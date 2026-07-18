import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, CheckCircle, XCircle, Edit, Trash2, Clock, ImageOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define interfaces
interface TeamMember {
 id: string;
 name: string;
 email: string;
 role: string;
 bio?: string;
 linkedin?: string;
 twitter?: string;
 photo_url?: string;
 is_executive: boolean;
 is_founder: boolean;
 created_at: string;
}

interface Intern {
 id: string;
 name: string;
 email: string;
 contact?: string;
 college?: string;
 branch?: string;
 year?: string;
 project_department?: string;
 joining_date?: string;
 end_date?: string;
 status: 'Active' | 'Completed' | 'Terminated' | 'Pending Onboarding';
 photo_url?: string;
 position: string;
 bio?: string;
 is_featured?: boolean;
 created_at: string;
 is_from_application?: boolean;
 application_id?: string;
}

export default function TeamManagement() {
 // State management
 const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
 const [interns, setInterns] = useState<Intern[]>([]);
 const [loading, setLoading] = useState(false);
 const [searchTerm, setSearchTerm] = useState('');
 const [activeTab, setActiveTab] = useState('interns');
 const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
 const [isInternDialogOpen, setIsInternDialogOpen] = useState(false);
 const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
 const [currentIntern, setCurrentIntern] = useState<Intern | null>(null);
 const [internFormStatus, setInternFormStatus] = useState<string>('Active');
 const { toast } = useToast();

 // Get Supabase URL
 const supabaseUrl = supabase.storage.from('intern-photos').getPublicUrl('').data.publicUrl.split('/storage/v1')[0];

 // Fetch data on mount
 useEffect(() => {
 fetchData();
 }, []);

 const fetchData = async () => {
 try {
 setLoading(true);
 
 // Fetch interns and accepted applications (these tables exist for sure)
 const [
 { data: internsData, error: internsError },
 { data: applicationsData, error: applicationsError }
 ] = await Promise.all([
 supabase.from('interns').select('*').order('created_at', { ascending: false }),
 supabase.from('job_applications').select('*').eq('status', 'accepted')
 ]);

 if (internsError) {
 console.error('Interns fetch error:', internsError);
 throw internsError;
 }
 if (applicationsError) {
 console.error('Applications fetch error:', applicationsError);
 }

 // Build accepted applications list (exclude already-onboarded emails)
 const existingEmails = new Set((internsData || []).map(i => i.email));
 
 const acceptedApplications = (applicationsData || [])
 .filter(app => !existingEmails.has(app.email))
 .map(app => ({
 id: `app_${app.id}`,
 name: app.full_name,
 email: app.email,
 contact: app.phone,
 status: 'Pending Onboarding' as const,
 position: app.role || 'Intern',
 created_at: app.created_at,
 is_from_application: true,
 application_id: app.id
 }));

 setInterns([
 ...acceptedApplications,
 ...(internsData || []).map(intern => ({
 ...intern,
 status: intern.status as 'Active' | 'Completed' | 'Terminated',
 created_at: intern.created_at
 }))
 ]);

 // Fetch team_members separately — table may not exist yet
 try {
 const { data: membersData, error: membersError } = await supabase
 .from('team_members')
 .select('*')
 .order('created_at', { ascending: false });

 if (membersError) {
 console.warn('team_members table not available:', membersError.message);
 setTeamMembers([]);
 } else {
 setTeamMembers((membersData || []).map(member => ({
 ...member,
 email: member.email || '',
 role: member.role || '',
 is_executive: member.is_executive === 'true',
 is_founder: member.is_founder === 'true',
 created_at: member.created_at
 })));
 }
 } catch {
 console.warn('team_members fetch failed, skipping');
 setTeamMembers([]);
 }
 } catch (error) {
 console.error('Fetch data error:', error);
 toast({
 title: 'Error',
 description: 'Failed to load data',
 variant: 'destructive'
 });
 } finally {
 setLoading(false);
 }
 };

 // Team Member Functions
 const handleMemberSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 if (!currentMember) return;
 
 setLoading(true);
 const formData = new FormData(e.currentTarget);

 try {
 let photoUrl = currentMember.photo_url;
 const photoFile = formData.get('photo') as File;

 // Handle image upload
 if (photoFile?.size > 0) {
 if (currentMember.photo_url) {
 const oldPhotoPath = currentMember.photo_url.split('/').pop();
 await supabase.storage.from('intern-photos').remove([`public/${oldPhotoPath}`]);
 }

 const fileName = `${Date.now()}_${photoFile.name}`;
 const { data: uploadData, error: uploadError } = await supabase.storage
 .from('intern-photos')
 .upload(`public/${fileName}`, photoFile);

 if (uploadError) throw uploadError;
 photoUrl = `${supabaseUrl}/storage/v1/object/public/intern-photos/${uploadData.path}`;
 }

 const memberData = {
 name: formData.get('name') as string,
 email: formData.get('email') as string,
 role: formData.get('role') as string,
 bio: (formData.get('bio') as string) || null,
 linkedin: (formData.get('linkedin') as string) || null,
 twitter: (formData.get('twitter') as string) || null,
 is_executive: formData.get('is_executive') === 'on' ? 'true' : 'false',
 is_founder: formData.get('is_founder') === 'on' ? 'true' : 'false',
 photo_url: photoUrl || null
 };

 if (currentMember.id) {
 // Update
 const { error } = await supabase
 .from('team_members')
 .update(memberData)
 .eq('id', currentMember.id);
 if (error) throw error;
 toast({ title: 'Success', description: 'Member updated' });
 } else {
 // Create
 const { error } = await supabase
 .from('team_members')
 .insert([{
 ...memberData,
 position: memberData.role // Use role as position
 }]);
 if (error) throw error;
 toast({ title: 'Success', description: 'Member added' });
 }

 setIsMemberDialogOpen(false);
 fetchData();
 } catch (error: any) {
 toast({
 title: 'Error',
 description: error.message,
 variant: 'destructive'
 });
 } finally {
 setLoading(false);
 }
 };

 const deleteMember = async (id: string) => {
 const confirm = window.confirm('Delete this team member?');
 if (!confirm) return;

 try {
 const member = teamMembers.find(m => m.id === id);
 if (member?.photo_url) {
 const photoPath = member.photo_url.split('/').pop();
 await supabase.storage.from('intern-photos').remove([`public/${photoPath}`]);
 }

 const { error } = await supabase
 .from('team_members')
 .delete()
 .eq('id', id);

 if (error) throw error;
 toast({ title: 'Success', description: 'Member deleted' });
 fetchData();
 } catch (error: any) {
 toast({
 title: 'Error',
 description: error.message,
 variant: 'destructive'
 });
 }
 };

 const deleteMemberPhoto = async (memberId: string, photoUrl: string) => {
 if (!window.confirm('Remove this profile photo?')) return;
 try {
 const photoPath = photoUrl.split('/intern-photos/').pop();
 if (photoPath) {
 await supabase.storage.from('intern-photos').remove([photoPath]);
 }
 const { error } = await supabase
 .from('team_members')
 .update({ photo_url: null })
 .eq('id', memberId);
 if (error) throw error;
 setCurrentMember(prev => prev ? { ...prev, photo_url: undefined } : null);
 toast({ title: 'Success', description: 'Photo removed' });
 fetchData();
 } catch (error: any) {
 toast({ title: 'Error', description: error.message, variant: 'destructive' });
 }
 };

 const deleteInternPhoto = async (internId: string, photoUrl: string) => {
 if (!window.confirm('Remove this profile photo?')) return;
 try {
 const photoPath = photoUrl.split('/intern-photos/').pop();
 if (photoPath) {
 await supabase.storage.from('intern-photos').remove([photoPath]);
 }
 const { error } = await supabase
 .from('interns')
 .update({ photo_url: null })
 .eq('id', internId);
 if (error) throw error;
 setCurrentIntern(prev => prev ? { ...prev, photo_url: undefined } : null);
 toast({ title: 'Success', description: 'Photo removed' });
 fetchData();
 } catch (error: any) {
 toast({ title: 'Error', description: error.message, variant: 'destructive' });
 }
 };

 // Intern Functions (similar to team member functions)
 const handleInternSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 if (!currentIntern) return;
 
 setLoading(true);
 const formData = new FormData(e.currentTarget);

 try {
 let photoUrl = currentIntern.photo_url;
 const photoFile = formData.get('photo') as File;

 if (photoFile?.size > 0) {
 if (currentIntern.photo_url) {
 const oldPhotoPath = currentIntern.photo_url.split('/').pop();
 await supabase.storage.from('intern-photos').remove([`public/${oldPhotoPath}`]);
 }

 const fileName = `${Date.now()}_${photoFile.name}`;
 const { data: uploadData, error: uploadError } = await supabase.storage
 .from('intern-photos')
 .upload(`public/${fileName}`, photoFile);

 if (uploadError) throw uploadError;
 photoUrl = `${supabaseUrl}/storage/v1/object/public/intern-photos/${uploadData.path}`;
 }

 const internData = {
 name: formData.get('name') as string,
 email: formData.get('email') as string,
 contact: (formData.get('contact') as string) || null,
 college: (formData.get('college') as string) || null,
 branch: (formData.get('branch') as string) || null,
 year: (formData.get('year') as string) || null,
 project_department: (formData.get('project_department') as string) || null,
 joining_date: (formData.get('joining_date') as string) || null,
 end_date: (formData.get('end_date') as string) || null,
 status: (internFormStatus || 'Active') as 'Active' | 'Completed' | 'Terminated',
 position: (formData.get('position') as string) || 'Intern',
 bio: (formData.get('bio') as string) || null,
 is_featured: formData.get('is_featured') === 'on',
 photo_url: photoUrl || null
 };

 if (currentIntern.id && !currentIntern.is_from_application) {
 // Update
 const { error } = await supabase
 .from('interns')
 .update(internData)
 .eq('id', currentIntern.id);
 if (error) throw error;
 toast({ title: 'Success', description: 'Intern updated' });
 } else {
 // Create (whether brand new or onboarded from application)
 // Set a default status if it's 'Pending Onboarding' during save
 if (internData.status === 'Pending Onboarding' as any) {
 internData.status = 'Active';
 }
 
 const { error } = await supabase
 .from('interns')
 .insert([internData]);
 if (error) throw error;
 toast({ title: 'Success', description: 'Intern added successfully' });
 }

 setIsInternDialogOpen(false);
 fetchData();
 } catch (error: any) {
 toast({
 title: 'Error',
 description: error.message,
 variant: 'destructive'
 });
 } finally {
 setLoading(false);
 }
 };

 const deleteIntern = async (id: string) => {
 const confirm = window.confirm('Delete this intern?');
 if (!confirm) return;

 const intern = interns.find(i => i.id === id);
 if (intern?.is_from_application) {
 toast({ title: 'Notice', description: 'This is an accepted application. To remove, change its status in the Job Applications tab.' });
 return;
 }

 try {
 if (intern?.photo_url) {
 const photoPath = intern.photo_url.split('/').pop();
 await supabase.storage.from('intern-photos').remove([`public/${photoPath}`]);
 }

 const { error } = await supabase
 .from('interns')
 .delete()
 .eq('id', id);

 if (error) throw error;
 toast({ title: 'Success', description: 'Intern deleted' });
 fetchData();
 } catch (error: any) {
 toast({
 title: 'Error',
 description: error.message,
 variant: 'destructive'
 });
 }
 };

 const updateInternStatus = async (id: string, status: 'Active' | 'Completed' | 'Terminated' | 'Pending Onboarding') => {
 const intern = interns.find(i => i.id === id);
 if (intern?.is_from_application) {
 toast({ title: 'Notice', description: 'Please click Edit and save this profile to complete onboarding before changing status.' });
 return;
 }

 try {
 const { error } = await supabase
 .from('interns')
 .update({ status })
 .eq('id', id);

 if (error) throw error;
 toast({ title: 'Success', description: 'Status updated' });
 fetchData();
 } catch (error: any) {
 toast({
 title: 'Error',
 description: error.message,
 variant: 'destructive'
 });
 }
 };

 // Filter functions
 const filteredMembers = teamMembers.filter(member => 
 member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 member.role.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const filteredInterns = interns.filter(intern => {
 const nameMatch = (intern.name || '').toLowerCase().includes(searchTerm.toLowerCase());
 const deptMatch = (intern.project_department || '').toLowerCase().includes(searchTerm.toLowerCase());
 return nameMatch || deptMatch;
 });

 // Badge colors
 const statusColors = {
 Active: 'bg-primary/10 text-foreground',
 Completed: 'bg-primary text-primary-foreground text-foreground',
 Terminated: 'bg-red-100 text-red-800',
 'Pending Onboarding': 'bg-yellow-100 text-yellow-800'
 };

 const roleColors = {
 founder: 'bg-secondary text-foreground',
 executive: 'bg-yellow-100 text-yellow-800',
 manager: 'bg-primary text-primary-foreground text-foreground'
 };

 return (
 <div className="space-y-6">
 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
 <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap justify-start">
 <TabsTrigger value="interns">Interns</TabsTrigger>
 <TabsTrigger value="team">Team Members</TabsTrigger>
 </TabsList>
 
 <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
 <div className="relative w-full sm:w-72">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
 <Input
 placeholder={`Search ${activeTab}...`}
 className="pl-10 w-full"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 
 <Button className="w-full sm:w-auto shrink-0 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
 if (activeTab === 'interns') {
 setCurrentIntern({
 id: '',
 name: '',
 email: '',
 status: 'Active',
 position: 'Intern',
 created_at: new Date().toISOString()
 });
 setInternFormStatus('Active');
 setIsInternDialogOpen(true);
 } else {
 setCurrentMember({
 id: '',
 name: '',
 email: '',
 role: '',
 is_executive: false,
 is_founder: false,
 created_at: new Date().toISOString()
 });
 setIsMemberDialogOpen(true);
 }
 }}>
 <Plus className="mr-2 h-4 w-4" />
 Add {activeTab === 'interns' ? 'Intern' : 'Member'}
 </Button>
 </div>
 </div>

 <TabsContent value="interns">
 <Card>
 <CardHeader>
 <CardTitle>Intern Management</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="hidden lg:block overflow-hidden rounded-md border">
 <Table>
 <TableHeader>
 <TableRow className="bg-muted/20">
 <TableHead>Profile</TableHead>
 <TableHead>Name</TableHead>
 <TableHead>Email</TableHead>
 <TableHead>Department</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredInterns.map((intern) => (
 <TableRow key={intern.id}>
 <TableCell>
 {intern.photo_url ? (
 <img
 src={intern.photo_url}
 alt={intern.name}
 className="h-10 w-10 rounded-full object-cover"
 />
 ) : (
 <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
 <span className="text-xs">No Image</span>
 </div>
 )}
 </TableCell>
 <TableCell className="font-medium text-foreground">{intern.name}</TableCell>
 <TableCell>{intern.email}</TableCell>
 <TableCell>{intern.project_department || '-'}</TableCell>
 <TableCell>
 <Badge className={statusColors[intern.status]}>
 {intern.status === 'Active' ? (
 <CheckCircle className="mr-1 h-3 w-3" />
 ) : intern.status === 'Pending Onboarding' ? (
 <Clock className="mr-1 h-3 w-3" />
 ) : (
 <XCircle className="mr-1 h-3 w-3" />
 )}
 {intern.status}
 </Badge>
 </TableCell>
 <TableCell className="flex gap-2">
 <Button
 variant="secondary"
 size="sm"
 onClick={() => {
 setCurrentIntern(intern);
 setInternFormStatus(intern.status);
 setIsInternDialogOpen(true);
 }}
 >
 <Edit className="mr-1 h-4 w-4" />
 {intern.is_from_application ? 'Onboard' : 'Edit'}
 </Button>
 <Button
 variant="destructive"
 size="sm"
 onClick={() => deleteIntern(intern.id)}
 disabled={intern.is_from_application}
 >
 <Trash2 className="mr-1 h-4 w-4" />
 Delete
 </Button>
 <Select
 value={intern.status}
 onValueChange={(value: 'Active' | 'Completed' | 'Terminated' | 'Pending Onboarding') =>
 updateInternStatus(intern.id, value)
 }
 disabled={intern.is_from_application}
 >
 <SelectTrigger className="w-[120px]">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="Active">Set Active</SelectItem>
 <SelectItem value="Completed">Set Completed</SelectItem>
 <SelectItem value="Terminated">Set Terminated</SelectItem>
 <SelectItem value="Pending Onboarding" disabled>Pending Onboarding</SelectItem>
 </SelectContent>
 </Select>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>

 {/* Mobile View */}
 <div className="grid grid-cols-1 gap-4 lg:hidden mt-4">
 {filteredInterns.map((intern) => (
 <Card key={intern.id} className="p-4 flex flex-col gap-4">
 <div className="flex items-start gap-4">
 {intern.photo_url ? (
 <img src={intern.photo_url} alt={intern.name} className="h-14 w-14 rounded-full object-cover shrink-0" />
 ) : (
 <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center shrink-0">
 <span className="text-xs">No Img</span>
 </div>
 )}
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start">
 <h3 className="font-bold text-foreground truncate">{intern.name}</h3>
 <Badge className={statusColors[intern.status]}>
 {intern.status}
 </Badge>
 </div>
 <p className="text-sm text-gray-500 truncate">{intern.email}</p>
 <p className="text-xs font-medium mt-1 uppercase text-gray-400">{intern.project_department || 'No Department'}</p>
 </div>
 </div>
 
 <div className="flex flex-col gap-2">
 <Select
 value={intern.status}
 onValueChange={(value: 'Active' | 'Completed' | 'Terminated' | 'Pending Onboarding') =>
 updateInternStatus(intern.id, value)
 }
 disabled={intern.is_from_application}
 >
 <SelectTrigger className="w-full">
 <SelectValue placeholder="Update Status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="Active">Set Active</SelectItem>
 <SelectItem value="Completed">Set Completed</SelectItem>
 <SelectItem value="Terminated">Set Terminated</SelectItem>
 <SelectItem value="Pending Onboarding" disabled>Pending Onboarding</SelectItem>
 </SelectContent>
 </Select>

 <div className="flex gap-2">
 <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setCurrentIntern(intern); setInternFormStatus(intern.status); setIsInternDialogOpen(true); }}>
 <Edit className="mr-1 h-4 w-4" /> {intern.is_from_application ? 'Onboard' : 'Edit'}
 </Button>
 <Button variant="destructive" size="sm" className="flex-1" onClick={() => deleteIntern(intern.id)} disabled={intern.is_from_application}>
 <Trash2 className="mr-1 h-4 w-4" /> Delete
 </Button>
 </div>
 </div>
 </Card>
 ))}
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="team">
 <Card>
 <CardHeader>
 <CardTitle>Team Members</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="hidden lg:block overflow-hidden rounded-md border">
 <Table>
 <TableHeader>
 <TableRow className="bg-muted/20">
 <TableHead>Profile</TableHead>
 <TableHead>Name</TableHead>
 <TableHead>Role</TableHead>
 <TableHead>Type</TableHead>
 <TableHead>Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredMembers.map((member) => (
 <TableRow key={member.id}>
 <TableCell>
 {member.photo_url ? (
 <img
 src={member.photo_url}
 alt={member.name}
 className="h-10 w-10 rounded-full object-cover"
 />
 ) : (
 <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
 <span className="text-xs">No Image</span>
 </div>
 )}
 </TableCell>
 <TableCell className="font-medium text-foreground">{member.name}</TableCell>
 <TableCell>{member.role || '-'}</TableCell>
 <TableCell>
 <div className="flex gap-1">
 {member.is_founder && (
 <Badge className={roleColors.founder}>Founder</Badge>
 )}
 {member.is_executive && (
 <Badge className={roleColors.executive}>Executive</Badge>
 )}
 </div>
 </TableCell>
 <TableCell className="flex gap-2">
 <Button
 variant="secondary"
 size="sm"
 onClick={() => {
 setCurrentMember(member);
 setIsMemberDialogOpen(true);
 }}
 >
 <Edit className="mr-1 h-4 w-4" />
 Edit
 </Button>
 <Button
 variant="destructive"
 size="sm"
 onClick={() => deleteMember(member.id)}
 >
 <Trash2 className="mr-1 h-4 w-4" />
 Delete
 </Button>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>

 {/* Mobile View */}
 <div className="grid grid-cols-1 gap-4 lg:hidden mt-4">
 {filteredMembers.map((member) => (
 <Card key={member.id} className="p-4 flex flex-col gap-4">
 <div className="flex items-start gap-4">
 {member.photo_url ? (
 <img src={member.photo_url} alt={member.name} className="h-14 w-14 rounded-full object-cover shrink-0" />
 ) : (
 <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center shrink-0">
 <span className="text-xs">No Img</span>
 </div>
 )}
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start mb-1">
 <h3 className="font-bold text-foreground truncate">{member.name}</h3>
 <div className="flex gap-1 flex-col items-end">
 {member.is_founder && <Badge className={roleColors.founder}>Founder</Badge>}
 {member.is_executive && <Badge className={roleColors.executive}>Executive</Badge>}
 </div>
 </div>
 <p className="text-sm text-gray-500 font-medium">{member.role || '-'}</p>
 </div>
 </div>
 
 <div className="flex gap-2 mt-2">
 <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setCurrentMember(member); setIsMemberDialogOpen(true); }}>
 <Edit className="mr-1 h-4 w-4" /> Edit
 </Button>
 <Button variant="destructive" size="sm" className="flex-1" onClick={() => deleteMember(member.id)}>
 <Trash2 className="mr-1 h-4 w-4" /> Delete
 </Button>
 </div>
 </Card>
 ))}
 </div>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>

 {/* Team Member Dialog */}
 <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
 <DialogContent className="max-w-xl overflow-y-auto max-h-screen">
 <DialogHeader>
 <DialogTitle>
 {currentMember?.id ? 'Edit Team Member' : 'Add New Team Member'}
 </DialogTitle>
 </DialogHeader>
 <form onSubmit={handleMemberSubmit} className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label htmlFor="name">Full Name *</Label>
 <Input
 id="name"
 name="name"
 defaultValue={currentMember?.name || ''}
 required
 />
 </div>
 <div>
 <Label htmlFor="email">Email *</Label>
 <Input
 id="email"
 name="email"
 type="email"
 defaultValue={currentMember?.email || ''}
 required
 />
 </div>
 <div>
 <Label htmlFor="role">Role *</Label>
 <Input
 id="role"
 name="role"
 defaultValue={currentMember?.role || ''}
 required
 />
 </div>
 <div>
 <Label htmlFor="linkedin">LinkedIn</Label>
 <Input
 id="linkedin"
 name="linkedin"
 defaultValue={currentMember?.linkedin || ''}
 />
 </div>
 <div>
 <Label htmlFor="twitter">Twitter</Label>
 <Input
 id="twitter"
 name="twitter"
 defaultValue={currentMember?.twitter || ''}
 />
 </div>
 <div className="flex items-center space-x-4">
 <div className="flex items-center space-x-2">
 <input
 type="checkbox"
 id="is_founder"
 name="is_founder"
 defaultChecked={currentMember?.is_founder || false}
 className="h-4 w-4"
 />
 <Label htmlFor="is_founder">Founder</Label>
 </div>
 <div className="flex items-center space-x-2">
 <input
 type="checkbox"
 id="is_executive"
 name="is_executive"
 defaultChecked={currentMember?.is_executive || false}
 className="h-4 w-4"
 />
 <Label htmlFor="is_executive">Executive</Label>
 </div>
 </div>
 </div>

 <div>
 <Label htmlFor="photo">Profile Photo</Label>
 <Input
 id="photo"
 name="photo"
 type="file"
 accept="image/*"
 className="cursor-pointer"
 />
 {currentMember?.photo_url && (
 <div className="mt-2 flex items-center gap-3">
 <img
 src={currentMember.photo_url}
 alt="Current profile"
 className="h-20 w-20 rounded-full object-cover border"
 />
 <Button
 type="button"
 variant="destructive"
 size="sm"
 onClick={() => currentMember.id && deleteMemberPhoto(currentMember.id, currentMember.photo_url!)}
 >
 <ImageOff className="mr-1 h-4 w-4" />
 Remove Photo
 </Button>
 </div>
 )}
 </div>

 <div>
 <Label htmlFor="bio">Bio</Label>
 <Textarea
 id="bio"
 name="bio"
 defaultValue={currentMember?.bio || ''}
 rows={4}
 />
 </div>

 <div className="flex justify-end gap-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => setIsMemberDialogOpen(false)}
 >
 Cancel
 </Button>
 <Button type="submit" disabled={loading}>
 {loading ? 'Saving...' : 'Save'}
 </Button>
 </div>
 </form>
 </DialogContent>
 </Dialog>

 {/* Intern Dialog */}
 <Dialog open={isInternDialogOpen} onOpenChange={setIsInternDialogOpen}>
 <DialogContent className="max-w-xl overflow-y-auto max-h-screen">
 <DialogHeader>
 <DialogTitle>
 {currentIntern?.id ? 'Edit Intern' : 'Add New Intern'}
 </DialogTitle>
 </DialogHeader>
 <form onSubmit={handleInternSubmit} className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label htmlFor="name">Full Name *</Label>
 <Input
 id="name"
 name="name"
 defaultValue={currentIntern?.name || ''}
 required
 />
 </div>
 <div>
 <Label htmlFor="email">Email *</Label>
 <Input
 id="email"
 name="email"
 type="email"
 defaultValue={currentIntern?.email || ''}
 required
 />
 </div>
 <div>
 <Label htmlFor="contact">Contact</Label>
 <Input
 id="contact"
 name="contact"
 defaultValue={currentIntern?.contact || ''}
 />
 </div>
 <div>
 <Label htmlFor="college">College</Label>
 <Input
 id="college"
 name="college"
 defaultValue={currentIntern?.college || ''}
 />
 </div>
 <div>
 <Label htmlFor="branch">Branch</Label>
 <Input
 id="branch"
 name="branch"
 defaultValue={currentIntern?.branch || ''}
 />
 </div>
 <div>
 <Label htmlFor="year">Year</Label>
 <Input
 id="year"
 name="year"
 defaultValue={currentIntern?.year || ''}
 />
 </div>
 <div>
 <Label htmlFor="project_department">Department</Label>
 <Input
 id="project_department"
 name="project_department"
 defaultValue={currentIntern?.project_department || ''}
 />
 </div>
 <div>
 <Label htmlFor="position">Position</Label>
 <Input
 id="position"
 name="position"
 defaultValue={currentIntern?.position || 'Intern'}
 />
 </div>
 <div>
 <Label htmlFor="joining_date">Joining Date</Label>
 <Input
 id="joining_date"
 name="joining_date"
 type="date"
 defaultValue={currentIntern?.joining_date || ''}
 />
 </div>
 <div>
 <Label htmlFor="end_date">End Date</Label>
 <Input
 id="end_date"
 name="end_date"
 type="date"
 defaultValue={currentIntern?.end_date || ''}
 />
 </div>
 <div>
 <Label htmlFor="status">Status</Label>
 <Select
 value={internFormStatus}
 onValueChange={setInternFormStatus}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="Active">Active</SelectItem>
 <SelectItem value="Completed">Completed</SelectItem>
 <SelectItem value="Terminated">Terminated</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="flex items-center space-x-2">
 <input
 type="checkbox"
 id="is_featured"
 name="is_featured"
 defaultChecked={currentIntern?.is_featured || false}
 className="h-4 w-4"
 />
 <Label htmlFor="is_featured">Featured Intern</Label>
 </div>
 </div>

 <div>
 <Label htmlFor="photo">Profile Photo</Label>
 <Input
 id="photo"
 name="photo"
 type="file"
 accept="image/*"
 className="cursor-pointer"
 />
 {currentIntern?.photo_url && (
 <div className="mt-2 flex items-center gap-3">
 <img
 src={currentIntern.photo_url}
 alt="Current profile"
 className="h-20 w-20 rounded-full object-cover border"
 />
 {currentIntern.id && !currentIntern.is_from_application && (
 <Button
 type="button"
 variant="destructive"
 size="sm"
 onClick={() => deleteInternPhoto(currentIntern.id, currentIntern.photo_url!)}
 >
 <ImageOff className="mr-1 h-4 w-4" />
 Remove Photo
 </Button>
 )}
 </div>
 )}
 </div>

 <div>
 <Label htmlFor="bio">Bio</Label>
 <Textarea
 id="bio"
 name="bio"
 defaultValue={currentIntern?.bio || ''}
 rows={4}
 />
 </div>

 <div className="flex justify-end gap-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => setIsInternDialogOpen(false)}
 >
 Cancel
 </Button>
 <Button type="submit" disabled={loading}>
 {loading ? 'Saving...' : 'Save'}
 </Button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 </div>
 );
}
