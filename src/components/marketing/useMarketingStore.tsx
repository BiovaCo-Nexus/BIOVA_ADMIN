import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { supabase } from "@/integrations/supabase/client"
import type {
  MktCampaign, MktContentItem, MktCreativeAsset,
  CampaignStatus, ContentStatus, AssetStatus, Platform, ContentType, AssetType
} from "./marketingTypes"

const STORE_KEY = "cravora_mkt_store_v2"

interface StoreData {
  campaigns: MktCampaign[]
  contentItems: MktContentItem[]
  creativeAssets: MktCreativeAsset[]
}

function loadLocalStore(): StoreData {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  // Start with clean empty state (NO DUMMY DATA)
  return {
    campaigns: [],
    contentItems: [],
    creativeAssets: []
  }
}

function persistLocalStore(data: StoreData) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data))
}

interface MarketingStoreContextType {
  campaigns: MktCampaign[]
  contentItems: MktContentItem[]
  creativeAssets: MktCreativeAsset[]
  loading: boolean

  addCampaign: (c: MktCampaign) => Promise<void>
  updateCampaign: (id: string, c: Partial<MktCampaign>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>

  addContent: (c: MktContentItem) => Promise<void>
  updateContent: (id: string, c: Partial<MktContentItem>) => Promise<void>
  deleteContent: (id: string) => Promise<void>

  addAsset: (a: MktCreativeAsset) => Promise<void>
  updateAsset: (id: string, a: Partial<MktCreativeAsset>) => Promise<void>
  deleteAsset: (id: string) => Promise<void>

  getCampaignById: (id: string) => MktCampaign | undefined
  getContentByCampaign: (campaignId: string) => MktContentItem[]
  getAssetsByCampaign: (campaignId: string) => MktCreativeAsset[]
  getContentByAsset: (assetId: string) => MktContentItem[]
  refreshAll: () => Promise<void>
}

const MarketingStoreContext = createContext<MarketingStoreContextType | null>(null)

export function MarketingStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(loadLocalStore)
  const [loading, setLoading] = useState(false)

  const fetchAllFromSupabase = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch Campaigns
      const { data: dbCampaigns, error: errC } = await supabase.from("mkt_campaigns").select("*").order("created_at", { ascending: false })
      // Fetch Content Items
      const { data: dbContent, error: errI } = await supabase.from("mkt_content_items").select("*").order("created_at", { ascending: false })
      // Fetch Assets
      const { data: dbAssets, error: errA } = await supabase.from("mkt_creative_assets").select("*").order("created_at", { ascending: false })

      if (errC || errI || errA) {
        console.warn("Marketing tables not found or 404 in Supabase DB, using local store.")
      }

