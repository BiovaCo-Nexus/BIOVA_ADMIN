import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { WifiOff, Wifi } from "lucide-react"

export function OfflineSyncManager() {
 const [isOffline, setIsOffline] = useState(!navigator.onLine)
 const [isSyncing, setIsSyncing] = useState(false)
 const { toast } = useToast()

 useEffect(() => {
 const handleOffline = () => setIsOffline(true)
 const handleOnline = async () => {
 setIsOffline(false)
 await syncOfflineData()
 }

 window.addEventListener("offline", handleOffline)
 window.addEventListener("online", handleOnline)

 // Initial check just in case
 if (navigator.onLine) {
 syncOfflineData()
 }

 return () => {
 window.removeEventListener("offline", handleOffline)
 window.removeEventListener("online", handleOnline)
 }
 }, [])

 const syncOfflineData = async () => {
 const queueStr = localStorage.getItem("rd_offline_queue")
 if (!queueStr) return
 
 let queue: any[] = []
 try {
 queue = JSON.parse(queueStr)
 } catch(e) { return }

 if (queue.length === 0) return

 setIsSyncing(true)
 toast({ title: "Internet Restored", description: `Syncing ${queue.length} offline records...` })

 const failedQueue: any[] = []
 let successCount = 0

 for (const item of queue) {
 try {
 if (item.action === "insert") {
 const { error } = await supabase.from(item.table).insert([item.payload])
 if (error) throw error
 } else if (item.action === "update") {
 const { error } = await supabase.from(item.table).update(item.payload).eq("id", item.id)
 if (error) throw error
 }
 successCount++
 } catch (err) {
 console.error("Failed to sync item:", item, err)
 failedQueue.push(item) // Keep it for next time
 }
 }

 localStorage.setItem("rd_offline_queue", JSON.stringify(failedQueue))
 setIsSyncing(false)

 if (successCount > 0) {
 toast({ 
 title: "Sync Complete", 
 description: `Successfully uploaded ${successCount} records to the database.`,
 className: "bg-muted/50 border-border text-foreground"
 })
 // Trigger a reload to refresh tables
 window.dispatchEvent(new Event("offline_sync_complete"))
 }
 
 if (failedQueue.length > 0) {
 toast({ 
 title: "Sync Incomplete", 
 description: `${failedQueue.length} records failed to sync.`, 
 variant: "destructive" 
 })
 }
 }

 if (!isOffline && !isSyncing) return null

 return (
 <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
 isOffline ? "bg-red-100 text-red-700 border border-red-200" : "bg-primary text-primary-foreground text-foreground border border-border"
 }`}>
 {isOffline ? (
 <><WifiOff className="h-4 w-4" /> Working Offline. Data will sync automatically.</>
 ) : (
 <><Wifi className="h-4 w-4 animate-pulse" /> Syncing data...</>
 )}
 </div>
 )
}

// Helper to use in any form submission
export const saveWithOfflineSupport = async (table: string, payload: any, action: "insert" | "update", id?: string) => {
 if (!navigator.onLine) {
 const queue = JSON.parse(localStorage.getItem("rd_offline_queue") || "[]")
 // If inserting, we generate a fake ID so it can render locally if needed, but for now just queue it
 queue.push({ table, payload, action, id })
 localStorage.setItem("rd_offline_queue", JSON.stringify(queue))
 return { error: null, offline: true }
 }

 if (action === "insert") {
 return await supabase.from(table).insert([payload])
 } else {
 return await supabase.from(table).update(payload).eq("id", id)
 }
}
