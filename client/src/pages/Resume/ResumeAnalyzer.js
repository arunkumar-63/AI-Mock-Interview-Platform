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
  Lightbulb,
  BarChart3,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ResumeAnalyzer = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

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
      loadResumes();
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
      setAnalyzing(true);
      await api.put(`/resume/${resumeId}`, { action: 'analyze' });
      const refreshed = await api.get(`/resume/${resumeId}`);
      const updated = refreshed?.data?.resume;
      toast.success('Resume analysis completed!');
      setResumes((prev) =>
        Array.isArray(prev)
          ? prev.map((r) => (r._id === resumeId ? { ...r, ...(updated || {}) } : r))
          : prev
      );
      if (selectedResume?._id === resumeId && updated) {
        setSelectedResume(updated);
      }
    } catch (error) {
      toast.error('Failed to analyze resume');
    } finally {
      setAnalyzing(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Resume Analyzer</h1>
          <p className="text-gray-600">Get AI-powered insights and suggestions for your resume</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary inline-flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Resume
        </button>
      </div>

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
                    title="View analysis"
                  >
                    <Eye className="w-4 h-4" />
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
                      {resume.analysis.categoryScores?.content || 0}%
                    </div>
                    <div className="text-xs text-gray-500">Content</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {resume.analysis.categoryScores?.structure || 0}%
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
                    disabled={analyzing}
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze'}
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedResume(resume)}
                    className="flex-1 btn-secondary text-sm py-2"
                  >
                    View Analysis
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resume Analysis Modal */}
      {selectedResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Resume Analysis - {selectedResume.file?.originalName || selectedResume.title || 'Resume'}
                </h2>
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

            <div className="p-6">
              {selectedResume.analysis ? (
                <div className="space-y-8">
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
                  {/* ATS */}
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
                        </div>
                        <div className="text-sm text-gray-600">Impact</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        Strengths
                      </h3>
                      <div className="space-y-3">
                        {(selectedResume.analysis.feedback?.strengths || []).map((s, index) => (
                          <div key={index}>
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

                    {/* Areas for Improvement */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                        Areas for Improvement
                      </h3>
                      <div className="space-y-3">
                        {(selectedResume.analysis.feedback?.weaknesses || []).map((w, index) => (
                          <div key={index}>
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
                  </div>

                  {/* Keyword Analysis */}
                  {selectedResume.analysis.keywordAnalysis && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Target className="w-5 h-5 text-blue-500 mr-2" />
                        Keyword Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Found Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {(selectedResume.analysis.keywordAnalysis.found || []).map((item, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                                {item.keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Missing Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {(selectedResume.analysis.keywordAnalysis.missing || []).map((item, index) => (
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                        AI Suggestions
                      </h3>
                      <div className="space-y-4">
                        {selectedResume.analysis.feedback.suggestions.map((sugg, idx) => (
                          <div key={idx} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                            <Zap className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="w-full">
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {selectedResume.analysis.suggestions && selectedResume.analysis.suggestions.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                        AI Suggestions
                      </h3>
                      <div className="space-y-4">
                        {selectedResume.analysis.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                            <Zap className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">{suggestion.title}</h4>
                              <p className="text-gray-700">{suggestion.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Industry Match */}
                  {selectedResume.analysis.industryMatch && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 text-purple-500 mr-2" />
                        Industry Match
                      </h3>
                      <div className="space-y-3">
                        {selectedResume.analysis.industryMatch.map((match, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">{match.industry}</span>
                            <span className={`font-semibold ${getScoreColor(match.score)}`}>
                              {match.score}%
                            </span>
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
                    disabled={analyzing}
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze Resume'}
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

export default ResumeAnalyzer; 