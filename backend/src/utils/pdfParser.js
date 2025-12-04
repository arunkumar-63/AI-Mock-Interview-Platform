const fs = require('fs').promises;
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

/**
 * Parse resume content from various file formats
 * @param {string} filePath - Path to the resume file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<Object>} Parsed resume content
 */
async function parseResumeContent(filePath, mimeType) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    let text = '';
    let structured = {};

    switch (mimeType) {
      case 'application/pdf':
        const pdfData = await pdf(fileBuffer);
        text = pdfData.text;
        structured = extractStructuredData(text);
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        text = docxResult.value;
        structured = extractStructuredData(text);
        break;

      case 'text/plain':
        text = fileBuffer.toString('utf-8');
        structured = extractStructuredData(text);
        break;

      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }

    return {
      text: text.trim(),
      structured
    };
  } catch (error) {
    console.error('Error parsing resume content:', error);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

/**
 * Extract structured data from resume text
 * @param {string} text - Raw resume text
 * @returns {Object} Structured resume data
 */
function extractStructuredData(text) {
  const structured = {
    personalInfo: {},
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: []
  };

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Extract personal information
  structured.personalInfo = extractPersonalInfo(lines);

  // Extract summary
  structured.summary = extractSummary(lines);

  // Extract experience
  structured.experience = extractExperience(lines);

  // Extract education
  structured.education = extractEducation(lines);

  // Extract skills
  structured.skills = extractSkills(lines);

  // Extract projects
  structured.projects = extractProjects(lines);

  // Extract certifications
  structured.certifications = extractCertifications(lines);

  // Extract languages
  structured.languages = extractLanguages(lines);

  return structured;
}

/**
 * Extract personal information from resume text
 * @param {string[]} lines - Resume text lines
 * @returns {Object} Personal information
 */
function extractPersonalInfo(lines) {
  const personalInfo = {};
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/i;
  const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].toLowerCase();

    // Extract email
    if (!personalInfo.email) {
      const emailMatch = lines[i].match(emailRegex);
      if (emailMatch) {
        personalInfo.email = emailMatch[0];
      }
    }

    // Extract phone
    if (!personalInfo.phone) {
      const phoneMatch = lines[i].match(phoneRegex);
      if (phoneMatch) {
        personalInfo.phone = phoneMatch[0];
      }
    }

    // Extract LinkedIn
    if (!personalInfo.linkedin) {
      const linkedinMatch = lines[i].match(linkedinRegex);
      if (linkedinMatch) {
        personalInfo.linkedin = linkedinMatch[0];
      }
    }

    // Extract website
    if (!personalInfo.website) {
      const websiteMatch = lines[i].match(websiteRegex);
      if (websiteMatch && !line.includes('linkedin')) {
        personalInfo.website = websiteMatch[0];
      }
    }

    // Extract name (usually the first line or a line with title-like formatting)
    if (!personalInfo.name && i < 3) {
      const nameMatch = lines[i].match(/^[A-Z][a-z]+ [A-Z][a-z]+/);
      if (nameMatch && !line.includes('@') && !line.includes('phone') && !line.includes('email')) {
        personalInfo.name = nameMatch[0];
      }
    }

    // Extract location
    if (!personalInfo.location) {
      const locationMatch = lines[i].match(/([A-Z][a-z]+(?:[,\s]+[A-Z][a-z]+)*,?\s*[A-Z]{2}\s*\d{5})/);
      if (locationMatch) {
        personalInfo.location = locationMatch[0];
      }
    }
  }

  return personalInfo;
}

/**
 * Extract summary from resume text
 * @param {string[]} lines - Resume text lines
 * @returns {string} Summary text
 */
function extractSummary(lines) {
  const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
  let summary = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    if (summaryKeywords.some(keyword => line.includes(keyword))) {
      // Collect summary text until we hit another section
      let j = i + 1;
      while (j < lines.length && !isSectionHeader(lines[j])) {
        if (lines[j].trim().length > 0) {
          summary += lines[j].trim() + ' ';
        }
        j++;
      }
      break;
    }
  }

  return summary.trim();
}

/**
 * Extract work experience from resume text
 * @param {string[]} lines - Resume text lines
 * @returns {Array} Experience entries
 */
