import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Download, FileText, Loader2, Eye, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

export const DocumentGenerator = ({ initialPayload, onClearPayload }: { initialPayload?: string, onClearPayload?: () => void }) => {
  const [documentType, setDocumentType] = useState('offer_letter');
  const [recipientName, setRecipientName] = useState('');
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (initialPayload) {
      try {
        const payload = JSON.parse(initialPayload);
        if (payload.type) setDocumentType(payload.type);
        if (payload.name) setRecipientName(payload.name);
        
        let initialContent = getTemplateContent(payload.type || 'offer_letter');
        if (payload.type === 'offer_letter') {
          initialContent = initialContent.replace('[Name]', `**${payload.name}**` || '[Name]');
          if (payload.role) {
             initialContent = initialContent.replace('[Role]', `**${payload.role}**`);
          }
        }
        
        setContent(initialContent);
        if (onClearPayload) onClearPayload();
      } catch (e) {
        console.error("Failed to parse payload", e);
      }
    }
  }, [initialPayload, onClearPayload]);

  useEffect(() => {
    const fetchRefNo = async () => {
      if (documentType === 'offer_letter' && !referenceNo) {
        const { count, error } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'accepted');
        
        if (!error && count !== null) {
          const date = new Date(referenceDate || new Date());
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yy = String(date.getFullYear()).slice(-2);
          
          const memberNum = count === 0 ? 1 : count;
          const formattedCount = String(memberNum).padStart(2, '0');
          setReferenceNo(`BNPL\\${formattedCount}\\${mm}${yy}`);
        }
      }
    };
    fetchRefNo();
  }, [documentType, referenceDate]);

  // ========== CORE PDF GENERATION ENGINE ==========
  const generatePdfBytes = async (): Promise<Uint8Array> => {
    const [firstPageBytes, secondPageBytes, stampBytes] = await Promise.all([
      fetch('/uploads/1page.pdf').then(res => {
        if (!res.ok) throw new Error("Could not load 1page.pdf");
        return res.arrayBuffer();
      }),
      fetch('/uploads/2ndpage.pdf').then(res => {
        if (!res.ok) throw new Error("Could not load 2ndpage.pdf");
        return res.arrayBuffer();
      }),
      fetch('/uploads/Stamp.png').then(res => {
        if (!res.ok) throw new Error("Could not load Stamp.png");
        return res.arrayBuffer();
      }),
    ]);

    const pdfDoc = await PDFDocument.create();
    const firstDoc = await PDFDocument.load(firstPageBytes);
    const secondDoc = await PDFDocument.load(secondPageBytes);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const boldItalicFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
    
    // Auto-size: count lines to decide font size
    const contentLineCount = content.split('\n').length;
    const fontSize = contentLineCount > 80 ? 9 : 10;
    const lineHeight = fontSize * 1.3;
    
    const marginX = 55;
    
    const firstPageTopMargin = 210;
    const secondPageTopMargin = 110;
    const bottomMargin = 80;

    let [currentPageTemplate] = await pdfDoc.copyPages(firstDoc, [0]);
    let currentPage = pdfDoc.addPage(currentPageTemplate);
    
    const { width, height } = currentPage.getSize();
    const maxWidth = width - (marginX * 2);

    let currentY = height - firstPageTopMargin;

    const drawTextLine = (text: string, isBold = false, customSize?: number) => {
      if (currentY < bottomMargin) return false;
      currentPage.drawText(text, {
        x: marginX,
        y: currentY,
        size: customSize || fontSize,
        font: isBold ? boldFont : font,
        color: rgb(0, 0, 0),
      });
      currentY -= customSize ? customSize * 1.3 : lineHeight;
      return true;
    };

    const addNewPage = async () => {
      const [nextPageTemplate] = await pdfDoc.copyPages(secondDoc, [0]);
      currentPage = pdfDoc.addPage(nextPageTemplate);
      const { height: newHeight } = currentPage.getSize();
      currentY = newHeight - secondPageTopMargin;
    };

    // ===== HEADER LAYOUT =====
    // 1. Centered title FIRST (above everything)
    if (documentType) {
      let docTitle = documentType.replace(/_/g, ' ').toUpperCase();
      if (documentType === 'lor') docTitle = 'LETTER OF RECOMMENDATION';
      else if (documentType === 'custom') docTitle = '';

      if (docTitle) {
        const titleSize = 13;
        const titleWidth = boldFont.widthOfTextAtSize(docTitle, titleSize);
        const titleX = (width - titleWidth) / 2;
        
        currentPage.drawText(docTitle, {
          x: titleX,
          y: currentY,
          size: titleSize,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        currentY -= titleSize * 1.3 + 6;
      }
    }

    // 2. Date
    if (referenceDate) {
      if (!drawTextLine(`Date: ${referenceDate}`)) await addNewPage();
    }
    
    // 3. Ref No.
    if (referenceNo && documentType === 'offer_letter') {
      if (!drawTextLine(`Offer Letter Ref No.: ${referenceNo}`)) await addNewPage();
    } else if (referenceNo) {
      if (!drawTextLine(`Ref No.: ${referenceNo}`)) await addNewPage();
    }

    currentY -= lineHeight * 0.3;
    
    // 4. To, Name
    if (recipientName && (documentType === 'offer_letter' || documentType === 'custom')) {
      if (!drawTextLine(`To,`)) await addNewPage();
      if (!drawTextLine(`Mr./Ms. ${recipientName}`, true)) await addNewPage();
      currentY -= lineHeight * 0.5;
    }

    // ===== MARKDOWN PARSING =====
    const parseMarkdownToSegments = (text: string) => {
      const segments: { text: string; isBold: boolean; isItalic: boolean }[] = [];
      const parts = text.split(/(\*\*.*?\*\*|\/\/.*?\/\/)/g);
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          segments.push({ text: part.slice(2, -2), isBold: true, isItalic: false });
        } else if (part.startsWith('//') && part.endsWith('//')) {
          segments.push({ text: part.slice(2, -2), isBold: false, isItalic: true });
        } else if (part.length > 0) {
          segments.push({ text: part, isBold: false, isItalic: false });
        }
      }
      return segments;
    };

    type WrappedLine = { segments: { text: string; isBold: boolean; isItalic: boolean }[]; width: number };

    const wrapParagraph = (paragraph: string, maxW: number): WrappedLine[] => {
      const segments = parseMarkdownToSegments(paragraph);
      const lines: WrappedLine[] = [];
      let currentLine: { text: string; isBold: boolean; isItalic: boolean }[] = [];
      let currentLineWidth = 0;

      for (const segment of segments) {
        let activeFont = font;
        if (segment.isBold && segment.isItalic) activeFont = boldItalicFont;
        else if (segment.isBold) activeFont = boldFont;
        else if (segment.isItalic) activeFont = italicFont;

        const words = segment.text.split(/(\s+)/);
        
        for (const word of words) {
          if (!word) continue;
          const wordWidth = activeFont.widthOfTextAtSize(word, fontSize);
          
          if (currentLineWidth + wordWidth > maxW && currentLineWidth > 0) {
            if (word.trim() === '') continue; 
            lines.push({ segments: currentLine, width: currentLineWidth });
            currentLine = [{ text: word.trimStart(), isBold: segment.isBold, isItalic: segment.isItalic }];
            currentLineWidth = activeFont.widthOfTextAtSize(word.trimStart(), fontSize);
          } else {
            if (currentLine.length === 0 && word.trim() === '') continue;
            if (currentLine.length > 0 && currentLine[currentLine.length - 1].isBold === segment.isBold && currentLine[currentLine.length - 1].isItalic === segment.isItalic) {
               currentLine[currentLine.length - 1].text += word;
            } else {
               currentLine.push({ text: word, isBold: segment.isBold, isItalic: segment.isItalic });
            }
            currentLineWidth += wordWidth;
          }
        }
      }
      if (currentLine.length > 0) {
        lines.push({ segments: currentLine, width: currentLineWidth });
      }
      return lines;
    };

    // ===== SECTION-BASED RENDERING =====
    type RenderItem = {
      type: 'heading' | 'paragraph' | 'bullet' | 'blank' | 'hr';
      lines: WrappedLine[];
      indentX: number;
      spaceBefore: number;
      spaceAfter: number;
    };

    const rawParagraphs = content.split('\n');
    const allItems: RenderItem[] = [];
    
    for (const paragraph of rawParagraphs) {
      if (paragraph.trim() === '') {
        allItems.push({ type: 'blank', lines: [], indentX: marginX, spaceBefore: 0, spaceAfter: lineHeight * 0.5 });
        continue;
      }

      if (paragraph.trim() === '---') {
        allItems.push({ type: 'hr', lines: [], indentX: marginX, spaceBefore: lineHeight * 0.2, spaceAfter: lineHeight * 0.2 });
        continue;
      }

      let text = paragraph;
      let isHeading = false;

      // Markdown heading (#, ##, ###)
      const headingMatch = text.trim().match(/^#{1,3}\s+(.*)/);
      if (headingMatch) {
        text = headingMatch[1];
        text = `**${text.replace(/\*\*/g, '')}**`;
        isHeading = true;
      }

      // Bullet detection — BUT skip lines that start with ** (those are bold text, not bullets!)
      let isBullet = false;
      if (!isHeading) {
        const trimmed = text.trim();
        // Only treat as bullet if it starts with a SINGLE * followed by non-* char, or - or number.
        // Lines starting with ** are markdown bold, NOT bullets.
        if (!trimmed.startsWith('**')) {
          const bulletMatch = trimmed.match(/^(\*|-|\d+\.)\s+(.*)/);
          if (bulletMatch) {
            isBullet = true;
            const sym = bulletMatch[1];
            const body = bulletMatch[2];
            if (sym === '*' || sym === '-') {
              text = `\u2022  ${body}`;
            } else {
              text = `${sym} ${body}`;
            }
          }
        }
      }

      const itemIndentX = isBullet ? marginX + 20 : marginX;
      const itemMaxWidth = maxWidth - (isBullet ? 20 : 0);
      const lines = wrapParagraph(text, itemMaxWidth);

      if (isHeading) {
        allItems.push({ type: 'heading', lines, indentX: itemIndentX, spaceBefore: lineHeight * 0.5, spaceAfter: lineHeight * 0.15 });
      } else if (isBullet) {
        allItems.push({ type: 'bullet', lines, indentX: itemIndentX, spaceBefore: 0, spaceAfter: lineHeight * 0.1 });
      } else {
        allItems.push({ type: 'paragraph', lines, indentX: itemIndentX, spaceBefore: 0, spaceAfter: lineHeight * 0.25 });
      }
    }

    // Group into sections (heading + body until next heading)
    type Section = { items: RenderItem[] };
    const sections: Section[] = [];
    let currentSection: RenderItem[] = [];

    for (const item of allItems) {
      if (item.type === 'heading' && currentSection.length > 0) {
        sections.push({ items: currentSection });
        currentSection = [item];
      } else {
        currentSection.push(item);
      }
    }
    if (currentSection.length > 0) {
      sections.push({ items: currentSection });
    }

    // Calculate section height
    const calcSectionHeight = (items: RenderItem[]): number => {
      let h = 0;
      for (const item of items) {
        h += item.spaceBefore;
        if (item.type === 'hr') {
          h += lineHeight * 0.5;
        } else if (item.type !== 'blank') {
          h += item.lines.length * lineHeight;
        }
        h += item.spaceAfter;
      }
      return h;
    };

    // Render
    const fullSecondPageHeight = height - secondPageTopMargin - bottomMargin;

    const renderItem = async (item: RenderItem) => {
      currentY -= item.spaceBefore;
      if (currentY < bottomMargin) await addNewPage();

      if (item.type === 'blank') {
        currentY -= item.spaceAfter;
        if (currentY < bottomMargin) await addNewPage();
        return;
      }

      if (item.type === 'hr') {
        if (currentY < bottomMargin) await addNewPage();
        currentPage.drawLine({
          start: { x: marginX, y: currentY },
          end: { x: width - marginX, y: currentY },
          thickness: 0.5,
          color: rgb(0.6, 0.6, 0.6),
        });
        currentY -= lineHeight * 0.5;
        currentY -= item.spaceAfter;
        if (currentY < bottomMargin) await addNewPage();
        return;
      }

      for (const line of item.lines) {
        if (currentY < bottomMargin) {
          await addNewPage();
        }
        let currentX = item.indentX;
        for (const segment of line.segments) {
          let activeFont = font;
          if (segment.isBold && segment.isItalic) activeFont = boldItalicFont;
          else if (segment.isBold) activeFont = boldFont;
          else if (segment.isItalic) activeFont = italicFont;

          currentPage.drawText(segment.text, {
            x: currentX,
            y: currentY,
            size: fontSize,
            font: activeFont,
            color: rgb(0.1, 0.1, 0.1),
          });
          currentX += activeFont.widthOfTextAtSize(segment.text, fontSize);
        }
        currentY -= lineHeight;
      }
      currentY -= item.spaceAfter;
    };

    for (const section of sections) {
      const sectionHeight = calcSectionHeight(section.items);
      const availableHeight = currentY - bottomMargin;

      if (sectionHeight > availableHeight && sectionHeight <= fullSecondPageHeight) {
        await addNewPage();
      }

      for (const item of section.items) {
        await renderItem(item);
      }
    }

    // ===== STAMP ON LAST PAGE =====
    try {
      const stampImage = await pdfDoc.embedPng(stampBytes);
      const stampDims = stampImage.scale(1);
      // Scale stamp to max 100px wide/tall while keeping aspect ratio
      const stampMaxSize = 100;
      const stampScale = Math.min(stampMaxSize / stampDims.width, stampMaxSize / stampDims.height);
      const stampW = stampDims.width * stampScale;
      const stampH = stampDims.height * stampScale;
      
      // Place at left margin, just above the bottom margin on the last page
      const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
      lastPage.drawImage(stampImage, {
        x: marginX,
        y: bottomMargin + 5,
        width: stampW,
        height: stampH,
      });
    } catch (stampErr) {
      console.warn("Could not embed stamp:", stampErr);
    }

    return pdfDoc.save();
  };

  // ========== PREVIEW ==========
  const handlePreview = async () => {
    if (!content.trim()) {
      toast({ title: "Content missing", description: "Please enter some content for the document.", variant: "destructive" });
      return;
    }

    setIsPreviewing(true);
    try {
      const pdfBytes = await generatePdfBytes();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Preview failed", description: error.message || "Could not generate preview.", variant: "destructive" });
    } finally {
      setIsPreviewing(false);
    }
  };

  const closePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

  // ========== DOWNLOAD ==========
  const handleGenerate = async () => {
    if (!content.trim()) {
      toast({ title: "Content missing", description: "Please enter some content for the document.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const pdfBytes = await generatePdfBytes();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentType}_${recipientName || 'document'}.pdf`.replace(/\s+/g, '_');
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "PDF generated and downloaded successfully." });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Generation failed", description: error.message || "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // ========== TEMPLATES ==========
  const getTemplateContent = (type: string) => {
    if (type === 'offer_letter') {
      return `Dear Mr./Ms. [Name],

We are pleased to extend this offer of engagement to you for the position of **[Role]** with BiovaCo Nexus Private Limited ("the Company"), subject to the terms and conditions set forth herein.

## 1. POSITION & NATURE OF ENGAGEMENT

**Designation:** [Role]
**Department:** __________________
**Reporting To:** __________________
**Location:** __________________
**Engagement Type:** __________________
**Commencement Date:** __________________

## 2. REMOTE / WORK ARRANGEMENT

[Insert remote, hybrid, or on-site work arrangement terms.]

## 3. PROBATION PERIOD

[Insert probation duration and evaluation terms.]

## 4. COMPENSATION

[Insert compensation model, salary, stipend, performance-based terms, or any other remuneration details.]

## 5. DUTIES AND RESPONSIBILITIES

As a **[Role]**, you shall be responsible for, including but not limited to:

* ---
* ---
* ---
* ---

The scope of responsibilities may be modified at the Company's discretion based on business requirements.

## 6. CONFIDENTIALITY

[Insert confidentiality obligations.]

## 7. INTELLECTUAL PROPERTY ASSIGNMENT

[Insert intellectual property ownership and assignment terms.]

## 8. DATA PROTECTION

[Insert data protection and information handling obligations.]

## 9. AI USAGE POLICY

[Insert AI usage and external tool restrictions, if applicable.]

## 10. PORTFOLIO AND SOCIAL MEDIA RESTRICTIONS

[Insert portfolio, publication, and social media restrictions, if applicable.]

## 11. ESOP CONSIDERATION

[Insert ESOP eligibility or discretionary equity participation terms, if applicable.]

## 12. NON-SOLICITATION

[Insert client, employee, vendor, and business non-solicitation terms.]

## 13. RETURN OF ASSETS AND CREDENTIALS

[Insert return and deletion of company property, credentials, and materials requirements.]

## 14. TERMINATION

[Insert notice period, immediate termination rights, and survival clauses.]

## 15. GOVERNING LAW AND JURISDICTION

[Insert governing law and jurisdiction details.]

---

# ACCEPTANCE

This offer shall lapse if not accepted within ______ days of the date of issuance.

By signing below, you confirm that you have read, understood, and unconditionally accept all terms and conditions set out in this offer letter. You further confirm that you are not bound by any agreement that would prevent you from undertaking this engagement.

Please sign and return one copy of this letter as your formal acceptance.

We look forward to welcoming you to the BiovaCo Nexus family.

Warm regards,

For BiovaCo Nexus Private Limited

---

Name: __________________
Designation: __________________

Accepted and Agreed:

---

Candidate Signature

Name: [Name]

Date: __________________`;
    }
    if (type === 'lor') {
      return `To Whom It May Concern,\n\nI am writing to highly recommend [Name] for [Purpose]. During their time at BiovaCo Nexus, they demonstrated exceptional skills in [Area].\n\nThey have been a valuable asset to our organization and I am confident they will excel in their future endeavors.\n\nSincerely,\n[Manager Name]\nBiovaCo Nexus`;
    }
    if (type === 'press_release') {
      return `FOR IMMEDIATE RELEASE\n\nBiovaCo Nexus Announces [News/Event]\n\n[City, State] – [Date] – BiovaCo Nexus today announced [brief summary of news].\n\n"[Quote from executive]," said [Name], [Title] at BiovaCo Nexus.\n\nAbout BiovaCo Nexus:\nBiovaCo Nexus is a leading company in [Industry], committed to [Mission].\n\nFor media inquiries, please contact:\n[Contact Name]\n[Email/Phone]`;
    }
    return '';
  };

  const handleTypeChange = (val: string) => {
    setDocumentType(val);
    let newContent = getTemplateContent(val);
    if (val === 'lor' && recipientName) {
      newContent = newContent.replace('[Name]', `**${recipientName}**`);
    }
    setContent(newContent);
  };

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-[#08A04B] shadow-lg">
        <CardHeader className="bg-green-50/30">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg text-green-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl text-[#032E63]">Document Generator</CardTitle>
              <CardDescription>
                Generate official documents on company letterhead. Use **bold** for bold text, //italic// for italic, ## for section headings, * for bullet points.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="docType">Document Type</Label>
              <Select value={documentType} onValueChange={handleTypeChange}>
                <SelectTrigger id="docType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offer_letter">Offer Letter</SelectItem>
                  <SelectItem value="lor">Letter of Recommendation</SelectItem>
                  <SelectItem value="press_release">Press Release</SelectItem>
                  <SelectItem value="custom">Custom Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient / Addressee Name</Label>
              <Input 
                id="recipient" 
                placeholder="e.g. John Doe" 
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refNo">Ref No.</Label>
              <Input 
                id="refNo" 
                placeholder="e.g. BNPL/2026/01" 
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="content">Document Content</Label>
              <span className="text-xs text-gray-500">
                **bold** for bold · //italic// for italic · ## heading · * bullet · --- horizontal line
              </span>
            </div>
            <Textarea 
              id="content" 
              placeholder="Type your document content here..." 
              className="min-h-[300px] resize-y font-mono text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              onClick={handlePreview} 
              disabled={isPreviewing || isGenerating}
              variant="outline"
              className="border-[#032E63] text-[#032E63] hover:bg-[#032E63] hover:text-white px-6"
            >
              {isPreviewing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {isPreviewing ? 'Generating...' : 'Preview PDF'}
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || isPreviewing}
              className="bg-[#08A04B] hover:bg-[#06803B] text-white px-8"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* PDF Preview */}
      {previewUrl && (
        <Card className="border-t-4 border-t-[#032E63] shadow-lg overflow-hidden">
          <CardHeader className="bg-blue-50/30 py-3 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#032E63]" />
                <CardTitle className="text-base text-[#032E63]">PDF Preview</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="bg-[#08A04B] hover:bg-[#06803B] text-white"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={closePreview}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <div className="w-full" style={{ height: '80vh' }}>
            <iframe 
              src={previewUrl} 
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          </div>
        </Card>
      )}
    </div>
  );
};
