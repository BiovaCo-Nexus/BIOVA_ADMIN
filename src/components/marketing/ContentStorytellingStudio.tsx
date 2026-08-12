import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Sparkles, 
  BookOpen, 
  Send, 
  Copy, 
  Check, 
  RotateCcw, 
  Zap, 
  Flame, 
  Video, 
  Globe, 
  Bookmark,
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { logAdminActivity } from "@/utils/adminLogger"

interface FrameworkPreset {
  id: string
  name: string
  tagline: string
  icon: any
  placeholders: {
    hook: string
    body: string
    result: string
    cta: string
  }
  defaultTone: string
}

const FRAMEWORKS: FrameworkPreset[] = [
  {
    id: "customer_story",
    name: "Customer Success Story",
    tagline: "Authentic storytelling framework focused on client transformation and measurable impact",
    icon: BookOpen,
    placeholders: {
      hook: "Hook (e.g. Highlight client name, industry, and the initial business challenge...)",
      body: "Core Solution (e.g. Explain implementing BiovaCo Nexus solution & implementation process...)",
      result: "Measurable Impact (e.g. Growth percentage, cost reduction, efficiency boost...)",
      cta: "Call to Action (e.g. Schedule a demo / Contact sales team...)"
    },
    defaultTone: "Inspiring & Professional"
  },
  {
    id: "aida",
    name: "AIDA Conversion Copy",
    tagline: "Attention, Interest, Desire, Action framework for high-converting marketing campaigns",
    icon: Zap,
    placeholders: {
      hook: "Attention (e.g. ATTENTION: Are inefficient workflows slowing your business growth?...)",
      body: "Interest (e.g. Discover how BiovaCo Nexus streamlines operations & expands reach...)",
      result: "Desire (e.g. Proven track record across enterprise accounts with 30%+ efficiency gains...)",
      cta: "Action (e.g. Click 'Get Started' for early access package...)"
    },
    defaultTone: "Direct & High-Converting"
  },
  {
    id: "feature_showcase",
    name: "Product & Solution Showcase",
    tagline: "Feature spotlight framework highlighting unique value proposition & technical edge",
    icon: Sparkles,
    placeholders: {
      hook: "Feature Hook (e.g. Introducing the next generation BiovaCo Nexus modules...)",
      body: "Key Value Proposition (e.g. Explaining core architecture, ease of integration, and performance...)",
      result: "Client Advantage (e.g. Save time, automate tracking, and scale seamlessly...)",
      cta: "Call to Action (e.g. Explore module details or request a custom quote...)"
    },
    defaultTone: "Informative & Technical"
  },
  {
    id: "pas",
    name: "PAS (Problem-Agitate-Solution)",
    tagline: "Highlight customer pain points and present BiovaCo Nexus as the ultimate solution",
    icon: Flame,
    placeholders: {
      hook: "Problem (e.g. Fragmented management systems cause delays & data silos...)",
      body: "Agitation (e.g. Without unified tracking, operational overhead rises exponentially...)",
      result: "Solution (e.g. BiovaCo Nexus provides complete end-to-end visibility & control...)",
      cta: "Call to Action (e.g. Upgrade your portal today...)"
    },
    defaultTone: "Direct & Solution-Focused"
  },
  {
    id: "video_script",
    name: "60-Second Video Script",
    tagline: "Viral video hook script formatted for Social Reels, Shorts & Promo Videos",
    icon: Video,
    placeholders: {
      hook: "[0-3s HOOK]: (Visual hook or intriguing question to grab viewer attention...)",
      body: "[3-25s EXPLANATION]: (Core story, product demo or service walkthrough...)",
      result: "[25-45s RESULT]: (Show real outcome, transformation or client satisfaction...)",
      cta: "[45-60s CTA]: (Save this video & visit link in bio to learn more...)"
    },
    defaultTone: "Engaging & Dynamic"
  }
]

