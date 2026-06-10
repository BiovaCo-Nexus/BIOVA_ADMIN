import jsPDF from 'jspdf';

// NOTE: This file is now VERY long (260+ lines). Please ask for refactoring if making further edits!

function addImageToPDF(pdf: jsPDF, imageUrl: string, x: number, y: number, width: number, height: number) {
  return new Promise<void>((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");
      pdf.addImage(dataUrl, "PNG", x, y, width, height, undefined, "FAST");
      resolve();
    };
    img.onerror = function () {
      resolve(); // Fail gracefully, logo missing should not crash PDF
    };
    img.src = imageUrl;
  });
}

export const generateApplicationPDF = async (
  applicationData: any,
  applicationId: string
) => {
  // -- SETUP
  const currentDate = new Date().toLocaleDateString('en-IN');
  const green = '#259D4A';
  const paleGreen = '#E6F2E6';
  const fallbackName = applicationData.full_name || applicationData.fullName || applicationData.name || '';

  // A4 size
  const pageWidth = 210;
  const pageHeight = 297;
  const sideMargin = 18;

  // Margin for top elements
  let y = 8;

  const pdf = new jsPDF({
    unit: "mm",
    format: "a4"
  });

  // --- SMALL LOGO - upper right corner ---
  const logoW = 14;
  const logoH = 9;
  const logoPad = 6;
  const logoX = pageWidth - logoW - logoPad;
  const logoY = logoPad;
  await addImageToPDF(
    pdf,
    "/lovable-uploads/89e4ce6f-289e-48cc-a537-3d0811e14628.png",
    logoX,
    logoY,
    logoW,
    logoH
  );

  // --- Brand title near the top ---
  const brandY = y + 14;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(green);
  pdf.text('ELECTROCULTURE', pageWidth / 2, brandY, { align: 'center' });

  const subtitleY = brandY + 7.2;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor('#222');
  pdf.text('Electronics Empower Agriculture', pageWidth / 2, subtitleY, { align: 'center' });

  // -- Green band below brand --
  const bandY = subtitleY + 8;
  pdf.setFillColor(green);
  pdf.rect(0, bandY, pageWidth, 8, "F");

  // "JOB APPLICATION" header with more margin
  const jobAppY = bandY + 16;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(green);
  pdf.text('JOB APPLICATION', pageWidth / 2, jobAppY, { align: 'center' });

  y = jobAppY + 13;

  // ========== PERSONAL INFORMATION SECTION =========
  pdf.setFillColor(paleGreen);
  pdf.rect(sideMargin, y, pageWidth - sideMargin * 2, 12, "F");
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12.2);
  pdf.setTextColor(green);
  pdf.text('PERSONAL INFORMATION', sideMargin + 4, y + 8.4);

  y += 14;

  // Main info box (table feel, more padding)
  const piBoxTop = y;
  const piBoxHeight = 41;
  pdf.setDrawColor(green);
  pdf.setLineWidth(0.4);
  pdf.rect(sideMargin, piBoxTop, pageWidth - sideMargin * 2, piBoxHeight, 'S');
  // pale green top "header" row
  pdf.setFillColor(paleGreen);
  pdf.rect(sideMargin, piBoxTop, pageWidth - sideMargin * 2, 9, "F");

  // --- Table-like layout for two columns
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.3);
  pdf.setTextColor('#222');
  const leftColX = sideMargin + 6;
  const rightColX = pageWidth/2 + 2;
  const colValOffset = 37;
  const colY0 = y + 6.5;
  const rowStep = 8.6;

  // Left column labels
  pdf.text('Full Name:', leftColX, colY0);
  pdf.text('Email:', leftColX, colY0 + rowStep);
  pdf.text('Position Applied:', leftColX, colY0 + rowStep * 2);

  // Right column labels
  pdf.text('Date:', rightColX, colY0);
  pdf.text('Phone:', rightColX, colY0 + rowStep);
  pdf.text('Experience:', rightColX, colY0 + rowStep * 2);

  // --- Values ---
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor('#222');
  // Label-value separation constants
  const labelValPadL = 35; // More right shift from the label for clear separation

  pdf.text(fallbackName, leftColX + labelValPadL, colY0);
  pdf.text(applicationData.email || '', leftColX + labelValPadL, colY0 + rowStep);

  let roleLabel =
    applicationData.role && typeof applicationData.role === 'string'
      ? applicationData.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      : '';
  // Align position applied value the same as others for better separation
  pdf.text(roleLabel, leftColX + labelValPadL, colY0 + rowStep * 2);

  pdf.text(currentDate, rightColX + 21, colY0);
  pdf.text(applicationData.phone || '', rightColX + 21, colY0 + rowStep);
  pdf.text(`${applicationData.experience_years ?? applicationData.experienceYears ?? '0'} years`, rightColX + 21, colY0 + rowStep * 2);

  // --- Signature box - cell feel, neat margin, label inside top-left ---
  const sigBoxW = 50;
  const sigBoxH = 12;
  // Place in the lower-right area of the box
  const sigBoxX = pageWidth - sideMargin - sigBoxW - 5;
  const sigBoxY = piBoxTop + piBoxHeight - sigBoxH - 3.5;
  pdf.setDrawColor('#999');
  pdf.setLineWidth(0.38);
  pdf.rect(sigBoxX, sigBoxY, sigBoxW, sigBoxH, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.1);
  pdf.setTextColor('#444');
  pdf.text('Signature:', sigBoxX + 2.3, sigBoxY + 5);

  // Signature image (fit cleanly inside box)
  const signatureData = applicationData.signature_image || applicationData.signature;
  if (signatureData && typeof signatureData === "string" && signatureData.startsWith("data:image")) {
    try {
      pdf.addImage(signatureData, "PNG", sigBoxX + 2, sigBoxY + 6.5, sigBoxW - 6, sigBoxH - 8, undefined, "FAST");
    } catch (err) {
      // Fail gracefully
    }
  }

  // --- Next section below box
  y = piBoxTop + piBoxHeight + 16;

  // ========== COMPANY INFORMATION ===============
  pdf.setFillColor(paleGreen);
  pdf.rect(sideMargin, y, pageWidth - sideMargin * 2, 12, "F");
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12.2);
  pdf.setTextColor(green);
  pdf.text('COMPANY INFORMATION', sideMargin + 4, y + 8.7);

  y += 14;
  // Info box
  const companyBoxHeight = 19;
  pdf.setDrawColor(green);
  pdf.setLineWidth(0.36);
  pdf.rect(sideMargin, y, pageWidth - sideMargin * 2, companyBoxHeight, 'S');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor('#222');
  const compInfoY = y + 7.1;
  pdf.text('ElectroCulture', sideMargin + 5, compInfoY);
  pdf.text('info@electroculture.in', pageWidth/2 - 14, compInfoY);
  pdf.text('8177806422 / 7249245392', pageWidth - sideMargin - 56, compInfoY);
  pdf.text('Chhatrapati Sq, 16, Kapil Nagar, Suyog Nagar,', sideMargin + 5, y + 12.7);
  pdf.text('New Sneh Nagar, Nagpur, Maharashtra 440015', sideMargin + 5, y + 17.5);

  y += companyBoxHeight + 13;

  // --- SKILLS & TECHNOLOGIES ---
  if (applicationData.skills) {
    pdf.setFillColor(paleGreen);
    pdf.rect(sideMargin, y, pageWidth - sideMargin * 2, 11, "F");
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(green);
    pdf.text('SKILLS & TECHNOLOGIES', sideMargin + 4, y + 7.8);

    y += 13;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor('#222');
    const skillsLines = pdf.splitTextToSize(applicationData.skills, pageWidth - sideMargin * 2 - 8);
    pdf.text(skillsLines, sideMargin + 5, y + 7);
    y += 8 * skillsLines.length + 7;
  }

  // --- COVER LETTER ---
  if (applicationData.cover_letter || applicationData.coverLetter) {
    pdf.setFillColor(paleGreen);
    pdf.rect(sideMargin, y, pageWidth - sideMargin * 2, 11, "F");
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(green);
    pdf.text('COVER LETTER', sideMargin + 4, y + 7.8);

    y += 13;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor('#222');
    const coverLetter =
      applicationData.cover_letter || applicationData.coverLetter;
    const coverLines = pdf.splitTextToSize(coverLetter, pageWidth - sideMargin * 2 - 8);
    pdf.text(coverLines, sideMargin + 5, y + 7);
    y += 8 * coverLines.length + 7;
  }

  // --- FOOTER band & text (visually separated) ---
  let footerY = pageHeight - 20;
  pdf.setFillColor(green);
  pdf.rect(0, footerY - 10, pageWidth, 11, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12.2);
  pdf.setTextColor(green);
  pdf.text('You can see your application status online:', sideMargin, footerY + 8.3);

  // Link "Track Application"
  const trackUrl = `https://electroculture.shop/track?application_id=${encodeURIComponent(applicationId || '')}`;
  pdf.setTextColor('#0389C2');
  pdf.textWithLink('Track Application', pageWidth - sideMargin - 47, footerY + 8.4, { url: trackUrl });

  // Bottom signatures (gray, italic)
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(10);
  pdf.setTextColor('#888');
  pdf.text('Founder: Richa Rajan', sideMargin, pageHeight - 7);
  pdf.text('Co-Founder: Nakul Mundhada', pageWidth - sideMargin - 63, pageHeight - 7);

  pdf.save(`ElectroCulture_Application_${applicationId}.pdf`);
};
