import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
 Calendar,
 Clock,
 Plus,
 Trash2,
 Edit2,
 Copy,
 Download,
 Info,
 LayoutGrid,
 ListTodo,
 AlertTriangle,
 RefreshCw,
 Search,
 PieChart,
 User,
 Sparkles,
 ClipboardList
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Define TypeScript interfaces for our Schedule Item
interface ScheduleItem {
 id: string;
 role: "ceo" | "md";
 day_of_week: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
 start_time: string; // "HH:MM" format
 end_time: string; // "HH:MM" format
 task_title: string;
 description?: string;
 category: "Meeting" | "Review" | "Strategic Planning" | "Operations" | "Personal" | "Site Visit" | "Client Call" | "Other";
}

// Category Configuration for Styling and Icons
const CATEGORIES = {
 "Meeting": { bg: "bg-muted/50 border-border text-foreground", color: "#3B82F6", pill: "bg-primary text-primary-foreground" },
 "Review": { bg: "bg-muted/50 border-border text-foreground", color: "#F59E0B", pill: "bg-secondary" },
 "Strategic Planning": { bg: "bg-muted/50 border-border text-foreground", color: "#8B5CF6", pill: "bg-secondary" },
 "Operations": { bg: "bg-emerald-50 border-emerald-200 text-emerald-800", color: "#10B981", pill: "bg-emerald-500" },
 "Personal": { bg: "bg-muted/50 border-border text-foreground", color: "#EF4444", pill: "bg-secondary" },
 "Site Visit": { bg: "bg-cyan-50 border-cyan-200 text-cyan-800", color: "#06B6D4", pill: "bg-cyan-500" },
 "Client Call": { bg: "bg-muted/50 border-border text-foreground", color: "#6366F1", pill: "bg-secondary" },
 "Other": { bg: "bg-gray-50 border-gray-200 text-gray-800", color: "#6B7280", pill: "bg-gray-500" }
};

const DAYS: Array<ScheduleItem["day_of_week"]> = [
 "Monday",
 "Tuesday",
 "Wednesday",
 "Thursday",
 "Friday",
 "Saturday",
 "Sunday"
];

