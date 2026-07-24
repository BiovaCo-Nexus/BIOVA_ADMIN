import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, User, Send, Sparkles, Loader2, ArrowRight } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

export function AIBusinessAssistant() {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: 'Hello! I am BiovaCo Nexus AI. I have full access to your business database. Ask me about finances, interns, or tasks!' }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setInput("")
    setIsTyping(true)

    // Simulate AI processing and DB query
    setTimeout(async () => {
      let aiResponse = "I'm analyzing that for you..."
      const lowerQuery = userMsg.toLowerCase()

      try {
        if (lowerQuery.includes('expense') || lowerQuery.includes('spend')) {
          const { data } = await supabase.from('expense_records').select('amount')
          const total = data?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0
          aiResponse = `Based on the latest data, your total recorded expenses are ₹${total.toLocaleString('en-IN')}. Would you like a breakdown by category?`
        } else if (lowerQuery.includes('intern') || lowerQuery.includes('student')) {
          const { count } = await supabase.from('interns').select('*', { count: 'exact', head: true })
          aiResponse = `You currently have ${count || 0} active interns registered in the system.`
        } else if (lowerQuery.includes('task') || lowerQuery.includes('work')) {
          const { count } = await supabase.from('ceo_md_timetable').select('*', { count: 'exact', head: true }).neq('status', 'completed')
          aiResponse = `There are ${count || 0} pending tasks across the organization that need attention.`
        } else {
          aiResponse = "I couldn't find a specific data point for that query. Try asking about 'expenses', 'interns', or 'tasks'."
        }
      } catch (err) {
        aiResponse = "I encountered an error while accessing the database."
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="max-w-5xl mx-auto h-[80vh] flex flex-col pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <Bot className="h-8 w-8 text-[#4B49AC]" /> AI Business Assistant
        </h2>
        <p className="text-gray-500 mt-2">Interact with your enterprise data using natural language.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-gray-200 shadow-md rounded-2xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'ai' ? 'bg-gradient-to-br from-[#4B49AC] to-[#7DA0FA]' : 'bg-gray-200'}`}>
                {msg.role === 'ai' ? <Sparkles className="h-5 w-5 text-white" /> : <User className="h-5 w-5 text-gray-600" />}
              </div>
              <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-[#4B49AC] text-white rounded-tr-sm' : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'}`}>
                <p className="text-[15px] leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-[#4B49AC] to-[#7DA0FA] flex items-center justify-center shadow-sm">
                <Bot className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Fetching insights...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-[#4B49AC] focus-within:ring-1 focus-within:ring-[#4B49AC] transition-all">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about revenue, active interns, or pending tasks..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-base"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping} className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white rounded-lg px-6 h-10">
              <Send className="h-4 w-4 mr-2" /> Send
            </Button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-xs text-gray-500 font-medium" onClick={() => setInput("What are our total expenses?")}>💰 Total Expenses?</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-xs text-gray-500 font-medium" onClick={() => setInput("How many interns do we have?")}>👥 Active Interns?</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-100 whitespace-nowrap text-xs text-gray-500 font-medium" onClick={() => setInput("What are the pending tasks?")}>📋 Pending Tasks?</Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
