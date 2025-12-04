import jsPDF from 'jspdf';

/**
 * Generate PDF from resume builder data
 * @param {Object} builderData - Resume data from builder
 * @param {string} template - Template style (modern, classic, compact)
 * @param {string} fileName - Output file name
 */
export const generateResumePDF = (builderData, template = 'modern', fileName = 'resume.pdf') => {
  // Create new jsPDF instance with optimized settings for ATS compatibility
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Font sizes for consistent hierarchy
  const FONT_SIZES = {
    header: 22,
    subheader: 18,
    sectionTitle: 14,
    body: 11,
    small: 10,
    tiny: 9
  };

  // Line heights for consistent spacing
  const LINE_HEIGHTS = {
    header: 28,
    subheader: 24,
    sectionTitle: 20,
    body: 16,
    small: 14,
    tiny: 12
  };

  // Colors for consistent styling (black for ATS compatibility)
  const COLORS = {
    primary: [0, 0, 0],        // Black for main text
    secondary: [64, 64, 64],   // Dark gray for secondary text
    accent: [0, 0, 0],         // Black for accents (ATS-friendly)
    light: [128, 128, 128],    // Medium gray for subtle elements
    divider: [200, 200, 200]   // Light gray for dividers
  };

  // Helper functions
  const addText = (text, fontSize = FONT_SIZES.body, isBold = false, indent = 0, color = COLORS.primary) => {
    if (!text || !text.trim()) return;
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach(line => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin + indent, yPosition);
      yPosition += fontSize * 1.2; // Consistent line height
    });
  };

  const addSpace = (space = 10) => {
    yPosition += space;
  };

  const addLine = () => {
    doc.setDrawColor(...COLORS.divider);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;
  };

  const addSectionHeader = (title) => {
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }
    addSpace(10);
    addText(title.toUpperCase(), FONT_SIZES.sectionTitle, true, 0, COLORS.primary);
    doc.setDrawColor(...COLORS.divider);
    doc.setLineWidth(1);
    doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
    addSpace(10);
  };

  // Header - Personal Information
  if (builderData.personal.name) {
    doc.setFontSize(FONT_SIZES.header);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(builderData.personal.name.toUpperCase(), margin, yPosition);
    yPosition += FONT_SIZES.header * 1.2;
  }

  // Contact Information
  const contactInfo = [
    builderData.personal.email,
    builderData.personal.phone,
    builderData.personal.location
  ].filter(Boolean).join(' | ');

  if (contactInfo) {
    doc.setFontSize(FONT_SIZES.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondary);
    doc.text(contactInfo, margin, yPosition);
    yPosition += FONT_SIZES.small * 1.2;
  }

  addSpace(15);
  addLine();

  // Professional Summary
  if (builderData.summary && builderData.summary.trim()) {
    addSectionHeader('PROFESSIONAL SUMMARY');
    addText(builderData.summary, FONT_SIZES.body);
    addSpace(10);
  }

  // Skills
  if (builderData.skills && builderData.skills.trim()) {
    addSectionHeader('SKILLS');
    const skillsArray = builderData.skills.split(',').map(s => s.trim()).filter(Boolean);
    const skillsText = skillsArray.join(', ');
    addText(skillsText, FONT_SIZES.body);
    addSpace(10);
  }

  // Education
  if (builderData.education && builderData.education.length > 0) {
    const validEducation = builderData.education.filter(ed => ed.institution || ed.degree);
    if (validEducation.length > 0) {
      addSectionHeader('EDUCATION');
      validEducation.forEach((ed, index) => {
        if (ed.degree || ed.institution) {
          const eduLine = [ed.degree, ed.institution].filter(Boolean).join(' - ');
          addText(eduLine, FONT_SIZES.body, true);
          if (ed.years) {
            addText(ed.years, FONT_SIZES.small, false, 0, COLORS.secondary);
          }
          if (index < validEducation.length - 1) {
            addSpace(10);
          }
        }
      });
      addSpace(10);
    }
  }

  // Projects
  if (builderData.projects && builderData.projects.length > 0) {
    const validProjects = builderData.projects.filter(pr => pr.title || pr.description);
    if (validProjects.length > 0) {
      addSectionHeader('PROJECTS');
      validProjects.forEach((pr, index) => {
        if (pr.title) {
          addText(pr.title, FONT_SIZES.body, true);
        }
        if (pr.description) {
          // Format as bullet points for better ATS compatibility
          const descriptions = pr.description
            .split(/[;\n]/)
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .map(item => item.startsWith('•') ? item : `• ${item}`);
          
          descriptions.forEach(desc => {
            addText(desc, FONT_SIZES.body, false, 10);
          });
        }
        if (index < validProjects.length - 1) {
          addSpace(10);
        }
      });
      addSpace(10);
    }
  }

  // Internships / Experience
  if (builderData.internships && builderData.internships.length > 0) {
    const validInternships = builderData.internships.filter(inr => inr.title || inr.company || inr.description);
    if (validInternships.length > 0) {
      addSectionHeader('EXPERIENCE');
      validInternships.forEach((inr, index) => {
        const titleLine = [inr.title, inr.company].filter(Boolean).join(' - ');
        if (titleLine) {
          addText(titleLine, FONT_SIZES.body, true);
        }
        if (inr.description) {
          // Format as bullet points for better ATS compatibility
          const descriptions = inr.description
            .split(/[;\n]/)
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .map(item => item.startsWith('•') ? item : `• ${item}`);
          
          descriptions.forEach(desc => {
            addText(desc, FONT_SIZES.body, false, 10);
          });
        }
        if (index < validInternships.length - 1) {
          addSpace(10);
        }
      });
    }
  }

  // Save the PDF
  doc.save(fileName);
};

/**
 * Generate PDF preview URL (for preview before download)
 * @param {Object} builderData - Resume data from builder
 * @param {string} template - Template style
 * @returns {string} Blob URL for preview
 */
export const generateResumePDFPreview = (builderData, template = 'modern') => {
  const doc = new jsPDF();
  // ... same logic as above but return blob URL instead
  const pdfBlob = doc.output('blob');
  return URL.createObjectURL(pdfBlob);
};

/**
 * Validate builder data before PDF generation
 * @param {Object} builderData - Resume data to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateResumeData = (builderData) => {
  const errors = [];

  if (!builderData.personal.name || !builderData.personal.name.trim()) {
    errors.push('Name is required');
  }

  if (!builderData.personal.email || !builderData.personal.email.trim()) {
    errors.push('Email is required');
  }

  if (!builderData.personal.phone || !builderData.personal.phone.trim()) {
    errors.push('Phone is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};