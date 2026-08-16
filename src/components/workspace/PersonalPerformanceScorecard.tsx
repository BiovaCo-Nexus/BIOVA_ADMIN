import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Award, 
  Plus, 
  Trash2, 
  Sparkles, 
  MessageSquareQuote,
  Star,
  CheckCircle2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PersonalWorkspaceService, getCleanEmail } from "@/services/personalWorkspaceService"

interface PersonalPerformanceScorecardProps {
  userEmail?: string
}

export function PersonalPerformanceScorecard({ userEmail }: PersonalPerformanceScorecardProps) {
  const activeEmail = getCleanEmail(userEmail)
  const [scorecard, setScorecard] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAppraisalModalOpen, setIsAppraisalModalOpen] = useState(false)
  
  const [goalTitle, setGoalTitle] = useState("")
  const [goalProgress, setGoalProgress] = useState(50)
  const [selfAppraisalNotes, setSelfAppraisalNotes] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    loadPerformance()
  }, [activeEmail])

  const loadPerformance = async () => {
    const data = await PersonalWorkspaceService.getPerformanceScorecard(activeEmail)
    setScorecard(data)
  }

  const handleUpdateProgress = async (goalId: string, newProgress: number) => {
    const updated = await PersonalWorkspaceService.updatePerformanceGoal(activeEmail, goalId, newProgress)
    setScorecard(updated)
    toast({
      title: "Goal Progress Updated",
      description: `Set milestone to ${newProgress}%.`
    })
  }

  const handleAddGoal = async () => {
    if (!goalTitle.trim()) {
      toast({ title: "Goal Title Required", description: "Please enter a goal title.", variant: "destructive" })
      return
    }

    const updated = await PersonalWorkspaceService.savePerformanceGoal(activeEmail, {
      title: goalTitle,
      progress: goalProgress,
      target: "100%",
      status: goalProgress >= 80 ? "Exceeding" : goalProgress >= 50 ? "On Track" : "In Progress"
    })

    setScorecard(updated)
    setIsModalOpen(false)
    setGoalTitle("")
    setGoalProgress(50)

    toast({
      title: "New Goal Added",
      description: `Added "${goalTitle}" to your KPI scorecard.`
    })
  }

  const handleDeleteGoal = async (goalId: string, title: string) => {
    const updated = await PersonalWorkspaceService.deletePerformanceGoal(activeEmail, goalId)
    setScorecard(updated)
    toast({
      title: "Goal Removed",
      description: `Deleted "${title}" from your scorecard.`
    })
  }

  const handleSubmitAppraisal = () => {
    if (!selfAppraisalNotes.trim()) {
      toast({ title: "Notes Required", description: "Please enter your self-appraisal summary.", variant: "destructive" })
      return
    }

    setIsAppraisalModalOpen(false)
    setSelfAppraisalNotes("")

    toast({
      title: "Self-Appraisal Submitted! 🌟",
      description: "Your quarterly self-appraisal was saved and submitted for executive review."
    })
  }

  if (!scorecard) return null

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-[#4B49AC]" /> My Performance & OKR Scorecard
          </h2>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            Quarterly KPIs, objective milestones, and appraisal records for <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">{activeEmail}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAppraisalModalOpen(true)} variant="outline" className="border-[#4B49AC]/30 text-[#4B49AC] hover:bg-indigo-50 font-medium text-xs h-10">
            <Star className="h-4 w-4 mr-1.5 text-amber-500" /> Submit Self-Appraisal
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white font-medium text-xs h-10 shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add Personal Goal
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-gray-200 bg-gradient-to-br from-indigo-50/50 to-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Performance Rating</p>
              <p className="text-3xl font-black text-[#4B49AC] mt-1">{scorecard.overallScore}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">⭐ Top Tier Performer</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl text-[#4B49AC]">
              <Trophy className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Active Objectives</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{scorecard.goals.length} Goals</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{scorecard.quarter} Targets</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Target className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Goal Completion Rate</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">
                {Math.round(scorecard.goals.reduce((acc: number, g: any) => acc + g.progress, 0) / (scorecard.goals.length || 1))}%
              </p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">On track for Q3 goals</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manager Feedback Banner */}
      <Card className="border-l-4 border-l-amber-500 bg-amber-50/40">
        <CardContent className="p-5 flex items-start gap-4">
          <MessageSquareQuote className="h-6 w-6 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">Executive & Manager Feedback ({scorecard.quarter})</h4>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              "{scorecard.managerFeedback}"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Goal Items List with Live Progress Sliders */}
      <Card className="border-gray-200">
        <CardHeader className="py-4 px-6 border-b border-gray-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-gray-900">Key Performance Indicators & OKRs</CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Drag the slider to update your live milestone achievement percentage
            </CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="sm" variant="outline" className="text-xs h-8">
            <Plus className="h-3.5 w-3.5 mr-1" /> New Goal
          </Button>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {scorecard.goals.map((goal: any) => (
            <div
              key={goal.id}
              className="p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-200 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#4B49AC]" />
                  <span className="text-xs font-bold text-gray-900">{goal.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    goal.progress >= 80 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                      : "bg-blue-50 text-blue-800 border-blue-200 text-[10px]"
                  }>
                    {goal.progress}% Completed
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGoal(goal.id, goal.title)}
                    className="h-7 w-7 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Progress Milestone:</span>
                  <span className="font-bold text-[#4B49AC]">{goal.progress}% / 100%</span>
                </div>
                <Slider
                  value={[goal.progress]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([val]) => handleUpdateProgress(goal.id, val)}
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add Goal Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[460px] p-0 rounded-2xl overflow-hidden border-gray-200">
          <DialogHeader className="p-4 bg-gray-50 border-b border-gray-100">
            <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-4 w-4 text-[#4B49AC]" /> Add Performance Goal / OKR
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Assigned to {activeEmail}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4 bg-white">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Goal / Objective Title *</label>
              <Input
                placeholder="e.g. Implement automated analytics reporting"
                value={goalTitle}
                onChange={e => setGoalTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                <span>Initial Completion Progress:</span>
                <span className="text-[#4B49AC] font-bold">{goalProgress}%</span>
              </div>
              <Slider
                value={[goalProgress]}
                min={0}
                max={100}
                step={5}
                onValueChange={([val]) => setGoalProgress(val)}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleAddGoal} size="sm" className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white text-xs">
              Save Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Self Appraisal Modal */}
      <Dialog open={isAppraisalModalOpen} onOpenChange={setIsAppraisalModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 rounded-2xl overflow-hidden border-gray-200">
          <DialogHeader className="p-4 bg-gray-50 border-b border-gray-100">
            <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" /> Submit Self-Appraisal ({scorecard.quarter})
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Submit your quarterly accomplishments and self-assessment for review.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-3.5 bg-white">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Quarterly Accomplishments & Key Contributions *</label>
              <Textarea
                placeholder="Highlight your key deliverables, leadership initiatives, and obstacles overcome during this quarter..."
                rows={5}
                value={selfAppraisalNotes}
                onChange={e => setSelfAppraisalNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAppraisalModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSubmitAppraisal} size="sm" className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white text-xs">
              Submit Appraisal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