// Pre-populate standard business hours (8:00 AM to 8:00 PM)
const HOURS = [
 "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
 "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

// Demo schedules to display if database not active
const DEMO_SCHEDULE: ScheduleItem[] = [
 // CEO DEMO SCHEDULES
 {
 id: "demo-ceo-1",
 role: "ceo",
 day_of_week: "Monday",
 start_time: "09:00",
 end_time: "10:30",
 task_title: "Weekly Nexus Alignment & Core Standup",
 description: "Align on executive operations, R&D Lab metrics, and weekly priority deliverables.",
 category: "Operations"
 },
 {
 id: "demo-ceo-2",
 role: "ceo",
 day_of_week: "Monday",
 start_time: "11:00",
 end_time: "12:00",
 task_title: "BiovaCo Biochar Growth Review",
 description: "Examine carbon-sequestration research updates and client feedback.",
 category: "Review"
 },
 {
 id: "demo-ceo-3",
 role: "ceo",
 day_of_week: "Monday",
 start_time: "14:00",
 end_time: "16:00",
 task_title: "Site Visit: Electroculture Experimental Fields",
 description: "Inspection of high-yield crops utilizing electromagnetic stimulation coils.",
 category: "Site Visit"
 },
 {
 id: "demo-ceo-4",
 role: "ceo",
 day_of_week: "Tuesday",
 start_time: "10:00",
 end_time: "12:00",
 task_title: "Strategic Q3 Expansion Planning",
 description: "Mapping logistics hubs and agricultural testing centers for North Region expansion.",
 category: "Strategic Planning"
 },
 {
 id: "demo-ceo-5",
 role: "ceo",
 day_of_week: "Tuesday",
 start_time: "15:00",
 end_time: "16:30",
 task_title: "International Agritech Investor Briefing",
 description: "Presenting BiovaCo Nexus milestones and financial forecasts.",
 category: "Meeting"
 },
 {
 id: "demo-ceo-6",
 role: "ceo",
 day_of_week: "Wednesday",
 start_time: "14:00",
 end_time: "15:00",
 task_title: "Key Account Review: GreenGrow Corp Partnership",
 description: "Discussing customized electroculture packages and supply scheduling.",
 category: "Client Call"
 },
 {
 id: "demo-ceo-7",
 role: "ceo",
 day_of_week: "Thursday",
 start_time: "09:00",
 end_time: "10:00",
 task_title: "CEO & MD Executive Align Chat",
 description: "Synchronize on resource allocation and upcoming strategic board approvals.",
 category: "Meeting"
 },
 {
 id: "demo-ceo-8",
 role: "ceo",
 day_of_week: "Friday",
 start_time: "16:00",
 end_time: "18:00",
 task_title: "Weekly Performance Reflection & Strategy",
 description: "Review internal dashboards and wrap up high-priority emails.",
 category: "Strategic Planning"
 },

 // MD DEMO SCHEDULES
 {
 id: "demo-md-1",
 role: "md",
 day_of_week: "Monday",
 start_time: "09:00",
 end_time: "10:30",
 task_title: "Weekly Nexus Alignment & Core Standup",
 description: "Align on executive operations, R&D Lab metrics, and weekly priority deliverables.",
 category: "Operations"
 },
 {
 id: "demo-md-2",
 role: "md",
 day_of_week: "Monday",
 start_time: "11:00",
 end_time: "13:00",
 task_title: "Supply Chain & Raw Materials Purchase Signoffs",
 description: "Reviewing copper wire inventory, magnetic components, and supplier contracts.",
 category: "Operations"
 },
 {
 id: "demo-md-3",
 role: "md",
 day_of_week: "Tuesday",
 start_time: "14:00",
 end_time: "15:30",
 task_title: "Supplier Negotiation & Contract Drafting",
 description: "Negotiating procurement rates with copper wire extrusion vendors.",
 category: "Client Call"
 },
 {
 id: "demo-md-4",
 role: "md",
 day_of_week: "Wednesday",
 start_time: "11:00",
 end_time: "13:00",
 task_title: "R&D Prototype Quality Inspection",
 description: "Verifying production builds of the new Electroculture Grow Rods v3.",
 category: "Site Visit"
 },
 {
 id: "demo-md-5",
 role: "md",
 day_of_week: "Thursday",
 start_time: "09:00",
 end_time: "10:00",
 task_title: "CEO & MD Executive Align Chat",
 description: "Synchronize on resource allocation and upcoming strategic board approvals.",
 category: "Meeting"
 },
 {
 id: "demo-md-6",
 role: "md",
 day_of_week: "Thursday",
 start_time: "14:00",
 end_time: "16:00",
 task_title: "Operations & HR Review Session",
 description: "Address team capacity, hiring pipelines, and department-wise budgets.",
 category: "Review"
 },
 {
 id: "demo-md-7",
 role: "md",
 day_of_week: "Friday",
 start_time: "10:30",
 end_time: "12:00",
 task_title: "Field Installation Audit & Logistics Align",
 description: "Review dispatch timelines and field technician schedules.",
 category: "Operations"
 }
];

export function CeoMdTimetable() {
 const [activeRole, setActiveRole] = useState<"ceo" | "md">("ceo");
 const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
 const [timetable, setTimetable] = useState<ScheduleItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [isLocalMode, setIsLocalMode] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedCategory, setSelectedCategory] = useState<string>("all");
 
 // Dialog States
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [isSqlDialogOpen, setIsSqlDialogOpen] = useState(false);
 const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
 const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
 const [bulkPasteText, setBulkPasteText] = useState("");
 const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

 // Form states for creating/editing schedule item
 const [formTitle, setFormTitle] = useState("");
 const [formCategory, setFormCategory] = useState<ScheduleItem["category"]>("Meeting");
 const [formDay, setFormDay] = useState<ScheduleItem["day_of_week"]>("Monday");
 const [formStart, setFormStart] = useState("09:00");
 const [formEnd, setFormEnd] = useState("10:00");
 const [formDesc, setFormDesc] = useState("");

 // Copy schedule states
 const [copySourceDay, setCopySourceDay] = useState<ScheduleItem["day_of_week"]>("Monday");
 const [copyTargetDay, setCopyTargetDay] = useState<ScheduleItem["day_of_week"]>("Tuesday");

 const { toast } = useToast();

 useEffect(() => {
 fetchTimetable();
 }, []);

 const fetchTimetable = async () => {
 setLoading(true);
 try {
 // We cast table name dynamically as 'ceo_md_timetable' to prevent typecheck block if types file is stale
 const { data, error } = await supabase
 .from("ceo_md_timetable" as any)
 .select("*")
 .order("start_time", { ascending: true });

 if (error) {
 if (error.code === "42P01") {
 throw new Error("TABLE_NOT_FOUND");
 }
 throw error;
 }

 setTimetable(data || []);
 setIsLocalMode(false);
 } catch (err: any) {
 console.warn("Supabase fetch failed or table doesn't exist. Switching to Local Storage:", err);
 setIsLocalMode(true);
 
 const localData = localStorage.getItem("ceo_md_timetable");
 if (localData) {
 try {
 setTimetable(JSON.parse(localData));
 } catch (e) {
 setTimetable(DEMO_SCHEDULE);
 localStorage.setItem("ceo_md_timetable", JSON.stringify(DEMO_SCHEDULE));
 }
 } else {
 setTimetable(DEMO_SCHEDULE);
 localStorage.setItem("ceo_md_timetable", JSON.stringify(DEMO_SCHEDULE));
 }
 } finally {
 setLoading(false);
 }
 };

 // Helper to save timetable locally (only used in Local Mode fallback)
 const saveLocally = (updatedList: ScheduleItem[]) => {
 setTimetable(updatedList);
 localStorage.setItem("ceo_md_timetable", JSON.stringify(updatedList));
 };

 // Open dialog to create a new item
 const handleOpenAddDialog = (day?: ScheduleItem["day_of_week"], hour?: string) => {
 setEditingItem(null);
 setFormTitle("");
 setFormCategory("Meeting");
 setFormDay(day || "Monday");
 
 if (hour) {
 setFormStart(hour);
 // Automatically set end time to 1 hour later
 const hourNum = parseInt(hour.split(":")[0]);
 const endHour = hourNum + 1 < 10 ? `0${hourNum + 1}:00` : `${hourNum + 1}:00`;
 setFormEnd(endHour);
 } else {
 setFormStart("09:00");
 setFormEnd("10:00");
 }
 setFormDesc("");
 setIsDialogOpen(true);
 };

 // Open dialog to edit an item
 const handleOpenEditDialog = (item: ScheduleItem) => {
 setEditingItem(item);
 setFormTitle(item.task_title);
 setFormCategory(item.category);
 setFormDay(item.day_of_week);
 setFormStart(item.start_time);
 setFormEnd(item.end_time);
 setFormDesc(item.description || "");
 setIsDialogOpen(true);
 };

 // Save Event Handler (Insert/Update)
 const handleSaveEvent = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!formTitle.trim()) {
 toast({
 title: "Validation Error",
 description: "Task title cannot be empty.",
 variant: "destructive"
 });
 return;
 }

 if (formStart >= formEnd) {
 toast({
 title: "Validation Error",
 description: "Start time must be before end time.",
 variant: "destructive"
 });
 return;
 }

 const payload: Omit<ScheduleItem, "id"> & { id?: string } = {
 role: activeRole,
 day_of_week: formDay,
 start_time: formStart,
 end_time: formEnd,
 task_title: formTitle,
 description: formDesc,
 category: formCategory
 };

 if (isLocalMode) {
 // Local Mode handling
 let updatedTimetable = [...timetable];
 if (editingItem) {
 updatedTimetable = updatedTimetable.map(item =>
 item.id === editingItem.id ? { ...item, ...payload } : item
 );
 toast({ title: "Updated Successfully", description: "Timetable slot updated locally." });
 } else {
 const newItem: ScheduleItem = {
 ...payload,
 id: `local-${Date.now()}`
 } as ScheduleItem;
 updatedTimetable.push(newItem);
 toast({ title: "Created Successfully", description: "Timetable slot added locally." });
 }
 saveLocally(updatedTimetable);
 setIsDialogOpen(false);
 } else {
 // Supabase Mode handling
 setLoading(true);
 try {
 if (editingItem) {
 const { error } = await supabase
 .from("ceo_md_timetable" as any)
 .update(payload)
 .eq("id", editingItem.id);

 if (error) throw error;
 toast({ title: "Success", description: "Schedule item updated successfully." });
 } else {
 const { error } = await supabase
 .from("ceo_md_timetable" as any)
 .insert([payload]);

 if (error) throw error;
 toast({ title: "Success", description: "Schedule item created successfully." });
 }
 setIsDialogOpen(false);
 fetchTimetable();
 } catch (error: any) {
 console.error("Error saving to database:", error);
 toast({
 title: "Database Error",
 description: error.message || "Failed to save schedule.",
 variant: "destructive"
 });
 } finally {
 setLoading(false);
 }
 }
 };

 // Delete event handler
 const handleDeleteEvent = async (id: string) => {
 if (!confirm("Are you sure you want to delete this schedule slot?")) return;

 if (isLocalMode) {
 const updated = timetable.filter(item => item.id !== id);
 saveLocally(updated);
 toast({ title: "Deleted", description: "Item deleted from local timetable." });
 } else {
 setLoading(true);
 try {
 const { error } = await supabase
 .from("ceo_md_timetable" as any)
 .delete()
 .eq("id", id);

 if (error) throw error;
 toast({ title: "Success", description: "Schedule item deleted." });
 fetchTimetable();
 } catch (error: any) {
 console.error("Error deleting from database:", error);
 toast({
 title: "Database Error",
 description: error.message || "Failed to delete schedule item.",
 variant: "destructive"
 });
 } finally {
 setLoading(false);
 }
 }
 };

 // Duplicate / Copy a full day's schedule
 const handleCopyDaySchedule = async () => {
 if (copySourceDay === copyTargetDay) {
 toast({
 title: "Validation Error",
 description: "Source and Target days must be different.",
 variant: "destructive"
 });
 return;
 }

 const sourceEvents = timetable.filter(
 item => item.role === activeRole && item.day_of_week === copySourceDay
 );

 if (sourceEvents.length === 0) {
 toast({
 title: "No Events Found",
 description: `There are no schedule events on ${copySourceDay} to copy.`,
 variant: "destructive"
 });
 return;
 }

 if (!confirm(`This will copy ${sourceEvents.length} events from ${copySourceDay} to ${copyTargetDay}. Proceed?`)) return;

 const newEvents = sourceEvents.map(event => ({
 role: activeRole,
 day_of_week: copyTargetDay,
 start_time: event.start_time,
 end_time: event.end_time,
 task_title: event.task_title,
 description: event.description,
 category: event.category
 }));

 if (isLocalMode) {
 const updated = [...timetable];
 newEvents.forEach((ev, idx) => {
 updated.push({
 ...ev,
 id: `local-copy-${Date.now()}-${idx}`
 } as ScheduleItem);
 });
 saveLocally(updated);
 toast({
 title: "Copy Complete",
 description: `Successfully duplicated ${newEvents.length} events to ${copyTargetDay} locally.`
 });
 setIsCopyDialogOpen(false);
 } else {
 setLoading(true);
 try {
 const { error } = await supabase
 .from("ceo_md_timetable" as any)
 .insert(newEvents);

 if (error) throw error;
 toast({
 title: "Copy Success",
 description: `Duplicated ${newEvents.length} events to ${copyTargetDay} in cloud sync.`
 });
 setIsCopyDialogOpen(false);
 fetchTimetable();
 } catch (error: any) {
 console.error("Error copying schedule:", error);
 toast({
 title: "Database Error",
 description: error.message || "Failed to copy schedule.",
 variant: "destructive"
 });
 } finally {
 setLoading(false);
 }
 }
 };

 // Clear all events for the current active role
 const handleClearRoleSchedule = async () => {
 if (!confirm(`Warning: This will delete ALL scheduled events for the ${activeRole.toUpperCase()} schedule. This action is irreversible. Proceed?`)) return;

 if (isLocalMode) {
 const updated = timetable.filter(item => item.role !== activeRole);
 saveLocally(updated);
 toast({ title: "Schedule Cleared", description: `Cleared all local entries for ${activeRole.toUpperCase()}.` });
 } else {
 setLoading(true);
 try {
 const { error } = await supabase
 .from("ceo_md_timetable" as any)
 .delete()
 .eq("role", activeRole);

 if (error) throw error;
 toast({ title: "Schedule Cleared", description: `Cleared all database entries for ${activeRole.toUpperCase()}.` });
 fetchTimetable();
 } catch (error: any) {
 console.error("Error clearing schedule:", error);
 toast({
 title: "Database Error",
 description: error.message || "Failed to clear schedule.",
 variant: "destructive"
 });
 } finally {
 setLoading(false);
 }
 }
 };

 // Reset to default sample timetable (Local Mode helper)
 const handleResetToDemo = () => {
 if (!confirm("This will overwrite current local storage entries with demo data. Proceed?")) return;
 saveLocally(DEMO_SCHEDULE);
 toast({ title: "Reset Success", description: "Loaded standard demo timetable." });
 };

 // Filter schedule items based on search and category filters
 const filteredEvents = useMemo(() => {
 return timetable.filter(item => {
 // Role filter
 if (item.role !== activeRole) return false;

 // Category filter
 if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

 // Search text filter
 if (searchQuery.trim()) {
 const query = searchQuery.toLowerCase();
 const titleMatch = item.task_title.toLowerCase().includes(query);
 const descMatch = item.description?.toLowerCase().includes(query) || false;
 const categoryMatch = item.category.toLowerCase().includes(query);
 const dayMatch = item.day_of_week.toLowerCase().includes(query);
 return titleMatch || descMatch || categoryMatch || dayMatch;
 }

 return true;
 });
 }, [timetable, activeRole, selectedCategory, searchQuery]);

 // Helper: convert "HH:MM" to total minutes from midnight
 const toMinutes = (t: string) => {
 const [h, m] = t.split(":").map(Number);
 return h * 60 + m;
 };

 // Dynamic visible time range — auto-expand to fit all events, minimum 08:00–18:00
 const { gridStartMin, gridEndMin } = useMemo(() => {
 let earliest = 8 * 60; // 08:00
 let latest = 18 * 60; // 18:00
 filteredEvents.forEach(ev => {
 const s = toMinutes(ev.start_time);
 const e = toMinutes(ev.end_time);
 if (s < earliest) earliest = s;
 if (e > latest) latest = e;
 });
 // Snap to hour boundaries
 earliest = Math.floor(earliest / 60) * 60;
 latest = Math.ceil(latest / 60) * 60;
 return { gridStartMin: earliest, gridEndMin: latest };
 }, [filteredEvents]);

 const totalGridMinutes = gridEndMin - gridStartMin;
 const PX_PER_MIN = 1.2; // pixels per minute — controls row height
 const GRID_HEIGHT = totalGridMinutes * PX_PER_MIN;

 // Hour labels shown on the left
 const hourLabels = useMemo(() => {
 const labels: string[] = [];
 for (let m = gridStartMin; m <= gridEndMin; m += 60) {
 const h = Math.floor(m / 60);
 labels.push(`${h.toString().padStart(2, "0")}:00`);
 }
 return labels;
 }, [gridStartMin, gridEndMin]);

 // Events grouped by day (for the new absolute grid)
 const eventsByDay = useMemo(() => {
 const map: Record<string, ScheduleItem[]> = {};
 DAYS.forEach(d => { map[d] = []; });
 filteredEvents.forEach(ev => {
 map[ev.day_of_week].push(ev);
 });
 return map;
 }, [filteredEvents]);

 // Bulk paste import handler
 const handleBulkImport = async () => {
 const lines = bulkPasteText
 .split("\n")
 .map(l => l.trim())
 .filter(l => l && !l.startsWith("#"));

 if (lines.length === 0) {
 toast({ title: "Empty Input", description: "Please paste at least one line.", variant: "destructive" });
 return;
 }

 const parsed: Omit<ScheduleItem, "id">[] = [];
 const errors: string[] = [];

 lines.forEach((line, idx) => {
 // Format: Day, HH:MM, HH:MM, Title, Category(optional)
 const parts = line.split(",").map(p => p.trim());
 if (parts.length < 4) {
 errors.push(`Line ${idx + 1}: needs at least Day, Start, End, Title`);
 return;
 }
 const [dayRaw, startRaw, endRaw, titleRaw, catRaw] = parts;
 const day = DAYS.find(d => d.toLowerCase() === dayRaw.toLowerCase());
 if (!day) { errors.push(`Line ${idx + 1}: unknown day "${dayRaw}"`); return; }
 if (!/^\d{2}:\d{2}$/.test(startRaw)) { errors.push(`Line ${idx + 1}: invalid start time`); return; }
 if (!/^\d{2}:\d{2}$/.test(endRaw)) { errors.push(`Line ${idx + 1}: invalid end time`); return; }
 if (startRaw >= endRaw) { errors.push(`Line ${idx + 1}: start must be before end`); return; }
 const validCats = Object.keys(CATEGORIES) as ScheduleItem["category"][];
 const cat: ScheduleItem["category"] = validCats.find(
 c => c.toLowerCase() === (catRaw || "").toLowerCase()
 ) || "Meeting";
 parsed.push({ role: activeRole, day_of_week: day, start_time: startRaw, end_time: endRaw, task_title: titleRaw, category: cat });
 });

 if (errors.length > 0) {
 toast({ title: `${errors.length} line(s) skipped`, description: errors.slice(0, 3).join(" | "), variant: "destructive" });
 }
 if (parsed.length === 0) return;

 if (isLocalMode) {
 const updated = [...timetable];
 parsed.forEach((ev, i) => updated.push({ ...ev, id: `bulk-${Date.now()}-${i}` } as ScheduleItem));
 saveLocally(updated);
 toast({ title: "Bulk Import Done", description: `Added ${parsed.length} slots locally.` });
 } else {
 try {
 const { error } = await supabase.from("ceo_md_timetable" as any).insert(parsed);
 if (error) throw error;
 toast({ title: "Bulk Import Done", description: `Saved ${parsed.length} slots to cloud.` });
 fetchTimetable();
 } catch (e: any) {
 toast({ title: "Import Failed", description: e.message, variant: "destructive" });
 return;
 }
 }
 setBulkPasteText("");
 setIsBulkDialogOpen(false);
 };

 // Calculations for time allocation analytics card
 const timeAllocationStats = useMemo(() => {
 const stats: Record<string, number> = {};
 let totalMinutes = 0;

 filteredEvents.forEach(item => {
 const [sh, sm] = item.start_time.split(":").map(Number);
 const [eh, em] = item.end_time.split(":").map(Number);
 const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
 
 if (diffMinutes > 0) {
 stats[item.category] = (stats[item.category] || 0) + diffMinutes;
 totalMinutes += diffMinutes;
 }
 });

 return {
 totalHours: (totalMinutes / 60).toFixed(1),
 breakdown: Object.keys(CATEGORIES).map(cat => {
 const categoryMinutes = stats[cat] || 0;
 const percentage = totalMinutes > 0 ? Math.round((categoryMinutes / totalMinutes) * 100) : 0;
 return {
 category: cat,
 hours: (categoryMinutes / 60).toFixed(1),
 percentage
 };
 }).sort((a, b) => b.percentage - a.percentage)
 };
 }, [filteredEvents]);

 // Native PDF exporter — professional corporate format
 const handlePrintSchedule = () => {
 try {
 const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

 const roleName = activeRole === "ceo" ? "Chief Executive Officer (CEO)" : "Managing Director (MD)";
 const roleShort = activeRole.toUpperCase();
 const pageW = doc.internal.pageSize.getWidth();
 const pageH = doc.internal.pageSize.getHeight();
 const M = 14;
 const generated = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

 // ── HEADER BAR ──────────────────────────────────────────────────
 doc.setFillColor(25, 35, 55);
 doc.rect(0, 0, pageW, 28, "F");

 doc.setFont("helvetica", "bold");
 doc.setFontSize(14);
 doc.setTextColor(255, 255, 255);
 doc.text("BiovaCo Nexus Private Limited", M, 11);

 doc.setFont("helvetica", "normal");
 doc.setFontSize(8);
 doc.setTextColor(170, 182, 196);
 doc.text("Advancing Agriculture Through Innovation", M, 17);

 doc.setFont("helvetica", "bold");
 doc.setFontSize(13);
 doc.setTextColor(255, 255, 255);
 doc.text("WEEKLY SCHEDULE", pageW - M, 11, { align: "right" });

 doc.setFont("helvetica", "normal");
 doc.setFontSize(8);
 doc.setTextColor(170, 182, 196);
 doc.text(roleName, pageW - M, 17, { align: "right" });

 // ── META ROW ───────────────────────────────────────────────────
 const metaY = 33;
 doc.setFont("helvetica", "normal");
 doc.setFontSize(7.5);
 doc.setTextColor(60, 60, 60);
 doc.text(`Prepared for : ${roleName}`, M, metaY);
 doc.text(`Document : Weekly Planner`, M + 90, metaY);
 doc.text(`Generated on : ${generated}`, M + 185, metaY);

 doc.setDrawColor(200, 200, 200);
 doc.setLineWidth(0.2);
 doc.line(M, metaY + 3, pageW - M, metaY + 3);

 // Build Table: one row per visible hour label, events matched by time overlap
 const head = [["Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]];

 // Helper: does the event overlap this hour slot?
 const eventInHour = (event: ScheduleItem, slotStartMin: number) => {
 const es = toMinutes(event.start_time);
 const ee = toMinutes(event.end_time);
 const slotEnd = slotStartMin + 60;
 return es < slotEnd && ee > slotStartMin;
 };

 const body = hourLabels.slice(0, -1).map((hourLabel) => {
 const slotStartMin = toMinutes(hourLabel);
 const row: string[] = [hourLabel];
 DAYS.forEach(day => {
 const dayEvents = (eventsByDay[day] || []).filter(ev => eventInHour(ev, slotStartMin));
 if (dayEvents.length === 0) {
 row.push("");
 } else {
 const text = dayEvents
 .map(ev => {
 let detail = `[${ev.start_time}-${ev.end_time}] ${ev.task_title}`;
 if (ev.description) detail += `\n ${ev.description}`;
 return detail;
 })
 .join("\n\n");
 row.push(text);
 }
 });
 return row;
 });

 autoTable(doc, {
 startY: metaY + 7,
 margin: { left: M, right: M, bottom: 18 },
 theme: "plain",
 head,
 body,
 styles: {
 fontSize: 7,
 cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
 lineColor: [210, 210, 210],
 lineWidth: 0.18,
 textColor: [30, 30, 30],
 font: "helvetica",
 valign: "top",
 overflow: "linebreak",
 },
 headStyles: {
 fillColor: [25, 35, 55],
 textColor: [255, 255, 255],
 fontStyle: "bold",
 halign: "center",
 fontSize: 7.5,
 cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
 },
 columnStyles: {
 0: { cellWidth: 14, halign: "center", fontStyle: "bold", fillColor: [238, 240, 244], textColor: [40, 40, 40] },
 1: { cellWidth: "auto" },
 2: { cellWidth: "auto" },
 3: { cellWidth: "auto" },
 4: { cellWidth: "auto" },
 5: { cellWidth: "auto" },
 6: { cellWidth: "auto" },
 7: { cellWidth: "auto" },
 },
 didParseCell: (data) => {
 if (data.cell.section === "body" && data.column.index > 0) {
 const hasText = data.cell.text?.length > 0 && data.cell.text[0] !== "";
 const isEven = data.row.index % 2 === 0;
 if (hasText) {
 data.cell.styles.fillColor = [248, 249, 250];
 } else {
 data.cell.styles.fillColor = isEven ? [255, 255, 255] : [250, 250, 250];
 }
 }
 },
 });

 // ── FOOTER on every page ───────────────────────────────────────
 const totalPages = (doc as any).internal.getNumberOfPages();
 for (let i = 1; i <= totalPages; i++) {
 doc.setPage(i);

 // Navy footer bar
 doc.setFillColor(25, 35, 55);
 doc.rect(0, pageH - 13, pageW, 13, "F");

 doc.setFont("helvetica", "normal");
 doc.setFontSize(6.5);
 doc.setTextColor(170, 182, 196);
 doc.text("BiovaCo Nexus Pvt. Ltd. | Confidential — Internal Use Only", M, pageH - 6);
 doc.text(`Page ${i} of ${totalPages}`, pageW / 2, pageH - 6, { align: "center" });
 doc.text(`${roleShort} Weekly Planner | ${generated}`, pageW - M, pageH - 6, { align: "right" });

 // Signature lines on last page
 if (i === totalPages) {
 const lastTableY = (doc as any).lastAutoTable?.finalY ?? (pageH - 40);
 const sigY = lastTableY + 5;
 if (sigY < pageH - 28) {
 doc.setDrawColor(130, 130, 130);
 doc.setLineWidth(0.25);
 doc.setFont("helvetica", "normal");
 doc.setFontSize(7);
 doc.setTextColor(70, 70, 70);

 // CEO signature
 doc.line(M, sigY + 10, M + 52, sigY + 10);
 doc.text("Authorised Signatory — CEO", M, sigY + 14);

 // MD signature
 doc.line(M + 70, sigY + 10, M + 122, sigY + 10);
 doc.text("Authorised Signatory — MD", M + 70, sigY + 14);

 // Date
 doc.line(pageW - M - 52, sigY + 10, pageW - M, sigY + 10);
 doc.text("Date", pageW - M - 52, sigY + 14);
 }
 }
 }

 doc.save(`BiovaCo_${roleShort}_WeeklySchedule.pdf`);

 toast({
 title: "PDF Downloaded",
 description: `${roleShort} Weekly Schedule saved successfully.`
 });
 } catch (err: any) {
 console.error("PDF generation failed:", err);
 toast({
 title: "PDF Export Failed",
 description: err.message || "Failed to generate PDF.",
 variant: "destructive"
 });
 }
 };

 // SQL table creation instruction code snippet
 const sqlCreateSnippet = `CREATE TABLE IF NOT EXISTS public.ceo_md_timetable (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 role TEXT NOT NULL CHECK (role IN ('ceo', 'md')),
 day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
 start_time TEXT NOT NULL,
 end_time TEXT NOT NULL,
 task_title TEXT NOT NULL,
 description TEXT,
 category TEXT DEFAULT 'Meeting' CHECK (category IN ('Meeting', 'Review', 'Strategic Planning', 'Operations', 'Personal', 'Site Visit', 'Client Call', 'Other')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ceo_md_timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ceo_md_timetable_select_policy" ON public.ceo_md_timetable FOR SELECT TO authenticated USING (true);
CREATE POLICY "ceo_md_timetable_insert_policy" ON public.ceo_md_timetable FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ceo_md_timetable_update_policy" ON public.ceo_md_timetable FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ceo_md_timetable_delete_policy" ON public.ceo_md_timetable FOR DELETE TO authenticated USING (true);`;

 return (
 <div className="space-y-6">
 
 {/* LOCAL / OFFLINE MODE BANNER */}
 {isLocalMode && (
 <div className="bg-muted/50 border-border p-4 rounded-r-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
 <div className="flex items-center space-x-3">
 <AlertTriangle className="h-6 w-6 text-foreground shrink-0" />
 <div>
 <p className="font-semibold text-foreground">Local Database Sandbox Mode Active</p>
 <p className="text-xs text-foreground">
 The <code className="bg-secondary px-1 py-0.5 rounded">ceo_md_timetable</code> table is not active in the remote Supabase database. Changes are currently saved in your browser storage.
 </p>
 </div>
 </div>
 <div className="flex items-center space-x-2 w-full md:w-auto">
 <Button
 size="sm"
 variant="outline"
 onClick={() => setIsSqlDialogOpen(true)}
 className="text-foreground border-border bg-white hover:bg-secondary text-xs shrink-0"
 >
 Get SQL Setup Query
 </Button>
 <Button
 size="sm"
 variant="ghost"
 onClick={handleResetToDemo}
 className="text-foreground hover:bg-secondary text-xs font-semibold shrink-0"
 >
 Load Demo Data
 </Button>
 </div>
 </div>
 )}

 {/* HEADER SECTION WITH FILTERS */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 ">
 <div className="space-y-1">
 <div className="flex items-center space-x-3">
 <Calendar className="h-6 w-6 text-foreground" />
 <h2 className="text-2xl font-bold text-foreground tracking-tight">Executive Schedule Desk</h2>
 </div>
 <p className="text-sm text-gray-500">
 Hour-wise & Day-wise planning utility tailored for the CEO & MD.
 </p>
 </div>

 {/* ROLE SELECTOR (CEO vs MD) */}
 <div className="flex items-center p-1 bg-gray-100 border border-gray-200 rounded-xl w-fit">
 <button
 onClick={() => setActiveRole("ceo")}
 className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold ${
 activeRole === "ceo"
 ? "bg-[#4B49AC] text-white"
 : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
 }`}
 >
 <User className="h-4 w-4" />
 <span>CEO Schedule</span>
 </button>
 <button
 onClick={() => setActiveRole("md")}
 className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold ${
 activeRole === "md"
 ? "bg-[#4B49AC] text-white"
 : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
 }`}
 >
 <User className="h-4 w-4" />
 <span>MD Schedule</span>
 </button>
 </div>
 </div>

 {/* INTERACTIVE CONTROLS PANEL */}
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 
 {/* SIDEBAR ANALYTICS & QUICK ACTIONS */}
 <div className="space-y-6 lg:col-span-1">
 
 {/* ACTION BUTTONS */}
 <Card className="border-gray-200 ">
 <CardHeader className="pb-3">
 <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Scheduler Actions</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <Button
 onClick={() => handleOpenAddDialog()}
 className="w-full bg-[#4B49AC] hover:bg-[#3e3d93] text-white font-semibold flex items-center justify-center gap-2 transition-colors duration-200"
 >
 <Plus className="h-4 w-4" />
 Add Time Slot
 </Button>
 <Button
 variant="outline"
 onClick={() => setIsCopyDialogOpen(true)}
 className="w-full border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 font-semibold flex items-center justify-center gap-2"
 >
 <Copy className="h-4 w-4" />
 Duplicate Day
 </Button>
 <Button
 variant="outline"
 onClick={handlePrintSchedule}
 className="w-full border-[#7DA0FA]/20 text-[#7DA0FA] bg-[#f2f6ff] hover:bg-[#7DA0FA]/10 font-semibold flex items-center justify-center gap-2"
 >
 <Download className="h-4 w-4" />
 Export / Print PDF
 </Button>
 <Button
 variant="outline"
 onClick={() => setIsBulkDialogOpen(true)}
 className="w-full border-[#4B49AC]/20 text-[#4B49AC] bg-[#4B49AC]/5 hover:bg-[#4B49AC]/10 font-semibold flex items-center justify-center gap-2"
 >
 <ClipboardList className="h-4 w-4" />
 Bulk Import
 </Button>
 <Button
 variant="ghost"
 onClick={handleClearRoleSchedule}
 className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold flex items-center justify-center gap-2"
 >
 <Trash2 className="h-4 w-4" />
 Clear All
 </Button>
 </CardContent>
 </Card>

 {/* TIME ALLOCATION METRICS */}
 <Card className="border-gray-200 ">
 <CardHeader className="pb-3">
 <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
 <PieChart className="h-4 w-4 text-foreground" />
 Weekly Work Balance
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <p className="text-2xl font-black text-foreground">{timeAllocationStats.totalHours} hrs</p>
 <p className="text-xs text-gray-500">Allocated schedule hours</p>
 </div>

 {filteredEvents.length === 0 ? (
 <div className="py-6 text-center text-xs text-gray-400">
 No records to display work analysis.
 </div>
 ) : (
 <div className="space-y-3">
 {timeAllocationStats.breakdown.map(item => {
 if (parseFloat(item.hours) === 0) return null;
 const catStyle = CATEGORIES[item.category as keyof typeof CATEGORIES];
 return (
 <div key={item.category} className="space-y-1">
 <div className="flex justify-between items-center text-xs font-semibold">
 <span className="text-gray-700 flex items-center gap-1.5">
 <span className={`w-2 h-2 rounded-full ${catStyle?.pill}`} />
 {item.category}
 </span>
 <span className="text-gray-500">{item.hours} hrs ({item.percentage}%)</span>
 </div>
 <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full `}
 style={{
 width: `${item.percentage}%`,
 backgroundColor: catStyle?.color || "#6B7280"
 }}
 />
 </div>
 </div>
 );
 })}
 </div>
 )}
 </CardContent>
 </Card>

 </div>

 {/* TIMETABLE VIEWPORT */}
 <div className="lg:col-span-3 space-y-6">
 
 {/* FILTER AND VIEW CONTROLS */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 ">
 <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
 
 {/* SEARCH */}
 <div className="relative w-full sm:w-60">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
 <Input
 placeholder="Search scheduled tasks..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 bg-gray-50 border-gray-200 focus:bg-white text-sm"
 />
 </div>

 {/* CATEGORY SELECTOR */}
 <Select value={selectedCategory} onValueChange={setSelectedCategory}>
 <SelectTrigger className="w-full sm:w-48 bg-gray-50 border-gray-200 text-sm">
 <SelectValue placeholder="All Categories" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Categories</SelectItem>
 {Object.keys(CATEGORIES).map(cat => (
 <SelectItem key={cat} value={cat}>{cat}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* VIEW SELECTOR TOGGLE */}
 <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50 shrink-0">
 <button
 onClick={() => setViewMode("grid")}
 className={`p-2 rounded-md transition-all ${
 viewMode === "grid"
 ? "bg-white text-foreground font-semibold"
 : "text-gray-500 hover:text-gray-900"
 }`}
 title="Weekly Grid Layout"
 >
 <LayoutGrid className="h-4 w-4" />
 </button>
 <button
 onClick={() => setViewMode("list")}
 className={`p-2 rounded-md transition-all ${
 viewMode === "list"
 ? "bg-white text-foreground font-semibold"
 : "text-gray-500 hover:text-gray-900"
 }`}
 title="Agenda List View"
 >
 <ListTodo className="h-4 w-4" />
 </button>
 </div>
 </div>

 {/* MAIN TIMETABLE CONTAINER FOR RENDER & PRINT */}
 <div id="printable-schedule-area" className="bg-white rounded-xl border border-gray-200 overflow-hidden p-6 relative">
 
 {/* PRINT-ONLY EMBEDDED HEADER */}
 <div className="hidden print:block mb-6 border-b pb-4">
 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-2xl font-black text-foreground">BiovaCo Nexus Executive Timetable</h1>
 <p className="text-sm text-gray-500">
 Officially compiled schedule for the: <span className="font-bold text-muted-foreground">{activeRole.toUpperCase()}</span>
 </p>
 </div>
 <div className="text-right text-xs text-gray-400">
 <p>Generated: {new Date().toLocaleDateString()}</p>
 <p>Status: Verified Official</p>
 </div>
 </div>
 </div>

 {loading ? (
 <div className="py-20 flex flex-col items-center justify-center space-y-4">
 <RefreshCw className="h-8 w-8 animate-spin text-foreground" />
 <p className="text-sm text-gray-500 font-medium">Fetching schedule entries...</p>
 </div>
 ) : filteredEvents.length === 0 ? (
 <div className="py-20 text-center space-y-3">
 <div className="w-12 h-12 bg-gray-50 border rounded-full flex items-center justify-center mx-auto">
 <Sparkles className="h-6 w-6 text-gray-400" />
 </div>
 <h3 className="font-semibold text-gray-800">No scheduled entries</h3>
 <p className="text-sm text-gray-500 max-w-sm mx-auto">
 There are no time allocations matching your selection. Click on "+ Add Time Slot" to start populating the timetable.
 </p>
 </div>
 ) : viewMode === "grid" ? (

 /* ── ABSOLUTE-POSITION CALENDAR GRID ── */
 <div className="overflow-x-auto select-none">
 <div className="min-w-[820px]">

 {/* Day headers */}
 <div className="flex">
 <div className="w-14 shrink-0" />
 {DAYS.map(day => (
 <div key={day} className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border border-gray-200 py-2">
 {day.slice(0,3)}
 </div>
 ))}
 </div>

 {/* Time + columns body */}
 <div className="flex" style={{ height: `${GRID_HEIGHT}px` }}>

 {/* Hour labels column */}
 <div className="w-14 shrink-0 relative border-r border-gray-200">
 {hourLabels.map((label, i) => (
 <div
 key={label}
 className="absolute w-full text-right pr-2 text-[10px] font-semibold text-gray-400"
 style={{ top: `${i * 60 * PX_PER_MIN - 6}px` }}
 >
 {label}
 </div>
 ))}
 </div>

 {/* Day columns */}
 {DAYS.map(day => (
 <div
 key={day}
 className="flex-1 relative border-r border-gray-200 group"
 style={{ height: `${GRID_HEIGHT}px` }}
 >
 {/* Hour grid lines */}
 {hourLabels.map((_, i) => (
 <div
 key={i}
 className="absolute left-0 right-0 border-t border-gray-100"
 style={{ top: `${i * 60 * PX_PER_MIN}px` }}
 />
 ))}

 {/* Half-hour dotted lines */}
 {hourLabels.slice(0, -1).map((_, i) => (
 <div
 key={`half-${i}`}
 className="absolute left-0 right-0 border-t border-dashed border-gray-50"
 style={{ top: `${(i * 60 + 30) * PX_PER_MIN}px` }}
 />
 ))}

 {/* Quick-add on click anywhere in column */}
 <div
 className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
 onClick={(e) => {
 const rect = e.currentTarget.getBoundingClientRect();
 const clickY = e.clientY - rect.top;
 const clickMin = gridStartMin + Math.floor(clickY / PX_PER_MIN / 30) * 30;
 const hh = Math.floor(clickMin / 60).toString().padStart(2, "0");
 const mm = (clickMin % 60).toString().padStart(2, "0");
 handleOpenAddDialog(day, `${hh}:${mm}`);
 }}
 >
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
 <Plus className="h-5 w-5 text-gray-300" />
 </div>
 </div>

 {/* Absolute-positioned events */}
 {(eventsByDay[day] || []).map(event => {
 const startMin = toMinutes(event.start_time);
 const endMin = toMinutes(event.end_time);
 const topPx = (startMin - gridStartMin) * PX_PER_MIN;
 const heightPx = Math.max((endMin - startMin) * PX_PER_MIN, 20);
 const config = CATEGORIES[event.category];
 return (
 <div
 key={event.id}
 onClick={() => handleOpenEditDialog(event)}
 className={`absolute left-0.5 right-0.5 rounded-md border text-[10px] cursor-pointer overflow-hidden shadow-sm hover: hover:z-10 ${config?.bg}`}
 style={{ top: `${topPx}px`, height: `${heightPx}px`, zIndex: 2 }}
 >
 <div className="p-1 h-full flex flex-col justify-start">
 <div className="font-bold leading-tight truncate">{event.task_title}</div>
 <div className="font-mono opacity-70 text-[9px] mt-0.5">{event.start_time}–{event.end_time}</div>
 {heightPx > 42 && event.description && (
 <p className="opacity-60 text-[9px] leading-tight mt-0.5 line-clamp-2">{event.description}</p>
 )}
 </div>
 </div>
 );
 })}
 </div>
 ))}
 </div>
 </div>
 </div>
 ) : (
 
 /* 2. AGENDA LIST VIEW */
 <div className="space-y-8">
 {DAYS.map(day => {
 const dayEvents = filteredEvents.filter(item => item.day_of_week === day);
 if (dayEvents.length === 0) return null;

 return (
 <div key={day} className="space-y-3">
 <div className="flex items-center space-x-2 border-b pb-1.5">
 <span className="h-2 w-2 rounded-full bg-primary text-primary-foreground" />
 <h4 className="font-bold text-foreground">{day} Schedule</h4>
 <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-semibold font-mono">
 {dayEvents.length} items
 </span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {dayEvents.map(event => {
 const config = CATEGORIES[event.category];
 return (
 <Card
 key={event.id}
 className={`border hover: ${config?.bg}`}
 >
 <CardContent className="p-4 flex justify-between items-start gap-4">
 <div className="space-y-1.5 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-[10px] font-bold tracking-wider uppercase bg-white/80 px-2 py-0.5 rounded-md border border-gray-200/50">
 {event.category}
 </span>
 <span className="text-xs font-mono font-bold flex items-center gap-1 text-gray-600 bg-white/50 px-2 py-0.5 rounded border border-gray-200/30">
 <Clock className="h-3 w-3" />
 {event.start_time} - {event.end_time}
 </span>
 </div>
 
 <h4 className="font-extrabold text-sm text-gray-900">{event.task_title}</h4>
 
 {event.description && (
 <p className="text-xs text-gray-600 leading-relaxed font-medium">{event.description}</p>
 )}
 </div>

 <div className="flex items-center gap-1 shrink-0 bg-white/40 p-1 rounded-lg border border-gray-200/30">
 <Button
 size="icon"
 variant="ghost"
 onClick={() => handleOpenEditDialog(event)}
 className="h-7 w-7 text-gray-700 hover:text-foreground hover:bg-white"
 >
 <Edit2 className="h-3.5 w-3.5" />
 </Button>
 <Button
 size="icon"
 variant="ghost"
 onClick={() => handleDeleteEvent(event.id)}
 className="h-7 w-7 text-gray-700 hover:text-red-600 hover:bg-white"
 >
 <Trash2 className="h-3.5 w-3.5" />
 </Button>
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* CREATE & EDIT TIME SLOT DIALOG */}
 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
 <DialogContent className="max-w-md bg-white">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
 <Clock className="h-5 w-5 text-foreground" />
 {editingItem ? "Edit Schedule Allocation" : "Allocate New Time Slot"}
 </DialogTitle>
 <DialogDescription>
 Provide scheduling details for the {activeRole.toUpperCase()}'s time slot.
 </DialogDescription>
 </DialogHeader>

 <form onSubmit={handleSaveEvent} className="space-y-4 pt-2">
 
 {/* TASK TITLE */}
 <div className="space-y-1">
 <Label htmlFor="task_title" className="font-semibold text-gray-700">Task Title / Meeting Name</Label>
 <Input
 id="task_title"
 value={formTitle}
 onChange={(e) => setFormTitle(e.target.value)}
 placeholder="e.g., Board Meeting, Core Review..."
 required
 />
 </div>

 {/* CATEGORY & DAY OF WEEK */}
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <Label htmlFor="category" className="font-semibold text-gray-700">Category</Label>
 <Select
 value={formCategory}
 onValueChange={(val) => setFormCategory(val as ScheduleItem["category"])}
 >
 <SelectTrigger id="category">
 <SelectValue placeholder="Select Category" />
 </SelectTrigger>
 <SelectContent>
 {Object.keys(CATEGORIES).map(cat => (
 <SelectItem key={cat} value={cat}>{cat}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-1">
 <Label htmlFor="day" className="font-semibold text-gray-700">Day of Week</Label>
 <Select
 value={formDay}
 onValueChange={(val) => setFormDay(val as ScheduleItem["day_of_week"])}
 >
 <SelectTrigger id="day">
 <SelectValue placeholder="Select Day" />
 </SelectTrigger>
 <SelectContent>
 {DAYS.map(day => (
 <SelectItem key={day} value={day}>{day}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 {/* START & END TIMES */}
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <Label htmlFor="start_time" className="font-semibold text-gray-700">Start Time</Label>
 <Input
 id="start_time"
 type="time"
 value={formStart}
 onChange={(e) => setFormStart(e.target.value)}
 required
 />
 </div>

 <div className="space-y-1">
 <Label htmlFor="end_time" className="font-semibold text-gray-700">End Time</Label>
 <Input
 id="end_time"
 type="time"
 value={formEnd}
 onChange={(e) => setFormEnd(e.target.value)}
 required
 />
 </div>
 </div>

 {/* DESCRIPTION */}
 <div className="space-y-1">
 <Label htmlFor="description" className="font-semibold text-gray-700">Description / Minutes (Optional)</Label>
 <Textarea
 id="description"
 value={formDesc}
 onChange={(e) => setFormDesc(e.target.value)}
 placeholder="Include agenda details, key discussion points or references..."
 rows={3}
 />
 </div>

 <DialogFooter className="pt-4 flex items-center justify-between gap-2 border-t">
 {editingItem && (
 <Button
 type="button"
 variant="destructive"
 onClick={() => {
 handleDeleteEvent(editingItem.id);
 setIsDialogOpen(false);
 }}
 className="bg-red-600 hover:bg-red-700 mr-auto"
 >
 Delete Item
 </Button>
 )}
 
 <div className="flex gap-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => setIsDialogOpen(false)}
 >
 Cancel
 </Button>
 <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 text-white font-semibold">
 {editingItem ? "Update Slot" : "Allocate Slot"}
 </Button>
 </div>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>

 {/* SQL SCHEMA DIALOG (LOCAL MODE HELP) */}
 <Dialog open={isSqlDialogOpen} onOpenChange={setIsSqlDialogOpen}>
 <DialogContent className="max-w-xl bg-white">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
 <Info className="h-5 w-5 text-foreground" />
 Supabase SQL Table Initialization
 </DialogTitle>
 <DialogDescription>
 Execute this SQL snippet in the Supabase SQL Editor of your project dashboard (<a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-foreground font-bold underline">https://supabase.com</a>) to establish permanent cloud-based synchronization.
 </DialogDescription>
 </DialogHeader>

 <div className="mt-3 relative">
 <pre className="p-4 bg-gray-900 text-foreground rounded-lg text-xs font-mono overflow-x-auto max-h-[300px]">
 {sqlCreateSnippet}
 </pre>
 <Button
 size="sm"
 onClick={() => {
 navigator.clipboard.writeText(sqlCreateSnippet);
 toast({ title: "Copied to Clipboard", description: "You can now paste it in Supabase." });
 }}
 className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white"
 >
 Copy SQL
 </Button>
 </div>

 <DialogFooter className="pt-2 border-t mt-4">
 <Button onClick={() => setIsSqlDialogOpen(false)} className="bg-primary text-primary-foreground">
 Close Instructions
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* DUPLICATE / COPY SCHEDULE DIALOG */}
 <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
 <DialogContent className="max-w-md bg-white">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
 <Copy className="h-5 w-5" />
 Duplicate Day Schedule
 </DialogTitle>
 <DialogDescription>
 Copy all scheduled events from one day to another day to speed up timetable creation.
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4 pt-2">
 <div className="space-y-1">
 <Label className="font-semibold text-gray-700">Source Day (Copy From)</Label>
 <Select
 value={copySourceDay}
 onValueChange={(val) => setCopySourceDay(val as ScheduleItem["day_of_week"])}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {DAYS.map(day => (
 <SelectItem key={day} value={day}>{day}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-1">
 <Label className="font-semibold text-gray-700">Target Day (Paste To)</Label>
 <Select
 value={copyTargetDay}
 onValueChange={(val) => setCopyTargetDay(val as ScheduleItem["day_of_week"])}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {DAYS.map(day => (
 <SelectItem key={day} value={day}>{day}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <DialogFooter className="pt-4 border-t mt-4">
 <Button variant="outline" onClick={() => setIsCopyDialogOpen(false)}>
 Cancel
 </Button>
 <Button onClick={handleCopyDaySchedule} className="bg-primary text-primary-foreground hover:bg-primary/90 text-white font-semibold">
 Copy Schedule
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* BULK PASTE IMPORT DIALOG */}
 <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
 <DialogContent className="max-w-lg bg-white">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
 <ClipboardList className="h-5 w-5" />
 Bulk Import Time Slots
 </DialogTitle>
 <DialogDescription>
 Paste multiple slots — one per line. Format:<br />
 <code className="text-xs bg-gray-100 px-1 rounded">Day, HH:MM, HH:MM, Title, Category(optional)</code>
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-3 pt-1">
 {/* Example hint */}
 <div className="bg-gray-900 rounded-lg p-3 text-[11px] font-mono text-foreground space-y-0.5">
 <p># Lines starting with # are ignored</p>
 <p>Monday, 09:00, 10:30, Core Standup, Operations</p>
 <p>Tuesday, 14:00, 15:30, Investor Call, Meeting</p>
 <p>Wednesday, 11:00, 13:00, Site Visit, Site Visit</p>
 <p>Thursday, 09:00, 10:00, CEO-MD Sync, Meeting</p>
 </div>

 <Textarea
 value={bulkPasteText}
 onChange={(e) => setBulkPasteText(e.target.value)}
 placeholder="Paste your schedule lines here..."
 rows={8}
 className="font-mono text-xs"
 />

 <p className="text-xs text-gray-400">
 Valid categories: Meeting · Review · Strategic Planning · Operations · Personal · Site Visit · Client Call · Other
 </p>
 </div>

 <DialogFooter className="pt-3 border-t flex gap-2">
 <Button variant="outline" onClick={() => { setBulkPasteText(""); setIsBulkDialogOpen(false); }}>
 Cancel
 </Button>
 <Button onClick={handleBulkImport} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold">
 Import {bulkPasteText.split("\n").filter(l => l.trim() && !l.trim().startsWith("#")).length} Slots
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 </div>
 );
}