function extractExperience(lines) {
  const experience = [];
  const experienceKeywords = ['experience', 'work history', 'employment', 'career'];
  let inExperienceSection = false;
  let currentExperience = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check if we're entering experience section
    if (!inExperienceSection && experienceKeywords.some(keyword => lowerLine.includes(keyword))) {
      inExperienceSection = true;
      continue;
    }

    if (inExperienceSection) {
      // Check if we've hit another major section
      if (isSectionHeader(line) && !experienceKeywords.some(keyword => lowerLine.includes(keyword))) {
        if (currentExperience) {
          experience.push(currentExperience);
        }
        break;
      }

      // Look for job title patterns
      const jobTitleMatch = line.match(/^([A-Z][A-Za-z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist|Coordinator|Director|Lead|Senior|Junior|Associate))/);
      if (jobTitleMatch && !currentExperience) {
        if (currentExperience) {
          experience.push(currentExperience);
        }
        currentExperience = {
          title: jobTitleMatch[1].trim(),
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          description: [],
          achievements: []
        };
      }

      // Look for company name patterns
      if (currentExperience && !currentExperience.company) {
        const companyMatch = line.match(/^([A-Z][A-Za-z\s&.,]+)/);
        if (companyMatch && !line.includes('@') && !line.includes('phone')) {
          currentExperience.company = companyMatch[1].trim();
        }
      }

      // Look for date patterns
      if (currentExperience && (!currentExperience.startDate || !currentExperience.endDate)) {
        const dateMatch = line.match(/(\w{3}\s+\d{4})\s*[-–—]\s*(\w{3}\s+\d{4}|Present|Current)/i);
        if (dateMatch) {
          currentExperience.startDate = dateMatch[1];
          currentExperience.endDate = dateMatch[2];
          currentExperience.current = dateMatch[2].toLowerCase() === 'present' || dateMatch[2].toLowerCase() === 'current';
        }
      }

      // Collect description/achievements
      if (currentExperience && line.trim().length > 0 && !isSectionHeader(line)) {
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          currentExperience.achievements.push(line.substring(1).trim());
        } else if (line.length > 20) {
          currentExperience.description.push(line.trim());
        }
      }
    }
  }

  if (currentExperience) {
    experience.push(currentExperience);
  }

  return experience;
}

/**
 * Extract education from resume text
 * @param {string[]} lines - Resume text lines
 * @returns {Array} Education entries
 */
function extractEducation(lines) {
  const education = [];
  const educationKeywords = ['education', 'academic', 'degree', 'university', 'college'];
  let inEducationSection = false;
  let currentEducation = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check if we're entering education section
    if (!inEducationSection && educationKeywords.some(keyword => lowerLine.includes(keyword))) {
      inEducationSection = true;
      continue;
    }

    if (inEducationSection) {
      // Check if we've hit another major section
      if (isSectionHeader(line) && !educationKeywords.some(keyword => lowerLine.includes(keyword))) {
        if (currentEducation) {
          education.push(currentEducation);
        }
        break;
      }

      // Look for degree patterns
      const degreeMatch = line.match(/(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|Associate|Diploma)/i);
      if (degreeMatch && !currentEducation) {
        if (currentEducation) {
          education.push(currentEducation);
        }
        currentEducation = {
          degree: line.trim(),
          institution: '',
          location: '',
          startDate: '',
          endDate: '',
          gpa: '',
          relevantCourses: []
        };
      }

      // Look for institution name
      if (currentEducation && !currentEducation.institution) {
        const institutionMatch = line.match(/^([A-Z][A-Za-z\s&.,]+(?:University|College|Institute|School))/i);
        if (institutionMatch) {
          currentEducation.institution = institutionMatch[1].trim();
        }
      }

      // Look for dates
      if (currentEducation && (!currentEducation.startDate || !currentEducation.endDate)) {
        const dateMatch = line.match(/(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/i);
        if (dateMatch) {
          currentEducation.startDate = dateMatch[1];
          currentEducation.endDate = dateMatch[2];
        }
      }

      // Look for GPA
      if (currentEducation && !currentEducation.gpa) {
        const gpaMatch = line.match(/GPA[:\s]*(\d+\.\d+)/i);
        if (gpaMatch) {
          currentEducation.gpa = gpaMatch[1];
        }
      }
    }
  }

  if (currentEducation) {
    education.push(currentEducation);
  }

  return education;
}

/**
 * Extract skills from resume text
 * @param {string[]} lines - Resume text lines
 * @returns {Array} Skills
 */
function extractSkills(lines) {
  const skills = [];
  const skillsKeywords = ['skills', 'technical skills', 'competencies', 'technologies'];
  let inSkillsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check if we're entering skills section
    if (!inSkillsSection && skillsKeywords.some(keyword => lowerLine.includes(keyword))) {
      inSkillsSection = true;
      continue;
    }

    if (inSkillsSection) {
      // Check if we've hit another major section
      if (isSectionHeader(line) && !skillsKeywords.some(keyword => lowerLine.includes(keyword))) {
        break;
      }

      // Extract skills (comma-separated, bullet points, or line breaks)
      if (line.includes(',') || line.includes('•') || line.includes('-')) {
        const skillItems = line.split(/[,•\-]/).map(item => item.trim()).filter(item => item.length > 0);
        skills.push(...skillItems);
      } else if (line.trim().length > 0 && line.length < 50) {
        skills.push(line.trim());
      }
    }
  }

  // Return skills in the correct format for the Resume model
  return [{
    category: 'Technical Skills',
    skills: skills
  }];
}

