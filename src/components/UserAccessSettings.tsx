import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, UserPlus, Trash2, Save, Loader2, RefreshCw,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Search
} from "lucide-react";

// Master list of all available pages in the admin panel
const ALL_PAGES = [
  { id: "dashboard", label: "Dashboard", group: "Core" },
  { id: "timetable", label: "CEO & MD Timetable", group: "Core" },
  { id: "applications", label: "Applications", group: "HR" },
  { id: "newsletter", label: "Newsletter", group: "Marketing" },
  { id: "interns", label: "Interns", group: "HR" },
  { id: "content", label: "Our Story", group: "Content" },
  { id: "documents", label: "Document Generator", group: "Core" },
  { id: "jobs", label: "Job Positions", group: "HR" },
  { id: "videos", label: "Videos", group: "Content" },
  { id: "location", label: "Location", group: "Content" },
  { id: "countdown", label: "Countdown", group: "Content" },
  { id: "postcountdown", label: "Post Countdown", group: "Content" },
  { id: "maintenance", label: "Maintenance", group: "System" },
  { id: "posts", label: "Marketing Posts", group: "Marketing" },
  { id: "models3d", label: "3D Models", group: "Content" },
  { id: "social", label: "Social Links", group: "Marketing" },
  { id: "business", label: "Business & ERP", group: "Finance" },
  { id: "market_research", label: "Market Research & BD", group: "Finance" },
  { id: "shared_files", label: "Shared Files Portal", group: "Collaboration" },
  { id: "knowledge", label: "Knowledge Tracker", group: "Collaboration" },
  { id: "rdlab", label: "R&D Lab", group: "R&D" },
  { id: "audit", label: "Audit Logs", group: "System" },
  { id: "news", label: "News & Press", group: "Content" },
];

const PAGE_GROUPS = ["Core", "HR", "Finance", "R&D", "Collaboration", "Marketing", "Content", "System"];

const GROUP_COLORS: Record<string, string> = {
  Core: "bg-blue-100 text-blue-800",
  HR: "bg-purple-100 text-purple-800",
  Finance: "bg-amber-100 text-amber-800",
  "R&D": "bg-green-100 text-green-800",
  Collaboration: "bg-cyan-100 text-cyan-800",
  Marketing: "bg-pink-100 text-pink-800",
  Content: "bg-orange-100 text-orange-800",
  System: "bg-slate-100 text-slate-800",
};

interface AccessRule {
  id?: string;
  user_email: string;
  user_label: string;
  allowed_pages: string[];
  default_tab: string | null;
  is_active: boolean;
  isNew?: boolean;
}

