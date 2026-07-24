import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, Sparkles, CheckCircle2, Bot, Calendar, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { supabase } from "@/integrations/supabase/client";

type ComplianceTask = {
  title: string;
  description: string;
  category: "regulation" | "system" | "market";
  priority: "critical" | "high" | "medium" | "low";
  due_date: string; // ISO date string or relative text
  id?: string; // local UI id
  added?: boolean;
};

export function ComplianceAI() {
  const [incDate, setIncDate] = useState("");
  const [companyType, setCompanyType] = useState("Private Limited");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { addItem } = useOfflineSync();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email || null);
    });
  }, []);

  const analyzeCompliance = async () => {
    if (!incDate) {
      toast({ title: "Date required", description: "Please enter the incorporation date.", variant: "destructive" });
      return;
    }

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      toast({ title: "API Key Missing", description: "Please set VITE_OPENROUTER_API_KEY in your .env file.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setTasks([]);

    try {
      const prompt = `
Act as an expert Indian Corporate Lawyer and Company Secretary. 
A company in India was incorporated on ${incDate} as a ${companyType}.
Calculate and list all the upcoming, immediate, and recurring statutory compliances they need to fulfill (e.g., First Board Meeting, Auditor Appointment, INC-20A, GST filing, ITR, AOC-4, MGT-7).

Format the output strictly as a JSON array of objects. Do not include markdown code blocks or any other text. Only return the JSON array.
Each object must have the following exact keys:
- "title": string (Name of the compliance)
- "description": string (Brief explanation of what it is and why it's needed)
- "category": string (Must be "regulation")
- "priority": string (Must be one of "critical", "high", "medium", "low")
- "due_date": string (Calculate the exact due date based on the incorporation date ${incDate}, format as YYYY-MM-DD. If it's recurring, provide the next immediate due date).
`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "BiovaCo Nexus"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash", 
          max_tokens: 2000, // Limit tokens to prevent 402 error on low balance
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      if (response.status === 402) {
        throw new Error("Payment Required: Your OpenRouter account needs credits to use this model. Please top up your account at openrouter.ai.");
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;
      
      // Clean up potential markdown formatting from AI response
      const jsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedTasks: ComplianceTask[] = JSON.parse(jsonStr);
      
      setTasks(parsedTasks.map((t, i) => ({ ...t, id: `task_${i}`, added: false })));
      
    } catch (error: any) {
      console.error(error);
      toast({ title: "Analysis Failed", description: "Could not generate compliance list. Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addToKnowledgeBase = async (task: ComplianceTask) => {
    try {
      await addItem({
        title: task.title,
        description: task.description,
        category: task.category || "regulation",
        priority: task.priority || "high",
        status: "pending",
        due_date: task.due_date || "",
        created_by: userEmail,
        assigned_to: userEmail
      });

      setTasks(tasks.map(t => t.id === task.id ? { ...t, added: true } : t));
      toast({ title: "Added to Knowledge Tracker", description: `Task "${task.title}" has been filed successfully.` });
    } catch (error) {
      console.error(error);
      toast({ title: "Filing Failed", description: "Could not add task to Knowledge Tracker.", variant: "destructive" });
    }
  };

  const addAllToKnowledgeBase = async () => {
    const unaddedTasks = tasks.filter(t => !t.added);
    for (const task of unaddedTasks) {
      await addToKnowledgeBase(task);
    }
    toast({ title: "Batch Filing Complete", description: `Added ${unaddedTasks.length} tasks to Knowledge Tracker.` });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-[#4B49AC]" /> AI Compliance Lawyer
        </h2>
        <p className="text-gray-500 mt-2">Generate automated corporate compliance timelines and file them directly to your Knowledge Tracker.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-md border-gray-100">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#4B49AC]" /> Company Details
            </CardTitle>
            <CardDescription>Enter details to calculate legal deadlines.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Date of Incorporation</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="date" 
                  className="pl-9" 
                  value={incDate} 
                  onChange={(e) => setIncDate(e.target.value)} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company Type</Label>
              <Select value={companyType} onValueChange={setCompanyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private Limited">Private Limited Company</SelectItem>
                  <SelectItem value="Public Limited">Public Limited Company</SelectItem>
                  <SelectItem value="LLP">Limited Liability Partnership (LLP)</SelectItem>
                  <SelectItem value="OPC">One Person Company (OPC)</SelectItem>
                  <SelectItem value="Section 8">Section 8 Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="w-full bg-[#4B49AC] hover:bg-[#3b3a88] text-white mt-4" 
              onClick={analyzeCompliance}
              disabled={isAnalyzing || !incDate}
            >
              {isAnalyzing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Laws...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate Compliance Plan</>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {tasks.length === 0 && !isAnalyzing ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
              <Bot className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Waiting for details</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-sm">
                Enter your incorporation date and click generate. The AI Lawyer will automatically calculate all MCA, Tax, and Labor compliance deadlines.
              </p>
            </div>
          ) : isAnalyzing ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-gray-50/50 border border-gray-100 rounded-xl p-8 text-center space-y-4 shadow-inner">
              <div className="relative">
                <div className="absolute inset-0 bg-[#4B49AC] rounded-full blur-xl opacity-20 animate-pulse"></div>
                <Bot className="h-16 w-16 text-[#4B49AC] animate-bounce relative z-10" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Consulting Legal Frameworks...</h3>
                <p className="text-gray-500 text-sm mt-1">Cross-referencing MCA timelines and Indian Corporate Law.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-700">Found {tasks.length} compliance requirements</span>
                <Button variant="outline" size="sm" onClick={addAllToKnowledgeBase} disabled={tasks.every(t => t.added)} className="text-[#4B49AC] border-[#4B49AC]/30 hover:bg-[#4B49AC]/5">
                  File All to Knowledge Tracker
                </Button>
              </div>
              
              <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 pb-4 scrollbar-thin">
                {tasks.map((task) => (
                  <Card key={task.id} className="shadow-sm hover:shadow-md transition-all border-gray-200 group">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Badge variant="outline" className={`${
                            task.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                            task.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            task.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          } text-xs`}>
                            {task.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            <Calendar className="h-3 w-3 mr-1" /> Due: {task.due_date}
                          </Badge>
                        </div>
                      </div>
                      <div className="shrink-0 pt-1">
                        <Button 
                          onClick={() => addToKnowledgeBase(task)}
                          disabled={task.added}
                          size="sm"
                          className={`w-full sm:w-auto ${task.added ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 opacity-100' : 'bg-primary hover:bg-primary/90 text-white'}`}
                        >
                          {task.added ? <><CheckCircle2 className="h-4 w-4 mr-1" /> Filed</> : "File as To-Do"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
