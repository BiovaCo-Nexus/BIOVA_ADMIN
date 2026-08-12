// ─── Shared Marketing Types ───────────────────────────────────────────
// Used by Strategy, Content Calendar, Creative/Assets, and Reports.

export type CampaignStatus = "Planning" | "Active" | "Paused" | "Completed"
export type CampaignPriority = "High" | "Medium" | "Low"
export type ContentStatus = "Idea" | "Draft" | "Creative Ready" | "Review" | "Approved" | "Scheduled" | "Published"
export type ApprovalStatus = "Pending" | "Approved" | "Rejected"
export type AssetStatus = "Draft" | "Approved" | "Published"
export type AssetType = "Product Photos" | "Product Videos" | "Reels" | "Posters" | "Logos" | "Brand Assets" | "Templates" | "Campaign Assets"
export type Platform = "Instagram" | "YouTube" | "LinkedIn" | "WhatsApp" | "X" | "Website"
export type ContentType = "Reel" | "Carousel" | "Static Post" | "Story" | "Blog" | "Video" | "Email"

export interface MktCampaign {
  id: string
  name: string
  goal: string
  targetAudience: string
  contentPillars: string[]
  platforms: Platform[]
  keyMessages: string
  kpis: string[]
  startDate: string
  endDate: string
  budget: number
  priority: CampaignPriority
  status: CampaignStatus
  createdAt: string
}

export interface MktContentItem {
  id: string
  title: string
  date: string
  platform: Platform
  contentType: ContentType
  campaignId: string
  contentPillar: string
  contentIdea: string
  caption: string
  cta: string
  assignedPerson: string
  status: ContentStatus
  creativeAssetId: string
  approvalStatus: ApprovalStatus
  publishingDate: string
  // Report metrics (populated after publish)
  reach: number
  impressions: number
  engagement: number
  clicks: number
  conversions: number
  createdAt: string
}

export interface MktCreativeAsset {
  id: string
  name: string
  previewUrl: string
  assetType: AssetType
  campaignId: string
  product: string
  version: string
  createdBy: string
  uploadDate: string
  status: AssetStatus
  usedInContentIds: string[]
}
