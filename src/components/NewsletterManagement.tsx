import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Mail, Search, CheckCircle2, XCircle, Users, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface NewsletterSubscription {
  id: string
  email: string
  confirmed: boolean
  subscribed_at: string
}

export function NewsletterManagement() {
  const [newsletters, setNewsletters] = useState<NewsletterSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("newsletter_subscriptions")
        .select("*")
        .order("subscribed_at", { ascending: false })

      if (error) throw error
      setNewsletters(data || [])
    } catch (error) {
      console.error("Error fetching newsletters:", error)
      toast({
        title: "Error",
        description: "Failed to load newsletter subscribers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (newsletters.length === 0) return
    const csvContent = [
      ["Email", "Confirmed", "Subscribed At"],
      ...newsletters.map((sub) => [
        sub.email,
        sub.confirmed ? "Yes" : "No",
        new Date(sub.subscribed_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()

    toast({
      title: "Exported CSV! 📄",
      description: `Downloaded ${newsletters.length} subscriber records.`
    })
  }

  const filteredSubs = useMemo(() => {
    return newsletters.filter((n) => n.email.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [newsletters, searchQuery])

  const confirmedCount = useMemo(() => newsletters.filter((n) => n.confirmed).length, [newsletters])

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#4B49AC]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-6 w-6 text-[#4B49AC]" />
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your email subscriber list, track confirmations, and export CRM mailing data.
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="font-semibold shadow-sm">
          <Download className="h-4 w-4 mr-2" /> Export CSV List
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Total Subscribers</p>
            <h3 className="text-xl font-bold text-gray-900">{newsletters.length}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Confirmed Active</p>
            <h3 className="text-xl font-bold text-emerald-700">{confirmedCount}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Pending Confirmation</p>
            <h3 className="text-xl font-bold text-gray-900">{newsletters.length - confirmedCount}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search subscribers by email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b">
          <CardTitle className="text-base font-bold text-gray-900">
            Subscriber Directory ({filteredSubs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSubs.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">No Subscribers Found</h3>
              <p className="text-sm text-gray-500 mt-1">Subscribers from your website or landing pages will appear here in real time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold">Subscriber Email</TableHead>
                    <TableHead className="font-semibold">Confirmation Status</TableHead>
                    <TableHead className="font-semibold text-right">Subscribed Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubs.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-gray-50/80">
                      <TableCell className="font-bold text-gray-900">{sub.email}</TableCell>
                      <TableCell>
                        <Badge className={sub.confirmed ? "bg-emerald-600 text-white text-xs" : "bg-amber-500 text-white text-xs"}>
                          {sub.confirmed ? "Confirmed Opt-in" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-600">
                        {new Date(sub.subscribed_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
