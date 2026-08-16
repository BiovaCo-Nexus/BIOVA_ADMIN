import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Plus, 
  Download, 
  Trash2, 
  Search, 
  Eye, 
  FolderLock, 
  FileCheck, 
  FileCode,
  ShieldCheck
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PersonalWorkspaceService, getCleanEmail } from "@/services/personalWorkspaceService"

interface PersonalDocumentsVaultProps {
  userEmail?: string
}

export function PersonalDocumentsVault({ userEmail }: PersonalDocumentsVaultProps) {
  const activeEmail = getCleanEmail(userEmail)
  const [documents, setDocuments] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<any | null>(null)
  
  const [docName, setDocName] = useState("")
  const [docCategory, setDocCategory] = useState("General Notes")
  const [docContent, setDocContent] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    loadDocuments()
  }, [activeEmail])

  const loadDocuments = async () => {
    const data = await PersonalWorkspaceService.getDocuments(activeEmail)
    setDocuments(data)
  }

  const handleSaveDocument = async () => {
    if (!docName.trim()) {
      toast({ title: "Document Title Required", description: "Please enter a document or note title.", variant: "destructive" })
      return
    }

    const newDoc = await PersonalWorkspaceService.saveDocument(activeEmail, {
      name: docName.endsWith(".txt") || docName.endsWith(".pdf") || docName.endsWith(".md") ? docName : `${docName}.md`,
      type: "Private Document",
      size: `${((docContent.length || 200) / 1024).toFixed(1)} KB`,
      category: docCategory,
      content: docContent || "Document content created in personal vault."
    })

    setDocuments(prev => [newDoc, ...prev])
    setIsModalOpen(false)
    setDocName("")
    setDocContent("")

    toast({
      title: "Document Saved to Vault",
      description: `Saved "${docName}" in your private personal documents.`
    })
  }

  const handleDeleteDocument = async (id: string, name: string) => {
    await PersonalWorkspaceService.deleteDocument(activeEmail, id)
    setDocuments(prev => prev.filter(d => d.id !== id))
    toast({
      title: "Document Deleted",
      description: `Removed "${name}" from your vault.`
    })
  }

  const handleDownloadDoc = (doc: any) => {
    const blob = new Blob([doc.content || `BiovaCo Private Document: ${doc.name}\nOwner: ${activeEmail}\nCreated: ${doc.date}`], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = doc.name
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Document Downloaded",
      description: `Downloaded ${doc.name}`
    })
  }

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FolderLock className="h-8 w-8 text-[#4B49AC]" /> My Personal Documents & Notes Vault
          </h2>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            Encrypted private documents, personal notes, and files for <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">{activeEmail}</span>
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white font-medium text-xs h-10 shadow-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Create Private Note / Doc
        </Button>
      </div>

      {/* Security Banner */}
      <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/40">
        <CardContent className="py-3.5 px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#4B49AC]" />
            <div className="text-xs text-indigo-950">
              <span className="font-bold text-[#4B49AC]">Zero-Knowledge Vault:</span> Documents stored here are strictly private to your user session and not visible to other members.
            </div>
          </div>
          <Badge className="bg-indigo-100 text-[#4B49AC] border-0 text-[10px]">
            {documents.length} Encrypted Files
          </Badge>
        </CardContent>
      </Card>

      {/* Search and List */}
      <Card className="border-gray-200">
        <CardHeader className="py-4 px-6 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search private documents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs border-gray-200"
            />
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40 text-gray-400" />
              No private documents found. Click "Create Private Note / Doc" to add your first record.
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl border border-gray-200 bg-white flex items-center justify-between hover:border-indigo-200 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[#4B49AC]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{doc.name}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-[9px] bg-gray-50 font-normal px-1.5 py-0">
                        {doc.category}
                      </Badge>
                      <span>•</span>
                      <span>{doc.date}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewDoc(doc)}
                    className="text-gray-600 hover:text-[#4B49AC] hover:bg-indigo-50 text-xs h-8 px-2.5"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadDoc(doc)}
                    className="text-gray-600 hover:text-[#4B49AC] hover:bg-indigo-50 text-xs h-8 px-2.5"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDocument(doc.id, doc.name)}
                    className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create Document Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 rounded-2xl overflow-hidden border-gray-200">
          <DialogHeader className="p-4 bg-gray-50 border-b border-gray-100">
            <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FolderLock className="h-4 w-4 text-[#4B49AC]" /> Create Private Note / Vault File
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Private to {activeEmail}
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-3.5 bg-white">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Document Name *</label>
              <Input
                placeholder="e.g. Q3_Biotech_Notes.md"
                value={docName}
                onChange={e => setDocName(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
              <Select value={docCategory} onValueChange={setDocCategory}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Notes">General Notes</SelectItem>
                  <SelectItem value="Performance & KPIs">Performance & KPIs</SelectItem>
                  <SelectItem value="Certifications & ID">Certifications & ID</SelectItem>
                  <SelectItem value="Project Drafts">Project Drafts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Document Content / Notes</label>
              <Textarea
                placeholder="Type your private notes or documentation here..."
                rows={5}
                value={docContent}
                onChange={e => setDocContent(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleSaveDocument} size="sm" className="bg-[#4B49AC] hover:bg-[#3b3a88] text-white text-xs">
              Save to Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {previewDoc && (
        <Dialog open={Boolean(previewDoc)} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="sm:max-w-[550px] p-0 rounded-2xl overflow-hidden border-gray-200">
            <DialogHeader className="p-4 bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-sm font-bold text-gray-900">{previewDoc.name}</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  {previewDoc.category} • Created: {previewDoc.date}
                </DialogDescription>
              </div>
            </DialogHeader>
            <div className="p-5 bg-white max-h-[300px] overflow-y-auto">
              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
                {previewDoc.content || "Empty document content."}
              </pre>
            </div>
            <DialogFooter className="p-3 bg-gray-50 border-t border-gray-100">
              <Button size="sm" onClick={() => handleDownloadDoc(previewDoc)} className="bg-[#4B49AC] text-white text-xs">
                <Download className="h-3.5 w-3.5 mr-1" /> Download Copy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