      setData(prev => {
        const campaigns: MktCampaign[] = dbCampaigns && dbCampaigns.length > 0 ? dbCampaigns.map((c: any) => ({
          id: c.id,
          name: c.name,
          goal: c.goal || c.channel || "",
          targetAudience: c.target_audience || "",
          contentPillars: Array.isArray(c.content_pillars) ? c.content_pillars : [],
          platforms: Array.isArray(c.platforms) ? c.platforms : c.channel ? [c.channel] : [],
          keyMessages: c.key_messages || "",
          kpis: Array.isArray(c.kpis) ? c.kpis : [],
          startDate: c.start_date || "",
          endDate: c.end_date || "",
          budget: Number(c.budget || 0),
          priority: c.priority || "Medium",
          status: c.status || "Active",
          createdAt: c.created_at || new Date().toISOString()
        })) : prev.campaigns

        const contentItems: MktContentItem[] = dbContent && dbContent.length > 0 ? dbContent.map((c: any) => ({
          id: c.id,
          title: c.title,
          date: c.date || "",
          platform: c.platform || "Instagram",
          contentType: c.content_type || "Reel",
          campaignId: c.campaign_id || "",
          contentPillar: c.content_pillar || "",
          contentIdea: c.content_idea || "",
          caption: c.caption || "",
          cta: c.cta || "",
          assignedPerson: c.assigned_person || "",
          status: c.status || "Draft",
          creativeAssetId: c.creative_asset_id || "",
          approvalStatus: c.approval_status || "Pending",
          publishingDate: c.publishing_date || "",
          reach: Number(c.reach || 0),
          impressions: Number(c.impressions || 0),
          engagement: Number(c.engagement || 0),
          clicks: Number(c.clicks || 0),
          conversions: Number(c.conversions || 0),
          createdAt: c.created_at || new Date().toISOString()
        })) : prev.contentItems

        const creativeAssets: MktCreativeAsset[] = dbAssets && dbAssets.length > 0 ? dbAssets.map((a: any) => ({
          id: a.id,
          name: a.name,
          previewUrl: a.preview_url || "",
          assetType: a.asset_type || "Product Photos",
          campaignId: a.campaign_id || "",
          product: a.product || "",
          version: a.version || "v1",
          createdBy: a.created_by || "Marketing Team",
          uploadDate: a.upload_date || new Date().toISOString().slice(0, 10),
          status: a.status || "Approved",
          usedInContentIds: Array.isArray(a.used_in_content_ids) ? a.used_in_content_ids : []
        })) : prev.creativeAssets

        const next = { campaigns, contentItems, creativeAssets }
        persistLocalStore(next)
        return next
      })
    } catch (err) {
      console.warn("Supabase load fallback:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllFromSupabase()

    // Realtime subscriptions
    const channel = supabase
      .channel("mkt_hub_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "mkt_campaigns" }, fetchAllFromSupabase)
      .on("postgres_changes", { event: "*", schema: "public", table: "mkt_content_items" }, fetchAllFromSupabase)
      .on("postgres_changes", { event: "*", schema: "public", table: "mkt_creative_assets" }, fetchAllFromSupabase)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAllFromSupabase])

  const updateState = useCallback((fn: (prev: StoreData) => StoreData) => {
    setData(prev => {
      const next = fn(prev)
      persistLocalStore(next)
      return next
    })
  }, [])

  // ─── Campaigns DB Operations ─────────────────────────────────────────

  const addCampaign = useCallback(async (c: MktCampaign) => {
    updateState(d => ({ ...d, campaigns: [c, ...d.campaigns] }))
    try {
      await supabase.from("mkt_campaigns").insert({
        id: c.id,
        name: c.name,
        goal: c.goal,
        target_audience: c.targetAudience,
        content_pillars: c.contentPillars,
        platforms: c.platforms,
        key_messages: c.keyMessages,
        kpis: c.kpis,
        start_date: c.startDate || null,
        end_date: c.endDate || null,
        budget: c.budget,
        priority: c.priority,
        status: c.status,
        created_at: c.createdAt
      })
    } catch (e) {
      console.warn("Insert campaign DB fallback:", e)
    }
  }, [updateState])

  const updateCampaign = useCallback(async (id: string, patch: Partial<MktCampaign>) => {
    updateState(d => ({
      ...d, campaigns: d.campaigns.map(c => c.id === id ? { ...c, ...patch } : c)
    }))
    try {
      const dbPatch: any = {}
      if (patch.name !== undefined) dbPatch.name = patch.name
      if (patch.goal !== undefined) dbPatch.goal = patch.goal
      if (patch.targetAudience !== undefined) dbPatch.target_audience = patch.targetAudience
      if (patch.contentPillars !== undefined) dbPatch.content_pillars = patch.contentPillars
      if (patch.platforms !== undefined) dbPatch.platforms = patch.platforms
      if (patch.keyMessages !== undefined) dbPatch.key_messages = patch.keyMessages
      if (patch.kpis !== undefined) dbPatch.kpis = patch.kpis
      if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate || null
      if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate || null
      if (patch.budget !== undefined) dbPatch.budget = patch.budget
      if (patch.priority !== undefined) dbPatch.priority = patch.priority
      if (patch.status !== undefined) dbPatch.status = patch.status

      await supabase.from("mkt_campaigns").update(dbPatch).eq("id", id)
    } catch (e) {
      console.warn("Update campaign DB fallback:", e)
    }
  }, [updateState])

  const deleteCampaign = useCallback(async (id: string) => {
    updateState(d => ({ ...d, campaigns: d.campaigns.filter(c => c.id !== id) }))
    try {
      await supabase.from("mkt_campaigns").delete().eq("id", id)
    } catch (e) {
      console.warn("Delete campaign DB fallback:", e)
    }
  }, [updateState])

  // ─── Content Items DB Operations ──────────────────────────────────────

  const addContent = useCallback(async (c: MktContentItem) => {
    updateState(d => ({ ...d, contentItems: [c, ...d.contentItems] }))
    try {
      await supabase.from("mkt_content_items").insert({
        id: c.id,
        title: c.title,
        date: c.date || null,
        platform: c.platform,
        content_type: c.contentType,
        campaign_id: c.campaignId || null,
        content_pillar: c.contentPillar || null,
        content_idea: c.contentIdea,
        caption: c.caption,
        cta: c.cta,
        assigned_person: c.assignedPerson,
        status: c.status,
        creative_asset_id: c.creativeAssetId || null,
        approval_status: c.approvalStatus,
        publishing_date: c.publishingDate || null,
        reach: c.reach,
        impressions: c.impressions,
        engagement: c.engagement,
        clicks: c.clicks,
        conversions: c.conversions,
        created_at: c.createdAt
      })
    } catch (e) {
      console.warn("Insert content DB fallback:", e)
    }
  }, [updateState])

  const updateContent = useCallback(async (id: string, patch: Partial<MktContentItem>) => {
    updateState(d => ({
      ...d, contentItems: d.contentItems.map(c => c.id === id ? { ...c, ...patch } : c)
    }))
    try {
      const dbPatch: any = {}
      if (patch.title !== undefined) dbPatch.title = patch.title
      if (patch.date !== undefined) dbPatch.date = patch.date || null
      if (patch.platform !== undefined) dbPatch.platform = patch.platform
      if (patch.contentType !== undefined) dbPatch.content_type = patch.contentType
      if (patch.campaignId !== undefined) dbPatch.campaign_id = patch.campaignId || null
      if (patch.contentPillar !== undefined) dbPatch.content_pillar = patch.contentPillar || null
      if (patch.contentIdea !== undefined) dbPatch.content_idea = patch.contentIdea
      if (patch.caption !== undefined) dbPatch.caption = patch.caption
      if (patch.cta !== undefined) dbPatch.cta = patch.cta
      if (patch.assignedPerson !== undefined) dbPatch.assigned_person = patch.assignedPerson
      if (patch.status !== undefined) dbPatch.status = patch.status
      if (patch.creativeAssetId !== undefined) dbPatch.creative_asset_id = patch.creativeAssetId || null
      if (patch.approvalStatus !== undefined) dbPatch.approval_status = patch.approvalStatus
      if (patch.publishingDate !== undefined) dbPatch.publishing_date = patch.publishingDate || null

      await supabase.from("mkt_content_items").update(dbPatch).eq("id", id)
    } catch (e) {
      console.warn("Update content DB fallback:", e)
    }
  }, [updateState])

  const deleteContent = useCallback(async (id: string) => {
    updateState(d => ({ ...d, contentItems: d.contentItems.filter(c => c.id !== id) }))
    try {
      await supabase.from("mkt_content_items").delete().eq("id", id)
    } catch (e) {
      console.warn("Delete content DB fallback:", e)
    }
  }, [updateState])

  // ─── Creative Assets DB Operations ─────────────────────────────────────

  const addAsset = useCallback(async (a: MktCreativeAsset) => {
    updateState(d => ({ ...d, creativeAssets: [a, ...d.creativeAssets] }))
    try {
      await supabase.from("mkt_creative_assets").insert({
        id: a.id,
        name: a.name,
        preview_url: a.previewUrl,
        asset_type: a.assetType,
        campaign_id: a.campaignId || null,
        product: a.product,
        version: a.version,
        created_by: a.createdBy,
        upload_date: a.uploadDate || null,
        status: a.status
      })
    } catch (e) {
      console.warn("Insert asset DB fallback:", e)
    }
  }, [updateState])

  const updateAsset = useCallback(async (id: string, patch: Partial<MktCreativeAsset>) => {
    updateState(d => ({
      ...d, creativeAssets: d.creativeAssets.map(a => a.id === id ? { ...a, ...patch } : a)
    }))
    try {
      const dbPatch: any = {}
      if (patch.name !== undefined) dbPatch.name = patch.name
      if (patch.assetType !== undefined) dbPatch.asset_type = patch.assetType
      if (patch.campaignId !== undefined) dbPatch.campaign_id = patch.campaignId || null
      if (patch.product !== undefined) dbPatch.product = patch.product
      if (patch.version !== undefined) dbPatch.version = patch.version
      if (patch.createdBy !== undefined) dbPatch.created_by = patch.createdBy
      if (patch.status !== undefined) dbPatch.status = patch.status

      await supabase.from("mkt_creative_assets").update(dbPatch).eq("id", id)
    } catch (e) {
      console.warn("Update asset DB fallback:", e)
    }
  }, [updateState])

  const deleteAsset = useCallback(async (id: string) => {
    updateState(d => ({ ...d, creativeAssets: d.creativeAssets.filter(a => a.id !== id) }))
    try {
      await supabase.from("mkt_creative_assets").delete().eq("id", id)
    } catch (e) {
      console.warn("Delete asset DB fallback:", e)
    }
  }, [updateState])

  // Lookups
  const getCampaignById = useCallback((id: string) => data.campaigns.find(c => c.id === id), [data.campaigns])
  const getContentByCampaign = useCallback((cid: string) => data.contentItems.filter(c => c.campaignId === cid), [data.contentItems])
  const getAssetsByCampaign = useCallback((cid: string) => data.creativeAssets.filter(a => a.campaignId === cid), [data.creativeAssets])
  const getContentByAsset = useCallback((aid: string) => data.contentItems.filter(c => c.creativeAssetId === aid), [data.contentItems])

  return (
    <MarketingStoreContext.Provider value={{
      ...data,
      loading,
      addCampaign, updateCampaign, deleteCampaign,
      addContent, updateContent, deleteContent,
      addAsset, updateAsset, deleteAsset,
      getCampaignById, getContentByCampaign, getAssetsByCampaign, getContentByAsset,
      refreshAll: fetchAllFromSupabase
    }}>
      {children}
    </MarketingStoreContext.Provider>
  )
}

export function useMarketingStore() {
  const ctx = useContext(MarketingStoreContext)
  if (!ctx) throw new Error("useMarketingStore must be used within MarketingStoreProvider")
  return ctx
}
