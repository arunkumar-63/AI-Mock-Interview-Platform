import React, { useState, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  User, Link as LinkIcon, FileText, Award, Briefcase, GraduationCap,
  Heart, Trophy, Globe, BookOpen, Target, GripVertical, ChevronDown,
  ChevronUp, Plus, Trash2, Save, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const DraggableResumeBuilder = ({ onSave, initialData = null }) => {
  const initialSections = [
    { id: 'personal', title: 'Personal Information', icon: User, enabled: true, collapsed: false },
    { id: 'links', title: 'Website & Social Links', icon: LinkIcon, enabled: true, collapsed: false },
    { id: 'summary', title: 'Professional Summary', icon: FileText, enabled: true, collapsed: false },
    { id: 'skills', title: 'Skills & Interests', icon: Target, enabled: true, collapsed: false },
    { id: 'projects', title: 'Projects', icon: Briefcase, enabled: true, collapsed: false },
    { id: 'certificates', title: 'Certificates/Certifications', icon: Award, enabled: true, collapsed: false },
    { id: 'education', title: 'Education', icon: GraduationCap, enabled: true, collapsed: false },
    { id: 'experience', title: 'Work Experience', icon: Briefcase, enabled: true, collapsed: false },
    { id: 'volunteering', title: 'Volunteering', icon: Heart, enabled: true, collapsed: false },
    { id: 'awards', title: 'Awards & Achievements', icon: Trophy, enabled: true, collapsed: false },
    { id: 'languages', title: 'Languages', icon: Globe, enabled: true, collapsed: false },
    { id: 'publications', title: 'Publications', icon: BookOpen, enabled: true, collapsed: false }
  ];

  const initialResumeData = {
    personal: { fullName: '', email: '', phone: '', location: '', title: '', photo: '' },
    links: { website: '', linkedin: '', github: '', twitter: '', portfolio: '', custom: [] },
    summary: { professionalSummary: '', careerObjective: '' },
    skills: { technical: [], soft: [], interests: [] },
    projects: [], certificates: [], education: [], experience: [],
    volunteering: [], awards: [], languages: [], publications: []
  };

  const [sections, setSections] = useState(initialData?.sections || initialSections);
  const [resumeData, setResumeData] = useState(initialData?.data || initialResumeData);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSections(items);
  };

  const toggleSection = (sectionId) => {
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, collapsed: !section.collapsed } : section
    ));
  };

  const updateField = (section, field, value) => {
    setResumeData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const updateArrayField = (section, value) => {
    setResumeData(prev => ({ ...prev, [section]: value }));
  };

  const addItem = (section, template) => {
    setResumeData(prev => ({ ...prev, [section]: [...prev[section], template] }));
  };

  const removeItem = (section, index) => {
    setResumeData(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
  };

  const updateItem = (section, index, field, value) => {
    setResumeData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ sections, data: resumeData });
      toast.success('Resume saved successfully!');
    }
  };

  const handleDownloadPDF = () => {
    try {
      // Create new jsPDF instance with optimized settings for ATS compatibility
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      // Set consistent margins
      const margin = 50;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const contentWidth = pageWidth - 2 * margin;
      
      // Initialize Y position
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
      
      // Helper function to add text with proper wrapping and positioning
      const addText = (text, fontSize = FONT_SIZES.body, isBold = false, indent = 0, color = COLORS.primary) => {
        if (!text || !text.trim()) return;
        
        // Check if we need a new page
        if (yPosition > pageHeight - margin - LINE_HEIGHTS.body) {
          doc.addPage();
          yPosition = margin;
        }
        
        // Set font styling
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(...color);
        
        // Split text to fit within content width
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        
        // Add each line
        lines.forEach((line, index) => {
          // Check if we need a new page for this line
          if (yPosition > pageHeight - margin - LINE_HEIGHTS.body) {
            doc.addPage();
            yPosition = margin;
          }
          
          doc.text(line, margin + indent, yPosition);
          yPosition += fontSize * 1.2; // Consistent line height
        });
      };
      
      // Helper function to add a section title
      const addSectionTitle = (title) => {
        // Add some space before section
        yPosition += 10;
        
        // Check if we need a new page
        if (yPosition > pageHeight - margin - LINE_HEIGHTS.sectionTitle) {
          doc.addPage();
          yPosition = margin;
        }
        
        // Add section title
        addText(title.toUpperCase(), FONT_SIZES.sectionTitle, true, 0, COLORS.primary);
        
        // Add underline
        doc.setDrawColor(...COLORS.divider);
        doc.setLineWidth(1);
        doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
        
        // Add space after section title
        yPosition += 10;
      };
      
      // Helper function to add a horizontal divider
      const addDivider = () => {
        if (yPosition > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.setDrawColor(...COLORS.divider);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;
      };
      
      // Helper function to add a date range
      const addDateRange = (startDate, endDate, isCurrent = false) => {
        if (startDate || endDate) {
          const dateText = isCurrent 
            ? `${startDate || ''} - Present`
            : `${startDate || ''} - ${endDate || ''}`;
          addText(dateText, FONT_SIZES.small, false, 0, COLORS.secondary);
        }
      };
      
      // Add header with personal information
      if (resumeData.personal.fullName) {
        addText(resumeData.personal.fullName.toUpperCase(), FONT_SIZES.header, true);
        yPosition += 5;
      }
      
      if (resumeData.personal.title) {
        addText(resumeData.personal.title, FONT_SIZES.subheader, true, 0, COLORS.secondary);
        yPosition += 5;
      }
      
      // Create contact information line
      const contactItems = [
        resumeData.personal.email,
        resumeData.personal.phone,
        resumeData.personal.location,
        resumeData.links.website,
        resumeData.links.linkedin,
        resumeData.links.github
      ].filter(item => item && item.trim());
      
      if (contactItems.length > 0) {
        const contactLine = contactItems.join(' | ');
        addText(contactLine, FONT_SIZES.small, false, 0, COLORS.secondary);
        yPosition += 15;
        addDivider();
      }
      
      // Process sections in order
      sections.forEach(section => {
        if (!section.enabled) return;
        
        switch (section.id) {
          case 'summary':
            if ((resumeData.summary.professionalSummary && resumeData.summary.professionalSummary.trim()) || 
                (resumeData.summary.careerObjective && resumeData.summary.careerObjective.trim())) {
              addSectionTitle('Professional Summary');
              
              if (resumeData.summary.professionalSummary && resumeData.summary.professionalSummary.trim()) {
                addText(resumeData.summary.professionalSummary);
                yPosition += 10;
              }
              
              if (resumeData.summary.careerObjective && resumeData.summary.careerObjective.trim()) {
                addText('CAREER OBJECTIVE', FONT_SIZES.small, true);
                addText(resumeData.summary.careerObjective);
                yPosition += 10;
              }
            }
            break;
            
          case 'skills':
            const allSkills = [
              ...(resumeData.skills.technical || []),
              ...(resumeData.skills.soft || []),
              ...(resumeData.skills.interests || [])
            ];
            
            if (allSkills.length > 0) {
              addSectionTitle('Skills');
              addText(allSkills.join(', '), FONT_SIZES.body);
              yPosition += 10;
            }
            break;
            
          case 'experience':
            if (resumeData.experience && resumeData.experience.length > 0) {
              const validExperience = resumeData.experience.filter(exp => 
                (exp.company && exp.company.trim()) || (exp.position && exp.position.trim())
              );
              
              if (validExperience.length > 0) {
                addSectionTitle('Work Experience');
                
                validExperience.forEach((exp, index) => {
                  // Company and position
                  const titleLine = [exp.position, exp.company].filter(Boolean).join(' at ');
                  if (titleLine) {
                    addText(titleLine, FONT_SIZES.body, true);
                  }
                  
                  // Location
                  if (exp.location && exp.location.trim()) {
                    addText(exp.location, FONT_SIZES.small, false, 0, COLORS.secondary);
                  }
                  
                  // Dates
                  addDateRange(exp.startDate, exp.endDate, exp.current);
                  
                  // Responsibilities
                  if (exp.responsibilities && exp.responsibilities.trim()) {
                    // Format as bullet points for better ATS compatibility
                    const responsibilities = exp.responsibilities
                      .split(/[;\n]/)
                      .map(item => item.trim())
                      .filter(item => item.length > 0)
                      .map(item => item.startsWith('•') ? item : `• ${item}`);
                    
                    responsibilities.forEach(resp => {
                      addText(resp, FONT_SIZES.body, false, 10);
                    });
                  }
                  
                  // Achievements
                  if (exp.achievements && exp.achievements.trim()) {
                    addText('Key Achievements:', FONT_SIZES.small, true, 0, COLORS.secondary);
                    
                    // Format as bullet points
                    const achievements = exp.achievements
                      .split(/[;\n]/)
                      .map(item => item.trim())
                      .filter(item => item.length > 0)
                      .map(item => item.startsWith('•') ? item : `• ${item}`);
                    
                    achievements.forEach(ach => {
                      addText(ach, FONT_SIZES.body, false, 10);
                    });
                  }
                  
                  // Add spacing between experiences
                  if (index < validExperience.length - 1) {
                    yPosition += 10;
                  }
                });
                
                yPosition += 5;
              }
            }
            break;
            
          case 'education':
            if (resumeData.education && resumeData.education.length > 0) {
              const validEducation = resumeData.education.filter(edu => 
                (edu.institution && edu.institution.trim()) || (edu.degree && edu.degree.trim())
              );
              
              if (validEducation.length > 0) {
                addSectionTitle('Education');
                
                validEducation.forEach((edu, index) => {
                  // Degree and field
                  const degreeLine = [edu.degree, edu.field].filter(Boolean).join(' in ');
                  if (degreeLine) {
                    addText(degreeLine, FONT_SIZES.body, true);
                  }
                  
                  // Institution and location
                  const institutionLine = [edu.institution, edu.location].filter(Boolean).join(', ');
                  if (institutionLine) {
                    addText(institutionLine, FONT_SIZES.small, false, 0, COLORS.secondary);
                  }
                  
                  // Dates
                  addDateRange(edu.startDate, edu.endDate);
                  
                  // GPA
                  if (edu.gpa && edu.gpa.trim()) {
                    addText(`GPA: ${edu.gpa}`, FONT_SIZES.small, false, 0, COLORS.secondary);
                  }
                  
                  // Achievements
                  if (edu.achievements && edu.achievements.trim()) {
                    // Format as bullet points
                    const achievements = edu.achievements
                      .split(/[;\n]/)
                      .map(item => item.trim())
                      .filter(item => item.length > 0)
                      .map(item => item.startsWith('•') ? item : `• ${item}`);
                    
                    achievements.forEach(ach => {
                      addText(ach, FONT_SIZES.body, false, 10);
                    });
                  }
                  
                  // Add spacing between education entries
                  if (index < validEducation.length - 1) {
                    yPosition += 10;
                  }
                });
                
                yPosition += 5;
              }
            }
            break;
            
          case 'projects':
            if (resumeData.projects && resumeData.projects.length > 0) {
              const validProjects = resumeData.projects.filter(proj => 
                (proj.name && proj.name.trim()) || (proj.description && proj.description.trim())
              );
              
              if (validProjects.length > 0) {
                addSectionTitle('Projects');
                
                validProjects.forEach((proj, index) => {
                  // Project name
                  if (proj.name && proj.name.trim()) {
                    addText(proj.name, FONT_SIZES.body, true);
                  }
                  
                  // Role and technologies
                  const details = [];
                  if (proj.role && proj.role.trim()) details.push(`Role: ${proj.role}`);
                  if (proj.technologies && proj.technologies.trim()) details.push(`Technologies: ${proj.technologies}`);
                  
                  if (details.length > 0) {
                    addText(details.join(' | '), FONT_SIZES.small, false, 0, COLORS.secondary);
                  }
                  
                  // Dates
                  addDateRange(proj.startDate, proj.endDate);
                  
                  // Description
                  if (proj.description && proj.description.trim()) {
                    // Format as bullet points
                    const descriptions = proj.description
                      .split(/[;\n]/)
                      .map(item => item.trim())
                      .filter(item => item.length > 0)
                      .map(item => item.startsWith('•') ? item : `• ${item}`);
                    
                    descriptions.forEach(desc => {
                      addText(desc, FONT_SIZES.body, false, 10);
                    });
                  }
                  
                  // Highlights
                  if (proj.highlights && proj.highlights.trim()) {
                    addText('Key Highlights:', FONT_SIZES.small, true, 0, COLORS.secondary);
                    
                    // Format as bullet points
                    const highlights = proj.highlights
                      .split(/[;\n]/)
                      .map(item => item.trim())
                      .filter(item => item.length > 0)
                      .map(item => item.startsWith('•') ? item : `• ${item}`);
                    
                    highlights.forEach(highlight => {
                      addText(highlight, FONT_SIZES.body, false, 10);
                    });
                  }
                  
                  // URL
                  if (proj.url && proj.url.trim()) {
                    addText(`Link: ${proj.url}`, FONT_SIZES.small, false, 0, [0, 0, 255]);
                  }
                  
                  // Add spacing between projects
                  if (index < validProjects.length - 1) {
                    yPosition += 10;
                  }
                });
                
                yPosition += 5;
              }
            }
            break;
            
          case 'certificates':
            if (resumeData.certificates && resumeData.certificates.length > 0) {
              const validCertificates = resumeData.certificates.filter(cert => 
                cert.name && cert.name.trim()
              );
              
              if (validCertificates.length > 0) {
                addSectionTitle('Certifications');
                
                validCertificates.forEach((cert, index) => {
                  // Certificate name
                  addText(cert.name, FONT_SIZES.body, true);
                  
                  // Issuer
                  if (cert.issuer && cert.issuer.trim()) {
                    addText(`Issued by: ${cert.issuer}`, FONT_SIZES.small, false, 0, COLORS.secondary);
                  }
                  
                  // Date
                  if (cert.issueDate && cert.issueDate.trim()) {
                    addText(`Date: ${cert.issueDate}`, FONT_SIZES.small, false, 0, COLORS.secondary);
                  }
                  
                  // Credential ID
                  if (cert.credentialId && cert.credentialId.trim()) {
                    addText(`Credential ID: ${cert.credentialId}`, FONT_SIZES.small, false, 0, COLORS.secondary);
                  }
                  
                  // Add spacing between certificates
                  if (index < validCertificates.length - 1) {
                    yPosition += 10;
                  }
                });
                
                yPosition += 5;
              }
            }
            break;
            
          case 'volunteering':
            if (resumeData.volunteering && resumeData.volunteering.length > 0) {
              const validVolunteering = resumeData.volunteering.filter(vol => 
                (vol.organization && vol.organization.trim()) || (vol.role && vol.role.trim())
              );
              
              if (validVolunteering.length > 0) {
                addSectionTitle('Volunteering');
                
                validVolunteering.forEach((vol, index) => {
                  // Role and organization
                  const titleLine = [vol.role, vol.organization].filter(Boolean).join(' at ');
                  if (titleLine) {
                    addText(titleLine, FONT_SIZES.body, true);
                  }
                  
                  // Dates
                  addDateRange(vol.startDate, vol.endDate);
                  
                  // Description
                  if (vol.description && vol.description.trim()) {
                    // Format as bullet points
                    const descriptions = vol.description
                      .split(/[;\n]/)
                      .map(item => item.trim())
                      .filter(item => item.length > 0)
                      .map(item => item.startsWith('•') ? item : `• ${item}`);
                    
                    descriptions.forEach(desc => {
                      addText(desc, FONT_SIZES.body, false, 10);
                    });
                  }
                  
                  // Impact
                  if (vol.impact && vol.impact.trim()) {
                    addText('Impact:', FONT_SIZES.small, true, 0, COLORS.secondary);
                    
                    // Format as bullet points
                    const impacts = vol.impact
                      .split(/[;\n]/)
                      .map(item => item.trim())
                      .filter(item => item.length > 0)
                      .map(item => item.startsWith('•') ? item : `• ${item}`);
                    
                    impacts.forEach(impact => {
                      addText(impact, FONT_SIZES.body, false, 10);
                    });
                  }
                  
                  // Add spacing between volunteering entries
                  if (index < validVolunteering.length - 1) {
                    yPosition += 10;
                  }
                });
                
                yPosition += 5;
              }
            }
            break;
            
          case 'awards':
            if (resumeData.awards && resumeData.awards.length > 0) {
              const validAwards = resumeData.awards.filter(award => 
                award.title && award.title.trim()
              );
              
              if (validAwards.length > 0) {
                addSectionTitle('Awards & Achievements');
                
                validAwards.forEach((award, index) => {
                  // Award title
                  addText(award.title, FONT_SIZES.body, true);
                  
                  // Issuer and date
                  const details = [];
                  if (award.issuer && award.issuer.trim()) details.push(`By: ${award.issuer}`);
                  if (award.date && award.date.trim()) details.push(`Date: ${award.date}`);
                  
                  if (details.length > 0) {
                    addText(details.join(' | '), FONT_SIZES.small, false, 0, COLORS.secondary);
                  }
                  
                  // Description
                  if (award.description && award.description.trim()) {
                    // Format as bullet points
                    const descriptions = award.description
                      .split(/[;\n]/)
                      .map(item => item.trim())
                      .filter(item => item.length > 0)
                      .map(item => item.startsWith('•') ? item : `• ${item}`);
                    
                    descriptions.forEach(desc => {
                      addText(desc, FONT_SIZES.body, false, 10);
                    });
                  }
                  
                  // Add spacing between awards
                  if (index < validAwards.length - 1) {
                    yPosition += 10;
                  }
                });
                
                yPosition += 5;
              }
            }
            break;
            
          case 'languages':
            if (resumeData.languages && resumeData.languages.length > 0) {
              const validLanguages = resumeData.languages.filter(lang => 
                lang.name && lang.name.trim()
              );
              
              if (validLanguages.length > 0) {
                addSectionTitle('Languages');
                
                const languageList = validLanguages.map(lang => {
                  const parts = [lang.name];
                  if (lang.proficiency && lang.proficiency.trim()) {
                    parts.push(lang.proficiency);
                  }
                  if (lang.certification && lang.certification.trim()) {
                    parts.push(lang.certification);
                  }
                  return parts.join(' - ');
                }).join(', ');
                
                addText(languageList, FONT_SIZES.body);
                yPosition += 10;
              }
            }
            break;
            
          case 'publications':
            if (resumeData.publications && resumeData.publications.length > 0) {
              const validPublications = resumeData.publications.filter(pub => 
                pub.title && pub.title.trim()
              );
              
              if (validPublications.length > 0) {
                addSectionTitle('Publications');
                
                validPublications.forEach((pub, index) => {
                  // Publication title
                  addText(pub.title, FONT_SIZES.body, true);
                  
                  // Authors
                  if (pub.authors && pub.authors.trim()) {
                    addText(`Authors: ${pub.authors}`, FONT_SIZES.small, false, 0, COLORS.secondary);
                  }
                  
                  // Publisher and date
                  const details = [];
                  if (pub.publisher && pub.publisher.trim()) details.push(`Publisher: ${pub.publisher}`);
                  if (pub.date && pub.date.trim()) details.push(`Date: ${pub.date}`);
                  
                  if (details.length > 0) {
                    addText(details.join(' | '), FONT_SIZES.small, false, 0, COLORS.secondary);
                  }
                  
                  // Description
                  if (pub.description && pub.description.trim()) {
                    // Format as bullet points
                    const descriptions = pub.description
                      .split(/[;\n]/)
                      .map(item => item.trim())
                      .filter(item => item.length > 0)
                      .map(item => item.startsWith('•') ? item : `• ${item}`);
                    
                    descriptions.forEach(desc => {
                      addText(desc, FONT_SIZES.body, false, 10);
                    });
                  }
                  
                  // Add spacing between publications
                  if (index < validPublications.length - 1) {
                    yPosition += 10;
                  }
                });
                
                yPosition += 5;
              }
            }
            break;
            
          case 'links':
            // Already handled in header
            break;
        }
      });
      
      // Generate filename
      const fileName = resumeData.personal.fullName 
        ? `${resumeData.personal.fullName.replace(/\s+/g, '_')}_Resume.pdf` 
        : 'Resume.pdf';
      
      // Save the PDF
      doc.save(fileName);
      toast.success('Resume PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const renderSectionContent = (section) => {
    if (section.collapsed) return null;
    const props = { data: resumeData[section.id], updateField, updateArrayField, addItem, removeItem, updateItem };
    
    switch (section.id) {
      case 'personal': return <PersonalInfoSection {...props} />;
      case 'links': return <LinksSection {...props} />;
      case 'summary': return <SummarySection {...props} />;
      case 'skills': return <SkillsSection {...props} />;
      case 'projects': return <ProjectsSection {...props} />;
      case 'certificates': return <CertificatesSection {...props} />;
      case 'education': return <EducationSection {...props} />;
      case 'experience': return <ExperienceSection {...props} />;
      case 'volunteering': return <VolunteeringSection {...props} />;
      case 'awards': return <AwardsSection {...props} />;
      case 'languages': return <LanguagesSection {...props} />;
      case 'publications': return <PublicationsSection {...props} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Build Your Resume</h2>
        <div className="flex gap-2">
          <button onClick={handleDownloadPDF} className="btn-secondary inline-flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
          <button onClick={handleSave} className="btn-primary inline-flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Save Resume
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}
                      className={`bg-white rounded-lg shadow-md border-2 ${snapshot.isDragging ? 'border-primary-500 shadow-lg' : 'border-gray-200'}`}>
                      <div className="flex items-center p-4 bg-gray-50 rounded-t-lg">
                        <div {...provided.dragHandleProps} className="mr-3 cursor-move text-gray-400 hover:text-gray-600">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <section.icon className="w-5 h-5 text-primary-600 mr-3" />
                        <h3 className="text-lg font-semibold text-gray-800 flex-1">{section.title}</h3>
                        <button onClick={() => toggleSection(section.id)} className="text-gray-500 hover:text-gray-700">
                          {section.collapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                        </button>
                      </div>
                      {renderSectionContent(section)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

// Section Components
const PersonalInfoSection = ({ data, updateField }) => (
  <div className="p-6 space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputField label="Full Name *" value={data.fullName} onChange={(v) => updateField('personal', 'fullName', v)} placeholder="John Doe" />
      <InputField label="Professional Title" value={data.title} onChange={(v) => updateField('personal', 'title', v)} placeholder="Software Engineer" />
      <InputField label="Email *" type="email" value={data.email} onChange={(v) => updateField('personal', 'email', v)} placeholder="john.doe@email.com" />
      <InputField label="Phone" type="tel" value={data.phone} onChange={(v) => updateField('personal', 'phone', v)} placeholder="+1 (555) 123-4567" />
      <div className="md:col-span-2">
        <InputField label="Location" value={data.location} onChange={(v) => updateField('personal', 'location', v)} placeholder="San Francisco, CA" />
      </div>
    </div>
  </div>
);

const LinksSection = ({ data, updateField }) => (
  <div className="p-6 space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputField label="Website" type="url" value={data.website} onChange={(v) => updateField('links', 'website', v)} placeholder="https://yourwebsite.com" />
      <InputField label="LinkedIn" type="url" value={data.linkedin} onChange={(v) => updateField('links', 'linkedin', v)} placeholder="https://linkedin.com/in/johndoe" />
      <InputField label="GitHub" type="url" value={data.github} onChange={(v) => updateField('links', 'github', v)} placeholder="https://github.com/johndoe" />
      <InputField label="Portfolio" type="url" value={data.portfolio} onChange={(v) => updateField('links', 'portfolio', v)} placeholder="https://portfolio.com" />
      <InputField label="Twitter" type="url" value={data.twitter} onChange={(v) => updateField('links', 'twitter', v)} placeholder="https://twitter.com/johndoe" />
    </div>
  </div>
);

const SummarySection = ({ data, updateField }) => (
  <div className="p-6 space-y-4">
    <TextAreaField label="Professional Summary" value={data.professionalSummary} 
      onChange={(v) => updateField('summary', 'professionalSummary', v)} rows={4}
      placeholder="A brief overview of your professional background, key skills, and career highlights..." />
    <TextAreaField label="Career Objective" value={data.careerObjective} 
      onChange={(v) => updateField('summary', 'careerObjective', v)} rows={3}
      placeholder="What you're looking to achieve in your next role..." />
  </div>
);

const SkillInput = ({ label, value, setValue, type, data, onAddSkill, onRemoveSkill, colorClasses }) => {
  const inputRef = useRef(null);
  
  const handleChange = useCallback((e) => {
    setValue(e.target.value);
  }, [setValue]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (value && value.trim()) {
        onAddSkill(type, value, setValue);
      }
    }
  }, [value, type, setValue, onAddSkill]);

  const handleAddClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (value && value.trim()) {
      onAddSkill(type, value, setValue);
      // Keep focus on input after adding
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [value, type, setValue, onAddSkill]);

  const handleRemove = useCallback((index, e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemoveSkill(type, index);
  }, [type, onRemoveSkill]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2 mb-3">
        <input 
          ref={inputRef}
          type="text" 
          value={value || ''} 
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="input-field flex-1" 
          placeholder={`e.g., JavaScript, Python...`}
        />
        <button 
          type="button"
          onClick={handleAddClick} 
          className="btn-secondary px-3">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(data[type] || []).map((skill, index) => (
          <span key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${colorClasses.bg} ${colorClasses.text}`}>
            {skill}
            <button 
              type="button"
              onClick={(e) => handleRemove(index, e)} 
              className={`ml-2 ${colorClasses.hover}`}>
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

const SkillsSection = ({ data, updateArrayField }) => {
  const [techSkill, setTechSkill] = useState('');
  const [softSkill, setSoftSkill] = useState('');
  const [interest, setInterest] = useState('');

  const addSkill = useCallback((type, value, setValue) => {
    if (value && value.trim()) {
      const currentArray = data[type] || [];
      updateArrayField('skills', { ...data, [type]: [...currentArray, value.trim()] });
      setValue('');
    }
  }, [data, updateArrayField]);

  const removeSkill = useCallback((type, index) => {
    const currentArray = data[type] || [];
    updateArrayField('skills', { ...data, [type]: currentArray.filter((_, i) => i !== index) });
  }, [data, updateArrayField]);

  return (
    <div className="p-6 space-y-6">
      <SkillInput 
        label="Technical Skills" 
        value={techSkill} 
        setValue={setTechSkill} 
        type="technical"
        data={data}
        onAddSkill={addSkill}
        onRemoveSkill={removeSkill}
        colorClasses={{ bg: 'bg-blue-100', text: 'text-blue-800', hover: 'text-blue-600 hover:text-blue-800' }} 
      />
      <SkillInput 
        label="Soft Skills" 
        value={softSkill} 
        setValue={setSoftSkill} 
        type="soft"
        data={data}
        onAddSkill={addSkill}
        onRemoveSkill={removeSkill}
        colorClasses={{ bg: 'bg-purple-100', text: 'text-purple-800', hover: 'text-purple-600 hover:text-purple-800' }} 
      />
      <SkillInput 
        label="Interests" 
        value={interest} 
        setValue={setInterest} 
        type="interests"
        data={data}
        onAddSkill={addSkill}
        onRemoveSkill={removeSkill}
        colorClasses={{ bg: 'bg-green-100', text: 'text-green-800', hover: 'text-green-600 hover:text-green-800' }} 
      />
    </div>
  );
};

const ProjectsSection = ({ data, addItem, removeItem, updateItem }) => {
  const template = { name: '', description: '', technologies: '', role: '', url: '', startDate: '', endDate: '', highlights: '' };
  
  return (
    <div className="p-6 space-y-4">
      {data.map((project, idx) => (
        <ItemCard key={idx} title={`Project ${idx + 1}`} onRemove={() => removeItem('projects', idx)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Project Name *" value={project.name} onChange={(v) => updateItem('projects', idx, 'name', v)} placeholder="E-commerce Platform" />
            <InputField label="Your Role" value={project.role} onChange={(v) => updateItem('projects', idx, 'role', v)} placeholder="Full Stack Developer" />
            <InputField label="Technologies" value={project.technologies} onChange={(v) => updateItem('projects', idx, 'technologies', v)} placeholder="React, Node.js, MongoDB" />
            <InputField label="Project URL" type="url" value={project.url} onChange={(v) => updateItem('projects', idx, 'url', v)} placeholder="https://project-url.com" />
            <InputField label="Start Date" type="month" value={project.startDate} onChange={(v) => updateItem('projects', idx, 'startDate', v)} />
            <InputField label="End Date" type="month" value={project.endDate} onChange={(v) => updateItem('projects', idx, 'endDate', v)} />
            <div className="md:col-span-2">
              <TextAreaField label="Description" value={project.description} onChange={(v) => updateItem('projects', idx, 'description', v)} rows={2} />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label="Key Highlights" value={project.highlights} onChange={(v) => updateItem('projects', idx, 'highlights', v)} rows={2} />
            </div>
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={() => addItem('projects', template)} label="Add Project" />
    </div>
  );
};

const CertificatesSection = ({ data, addItem, removeItem, updateItem }) => {
  const template = { name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' };
  
  return (
    <div className="p-6 space-y-4">
      {data.map((cert, idx) => (
        <ItemCard key={idx} title={`Certificate ${idx + 1}`} onRemove={() => removeItem('certificates', idx)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Certificate Name *" value={cert.name} onChange={(v) => updateItem('certificates', idx, 'name', v)} />
            <InputField label="Issuing Organization" value={cert.issuer} onChange={(v) => updateItem('certificates', idx, 'issuer', v)} />
            <InputField label="Issue Date" type="month" value={cert.issueDate} onChange={(v) => updateItem('certificates', idx, 'issueDate', v)} />
            <InputField label="Expiry Date" type="month" value={cert.expiryDate} onChange={(v) => updateItem('certificates', idx, 'expiryDate', v)} />
            <InputField label="Credential ID" value={cert.credentialId} onChange={(v) => updateItem('certificates', idx, 'credentialId', v)} />
            <InputField label="Credential URL" type="url" value={cert.credentialUrl} onChange={(v) => updateItem('certificates', idx, 'credentialUrl', v)} />
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={() => addItem('certificates', template)} label="Add Certificate" />
    </div>
  );
};

const EducationSection = ({ data, addItem, removeItem, updateItem }) => {
  const template = { institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '', location: '', achievements: '' };
  
  return (
    <div className="p-6 space-y-4">
      {data.map((edu, idx) => (
        <ItemCard key={idx} title={`Education ${idx + 1}`} onRemove={() => removeItem('education', idx)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Institution *" value={edu.institution} onChange={(v) => updateItem('education', idx, 'institution', v)} />
            <InputField label="Degree" value={edu.degree} onChange={(v) => updateItem('education', idx, 'degree', v)} />
            <InputField label="Field of Study" value={edu.field} onChange={(v) => updateItem('education', idx, 'field', v)} />
            <InputField label="Location" value={edu.location} onChange={(v) => updateItem('education', idx, 'location', v)} />
            <InputField label="Start Date" type="month" value={edu.startDate} onChange={(v) => updateItem('education', idx, 'startDate', v)} />
            <InputField label="End Date" type="month" value={edu.endDate} onChange={(v) => updateItem('education', idx, 'endDate', v)} />
            <InputField label="GPA" value={edu.gpa} onChange={(v) => updateItem('education', idx, 'gpa', v)} placeholder="3.8/4.0" />
            <div className="md:col-span-2">
              <TextAreaField label="Achievements" value={edu.achievements} onChange={(v) => updateItem('education', idx, 'achievements', v)} rows={2} />
            </div>
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={() => addItem('education', template)} label="Add Education" />
    </div>
  );
};

const ExperienceSection = ({ data, addItem, removeItem, updateItem }) => {
  const template = { company: '', position: '', location: '', startDate: '', endDate: '', current: false, responsibilities: '', achievements: '' };
  
  return (
    <div className="p-6 space-y-4">
      {data.map((exp, idx) => (
        <ItemCard key={idx} title={`Experience ${idx + 1}`} onRemove={() => removeItem('experience', idx)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Company *" value={exp.company} onChange={(v) => updateItem('experience', idx, 'company', v)} />
            <InputField label="Position *" value={exp.position} onChange={(v) => updateItem('experience', idx, 'position', v)} />
            <InputField label="Location" value={exp.location} onChange={(v) => updateItem('experience', idx, 'location', v)} />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={exp.current} onChange={(e) => updateItem('experience', idx, 'current', e.target.checked)} 
                className="rounded border-gray-300" />
              <label className="text-sm text-gray-700">Currently working here</label>
            </div>
            <InputField label="Start Date" type="month" value={exp.startDate} onChange={(v) => updateItem('experience', idx, 'startDate', v)} />
            <InputField label="End Date" type="month" value={exp.endDate} onChange={(v) => updateItem('experience', idx, 'endDate', v)} disabled={exp.current} />
            <div className="md:col-span-2">
              <TextAreaField label="Responsibilities" value={exp.responsibilities} onChange={(v) => updateItem('experience', idx, 'responsibilities', v)} rows={3} />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label="Key Achievements" value={exp.achievements} onChange={(v) => updateItem('experience', idx, 'achievements', v)} rows={2} />
            </div>
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={() => addItem('experience', template)} label="Add Experience" />
    </div>
  );
};

const VolunteeringSection = ({ data, addItem, removeItem, updateItem }) => {
  const template = { organization: '', role: '', startDate: '', endDate: '', current: false, description: '', impact: '' };
  
  return (
    <div className="p-6 space-y-4">
      {data.map((vol, idx) => (
        <ItemCard key={idx} title={`Volunteering ${idx + 1}`} onRemove={() => removeItem('volunteering', idx)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Organization *" value={vol.organization} onChange={(v) => updateItem('volunteering', idx, 'organization', v)} />
            <InputField label="Role" value={vol.role} onChange={(v) => updateItem('volunteering', idx, 'role', v)} />
            <InputField label="Start Date" type="month" value={vol.startDate} onChange={(v) => updateItem('volunteering', idx, 'startDate', v)} />
            <InputField label="End Date" type="month" value={vol.endDate} onChange={(v) => updateItem('volunteering', idx, 'endDate', v)} />
            <div className="md:col-span-2">
              <TextAreaField label="Description" value={vol.description} onChange={(v) => updateItem('volunteering', idx, 'description', v)} rows={2} />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label="Impact" value={vol.impact} onChange={(v) => updateItem('volunteering', idx, 'impact', v)} rows={2} />
            </div>
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={() => addItem('volunteering', template)} label="Add Volunteering" />
    </div>
  );
};

const AwardsSection = ({ data, addItem, removeItem, updateItem }) => {
  const template = { title: '', issuer: '', date: '', description: '' };
  
  return (
    <div className="p-6 space-y-4">
      {data.map((award, idx) => (
        <ItemCard key={idx} title={`Award ${idx + 1}`} onRemove={() => removeItem('awards', idx)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Award Title *" value={award.title} onChange={(v) => updateItem('awards', idx, 'title', v)} />
            <InputField label="Issuer" value={award.issuer} onChange={(v) => updateItem('awards', idx, 'issuer', v)} />
            <InputField label="Date" type="month" value={award.date} onChange={(v) => updateItem('awards', idx, 'date', v)} />
            <div className="md:col-span-2">
              <TextAreaField label="Description" value={award.description} onChange={(v) => updateItem('awards', idx, 'description', v)} rows={2} />
            </div>
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={() => addItem('awards', template)} label="Add Award" />
    </div>
  );
};

const LanguagesSection = ({ data, addItem, removeItem, updateItem }) => {
  const template = { name: '', proficiency: '', certification: '' };
  
  return (
    <div className="p-6 space-y-4">
      {data.map((lang, idx) => (
        <ItemCard key={idx} title={`Language ${idx + 1}`} onRemove={() => removeItem('languages', idx)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InputField label="Language *" value={lang.name} onChange={(v) => updateItem('languages', idx, 'name', v)} placeholder="English" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency</label>
              <select value={lang.proficiency} onChange={(e) => updateItem('languages', idx, 'proficiency', e.target.value)} className="input-field">
                <option value="">Select Proficiency</option>
                <option value="native">Native</option>
                <option value="fluent">Fluent</option>
                <option value="advanced">Advanced</option>
                <option value="intermediate">Intermediate</option>
                <option value="beginner">Beginner</option>
              </select>
            </div>
            <InputField label="Certification" value={lang.certification} onChange={(v) => updateItem('languages', idx, 'certification', v)} placeholder="TOEFL, IELTS, etc." />
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={() => addItem('languages', template)} label="Add Language" />
    </div>
  );
};

const PublicationsSection = ({ data, addItem, removeItem, updateItem }) => {
  const template = { title: '', authors: '', publisher: '', date: '', url: '', description: '' };
  
  return (
    <div className="p-6 space-y-4">
      {data.map((pub, idx) => (
        <ItemCard key={idx} title={`Publication ${idx + 1}`} onRemove={() => removeItem('publications', idx)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <InputField label="Title *" value={pub.title} onChange={(v) => updateItem('publications', idx, 'title', v)} />
            </div>
            <InputField label="Authors" value={pub.authors} onChange={(v) => updateItem('publications', idx, 'authors', v)} placeholder="John Doe, Jane Smith" />
            <InputField label="Publisher" value={pub.publisher} onChange={(v) => updateItem('publications', idx, 'publisher', v)} />
            <InputField label="Publication Date" type="month" value={pub.date} onChange={(v) => updateItem('publications', idx, 'date', v)} />
            <InputField label="URL" type="url" value={pub.url} onChange={(v) => updateItem('publications', idx, 'url', v)} />
            <div className="md:col-span-2">
              <TextAreaField label="Description" value={pub.description} onChange={(v) => updateItem('publications', idx, 'description', v)} rows={2} />
            </div>
          </div>
        </ItemCard>
      ))}
      <AddButton onClick={() => addItem('publications', template)} label="Add Publication" />
    </div>
  );
};

// Helper Components
const InputField = ({ label, value, onChange, type = 'text', placeholder = '', disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} 
      className="input-field" placeholder={placeholder} disabled={disabled} />
  </div>
);

const TextAreaField = ({ label, value, onChange, rows = 3, placeholder = '' }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} 
      className="input-field" rows={rows} placeholder={placeholder} />
  </div>
);

const ItemCard = ({ title, onRemove, children }) => (
  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
    <div className="flex justify-between items-center mb-2">
      <h4 className="font-medium text-gray-700">{title}</h4>
      <button onClick={onRemove} className="text-red-600 hover:text-red-800">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
    {children}
  </div>
);

const AddButton = ({ onClick, label }) => (
  <button onClick={onClick} className="btn-secondary inline-flex items-center w-full justify-center">
    <Plus className="w-4 h-4 mr-2" />
    {label}
  </button>
);

export default DraggableResumeBuilder;

