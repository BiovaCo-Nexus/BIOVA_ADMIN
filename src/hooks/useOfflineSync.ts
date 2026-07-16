/**
 * useOfflineSync — Offline-first sync engine for Knowledge Tracker
 *
 * Architecture:
 * ┌─────────────┐     ┌──────────────┐     ┌───────────┐
 * │  Component   │────▶│ localStorage │────▶│  Supabase │
 * │  (instant)   │     │  (cache +    │     │  (remote) │
 * │              │◀────│   queue)     │◀────│           │
 * └─────────────┘     └──────────────┘     └───────────┘
 *
 * - CACHE_KEY: Full mirror of remote data for instant offline reads
 * - QUEUE_KEY: Pending operations (insert/update/delete) queued while offline
 * - On online: flushes queue → re-fetches fresh data → updates cache
 * - On offline: all writes go to queue + applied to local cache instantly
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/integrations/supabase/client"

const CACHE_KEY = "biovaco_knowledge_cache"
const QUEUE_KEY = "biovaco_knowledge_queue"

export interface KnowledgeItem {
  id: string
  title: string
  description: string | null
  category: string
  priority: string
  status: string
  source: string | null
  validation_notes: string | null
  due_date: string | null
  created_by: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

type QueueAction =
  | { type: "insert"; item: KnowledgeItem }
  | { type: "update"; id: string; changes: Partial<KnowledgeItem> }
  | { type: "delete"; id: string }

// ─── localStorage helpers ────────────────────────────────────────
function readCache(): KnowledgeItem[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]") } catch { return [] }
}
function writeCache(items: KnowledgeItem[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(items))
}
function readQueue(): QueueAction[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") } catch { return [] }
}
function writeQueue(queue: QueueAction[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}
function enqueue(action: QueueAction) {
  const q = readQueue()
  q.push(action)
  writeQueue(q)
}

// ─── Hook ────────────────────────────────────────────────────────
export function useOfflineSync() {
  const [items, setItems] = useState<KnowledgeItem[]>(readCache)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(readQueue().length)
  const syncLock = useRef(false)

  // ─── Online/Offline detection ──────────────────────────────────
  useEffect(() => {
    const goOnline = () => { setIsOnline(true) }
    const goOffline = () => { setIsOnline(false) }
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])

  // ─── Flush queue when online ───────────────────────────────────
  const flushQueue = useCallback(async (): Promise<boolean> => {
    if (syncLock.current) return false
    const queue = readQueue()
    if (queue.length === 0) return true

    syncLock.current = true
    setIsSyncing(true)

    let allSuccess = true
    const remaining: QueueAction[] = []

    for (const action of queue) {
      try {
        if (action.type === "insert") {
          const { error } = await supabase.from("knowledge_items").insert([{
            id: action.item.id,
            title: action.item.title,
            description: action.item.description,
            category: action.item.category,
            priority: action.item.priority,
            status: action.item.status,
            source: action.item.source,
            validation_notes: action.item.validation_notes,
            due_date: action.item.due_date,
          }])
          if (error) { remaining.push(action); allSuccess = false }
        } else if (action.type === "update") {
          const { error } = await supabase.from("knowledge_items")
            .update(action.changes).eq("id", action.id)
          if (error) { remaining.push(action); allSuccess = false }
        } else if (action.type === "delete") {
          const { error } = await supabase.from("knowledge_items")
            .delete().eq("id", action.id)
          if (error) { remaining.push(action); allSuccess = false }
        }
      } catch {
        remaining.push(action)
        allSuccess = false
      }
    }

    writeQueue(remaining)
    setPendingCount(remaining.length)
    syncLock.current = false
    setIsSyncing(false)
    return allSuccess
  }, [])

  // ─── Fetch remote → cache ─────────────────────────────────────
  const fetchRemote = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("knowledge_items")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      const remote = data || []
      writeCache(remote)
      setItems(remote)
    } catch {
      // If fetch fails, fall back to cache (already loaded)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Initial load + auto-sync ──────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // Always start from cache for instant render
      const cached = readCache()
      if (cached.length > 0) {
        setItems(cached)
        setIsLoading(false)
      }

      if (navigator.onLine) {
        // Flush any pending queue first, then fetch fresh data
        await flushQueue()
        await fetchRemote()
      } else {
        setIsLoading(false)
      }
    }
    init()
  }, [flushQueue, fetchRemote])

  // ─── Auto-sync when coming back online ─────────────────────────
  useEffect(() => {
    if (isOnline) {
      const sync = async () => {
        await flushQueue()
        await fetchRemote()
      }
      sync()
    }
  }, [isOnline, flushQueue, fetchRemote])

  // ─── Periodic sync check (every 30s when online) ──────────────
  useEffect(() => {
    if (!isOnline) return
    const interval = setInterval(async () => {
      const q = readQueue()
      if (q.length > 0) {
        await flushQueue()
        await fetchRemote()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [isOnline, flushQueue, fetchRemote])

  // ─── CRUD operations (offline-safe) ────────────────────────────

  const addItem = useCallback(async (itemData: Omit<KnowledgeItem, "id" | "created_at" | "updated_at">) => {
    const now = new Date().toISOString()
    const newItem: KnowledgeItem = {
      ...itemData,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    }

    // 1. Apply locally immediately
    setItems(prev => {
      const updated = [newItem, ...prev]
      writeCache(updated)
      return updated
    })

    // 2. Try remote, or queue
    if (navigator.onLine) {
      try {
        const { error } = await supabase.from("knowledge_items").insert([{
          id: newItem.id, title: newItem.title, description: newItem.description,
          category: newItem.category, priority: newItem.priority, status: newItem.status,
          source: newItem.source, validation_notes: newItem.validation_notes, due_date: newItem.due_date,
          created_by: newItem.created_by, assigned_to: newItem.assigned_to
        }])
        if (error) throw error
      } catch {
        enqueue({ type: "insert", item: newItem })
        setPendingCount(readQueue().length)
      }
    } else {
      enqueue({ type: "insert", item: newItem })
      setPendingCount(readQueue().length)
    }

    return newItem
  }, [])

  const updateItem = useCallback(async (id: string, changes: Partial<KnowledgeItem>) => {
    const now = new Date().toISOString()
    const fullChanges = { ...changes, updated_at: now }

    // 1. Apply locally immediately
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, ...fullChanges } : i)
      writeCache(updated)
      return updated
    })

    // 2. Try remote, or queue
    if (navigator.onLine) {
      try {
        const { updated_at, ...dbChanges } = fullChanges
        const { error } = await supabase.from("knowledge_items").update(dbChanges).eq("id", id)
        if (error) throw error
      } catch {
        enqueue({ type: "update", id, changes: fullChanges })
        setPendingCount(readQueue().length)
      }
    } else {
      enqueue({ type: "update", id, changes: fullChanges })
      setPendingCount(readQueue().length)
    }
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    // 1. Apply locally immediately
    setItems(prev => {
      const updated = prev.filter(i => i.id !== id)
      writeCache(updated)
      return updated
    })

    // 2. Try remote, or queue
    if (navigator.onLine) {
      try {
        const { error } = await supabase.from("knowledge_items").delete().eq("id", id)
        if (error) throw error
      } catch {
        enqueue({ type: "delete", id })
        setPendingCount(readQueue().length)
      }
    } else {
      enqueue({ type: "delete", id })
      setPendingCount(readQueue().length)
    }
  }, [])

  const forceSync = useCallback(async () => {
    if (!navigator.onLine) return false
    await flushQueue()
    await fetchRemote()
    return true
  }, [flushQueue, fetchRemote])

  return {
    items,
    isOnline,
    isLoading,
    isSyncing,
    pendingCount,
    addItem,
    updateItem,
    deleteItem,
    forceSync,
  }
}
