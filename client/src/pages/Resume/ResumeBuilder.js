import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Upload, 
  FileText, 
  Download, 
  Edit3, 
  Eye, 
  Trash2,
  Plus,
  Save,
  AlertCircle,
  CheckCircle,
  Star,
  TrendingUp,
  Target,
  Users,
  FileDown,
  Layout
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { generateResumePDF, validateResumeData } from '../../utils/resumePdfGenerator';
import DraggableResumeBuilder from '../../components/Resume/DraggableResumeBuilder';

const ResumeBuilder = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showDraggableBuilder, setShowDraggableBuilder] = useState(false);
  const [buildStep, setBuildStep] = useState(1);
  const [template, setTemplate] = useState('modern');
  const [builderData, setBuilderData] = useState({
    personal: { name: '', email: '', phone: '', location: '' },
    summary: '',
    skills: '',
    education: [{ institution: '', degree: '', years: '' }],
    projects: [{ title: '', description: '' }],
    internships: [{ title: '', company: '', description: '' }]
  });

  // No-op: feedback rendering uses structured fields from backend schema

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/resume');
      setResumes(response.data.resumes || []);
    } catch (error) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('resume', file);

      const response = await api.post('/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Resume uploaded successfully!');
      setShowUploadModal(false);
      // Refresh list and open the uploaded resume's details immediately
      loadResumes();
      if (response?.data?.resume) {
        setSelectedResume(response.data.resume);
        // Immediately analyze the newly uploaded resume so modal shows real data
        try {
          await api.put(`/resume/${response.data.resume._id}`, { action: 'analyze' });
          const refreshed = await api.get(`/resume/${response.data.resume._id}`);
          const updated = refreshed?.data?.resume;
          setResumes((prev) =>
            Array.isArray(prev)
              ? prev.map((r) => (r._id === response.data.resume._id ? { ...r, ...(updated || {}) } : r))
              : prev
          );
          if (updated) setSelectedResume(updated);
        } catch (e) {
          // no-op toast here; upload already succeeded
        }
        return response.data.resume;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const analyzeResume = async (resumeId) => {
    try {
      setLoading(true);
      await api.put(`/resume/${resumeId}`, { action: 'analyze' });
      // Fetch the updated resume so the open modal/card reflects latest analysis
      const refreshed = await api.get(`/resume/${resumeId}`);
      const updated = refreshed?.data?.resume;
      toast.success('Resume analysis completed!');
      // Update grid list
      setResumes((prev) =>
        Array.isArray(prev)
          ? prev.map((r) => (r._id === resumeId ? { ...r, ...(updated || {}) } : r))
          : prev
      );
      // If this resume is selected in the modal, refresh it there too
      if (selectedResume?._id === resumeId && updated) {
        setSelectedResume(updated);
      }
    } catch (error) {
      toast.error('Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    try {
      await api.delete(`/resume/${resumeId}`);
      toast.success('Resume deleted successfully');
      loadResumes();
      if (selectedResume?._id === resumeId) {
        setSelectedResume(null);
      }
    } catch (error) {
      toast.error('Failed to delete resume');
    }
  };

  const handleDownloadPDF = () => {
    const validation = validateResumeData(builderData);
    if (!validation.valid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    try {
      const fileName = `${builderData.personal.name.replace(/\s+/g, '_')}_Resume.pdf`;
      generateResumePDF(builderData, template, fileName);
      toast.success('Resume PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleDownloadUploadedResumePDF = async (resume) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/resume/${resume._id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download resume');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.originalName || resume.title || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Resume downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resume Builder</h1>
          <p className="text-gray-600">Upload, analyze, and optimize your resumes with AI</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Resume
          </button>
          <button
            onClick={() => { setShowBuildModal(true); setBuildStep(1); }}
            className="btn-secondary inline-flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" />
            Quick Build
          </button>
          <button
            onClick={() => setShowDraggableBuilder(true)}
            className="btn-primary inline-flex items-center"
          >
            <Layout className="w-4 h-4 mr-2" />
            Advanced Builder
          </button>
        </div>
      </div>

      {/* Download Section - Show when resumes exist */}
      {resumes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Download Your Resumes</h3>
                <p className="text-xs text-gray-600">Click the download icon (↓) on any resume card below to download it</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {resumes.length} resume{resumes.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">Upload Resume</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your resume here, or{' '}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                  browse
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500">
                Supports PDF, DOC, DOCX, TXT (max 10MB)
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn-secondary"
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Build Resume Modal */}
      {showBuildModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Build New Resume</h2>
              <button onClick={() => setShowBuildModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {/* Stepper */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-medium text-gray-600">
                {['Profile','Skills','Education','Projects','Internships'].map((label, idx)=>{
                  const stepIdx = idx+1;
                  const active = buildStep === stepIdx;
                  const completed = buildStep > stepIdx;
                  return (
                    <div key={label} className="flex-1 flex items-center">
                      <div className={`flex items-center ${idx!==0 ? 'ml-2' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${completed ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{stepIdx}</div>
                        <span className={`${active ? 'text-blue-700' : 'text-gray-600'}`}>{label}</span>
                      </div>
                      {idx<4 && <div className={`flex-1 mx-2 h-px ${completed ? 'bg-green-300' : 'bg-gray-200'}`}></div>}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">Step {buildStep} of 5</div>
                <div className="flex items-center space-x-2">
                  {['modern','classic','compact'].map(t => (
                    <button key={t} onClick={()=>setTemplate(t)} className={`px-3 py-1 rounded-full text-xs border ${template===t ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Steps */}
            {buildStep === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full Name" value={builderData.personal.name} onChange={(e)=>setBuilderData(d=>({...d,personal:{...d.personal,name:e.target.value}}))} />
                  <input className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" value={builderData.personal.email} onChange={(e)=>setBuilderData(d=>({...d,personal:{...d.personal,email:e.target.value}}))} />
                  <input className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone" value={builderData.personal.phone} onChange={(e)=>setBuilderData(d=>({...d,personal:{...d.personal,phone:e.target.value}}))} />
                  <input className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Location" value={builderData.personal.location} onChange={(e)=>setBuilderData(d=>({...d,personal:{...d.personal,location:e.target.value}}))} />
                </div>
                <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Professional Summary" value={builderData.summary} onChange={(e)=>setBuilderData(d=>({...d,summary:e.target.value}))} />
              </div>
            )}

            {buildStep === 2 && (
              <div className="space-y-3">
                <label className="text-sm text-gray-700">Skills (comma separated)</label>
                <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. JavaScript, React, Node, SQL" value={builderData.skills} onChange={(e)=>setBuilderData(d=>({...d,skills:e.target.value}))} />
              </div>
            )}

            {buildStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Education</div>
                  <button className="btn-secondary text-xs" onClick={()=>setBuilderData(d=>({...d,education:[...d.education,{ institution:'', degree:'', years:'' }]}))}>Add</button>
                </div>
                {builderData.education.map((ed, idx)=>(
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                    <input className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Institution" value={ed.institution} onChange={(e)=>{
                      const arr=[...builderData.education]; arr[idx]={...ed,institution:e.target.value}; setBuilderData(d=>({...d,education:arr}));
                    }} />
                    <input className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Degree" value={ed.degree} onChange={(e)=>{
                      const arr=[...builderData.education]; arr[idx]={...ed,degree:e.target.value}; setBuilderData(d=>({...d,education:arr}));
                    }} />
                    <div className="flex items-center space-x-2">
                      <input className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Years (e.g. 2019-2023)" value={ed.years} onChange={(e)=>{
                      const arr=[...builderData.education]; arr[idx]={...ed,years:e.target.value}; setBuilderData(d=>({...d,education:arr}));
                      }} />
                      {builderData.education.length>1 && (
                        <button className="text-red-600 text-sm" onClick={()=>{
                          const arr=[...builderData.education]; arr.splice(idx,1); setBuilderData(d=>({...d,education:arr}));
                        }}>Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {buildStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Projects</div>
                  <button className="btn-secondary text-xs" onClick={()=>setBuilderData(d=>({...d,projects:[...d.projects,{ title:'', description:'' }]}))}>Add</button>
                </div>
                {builderData.projects.map((pr, idx)=>(
                  <div key={idx} className="space-y-2">
                    <input className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Project Title" value={pr.title} onChange={(e)=>{
                      const arr=[...builderData.projects]; arr[idx]={...pr,title:e.target.value}; setBuilderData(d=>({...d,projects:arr}));
                    }} />
                    <div className="flex items-start space-x-2">
                      <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Description / tech / impact" value={pr.description} onChange={(e)=>{
                      const arr=[...builderData.projects]; arr[idx]={...pr,description:e.target.value}; setBuilderData(d=>({...d,projects:arr}));
                      }} />
                      {builderData.projects.length>1 && (
                        <button className="text-red-600 text-sm" onClick={()=>{
                          const arr=[...builderData.projects]; arr.splice(idx,1); setBuilderData(d=>({...d,projects:arr}));
                        }}>Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {buildStep === 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Internships</div>
                  <button className="btn-secondary text-xs" onClick={()=>setBuilderData(d=>({...d,internships:[...d.internships,{ title:'', company:'', description:'' }]}))}>Add</button>
                </div>
                {builderData.internships.map((inr, idx)=>(
                  <div key={idx} className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Internship Title" value={inr.title} onChange={(e)=>{
                        const arr=[...builderData.internships]; arr[idx]={...inr,title:e.target.value}; setBuilderData(d=>({...d,internships:arr}));
                      }} />
                      <input className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Company" value={inr.company} onChange={(e)=>{
                        const arr=[...builderData.internships]; arr[idx]={...inr,company:e.target.value}; setBuilderData(d=>({...d,internships:arr}));
                      }} />
                    </div>
                    <div className="flex items-start space-x-2">
                      <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Description / contributions / tools" value={inr.description} onChange={(e)=>{
                      const arr=[...builderData.internships]; arr[idx]={...inr,description:e.target.value}; setBuilderData(d=>({...d,internships:arr}));
                      }} />
                      {builderData.internships.length>1 && (
                        <button className="text-red-600 text-sm" onClick={()=>{
                          const arr=[...builderData.internships]; arr.splice(idx,1); setBuilderData(d=>({...d,internships:arr}));
                        }}>Remove</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-6">
              <div>
                <button className="btn-secondary mr-2" onClick={()=>setShowBuildModal(false)}>Cancel</button>
              </div>
              <div className="space-x-2">
                {/* Download PDF Button - Available on all steps */}
                <button
                  className="btn-secondary inline-flex items-center"
                  onClick={handleDownloadPDF}
                  title="Download as PDF"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
                
                {buildStep > 1 && (
                  <button className="btn-secondary" onClick={()=>setBuildStep(s=>Math.max(1, s-1))}>Back</button>
                )}
                {buildStep < 5 && (
                  <button
                    className={`btn-primary ${!canProceed(buildStep, builderData) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!canProceed(buildStep, builderData)}
                    onClick={()=>setBuildStep(s=>Math.min(5, s+1))}
                  >Next</button>
                )}
                {buildStep === 5 && (
                  <button className={`btn-primary ${!canProceed(buildStep, builderData) ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!canProceed(buildStep, builderData)} onClick={async ()=>{
                    // Generate plain text resume
                    const txt = generateResumeText(builderData, template);
                    const blob = new Blob([txt], { type: 'text/plain' });
                    const file = new File([blob], 'generated-resume.txt', { type: 'text/plain' });
                    await handleFileUpload(file);
                    setShowBuildModal(false);
                  }}>Generate & Upload</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading resumes...</p>
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
          <p className="text-gray-600 mb-4">
            Upload your first resume to get started with AI-powered analysis
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary inline-flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div
              key={resume._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 truncate max-w-xs">
                      {resume.file?.originalName || resume.title || 'Resume'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedResume(resume)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteResume(resume._id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Score */}
              {typeof resume.analysis?.overallScore === 'number' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Score</span>
                    <span className={`text-sm font-semibold ${getScoreColor(resume.analysis.overallScore)}`}>
                      {resume.analysis.overallScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(resume.analysis.overallScore)}`}
                      style={{ width: `${resume.analysis.overallScore}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              {resume.analysis && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {resume.analysis.scores?.content || 0}%
                    </div>
                    <div className="text-xs text-gray-500">Content</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {resume.analysis.scores?.structure || 0}%
                    </div>
                    <div className="text-xs text-gray-500">Structure</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                {!resume.analysis ? (
                  <button
                    onClick={() => analyzeResume(resume._id)}
                    className="flex-1 btn-primary text-sm py-2"
                    disabled={loading}
                  >
                    {loading ? 'Analyzing...' : 'Analyze'}
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedResume(resume)}
                    className="flex-1 btn-secondary text-sm py-2"
                  >
                    View Details
                  </button>
                )}
                <button
                  onClick={() => handleDownloadUploadedResumePDF(resume)}
                  className="btn-secondary text-sm py-2 px-3"
                  title="Download"
                  disabled={loading}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Draggable Resume Builder Modal */}
      {showDraggableBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900">Advanced Resume Builder</h2>
              <button
                onClick={() => setShowDraggableBuilder(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <DraggableResumeBuilder
                onSave={async (resumeData) => {
                  // Convert draggable builder data to text format and upload
                  const txt = convertDraggableDataToText(resumeData);
                  const blob = new Blob([txt], { type: 'text/plain' });
                  const file = new File([blob], 'advanced-resume.txt', { type: 'text/plain' });
                  await handleFileUpload(file);
                  setShowDraggableBuilder(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Resume Detail Modal */}
      {selectedResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedResume.file?.originalName || selectedResume.title || 'Resume Details'}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadUploadedResumePDF(selectedResume)}
                    className="btn-secondary inline-flex items-center text-sm"
                    title={`Download ${selectedResume.file?.originalName || selectedResume.title || 'Resume'}`}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setSelectedResume(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {selectedResume.analysis ? (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Overall Analysis</h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBgColor(selectedResume.analysis.overallScore)} ${getScoreColor(selectedResume.analysis.overallScore)}`}>
                        {selectedResume.analysis.overallScore}%
                      </div>
                    </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedResume.analysis.scores?.content || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Content Quality</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedResume.analysis.scores?.structure || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Structure</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedResume.analysis.scores?.impact || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Impact</div>
                      </div>
                    </div>
                  </div>

                  {/* ATS Score */}
                  {selectedResume.analysis.ats && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">ATS Compatibility</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-700">ATS Score</span>
                        <span className={`text-sm font-semibold ${getScoreColor(selectedResume.analysis.ats.score)}`}>
                          {selectedResume.analysis.ats.score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full ${getScoreBgColor(selectedResume.analysis.ats.score)}`}
                          style={{ width: `${selectedResume.analysis.ats.score}%` }}
                        ></div>
                      </div>
                      {typeof selectedResume.analysis.ats.keywordMatchPercent === 'number' && (
                        <p className="text-sm text-gray-600 mb-2">Keyword match: {selectedResume.analysis.ats.keywordMatchPercent}%</p>
                      )}
                      {selectedResume.analysis.ats.reasons && selectedResume.analysis.ats.reasons.length > 0 && (
                        <ul className="list-disc ml-5 text-sm text-gray-700">
                          {selectedResume.analysis.ats.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Feedback: Strengths & Weaknesses */}
                  {(selectedResume.analysis.feedback?.strengths?.length > 0 || selectedResume.analysis.feedback?.weaknesses?.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Strengths */}
                      {selectedResume.analysis.feedback?.strengths?.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Strengths</h3>
                          <div className="space-y-3">
                            {selectedResume.analysis.feedback.strengths.map((s, idx) => (
                              <div key={idx}>
                                {s.category && <div className="text-sm font-medium text-gray-800 mb-1">{s.category}</div>}
                                <ul className="list-disc ml-5 text-gray-700 space-y-1">
                                  {(s.points || []).map((p, pi) => (
                                    <li key={pi}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {selectedResume.analysis.feedback?.weaknesses?.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
                          <div className="space-y-3">
                            {selectedResume.analysis.feedback.weaknesses.map((w, idx) => (
                              <div key={idx}>
                                {w.category && <div className="text-sm font-medium text-gray-800 mb-1">{w.category}</div>}
                                <ul className="list-disc ml-5 text-gray-700 space-y-1">
                                  {(w.points || []).map((p, pi) => (
                                    <li key={pi}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Corrections */}
                  {selectedResume.analysis.corrections && selectedResume.analysis.corrections.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Corrections</h3>
                      <div className="space-y-4">
                        {selectedResume.analysis.corrections.map((c, i) => (
                          <div key={i} className="p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-500 mb-1">{c.section}</div>
                            <div className="text-sm"><span className="font-medium">Before:</span> {c.before}</div>
                            <div className="text-sm"><span className="font-medium">After:</span> {c.after}</div>
                            {c.rationale && <div className="text-sm text-gray-600 mt-1">Why: {c.rationale}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advice */}
                  {selectedResume.analysis.advice && selectedResume.analysis.advice.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Advice</h3>
                      <ul className="list-disc ml-5 text-gray-700 space-y-1">
                        {selectedResume.analysis.advice.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Keywords */}
                  {selectedResume.analysis.keywordAnalysis && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyword Analysis</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Found Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedResume.analysis.keywordAnalysis.found?.map((item, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                                {item.keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Missing Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedResume.analysis.keywordAnalysis.missing?.map((item, index) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded">
                                {item.keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {selectedResume.analysis.feedback?.suggestions?.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Suggestions</h3>
                      <div className="space-y-4">
                        {selectedResume.analysis.feedback.suggestions.map((sugg, idx) => (
                          <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-gray-900">{sugg.category || 'General'}</div>
                              {sugg.priority && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{sugg.priority}</span>}
                            </div>
                            <ul className="list-disc ml-5 text-gray-700 space-y-1">
                              {(sugg.suggestions || []).map((it, ii) => (
                                <li key={ii}>{it}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis yet</h3>
                  <p className="text-gray-600 mb-4">
                    Run AI analysis to get detailed feedback and suggestions
                  </p>
                  <button
                    onClick={() => analyzeResume(selectedResume._id)}
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Resume'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder; 

// Helpers
function convertDraggableDataToText(resumeData) {
  const { sections, data } = resumeData;
  const lines = [];

  sections.forEach(section => {
    if (!section.enabled) return;

    switch (section.id) {
      case 'personal':
        if (data.personal.fullName) lines.push(data.personal.fullName);
        if (data.personal.title) lines.push(data.personal.title);
        const contact = [data.personal.email, data.personal.phone, data.personal.location].filter(Boolean).join(' | ');
        if (contact) lines.push(contact);
        lines.push('');
        break;

      case 'links':
        if (data.links.website || data.links.linkedin || data.links.github || data.links.portfolio || data.links.twitter) {
          lines.push('LINKS');
          if (data.links.website) lines.push(`Website: ${data.links.website}`);
          if (data.links.linkedin) lines.push(`LinkedIn: ${data.links.linkedin}`);
          if (data.links.github) lines.push(`GitHub: ${data.links.github}`);
          if (data.links.portfolio) lines.push(`Portfolio: ${data.links.portfolio}`);
          if (data.links.twitter) lines.push(`Twitter: ${data.links.twitter}`);
          lines.push('');
        }
        break;

      case 'summary':
        if (data.summary.professionalSummary || data.summary.careerObjective) {
          lines.push('PROFESSIONAL SUMMARY');
          if (data.summary.professionalSummary) lines.push(data.summary.professionalSummary);
          if (data.summary.careerObjective) {
            lines.push('');
            lines.push('Career Objective:');
            lines.push(data.summary.careerObjective);
          }
          lines.push('');
        }
        break;

      case 'skills':
        if (data.skills.technical.length || data.skills.soft.length || data.skills.interests.length) {
          lines.push('SKILLS & INTERESTS');
          if (data.skills.technical.length) lines.push(`Technical: ${data.skills.technical.join(', ')}`);
          if (data.skills.soft.length) lines.push(`Soft Skills: ${data.skills.soft.join(', ')}`);
          if (data.skills.interests.length) lines.push(`Interests: ${data.skills.interests.join(', ')}`);
          lines.push('');
        }
        break;

      case 'experience':
        if (data.experience.length) {
          lines.push('WORK EXPERIENCE');
          data.experience.forEach(exp => {
            lines.push(`${exp.position} - ${exp.company}`);
            if (exp.location) lines.push(exp.location);
            const dates = exp.current ? `${exp.startDate} - Present` : `${exp.startDate} - ${exp.endDate}`;
            if (exp.startDate) lines.push(dates);
            if (exp.responsibilities) lines.push(exp.responsibilities);
            if (exp.achievements) lines.push(`Achievements: ${exp.achievements}`);
            lines.push('');
          });
        }
        break;

      case 'education':
        if (data.education.length) {
          lines.push('EDUCATION');
          data.education.forEach(edu => {
            lines.push(`${edu.degree} in ${edu.field}`);
            lines.push(`${edu.institution}, ${edu.location}`);
            if (edu.startDate && edu.endDate) lines.push(`${edu.startDate} - ${edu.endDate}`);
            if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
            if (edu.achievements) lines.push(edu.achievements);
            lines.push('');
          });
        }
        break;

      case 'projects':
        if (data.projects.length) {
          lines.push('PROJECTS');
          data.projects.forEach(proj => {
            lines.push(proj.name);
            if (proj.role) lines.push(`Role: ${proj.role}`);
            if (proj.technologies) lines.push(`Technologies: ${proj.technologies}`);
            if (proj.startDate && proj.endDate) lines.push(`${proj.startDate} - ${proj.endDate}`);
            if (proj.description) lines.push(proj.description);
            if (proj.highlights) lines.push(proj.highlights);
            if (proj.url) lines.push(`Link: ${proj.url}`);
            lines.push('');
          });
        }
        break;

      case 'certificates':
        if (data.certificates.length) {
          lines.push('CERTIFICATIONS');
          data.certificates.forEach(cert => {
            lines.push(cert.name);
            if (cert.issuer) lines.push(`Issued by: ${cert.issuer}`);
            if (cert.issueDate) lines.push(`Issue Date: ${cert.issueDate}`);
            if (cert.expiryDate) lines.push(`Expires: ${cert.expiryDate}`);
            if (cert.credentialId) lines.push(`Credential ID: ${cert.credentialId}`);
            if (cert.credentialUrl) lines.push(`Verify: ${cert.credentialUrl}`);
            lines.push('');
          });
        }
        break;

      case 'volunteering':
        if (data.volunteering.length) {
          lines.push('VOLUNTEERING');
          data.volunteering.forEach(vol => {
            lines.push(`${vol.role} - ${vol.organization}`);
            if (vol.startDate && vol.endDate) lines.push(`${vol.startDate} - ${vol.endDate}`);
            if (vol.description) lines.push(vol.description);
            if (vol.impact) lines.push(`Impact: ${vol.impact}`);
            lines.push('');
          });
        }
        break;

      case 'awards':
        if (data.awards.length) {
          lines.push('AWARDS & ACHIEVEMENTS');
          data.awards.forEach(award => {
            lines.push(award.title);
            if (award.issuer) lines.push(`By: ${award.issuer}`);
            if (award.date) lines.push(`Date: ${award.date}`);
            if (award.description) lines.push(award.description);
            lines.push('');
          });
        }
        break;

      case 'languages':
        if (data.languages.length) {
          lines.push('LANGUAGES');
          data.languages.forEach(lang => {
            const proficiency = lang.proficiency ? ` (${lang.proficiency})` : '';
            const cert = lang.certification ? ` - ${lang.certification}` : '';
            lines.push(`${lang.name}${proficiency}${cert}`);
          });
          lines.push('');
        }
        break;

      case 'publications':
        if (data.publications.length) {
          lines.push('PUBLICATIONS');
          data.publications.forEach(pub => {
            lines.push(pub.title);
            if (pub.authors) lines.push(`Authors: ${pub.authors}`);
            if (pub.publisher) lines.push(`Publisher: ${pub.publisher}`);
            if (pub.date) lines.push(`Date: ${pub.date}`);
            if (pub.description) lines.push(pub.description);
            if (pub.url) lines.push(`Link: ${pub.url}`);
            lines.push('');
          });
        }
        break;
    }
  });

  return lines.join('\n');
}

function generateResumeText(data, template) {
  const lines = [];
  lines.push(data.personal.name);
  lines.push(`${data.personal.email} | ${data.personal.phone} | ${data.personal.location}`);
  lines.push('');
  if (data.summary) {
    lines.push('Summary');
    lines.push(data.summary);
    lines.push('');
  }
  if (data.skills) {
    lines.push('Skills');
    lines.push(data.skills);
    lines.push('');
  }
  if (Array.isArray(data.education) && data.education.length) {
    lines.push('Education');
    data.education.forEach(ed => {
      lines.push(`${ed.degree} - ${ed.institution}`);
      if (ed.years) lines.push(ed.years);
      lines.push('');
    });
  }
  if (Array.isArray(data.projects) && data.projects.length) {
    lines.push('Projects');
    data.projects.forEach(pr => {
      if (pr.title) lines.push(pr.title);
      if (pr.description) lines.push(`- ${pr.description}`);
      lines.push('');
    });
  }
  if (Array.isArray(data.internships) && data.internships.length) {
    lines.push('Internships');
    data.internships.forEach(inr => {
      if (inr.title || inr.company) lines.push(`${inr.title || ''} ${inr.company ? ' - ' + inr.company : ''}`.trim());
      if (inr.description) lines.push(`- ${inr.description}`);
      lines.push('');
    });
  }
  const out = lines.join('\n');
  // simple template tweak (could expand later)
  if (template === 'compact') return out.replace(/\n\n/g, '\n');
  return out;
}

function canProceed(step, data) {
  switch (step) {
    case 1:
      return Boolean(data.personal.name && data.personal.email && data.personal.phone && data.personal.location);
    case 2:
      return Boolean(data.skills && data.skills.trim().length > 0);
    case 3:
      return data.education.every(ed => ed.institution && ed.degree);
    case 4:
      return data.projects.every(pr => pr.title && pr.description);
    case 5:
      return data.internships.every(inr => inr.title && inr.company && inr.description);
    default:
      return true;
  }
}