/**
 * Extract projects from resume text
 * @param {string[]} lines - Resume text lines
 * @returns {Array} Projects
 */
function extractProjects(lines) {
  const projects = [];
  const projectKeywords = ['projects', 'portfolio', 'applications'];
  let inProjectSection = false;
  let currentProject = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check if we're entering projects section
    if (!inProjectSection && projectKeywords.some(keyword => lowerLine.includes(keyword))) {
      inProjectSection = true;
      continue;
    }

    if (inProjectSection) {
      // Check if we've hit another major section
      if (isSectionHeader(line) && !projectKeywords.some(keyword => lowerLine.includes(keyword))) {
        if (currentProject) {
          projects.push(currentProject);
        }
        break;
      }

      // Look for project title patterns
      const projectMatch = line.match(/^([A-Z][A-Za-z\s]+)/);
      if (projectMatch && !currentProject) {
        if (currentProject) {
          projects.push(currentProject);
        }
        currentProject = {
          title: projectMatch[1].trim(),
          description: '',
          technologies: [],
          link: '',
          startDate: '',
          endDate: ''
        };
      }

      // Collect project description
      if (currentProject && line.trim().length > 0 && !isSectionHeader(line)) {
        if (!currentProject.description) {
          currentProject.description = line.trim();
        } else {
          currentProject.description += ' ' + line.trim();
        }
      }
    }
  }

  if (currentProject) {
    projects.push(currentProject);
  }

  return projects;
}

/**
 * Extract certifications from resume text
 * @param {string[]} lines - Resume text lines
 * @returns {Array} Certifications
 */
function extractCertifications(lines) {
  const certifications = [];
  const certKeywords = ['certifications', 'certificates', 'licenses'];
  let inCertSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check if we're entering certifications section
    if (!inCertSection && certKeywords.some(keyword => lowerLine.includes(keyword))) {
      inCertSection = true;
      continue;
    }

    if (inCertSection) {
      // Check if we've hit another major section
      if (isSectionHeader(line) && !certKeywords.some(keyword => lowerLine.includes(keyword))) {
        break;
      }

      // Look for certification patterns
      if (line.trim().length > 0 && !isSectionHeader(line)) {
        const certMatch = line.match(/^([A-Z][A-Za-z\s]+(?:Certification|Certificate|License))/i);
        if (certMatch) {
          certifications.push({
            name: certMatch[1].trim(),
            issuer: '',
            date: '',
            expiryDate: ''
          });
        }
      }
    }
  }

  return certifications;
}

/**
 * Extract languages from resume text
 * @param {string[]} lines - Resume text lines
 * @returns {Array} Languages
 */
function extractLanguages(lines) {
  const languages = [];
  const languageKeywords = ['languages', 'language skills'];
  let inLanguageSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check if we're entering languages section
    if (!inLanguageSection && languageKeywords.some(keyword => lowerLine.includes(keyword))) {
      inLanguageSection = true;
      continue;
    }

    if (inLanguageSection) {
      // Check if we've hit another major section
      if (isSectionHeader(line) && !languageKeywords.some(keyword => lowerLine.includes(keyword))) {
        break;
      }

      // Look for language patterns
      if (line.trim().length > 0 && !isSectionHeader(line)) {
        const languageMatch = line.match(/^([A-Z][a-z]+)\s*[:\-]?\s*(Native|Fluent|Advanced|Intermediate|Basic)/i);
        if (languageMatch) {
          languages.push({
            language: languageMatch[1].trim(),
            proficiency: languageMatch[2].trim()
          });
        }
      }
    }
  }

  return languages;
}

/**
 * Check if a line is a section header
 * @param {string} line - Line to check
 * @returns {boolean} True if line is a section header
 */
function isSectionHeader(line) {
  const sectionKeywords = [
    'experience', 'education', 'skills', 'projects', 'certifications',
    'languages', 'summary', 'objective', 'profile', 'about', 'contact',
    'references', 'awards', 'publications', 'volunteer'
  ];

  const lowerLine = line.toLowerCase().trim();
  return sectionKeywords.some(keyword => lowerLine.includes(keyword)) && 
         (line.length < 50 || line.match(/^[A-Z\s]+$/));
}

module.exports = {
  parseResumeContent,
  extractStructuredData
}; 