export function UserAccessSettings() {
  const [rules, setRules] = useState<AccessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const fetchRules = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_page_access")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      // Table might not exist yet — show helpful message
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        toast({
          title: "Table Not Found",
          description: "Please run the SQL setup script first (supabase_user_access_setup.sql).",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      setRules([]);
    } else {
      setRules((data || []).map((r: any) => ({ ...r, isNew: false })));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const addNewRule = () => {
    const tempId = `new_${Date.now()}`;
    const newRule: AccessRule = {
      id: tempId,
      user_email: "",
      user_label: "",
      allowed_pages: ["knowledge", "shared_files"],
      default_tab: "knowledge",
      is_active: true,
      isNew: true,
    };
    setRules(prev => [...prev, newRule]);
    setExpandedRule(tempId);
  };

  const updateRule = (id: string, field: keyof AccessRule, value: any) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const togglePage = (ruleId: string, pageId: string) => {
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      const pages = r.allowed_pages.includes(pageId)
        ? r.allowed_pages.filter(p => p !== pageId)
        : [...r.allowed_pages, pageId];
      // If default tab was removed, reset it
      const defaultTab = pages.includes(r.default_tab || "") ? r.default_tab : (pages[0] || null);
      return { ...r, allowed_pages: pages, default_tab: defaultTab };
    }));
  };

  const selectAllInGroup = (ruleId: string, group: string) => {
    const groupPageIds = ALL_PAGES.filter(p => p.group === group).map(p => p.id);
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      const allSelected = groupPageIds.every(pid => r.allowed_pages.includes(pid));
      let pages: string[];
      if (allSelected) {
        pages = r.allowed_pages.filter(p => !groupPageIds.includes(p));
      } else {
        pages = [...new Set([...r.allowed_pages, ...groupPageIds])];
      }
      const defaultTab = pages.includes(r.default_tab || "") ? r.default_tab : (pages[0] || null);
      return { ...r, allowed_pages: pages, default_tab: defaultTab };
    }));
  };

  const saveRule = async (rule: AccessRule) => {
    if (!rule.user_email || !rule.user_email.includes("@")) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (rule.allowed_pages.length === 0) {
      toast({ title: "No Pages", description: "Select at least one page to grant access.", variant: "destructive" });
      return;
    }

    setSaving(rule.id || null);
    const payload = {
      user_email: rule.user_email.toLowerCase().trim(),
      user_label: rule.user_label.trim(),
      allowed_pages: rule.allowed_pages,
      default_tab: rule.default_tab,
      is_active: rule.is_active,
    };

    let error;
    if (rule.isNew) {
      const res = await supabase.from("user_page_access").insert(payload).select().single();
      error = res.error;
      if (!error && res.data) {
        setRules(prev => prev.map(r => r.id === rule.id ? { ...res.data, isNew: false } : r));
      }
    } else {
      const res = await supabase.from("user_page_access").update(payload).eq("id", rule.id!).select().single();
      error = res.error;
      if (!error && res.data) {
        setRules(prev => prev.map(r => r.id === rule.id ? { ...res.data, isNew: false } : r));
      }
    }

    if (error) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `Access for ${rule.user_email} updated successfully.` });
    }
    setSaving(null);
  };

  const deleteRule = async (rule: AccessRule) => {
    if (rule.isNew) {
      setRules(prev => prev.filter(r => r.id !== rule.id));
      return;
    }
    const { error } = await supabase.from("user_page_access").delete().eq("id", rule.id!);
    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      setRules(prev => prev.filter(r => r.id !== rule.id));
      toast({ title: "Deleted", description: `Access for ${rule.user_email} removed.` });
    }
  };

  const filteredRules = rules.filter(r =>
    r.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.user_label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#7DA0FA]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#4B49AC] flex items-center gap-2">
            <Shield className="h-7 w-7 text-[#7DA0FA]" />
            User Access Control
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage which pages each user can access. CEO & MD always have full access.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRules}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button onClick={addNewRule} className="bg-primary hover:bg-primary/90 text-white">
            <UserPlus className="h-4 w-4 mr-1" /> Add User
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-l-4 border-l-[#7DA0FA] bg-[#f2f6ff]">
        <CardContent className="py-3 px-4 text-sm text-[#4B49AC]">
          <strong>Note:</strong> CEO (<code className="bg-white/60 px-1 py-0.5 rounded text-xs">ceo@biovaco.in</code>) and MD (<code className="bg-white/60 px-1 py-0.5 rounded text-xs">md@biovaco.in</code>) always have full access to all pages. This settings panel is for managing access of other team members. New emails added here will also be able to log in.
        </CardContent>
      </Card>

      {/* Search */}
      {rules.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by email or label..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Rules List */}
      {filteredRules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Shield className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No access rules configured</p>
            <p className="text-sm">Click "Add User" to grant a team member portal access.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRules.map(rule => {
            const isExpanded = expandedRule === rule.id;
            return (
              <Card
                key={rule.id}
                className={`transition-all duration-200 ${
                  rule.isNew ? "ring-2 ring-[#7DA0FA]/40 shadow-lg" : ""
                } ${!rule.is_active ? "opacity-60" : ""}`}
              >
                {/* Collapsed Header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 rounded-t-lg"
                  onClick={() => setExpandedRule(isExpanded ? null : rule.id!)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-3 w-3 rounded-full shrink-0 ${rule.is_active ? "bg-[#7DA0FA]" : "bg-gray-300"}`} />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#4B49AC] truncate">
                        {rule.user_label || rule.user_email || "New User"}
                      </div>
                      {rule.user_label && (
                        <div className="text-xs text-gray-500 truncate">{rule.user_email}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {rule.allowed_pages.length} pages
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <CardContent className="border-t pt-5 space-y-5">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Email Address *</label>
                        <Input
                          placeholder="user@biovaco.in"
                          value={rule.user_email}
                          onChange={e => updateRule(rule.id!, "user_email", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Display Label</label>
                        <Input
                          placeholder="e.g. Food Tech, R&D Head"
                          value={rule.user_label}
                          onChange={e => updateRule(rule.id!, "user_label", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                      <div>
                        <div className="font-medium text-sm">Account Active</div>
                        <div className="text-xs text-gray-500">Disable to temporarily revoke access without deleting</div>
                      </div>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={v => updateRule(rule.id!, "is_active", v)}
                      />
                    </div>

                    {/* Page Selection */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-2 block">Allowed Pages</label>
                      <div className="space-y-3">
                        {PAGE_GROUPS.map(group => {
                          const groupPages = ALL_PAGES.filter(p => p.group === group);
                          const allSelected = groupPages.every(p => rule.allowed_pages.includes(p.id));
                          const someSelected = groupPages.some(p => rule.allowed_pages.includes(p.id));
                          return (
                            <div key={group} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <button
                                  type="button"
                                  onClick={() => selectAllInGroup(rule.id!, group)}
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer ${GROUP_COLORS[group] || "bg-gray-100 text-gray-700"}`}
                                >
                                  {group} {allSelected ? "- All Selected" : someSelected ? "- Partial" : ""}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => selectAllInGroup(rule.id!, group)}
                                  className="text-xs text-[#4B49AC] hover:underline"
                                >
                                  {allSelected ? "Deselect All" : "Select All"}
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {groupPages.map(page => {
                                  const selected = rule.allowed_pages.includes(page.id);
                                  return (
                                    <button
                                      key={page.id}
                                      type="button"
                                      onClick={() => togglePage(rule.id!, page.id)}
                                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                                        selected
                                          ? "bg-[#4B49AC] text-white border-[#4B49AC]"
                                          : "bg-white text-gray-600 border-gray-200 hover:border-[#7DA0FA]/40 hover:bg-[#f2f6ff]"
                                      }`}
                                    >
                                      {selected ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-40" />}
                                      {page.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Default Tab */}
                    {rule.allowed_pages.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Default Landing Page</label>
                        <Select
                          value={rule.default_tab || rule.allowed_pages[0]}
                          onValueChange={v => updateRule(rule.id!, "default_tab", v)}
                        >
                          <SelectTrigger className="w-full sm:w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {rule.allowed_pages.map(pid => {
                              const page = ALL_PAGES.find(p => p.id === pid);
                              return (
                                <SelectItem key={pid} value={pid}>
                                  {page?.label || pid}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteRule(rule)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </Button>
                      <Button
                        onClick={() => saveRule(rule)}
                        disabled={saving === rule.id}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        {saving === rule.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
