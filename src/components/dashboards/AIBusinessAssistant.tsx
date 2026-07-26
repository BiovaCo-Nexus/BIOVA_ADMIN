import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, User, Send, Sparkles, Loader2, RefreshCw, Trash2, Download, 
  IndianRupee, Users, Package, AlertTriangle, Briefcase, CheckCircle2, ChevronRight,
  TrendingUp, ShieldAlert, Cpu, Lock, ShieldCheck, FileText
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: string;
  actionTab?: string;
  actionLabel?: string;
}

interface AIBusinessAssistantProps {
  onNavigateToTab?: (tabId: string, payload?: string) => void;
}

export function AIBusinessAssistant({ onNavigateToTab }: AIBusinessAssistantProps) {
  const { toast } = useToast();

  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [isExecutive, setIsExecutive] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFetchingDB, setIsFetchingDB] = useState(true);
  
  // Realtime Portal Database Snapshot State
  const [dbSnapshot, setDbSnapshot] = useState<{
    revenue: number;
    expenses: number;
    netProfit: number;
    pendingExpenses: number;
    activeInterns: number;
    totalInterns: number;
    pendingApplications: number;
    totalApplications: number;
    totalInventorySKUs: number;
    lowStockSKUs: any[];
    knowledgeTotal: number;
    knowledgeValidated: number;
    knowledgeCritical: any[];
    rdRawMaterialsCount: number;
    departmentsCount: number;
    rawExpenses: any[];
    rawInterns: any[];
    rawInventory: any[];
    rawKnowledge: any[];
    rawApplications: any[];
    rawRawMaterials: any[];
  }>({
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    pendingExpenses: 0,
    activeInterns: 0,
    totalInterns: 0,
    pendingApplications: 0,
    totalApplications: 0,
    totalInventorySKUs: 0,
    lowStockSKUs: [],
    knowledgeTotal: 0,
    knowledgeValidated: 0,
    knowledgeCritical: [],
    rdRawMaterialsCount: 0,
    departmentsCount: 0,
    rawExpenses: [],
    rawInterns: [],
    rawInventory: [],
    rawKnowledge: [],
    rawApplications: [],
    rawRawMaterials: []
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const [userAllowedPages, setUserAllowedPages] = useState<string[]>([]);
  const [userDisplayLabel, setUserDisplayLabel] = useState<string>("");

  // ─── Fetch Current User Role & Initial Setup ───
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const email = (data.session?.user?.email || "").toLowerCase();
      setCurrentUserEmail(email);
      const execStatus = email === "ceo@biovaco.in" || email === "md@biovaco.in" || email === "admin@biovaco.in";
      setIsExecutive(execStatus);

      let label = "";
      let pages: string[] = [];

      if (!execStatus && email) {
        const { data: accessRule } = await supabase
          .from('user_page_access')
          .select('allowed_pages, user_label')
          .eq('user_email', email)
          .maybeSingle();

        if (accessRule) {
          pages = accessRule.allowed_pages || [];
          label = accessRule.user_label || "";
          setUserAllowedPages(pages);
          setUserDisplayLabel(label);
        }
      }

      setMessages([
        { 
          id: 'welcome',
          role: 'ai', 
          text: execStatus 
            ? "👋 Welcome Executive! I am **BiovaCo Nexus AI Assistant** with complete portal database access across Finances, HR, R&D Lab, Inventory, and System Governance.\n\nHow can I support your leadership decisions today?"
            : `👋 Hello! I am **BiovaCo Nexus AI Assistant**.\n\nYou are logged in as **${email}**${label ? ` (*${label}*)` : ''}. Your AI assistant context and available tabs have been automatically customized based on your Access Control setup. How can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    });
  }, []);

  // ─── Fetch Portal Database Context ───
  const fetchPortalContext = useCallback(async () => {
    setIsFetchingDB(true);
    try {
      const [expRes, invcRes, incRes, intRes, appRes, invRes, rdRes, deptRes, rawMatRes] = await Promise.all([
        supabase.from('expense_records').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('income_records').select('*'),
        supabase.from('interns').select('*'),
        supabase.from('job_applications').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('knowledge_items').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('rd_raw_materials').select('*')
      ]);

      const expList = expRes.data || [];
      const invcList = invcRes.data || [];
      const incList = incRes.data || [];
      const intList = intRes.data || [];
      const appList = appRes.data || [];
      const invList = invRes.data || [];
      const rdList = rdRes.data || [];
      const deptList = deptRes.data || [];
      const rawMatList = rawMatRes.data || [];

      // Financial Calculations
      const revFromExp = expList.filter(e => e.type === 'revenue' || e.category?.toLowerCase() === 'revenue').reduce((a, c) => a + (c.amount || 0), 0);
      const revFromInvc = invcList.reduce((a, c) => a + (c.total_amount || 0), 0);
      const revFromInc = incList.reduce((a, c) => a + (c.total_amount || c.amount || 0), 0);
      const totalRev = revFromExp + revFromInvc + revFromInc;

      const pureExp = expList.filter(e => e.type === 'expense' || (e.category && e.category?.toLowerCase() !== 'revenue')).reduce((a, c) => a + (c.amount || 0), 0);
      const profit = totalRev - pureExp;

      const pendingExpCount = expList.filter(e => e.reimbursement_status === 'Pending').length;
      const activeStaff = intList.filter(i => i.status === 'Active').length;
      const pendingAppsCount = appList.filter(a => a.status === 'New' || a.status === 'Pending').length;

      const lowStockItems = invList.filter(i => (i.quantity || 0) < (i.min_stock || 5));
      const criticalTasks = rdList.filter(k => k.priority === 'critical' && k.status !== 'validated');
      const validatedTasksCount = rdList.filter(k => k.status === 'validated').length;

      setDbSnapshot({
        revenue: totalRev,
        expenses: pureExp,
        netProfit: profit,
        pendingExpenses: pendingExpCount,
        activeInterns: activeStaff,
        totalInterns: intList.length,
        pendingApplications: pendingAppsCount,
        totalApplications: appList.length,
        totalInventorySKUs: invList.length,
        lowStockSKUs: lowStockItems,
        knowledgeTotal: rdList.length,
        knowledgeValidated: validatedTasksCount,
        knowledgeCritical: criticalTasks,
        rdRawMaterialsCount: rawMatList.length,
        departmentsCount: deptList.length,
        rawExpenses: expList,
        rawInterns: intList,
        rawInventory: invList,
        rawKnowledge: rdList,
        rawApplications: appList,
        rawRawMaterials: rawMatList
      });

    } catch (err) {
      console.error("Error loading portal DB context for AI Assistant:", err);
    } finally {
      setIsFetchingDB(false);
    }
  }, []);

  useEffect(() => {
    fetchPortalContext();
  }, [fetchPortalContext]);

  // Filter tasks specific to logged-in user
  const userAssignedTasks = useMemo(() => {
    if (!currentUserEmail) return [];
    if (isExecutive) return dbSnapshot.rawKnowledge;
    const lowerEmail = currentUserEmail.toLowerCase();
    return dbSnapshot.rawKnowledge.filter(k => 
      (k.assigned_to && k.assigned_to.toLowerCase().includes(lowerEmail)) ||
      (k.created_by && k.created_by.toLowerCase() === lowerEmail)
    );
  }, [dbSnapshot.rawKnowledge, currentUserEmail, isExecutive]);

  // ─── Local Role-Aware Fallback Query Engine ───
  const generateRoleAwareFallbackAnswer = (userQuery: string): { response: string; tab?: string; label?: string } => {
    const q = userQuery.toLowerCase();

    // Restricted Financial Query check for Non-Executives
    if (q.includes('revenue') || q.includes('profit') || q.includes('finance') || q.includes('money') || q.includes('income') || q.includes('expense') || q.includes('salary') || q.includes('bank')) {
      if (!isExecutive) {
        return {
          response: `🔒 **Access Restricted:** Financial and executive performance metrics are strictly restricted to executive leadership (CEO/MD). You have access to your assigned tasks, department raw materials, and inventory catalogs.`
        };
      }
      return {
        response: `📊 **Financial Status Breakdown (Executive Scope):**\n\n• **Total Revenue Recorded:** ₹${dbSnapshot.revenue.toLocaleString('en-IN')}\n• **Total Expenses:** ₹${dbSnapshot.expenses.toLocaleString('en-IN')}\n• **Net Profit:** ₹${dbSnapshot.netProfit.toLocaleString('en-IN')}\n• **Pending Expense Approvals:** ${dbSnapshot.pendingExpenses}\n\nYour financial status is currently operating at a **${dbSnapshot.revenue > 0 ? ((dbSnapshot.netProfit / dbSnapshot.revenue) * 100).toFixed(1) : 0}% Gross Margin**.`,
        tab: 'business',
        label: 'Open Finance & Business Module'
      };
    }

    if (q.includes('intern') || q.includes('staff') || q.includes('employee') || q.includes('team') || q.includes('hr') || q.includes('applicant')) {
      if (!isExecutive) {
        return {
          response: `👥 **Team & Department Info:**\n\n• **Active Staff Members:** ${dbSnapshot.activeInterns}\n• **Company Departments:** ${dbSnapshot.departmentsCount}\n\nFor HR applicant details or recruitment management, please contact your department manager.`
        };
      }
      const sampleNames = dbSnapshot.rawInterns.slice(0, 5).map(i => `${i.name} (${i.role || 'Staff'})`).join(', ');
      return {
        response: `👥 **HR & Team Operations Summary:**\n\n• **Active Staff/Interns:** ${dbSnapshot.activeInterns} out of ${dbSnapshot.totalInterns} registered members\n• **New Job Applications:** ${dbSnapshot.pendingApplications} pending review\n• **Total Received Applications:** ${dbSnapshot.totalApplications}\n\n**Sample Members:** ${sampleNames || 'None registered yet'}`,
        tab: 'interns',
        label: 'Manage Team & HR'
      };
    }

    if (q.includes('stock') || q.includes('inventory') || q.includes('product') || q.includes('sku') || q.includes('reorder')) {
      const lowNames = dbSnapshot.lowStockSKUs.map(i => `${i.name} (${i.quantity} left)`).join(', ');
      return {
        response: `📦 **Inventory Catalog Overview:**\n\n• **Total SKUs in Catalog:** ${dbSnapshot.totalInventorySKUs}\n• **Low Stock Alerts:** ${dbSnapshot.lowStockSKUs.length} items below minimum threshold\n\n${dbSnapshot.lowStockSKUs.length > 0 ? `⚠️ **Reorder Recommended For:** ${lowNames}` : '✅ All stock levels are currently healthy!'}`,
        tab: 'business',
        label: 'View Inventory Catalog'
      };
    }

    if (q.includes('task') || q.includes('my work') || q.includes('assigned') || q.includes('todo') || q.includes('knowledge')) {
      if (!isExecutive) {
        if (userAssignedTasks.length === 0) {
          return {
            response: `📋 **Your Assigned Tasks:**\n\nYou currently have **0 pending tasks** explicitly assigned to ${currentUserEmail}.\n\nCheck back when your manager assigns new knowledge items or tasks!`,
            tab: 'knowledge_tracker',
            label: 'Open Knowledge Tracker'
          };
        }
        const taskList = userAssignedTasks.slice(0, 5).map(t => `• **${t.title}** (Status: ${t.status || 'Pending'}, Priority: ${t.priority || 'Medium'})`).join('\n');
        return {
          response: `📋 **Your Assigned Tasks (${userAssignedTasks.length}):**\n\n${taskList}\n\nAll tasks outside your scope are hidden for privacy.`,
          tab: 'knowledge_tracker',
          label: 'Manage My Assigned Tasks'
        };
      }
      return {
        response: `📋 **Company Knowledge Tracker Overview:**\n\n• **Total Registered Tasks:** ${dbSnapshot.knowledgeTotal}\n• **Validated Tasks:** ${dbSnapshot.knowledgeValidated}\n• **Critical Pending Alerts:** ${dbSnapshot.knowledgeCritical.length}\n\n${dbSnapshot.knowledgeCritical.length > 0 ? `🔥 **Critical Tasks:** ${dbSnapshot.knowledgeCritical.map(c => c.title).join(', ')}` : '✅ No critical overdue task alerts found.'}`,
        tab: 'knowledge_tracker',
        label: 'Open Knowledge Tracker'
      };
    }

    if (q.includes('material') || q.includes('r&d') || q.includes('lab') || q.includes('raw') || q.includes('formula')) {
      return {
        response: `🧪 **R&D Lab & Raw Material Library:**\n\n• **Total Raw Materials Cataloged:** ${dbSnapshot.rdRawMaterialsCount}\n• **Active Research Items:** ${dbSnapshot.knowledgeTotal}\n\nYou can access material duplication filters and formula specs in the R&D Lab module.`,
        tab: 'raw_materials',
        label: 'Open R&D Raw Materials'
      };
    }

    return {
      response: `💡 **BiovaCo Nexus System Assistant:**\n\n` +
        (isExecutive 
          ? `• **Revenue:** ₹${dbSnapshot.revenue.toLocaleString('en-IN')}\n• **Active Staff:** ${dbSnapshot.activeInterns}\n• **Inventory SKUs:** ${dbSnapshot.totalInventorySKUs}\n• **Tasks & R&D:** ${dbSnapshot.knowledgeTotal} items\n\nAsk me specific questions about your executive finances, hiring pipeline, stock levels, or task governance!`
          : `• **Assigned Tasks:** ${userAssignedTasks.length} items\n• **Inventory Catalog:** ${dbSnapshot.totalInventorySKUs} SKUs\n• **R&D Materials:** ${dbSnapshot.rdRawMaterialsCount} items\n\nAsk me about your assigned tasks, raw materials, or catalog stock!`)
    };
  };

  // ─── Process User Query ───
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    // Build Role-Restricted System Prompt
    const systemPrompt = isExecutive 
      ? `
You are BiovaCo Nexus AI Assistant, an executive AI co-pilot for BiovaCo leadership.
User: ${currentUserEmail} (Role: CEO/MD/Executive).

FULL EXECUTIVE DATABASE CONTEXT:
- Finance: Total Revenue: ₹${dbSnapshot.revenue}, Total Expenses: ₹${dbSnapshot.expenses}, Net Profit: ₹${dbSnapshot.netProfit}, Pending Expense Claims: ${dbSnapshot.pendingExpenses}
- HR: Active Staff: ${dbSnapshot.activeInterns} (Total: ${dbSnapshot.totalInterns}), Pending Job Applications: ${dbSnapshot.pendingApplications}
- Inventory: Total SKUs: ${dbSnapshot.totalInventorySKUs}, Low Stock SKUs: ${dbSnapshot.lowStockSKUs.length} (${JSON.stringify(dbSnapshot.lowStockSKUs.map(i => ({ name: i.name, qty: i.quantity })))})
- Tasks & Governance: Total Items: ${dbSnapshot.knowledgeTotal}, Validated: ${dbSnapshot.knowledgeValidated}, Critical Alerts: ${dbSnapshot.knowledgeCritical.length} (${JSON.stringify(dbSnapshot.knowledgeCritical.map(c => c.title))})
- R&D Materials: ${dbSnapshot.rdRawMaterialsCount} items cataloged

INSTRUCTIONS:
Provide structured, concise, executive-level insights with bold headers and clear bullet points.
`
      : `
You are BiovaCo Nexus AI Assistant.
User: ${currentUserEmail} (Role: Staff / Team Member).

ROLE-BASED RESTRICTIONS (STRICT SECURITY ENFORCEMENT):
1. User is a standard team member, NOT an executive director.
2. STRICT RULE: DO NOT disclose company revenue, net profit, total financial budget, executive salaries, or bank balances.
3. If the user asks about revenue, profit, finances, or salary, reply with:
   "🔒 Access Restricted: Financial and executive performance metrics are strictly restricted to executive leadership (CEO/MD). You have access to your assigned tasks, department raw materials, and inventory catalogs."
4. User's Assigned Tasks (${userAssignedTasks.length} items): ${JSON.stringify(userAssignedTasks.map(t => ({ title: t.title, status: t.status, due: t.due_date })))}
5. Catalog Inventory (${dbSnapshot.totalInventorySKUs} SKUs) and R&D Raw Materials (${dbSnapshot.rdRawMaterialsCount} items) are accessible for operational queries.
`;

    if (!apiKey) {
      setTimeout(() => {
        const local = generateRoleAwareFallbackAnswer(userText);
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: local.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionTab: local.tab,
          actionLabel: local.label
        }]);
        setIsTyping(false);
      }, 800);
      return;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "BiovaCo Nexus AI Assistant"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          max_tokens: 2000,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-6).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
            { role: "user", content: userText }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Response Status: ${response.status}`);
      }

      const data = await response.json();
      const aiReply = data.choices[0]?.message?.content || "I've processed your request.";

      // Determine navigation suggestion
      let suggestedTab: string | undefined = undefined;
      let suggestedLabel: string | undefined = undefined;
      const lowerQ = userText.toLowerCase();

      if (isExecutive && (lowerQ.includes('finance') || lowerQ.includes('expense') || lowerQ.includes('revenue'))) {
        suggestedTab = 'business';
        suggestedLabel = 'Open Financial Overview';
      } else if (lowerQ.includes('task') || lowerQ.includes('assigned') || lowerQ.includes('work')) {
        suggestedTab = 'knowledge_tracker';
        suggestedLabel = 'Open Knowledge Tracker';
      } else if (lowerQ.includes('inventory') || lowerQ.includes('stock')) {
        suggestedTab = 'business';
        suggestedLabel = 'View Inventory Catalog';
      } else if (lowerQ.includes('raw material') || lowerQ.includes('r&d')) {
        suggestedTab = 'raw_materials';
        suggestedLabel = 'Open R&D Library';
      }

      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTab: suggestedTab,
        actionLabel: suggestedLabel
      }]);

    } catch (err) {
      console.warn("Using smart role-aware fallback:", err);
      const local = generateRoleAwareFallbackAnswer(userText);
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: local.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionTab: local.tab,
        actionLabel: local.label
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{ 
      id: 'welcome',
      role: 'ai', 
      text: "Chat history reset. How can I assist you with your portal data?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const exportChat = () => {
    const textContent = messages.map(m => `[${m.timestamp}] ${m.role.toUpperCase()}: ${m.text}`).join('\n\n---\n\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BiovaCo_AI_Assistant_Log_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Log Exported", description: "Saved AI chat text log." });
  };

  const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="max-w-6xl mx-auto h-[82vh] flex flex-col pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      
      {/* ────────────────────────
          HEADER & ROLE ACCESS BADGE
      ──────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#4B49AC] to-[#7DA0FA] text-white shadow-md">
                <Bot className="h-6 w-6" />
              </div>
              AI Business Assistant & Portal Copilot
            </h2>
            <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              isExecutive 
                ? 'bg-purple-50 text-purple-700 border-purple-300' 
                : 'bg-blue-50 text-blue-700 border-blue-300'
            }`}>
              {isExecutive ? (
                <><Lock className="h-3 w-3 mr-1 inline" /> Executive Mode</>
              ) : (
                <><ShieldCheck className="h-3 w-3 mr-1 inline" /> Role-Filtered Access</>
              )}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Powered by BiovaCo Enterprise Intelligence & Live Portal Context
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPortalContext} 
            disabled={isFetchingDB}
            className="h-8 text-xs font-semibold border-gray-200 text-gray-700 hover:bg-gray-50"
            title="Sync Latest Database Snapshot"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetchingDB ? 'animate-spin text-[#4B49AC]' : 'text-gray-500'}`} />
            {isFetchingDB ? 'Syncing...' : 'Sync Data'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportChat}
            className="h-8 text-xs font-semibold border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-gray-500" /> Export Log
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearChat}
            className="h-8 text-xs text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* Live DB Quick Metrics Bar (Role-Filtered) */}
      <div className="bg-white border border-gray-200 rounded-xl p-2.5 mb-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {isExecutive ? (
          <>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-700 font-bold">
              <IndianRupee className="h-3.5 w-3.5" />
              <span>Rev: {formatINR(dbSnapshot.revenue)}</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-purple-50 rounded-lg border border-purple-100 text-purple-700 font-bold">
              <Users className="h-3.5 w-3.5" />
              <span>Team: {dbSnapshot.activeInterns} Active</span>
            </div>
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${dbSnapshot.lowStockSKUs.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-800 font-bold' : 'bg-teal-50 border-teal-100 text-teal-700 font-semibold'}`}>
              <Package className="h-3.5 w-3.5" />
              <span>SKUs: {dbSnapshot.totalInventorySKUs} ({dbSnapshot.lowStockSKUs.length} Low)</span>
            </div>
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border ${dbSnapshot.knowledgeCritical.length > 0 ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'bg-blue-50 border-blue-100 text-blue-700 font-semibold'}`}>
              <Briefcase className="h-3.5 w-3.5" />
              <span>Tasks: {dbSnapshot.knowledgeTotal} ({dbSnapshot.knowledgeCritical.length} Critical)</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-700 font-bold">
              <Briefcase className="h-3.5 w-3.5" />
              <span>My Assigned Tasks: {userAssignedTasks.length}</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-teal-50 rounded-lg border border-teal-100 text-teal-700 font-semibold">
              <Package className="h-3.5 w-3.5" />
              <span>Catalog SKUs: {dbSnapshot.totalInventorySKUs}</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 font-semibold">
              <Package className="h-3.5 w-3.5" />
              <span>R&D Materials: {dbSnapshot.rdRawMaterialsCount} Items</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 bg-purple-50 rounded-lg border border-purple-100 text-purple-700 font-semibold">
              <Users className="h-3.5 w-3.5" />
              <span>Departments: {dbSnapshot.departmentsCount}</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium ml-auto">
          <ShieldCheck className="h-3.5 w-3.5 text-[#4B49AC]" />
          DB Verified
        </div>
      </div>

      {/* ────────────────────────
          CHAT INTERFACE CARD
      ──────────────────────── */}
      <Card className="flex-1 flex flex-col overflow-hidden border-gray-200 shadow-md rounded-2xl bg-white">
        
        {/* Messages Scroll View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/40">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3.5 max-w-[90%] sm:max-w-[82%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center shadow-xs ${msg.role === 'ai' ? 'bg-gradient-to-br from-[#4B49AC] to-[#7DA0FA] text-white' : 'bg-gray-800 text-white'}`}>
                {msg.role === 'ai' ? <Sparkles className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
              </div>

              <div className="flex flex-col space-y-1 min-w-0">
                <div className={`p-4 rounded-2xl shadow-xs text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#4B49AC] text-white rounded-tr-xs' 
                    : 'bg-white border border-gray-200/80 text-gray-800 rounded-tl-xs whitespace-pre-wrap'
                }`}>
                  {msg.text}
                </div>

                {/* Optional Action Button for AI Messages */}
                {msg.role === 'ai' && msg.actionTab && (
                  <div className="pt-1">
                    <Button 
                      onClick={() => onNavigateToTab?.(msg.actionTab!)}
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs font-semibold text-[#4B49AC] border-[#4B49AC]/30 hover:bg-[#4B49AC]/10 bg-white"
                    >
                      {msg.actionLabel || 'Navigate to Module'} <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                )}

                <span className={`text-[10px] text-gray-400 font-medium px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3.5 max-w-[85%]">
              <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#4B49AC] to-[#7DA0FA] flex items-center justify-center shadow-xs text-white">
                <Bot className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div className="p-3.5 bg-white border border-gray-200 shadow-xs rounded-2xl rounded-tl-xs flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-[#4B49AC]" /> 
                Processing live database context...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Role-Based Prompt Chips */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-[#4B49AC] focus-within:ring-1 focus-within:ring-[#4B49AC] transition-all">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isExecutive ? "Ask about finances, team, inventory SKUs, or pending tasks..." : "Ask about your assigned tasks, R&D materials, or catalog inventory..."}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
              disabled={isTyping}
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isTyping} 
              className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white rounded-lg px-5 h-9 shrink-0 text-xs font-semibold shadow-xs"
            >
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send</>}
            </Button>
          </div>

          {/* Role-Specific Quick Prompt Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
            {isExecutive ? (
              <>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-xs text-gray-600 font-medium border-gray-200 py-1"
                  onClick={() => { setInput("Give me an executive financial summary of current revenue, expenses, and net profit."); }}
                >
                  📊 Financial Summary
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-xs text-gray-600 font-medium border-gray-200 py-1"
                  onClick={() => { setInput("What is our current HR team count and pending job application pipeline?"); }}
                >
                  👥 HR & Hiring Pipeline
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-xs text-gray-600 font-medium border-gray-200 py-1"
                  onClick={() => { setInput("List all low stock inventory SKUs and reorder recommendations."); }}
                >
                  ⚠️ Low Stock SKUs
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-xs text-gray-600 font-medium border-gray-200 py-1"
                  onClick={() => { setInput("What critical or overdue tasks in Knowledge Tracker require immediate executive attention?"); }}
                >
                  🔥 Critical Tasks
                </Badge>
              </>
            ) : (
              <>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-xs text-gray-600 font-medium border-gray-200 py-1"
                  onClick={() => { setInput("List all my assigned tasks and pending work items."); }}
                >
                  📋 My Assigned Tasks
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-xs text-gray-600 font-medium border-gray-200 py-1"
                  onClick={() => { setInput("Summarize our R&D Lab raw material inventory catalog."); }}
                >
                  🧪 R&D Materials Catalog
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-xs text-gray-600 font-medium border-gray-200 py-1"
                  onClick={() => { setInput("Check available catalog inventory items."); }}
                >
                  📦 Available SKUs
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-xs text-gray-600 font-medium border-gray-200 py-1"
                  onClick={() => { setInput("List company departments and team structure."); }}
                >
                  🏢 Departments Overview
                </Badge>
              </>
            )}
          </div>
        </div>

      </Card>
    </div>
  )
}