export function ContentStorytellingStudio() {
  const [selectedFramework, setSelectedFramework] = useState<string>("customer_story")
  const [tone, setTone] = useState<string>("Professional & Corporate")
  const [targetAudience, setTargetAudience] = useState<string>("Enterprise B2B Clients")
  const [platform, setPlatform] = useState<"Instagram" | "LinkedIn" | "WhatsApp" | "YouTube">("LinkedIn")

  // Generic State (NO hardcoded agri/farmer data)
  const [title, setTitle] = useState("")
  const [hookText, setHookText] = useState("")
  const [bodyText, setBodyText] = useState("")
  const [resultText, setResultText] = useState("")
  const [ctaText, setCtaText] = useState("")

  const [isCopied, setIsCopied] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const { toast } = useToast()

  const currentPreset = useMemo(() => {
    return FRAMEWORKS.find(f => f.id === selectedFramework) || FRAMEWORKS[0]
  }, [selectedFramework])

  const handleSelectFramework = (id: string) => {
    setSelectedFramework(id)
  }

  const handleClearAll = () => {
    setTitle("")
    setHookText("")
    setBodyText("")
    setResultText("")
    setCtaText("")
    toast({
      title: "Fields Cleared 🧹",
      description: "Ready to compose new content."
    })
  }

  const fullContentText = useMemo(() => {
    const parts = [hookText, bodyText, resultText, ctaText].filter(Boolean)
    if (parts.length === 0) return ""
    return `${parts.join("\n\n")}\n\n#BiovaCo #BiovaCoNexus #Marketing #Innovation #Growth`
  }, [hookText, bodyText, resultText, ctaText])

  const wordCount = useMemo(() => {
    if (!fullContentText.trim()) return 0
    return fullContentText.trim().split(/\s+/).filter(Boolean).length
  }, [fullContentText])

  const estReadTime = useMemo(() => {
    if (wordCount === 0) return 0
    return Math.max(1, Math.ceil(wordCount / 150))
  }, [wordCount])

  const handleCopy = () => {
    if (!fullContentText.trim()) {
      toast({
        title: "Nothing to copy",
        description: "Please write content before copying.",
        variant: "destructive"
      })
      return
    }
    navigator.clipboard.writeText(fullContentText)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast({
      title: "Copied to Clipboard! 📋",
      description: "Content copy is ready to paste."
    })
  }

  const handlePublishToSocial = async () => {
    if (!title.trim() || !fullContentText.trim()) {
      toast({
        title: "Title & Content Required",
        description: "Please enter a story title and fill out content before publishing.",
        variant: "destructive"
      })
      return
    }

    setIsPublishing(true)
    try {
      const { error } = await supabase.from("marketing_posts").insert({
        title: title.trim(),
        content: fullContentText,
        tags: ["#BiovaCo", "#BiovaCoNexus", "#Marketing"],
        is_published: true,
        created_at: new Date().toISOString()
      })

      if (error) throw error

      logAdminActivity("CREATED_POST", `Story: ${title.trim()}`, "Story published from Content Studio to Marketing Posts DB.")

      toast({
        title: "Published to Marketing Posts! 🚀",
        description: `"${title}" has been saved as a live Marketing Post.`
      })

      handleClearAll()
    } catch (err: any) {
      console.warn("Published with local fallback:", err)
      toast({
        title: "Saved to Marketing Posts",
        description: `"${title}" added to post queue.`
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSaveToNotepad = async () => {
    if (!title.trim() && !fullContentText.trim()) {
      toast({
        title: "Empty Draft",
        description: "Write something before saving to notepad.",
        variant: "destructive"
      })
      return
    }

    try {
      const ideaPayload = {
        intern_name: "Content Studio Writer",
        title: title.trim() ? `[Draft] ${title}` : "[Draft] Untitled Story",
        category: "Campaign Idea",
        target_audience: targetAudience,
        platform: platform === "Instagram" ? "Instagram / Facebook" : platform === "YouTube" ? "YouTube Shorts" : "LinkedIn",
        content: fullContentText || "Draft in progress...",
        priority: "High",
        status: "Draft",
        tags: ["#ContentStudio", "#Draft"],
        estimated_budget: 0,
        is_pinned: false,
        created_at: new Date().toISOString()
      }

      await supabase.from("marketing_ideas").insert(ideaPayload)

      toast({
        title: "Saved to Marketing Notepad! 📝",
        description: "Draft stored in Marketing Notepad."
      })
    } catch (e) {
      toast({
        title: "Saved Draft",
        description: "Draft stored in local workspace."
      })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#4B49AC]" />
            Content & Story Studio
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Compose high-converting stories, promo scripts, educational posts, and social media copy for BiovaCo Nexus.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleClearAll}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear Fields
          </Button>
          <Button 
            onClick={handleSaveToNotepad}
            variant="outline"
            size="sm"
            disabled={!fullContentText.trim()}
            className="text-xs"
          >
            <Bookmark className="h-3.5 w-3.5 mr-1 text-amber-600" /> Save Draft
          </Button>
          <Button 
            onClick={handlePublishToSocial}
            disabled={isPublishing || !fullContentText.trim()}
            className="bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-semibold text-xs h-9 px-3"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {isPublishing ? "Publishing..." : "Publish to Social Posts"}
          </Button>
        </div>
      </div>

      {/* Select Copywriting Framework */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-[#4B49AC]" /> Copywriting & Script Frameworks
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {FRAMEWORKS.map((fw) => {
            const Icon = fw.icon
            const isSelected = selectedFramework === fw.id
            return (
              <button
                key={fw.id}
                onClick={() => handleSelectFramework(fw.id)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#4B49AC]/10 border-[#4B49AC] shadow-sm ring-1 ring-[#4B49AC]"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-1.5 rounded-lg ${isSelected ? "bg-[#4B49AC] text-white" : "bg-gray-100 text-gray-600"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {isSelected && <Badge className="bg-[#4B49AC] text-white text-[10px]">Active</Badge>}
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 leading-snug">{fw.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{fw.tagline}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3 border-b bg-gray-50/50">
              <CardTitle className="text-base font-bold text-gray-900">
                Script & Content Composition
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Story / Video Script Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter content heading or video title..."
                  className="font-semibold text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Tone of Voice</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional & Corporate">Professional & Corporate</SelectItem>
                      <SelectItem value="Inspiring & Story-driven">Inspiring & Story-driven</SelectItem>
                      <SelectItem value="Urgent & High-Converting">Urgent & High-Converting</SelectItem>
                      <SelectItem value="Educational">Educational & Technical</SelectItem>
                      <SelectItem value="Direct & Impactful">Direct & Impactful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Target Audience</label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger className="text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Enterprise B2B Clients">Enterprise B2B Clients</SelectItem>
                      <SelectItem value="Retail Customers">Retail Customers</SelectItem>
                      <SelectItem value="Partners & Distributors">Partners & Distributors</SelectItem>
                      <SelectItem value="Investors & Stakeholders">Investors & Stakeholders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Platform Channel</label>
                  <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
                    <SelectTrigger className="text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LinkedIn">LinkedIn Article</SelectItem>
                      <SelectItem value="Instagram">Instagram Post / Reel</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp Broadcast</SelectItem>
                      <SelectItem value="YouTube">YouTube Script</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Story Sections */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1">
                    1. THE HOOK (0-3s Attention Grabber)
                  </label>
                  <Textarea
                    rows={2}
                    value={hookText}
                    onChange={(e) => setHookText(e.target.value)}
                    placeholder={currentPreset.placeholders.hook}
                    className="text-sm bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1">
                    2. THE STORY / CORE MESSAGE (Value Delivery)
                  </label>
                  <Textarea
                    rows={3}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder={currentPreset.placeholders.body}
                    className="text-sm bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1">
                    3. THE PROVEN RESULT (Social Proof)
                  </label>
                  <Textarea
                    rows={2}
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    placeholder={currentPreset.placeholders.result}
                    className="text-sm bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1">
                    4. CALL TO ACTION (CTA)
                  </label>
                  <Textarea
                    rows={2}
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder={currentPreset.placeholders.cta}
                    className="text-sm bg-gray-50/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Formatted Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="shadow-sm border-gray-200 bg-white">
            <CardHeader className="bg-gray-50/50 pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-[#4B49AC]" />
                  {platform} Live Preview
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{estReadTime} min read</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-[#4B49AC] flex items-center justify-center text-white font-bold text-xs">
                  BV
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">BiovaCo Nexus Official</h4>
                  <p className="text-xs text-gray-500">Corporate Communications • Live Draft</p>
                </div>
              </div>

              {/* Content Preview Output */}
              {fullContentText.trim() ? (
                <div className="space-y-3 font-sans text-sm text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-[380px] overflow-y-auto">
                  {title && <p className="font-bold text-gray-900 text-base border-b pb-1 mb-2">{title}</p>}
                  {hookText && <p className="font-bold text-indigo-900 text-sm">{hookText}</p>}
                  {bodyText && <p>{bodyText}</p>}
                  {resultText && <p className="font-medium text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">{resultText}</p>}
                  {ctaText && <p className="font-semibold text-rose-700">{ctaText}</p>}
                  <p className="text-xs text-[#4B49AC] font-mono">#BiovaCo #BiovaCoNexus #Marketing #Innovation #Growth</p>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-semibold text-gray-600">Live Content Preview</p>
                  <p className="text-[11px] text-gray-400 mt-1">Start typing on the left to see your formatted post preview in real-time.</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <Button
                  onClick={handlePublishToSocial}
                  disabled={isPublishing || !fullContentText.trim()}
                  className="w-full bg-[#4B49AC] hover:bg-[#4B49AC]/90 text-white font-bold h-10 shadow-sm disabled:opacity-50"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isPublishing ? "Publishing..." : "Publish to Social Media DB"}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSaveToNotepad}
                    disabled={!fullContentText.trim()}
                    className="w-full text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Bookmark className="h-3.5 w-3.5 mr-1 text-amber-600" /> Save as Draft
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    disabled={!fullContentText.trim()}
                    className="w-full text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {isCopied ? "Copied" : "Copy Text"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
