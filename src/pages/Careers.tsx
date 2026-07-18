import { useState, useEffect } from "react"
import { NavigationHeader } from "@/components/NavigationHeader"
import { JobApplicationForm } from "@/components/JobApplicationForm"
import { ApplicationTracker } from "@/components/ApplicationTracker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, ArrowRight, DollarSign, Briefcase, Search } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Link } from "react-router-dom"

interface JobPosition {
 id: string
 role_key: string
 title: string
 department: string
 location: string
 job_type: string
 description: string
 salary_range: string
 is_active: boolean
 display_order: number
}

const Careers = () => {
 const [positions, setPositions] = useState<JobPosition[]>([])
 const [loading, setLoading] = useState(true)
 const { toast } = useToast()

 useEffect(() => {
 fetchPositions()
 }, [])

 const fetchPositions = async () => {
 try {
 const { data, error } = await supabase
 .from("job_positions")
 .select("*")
 .eq("is_active", true)
 .order("display_order", { ascending: true })

 if (error) throw error
 setPositions(data || [])
 } catch (error) {
 console.error("Error fetching positions:", error)
 toast({
 title: "Error",
 description: "Failed to fetch job positions",
 variant: "destructive",
 })
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="min-h-screen bg-[#F8FAFC] selection:bg-accent/20 selection:text-primary font-sans overflow-hidden">
 <NavigationHeader currentPageTitle="Careers" />

 {/* Abstract Background Orbs */}
 <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
 <div className="absolute top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-muted/5 blur-[120px]" />
 <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-muted/5 blur-[120px]" />
 </div>

 {/* Hero Section */}
 <section className="pt-32 pb-16 relative z-10">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left mt-8">
 <Badge variant="outline" className="mb-6 border-primary/20 text-primary bg-primary/5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest backdrop-blur-md">
 <Search className="w-4 h-4 mr-2 inline" />
 Join BiovaCo
 </Badge>
 <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-primary tracking-tight leading-[1.1]">
 Build the future of <br className="hidden md:block"/>
 <span className="text-foreground font-bold">
 scalable technology.
 </span>
 </h1>
 <p className="text-lg md:text-2xl max-w-3xl mb-10 text-muted-foreground font-medium">
 We are looking for exceptional talent to join our portfolio of ventures across AI, AgTech, and Consumer Technology.
 </p>
 <div className="flex flex-col sm:flex-row gap-5">
 <a href="#open-positions" className="w-full sm:w-auto">
 <Button size="lg" className="rounded-full px-8 h-14 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 hover:scale-105 w-full">
 View Open Positions
 </Button>
 </a>
 <a href="#application-tracker" className="w-full sm:w-auto">
 <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:text-accent hover:border-accent/30 w-full ">
 Track Application
 </Button>
 </a>
 </div>
 </div>
 </section>

 {/* Open Positions Section */}
 <section id="open-positions" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
 <div className="flex flex-col sm:flex-row justify-between items-end gap-6 mb-12">
 <div>
 <h2 className="text-4xl font-bold text-primary mb-2 tracking-tight">Open Roles</h2>
 <p className="text-muted-foreground text-lg">Join us in our mission to solve global challenges.</p>
 </div>
 <div className="bg-white rounded-full px-5 py-2.5 border border-gray-100 flex items-center gap-3">
 <Briefcase className="h-5 w-5 text-accent" />
 <span className="text-sm font-semibold text-primary">{positions.length} active positions</span>
 </div>
 </div>

 {loading ? (
 <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-gray-100/50 ">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
 <p className="text-muted-foreground font-medium">Loading open positions...</p>
 </div>
 ) : positions.length > 0 ? (
 <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
 {positions.map((position) => (
 <Card key={position.id} className="border border-gray-100/80 shadow-gray-200/30 hover:shadow-2xl hover:shadow-primary/10 flex flex-col h-full rounded-[2rem] bg-white group hover:border-primary/20 overflow-hidden relative">
 <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-50 to-transparent -z-10 group-hover:from-accent/5 transition-colors duration-500"></div>
 <CardHeader className="pb-4 relative z-10">
 <div className="flex justify-between items-start mb-4">
 <Badge variant="secondary" className="bg-primary/5 text-primary border-none hover:bg-primary/10 px-3 py-1 text-xs">
 {position.department}
 </Badge>
 </div>
 <CardTitle className="text-2xl font-bold text-primary group-hover:text-accent transition-colors">
 {position.title}
 </CardTitle>
 </CardHeader>
 <CardContent className="flex-1 relative z-10">
 <p className="text-muted-foreground line-clamp-3 mb-6 text-sm leading-relaxed">
 {position.description}
 </p>
 <div className="space-y-3 text-sm text-gray-600 bg-gray-50/80 p-5 rounded-2xl border border-gray-100/50">
 <div className="flex items-center gap-3">
 <MapPin className="h-4 w-4 text-primary/50" />
 <span className="font-medium text-primary">{position.location}</span>
 </div>
 <div className="flex items-center gap-3">
 <Clock className="h-4 w-4 text-primary/50" />
 <span className="font-medium text-primary">{position.job_type}</span>
 </div>
 {position.salary_range && (
 <div className="flex items-center gap-3">
 <DollarSign className="h-4 w-4 text-primary/50" />
 <span className="font-medium text-primary">{position.salary_range}</span>
 </div>
 )}
 </div>
 </CardContent>
 <CardFooter className="pt-4 border-t border-gray-100/50 relative z-10">
 <Link to={`/careers/job/${position.role_key}`} className="w-full">
 <Button variant="ghost" className="w-full h-12 text-primary hover:bg-primary/5 hover:text-primary group-hover:bg-primary group-hover:text-white transition-all rounded-xl font-semibold">
 View Details
 <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 " />
 </Button>
 </Link>
 </CardFooter>
 </Card>
 ))}
 </div>
 ) : (
 <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-gray-100/50 ">
 <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
 <Briefcase className="h-10 w-10 text-primary/40" />
 </div>
 <h3 className="text-2xl font-bold text-primary mb-3 tracking-tight">No Open Positions</h3>
 <p className="text-muted-foreground max-w-md mx-auto text-lg">We don't have any open positions at the moment, but we are always looking for great talent. Check back soon!</p>
 </div>
 )}
 </section>

 {/* Application Form Section */}
 <section id="application-form" className="py-24 relative z-10 border-t border-b border-gray-200/50 bg-white/30 backdrop-blur-sm">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center mb-12">
 <h2 className="text-4xl font-extrabold text-primary mb-4 tracking-tight">Submit Your Application</h2>
 <p className="text-xl text-muted-foreground">Select a role from the dropdown inside the form to apply directly.</p>
 </div>
 <div className="bg-white p-8 sm:p-14 rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/40 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -z-10"></div>
 <JobApplicationForm />
 </div>
 </div>
 </section>

 {/* Tracker Section */}
 <section id="application-tracker" className="py-24 relative z-10">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="text-center mb-12">
 <h2 className="text-4xl font-extrabold text-primary mb-4 tracking-tight">Track Application Status</h2>
 <p className="text-xl text-muted-foreground">
 Enter your Application ID below to check your current hiring status.
 </p>
 </div>
 <div className="bg-white p-8 sm:p-14 rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/40 relative overflow-hidden">
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10"></div>
 <ApplicationTracker />
 </div>
 </div>
 </section>

 {/* Footer */}
 <footer className="border-t border-gray-200/60 bg-white pt-20 pb-10 mt-10 relative z-10">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
 <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
 <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
 <span className="text-primary font-bold text-xl mr-4">BIOVACO NEXUS PRIVATE LIMITED</span>
 <span>© 2026 All rights reserved.</span>
 <span className="hidden sm:inline text-gray-300">•</span>
 <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
 </div>
 </div>
 </div>
 </footer>
 </div>
 )
}

export default Careers
