import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
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
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
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
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#032E63]">Newsletter Subscribers ({newsletters.length})</h1>
        <Button variant="outline" className="w-full sm:w-auto" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="hidden md:block overflow-x-auto rounded-md border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f8fafc]">
              <TableHead className="text-[#032E63] font-bold">Email</TableHead>
              <TableHead className="text-[#032E63] font-bold">Confirmed</TableHead>
              <TableHead className="text-[#032E63] font-bold">Subscribed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newsletters.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.email}</TableCell>
                <TableCell>
                  <Badge className={sub.confirmed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {sub.confirmed ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  {new Date(sub.subscribed_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Responsive Vertical Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {newsletters.map((sub) => (
          <Card key={sub.id} className="p-4 border-l-4 border-l-[#08A04B] shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-[#032E63] break-all mr-2">{sub.email}</span>
              <Badge
                className={
                  sub.confirmed ? "bg-green-100 text-green-800 shrink-0" : "bg-red-100 text-red-800 shrink-0"
                }
              >
                {sub.confirmed ? "Confirmed" : "Pending"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              <span className="text-xs uppercase tracking-wider mr-1">Date:</span>
              {new Date(sub.subscribed_at).toLocaleDateString()}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
