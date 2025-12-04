import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInterview } from '../../contexts/InterviewContext';
import { 
  Users, 
  Clock, 
  Target, 
  Settings, 
  Play, 
  FileText,
  Building,
  GraduationCap,
  Briefcase,
  Star,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const InterviewCreator = () => {
  const { user } = useAuth();
  const { createInterview } = useInterview();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'technical',
    subject: 'general',
    difficulty: 'intermediate',
    duration: 30,
    questionCount: 10,
    industry: '',
    jobRole: '',
    focusAreas: []
  });
  
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const response = await api.get('/resume');
      setResumes(response.data.resumes || []);
    } catch (error) {
      console.error('Failed to load resumes:', error);
    }
  };

  const interviewTypes = [
    {
      id: 'technical',
      name: 'Technical Interview',
      description: 'Focus on technical skills, coding, and problem-solving',
      icon: Users,
      color: 'blue'
    },
    {
      id: 'behavioral',
      name: 'Behavioral Interview',
      description: 'Focus on past experiences, leadership, and soft skills',
      icon: Target,
      color: 'green'
    },
    {
      id: 'case',
      name: 'Case Study',
      description: 'Focus on analytical thinking and business acumen',
      icon: Building,
      color: 'purple'
    },
    {
      id: 'general',
      name: 'General Interview',
      description: 'Mix of technical, behavioral, and general questions',
      icon: Star,
      color: 'yellow'
    }
  ];

  const difficultyLevels = [
    { id: 'beginner', name: 'Beginner', description: 'Basic questions for beginners' },
    { id: 'intermediate', name: 'Intermediate', description: 'Standard questions for intermediate level' },
    { id: 'advanced', name: 'Advanced', description: 'Advanced questions for experienced professionals' }
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Marketing',
    'Sales',
    'Consulting',
    'Manufacturing',
    'Retail',
    'Other'
  ];

  // Group subjects by category for better organization
  const subjectCategories = [
    {
      name: 'Core Programming',
      subjects: [
        { id: 'general', name: 'General' },
        { id: 'dsa', name: 'Data Structures & Algorithms' },
        { id: 'java', name: 'Java' },
        { id: 'python', name: 'Python' },
        { id: 'javascript', name: 'JavaScript' },
        { id: 'c++', name: 'C++' }
      ]
    },
    {
      name: 'Computer Science Fundamentals',
      subjects: [
        { id: 'system-design', name: 'System Design' },
        { id: 'database', name: 'Database' },
        { id: 'networking', name: 'Networking' },
        { id: 'os', name: 'Operating Systems' }
      ]
    },
    {
      name: 'Emerging Technologies',
      subjects: [
        { id: 'ml', name: 'Machine Learning' },
        { id: 'ai', name: 'Artificial Intelligence' },
        { id: 'data-science', name: 'Data Science' },
        { id: 'blockchain', name: 'Blockchain' }
      ]
    },
    {
      name: 'Engineering Practices',
      subjects: [
        { id: 'devops', name: 'DevOps' },
        { id: 'cloud', name: 'Cloud Computing' },
        { id: 'cybersecurity', name: 'Cybersecurity' },
        { id: 'mobile', name: 'Mobile Development' }
      ]
    },
    {
      name: 'Web Development',
      subjects: [
        { id: 'react', name: 'React' },
        { id: 'node', name: 'Node.js' }
      ]
    }
  ];

  const focusAreas = [
    'Problem Solving',
    'Communication',
    'Leadership',
    'Technical Skills',
    'Teamwork',
    'Adaptability',
    'Innovation',
    'Time Management',
    'Conflict Resolution',
    'Strategic Thinking'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFocusAreaToggle = (area) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter an interview title');
      return;
    }

    if (!formData.jobRole.trim()) {
      toast.error('Please enter a target job role');
      return;
    }

    if (!formData.industry.trim()) {
      toast.error('Please select an industry');
      return;
    }

    try {
      setCreating(true);
      const interviewData = {
        ...formData,
        resumeId: selectedResume?._id,
        userId: user._id,
        settings: {
          duration: formData.duration,
          questionCount: formData.questionCount
        }
      };

      const result = await createInterview(interviewData);
      if (result.success) {
        toast.success('Interview created successfully!');
        console.log('Created interview:', result.interview);
        // Navigate to the interview session page so user can start the interview
        navigate(`/interview/session/${result.interview._id}`);
      }
    } catch (error) {
      toast.error('Failed to create interview');
    } finally {
      setCreating(false);
    }
  };

  // Add this helper function to get subject color
  const getSubjectColorClass = (subjectId) => {
    const colorMap = {
      'general': 'bg-gray-100 text-gray-800',
      'dsa': 'bg-blue-100 text-blue-800',
      'java': 'bg-red-100 text-red-800',
      'python': 'bg-blue-100 text-blue-800',
      'javascript': 'bg-yellow-100 text-yellow-800',
      'c++': 'bg-blue-100 text-blue-800',
      'system-design': 'bg-purple-100 text-purple-800',
      'database': 'bg-green-100 text-green-800',
      'networking': 'bg-indigo-100 text-indigo-800',
      'os': 'bg-pink-100 text-pink-800',
      'ml': 'bg-teal-100 text-teal-800',
      'ai': 'bg-purple-100 text-purple-800',
      'data-science': 'bg-green-100 text-green-800',
      'blockchain': 'bg-indigo-100 text-indigo-800',
      'devops': 'bg-blue-100 text-blue-800',
      'cloud': 'bg-sky-100 text-sky-800',
      'cybersecurity': 'bg-red-100 text-red-800',
      'mobile': 'bg-orange-100 text-orange-800',
      'react': 'bg-blue-100 text-blue-800',
      'node': 'bg-green-100 text-green-800'
    };
    return colorMap[subjectId] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Create Mock Interview</h1>
        <p className="text-gray-600 mt-2">
          Configure your AI-powered interview session with personalized questions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Interview Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Senior Software Engineer Interview"
                required
              />
            </div>
            <div>
              <label htmlFor="jobRole" className="block text-sm font-medium text-gray-700 mb-1">
                Target Job Role
              </label>
              <input
                type="text"
                id="jobRole"
                name="jobRole"
                value={formData.jobRole}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the specific job role you're preparing for (e.g., Frontend Developer, Marketing Manager, etc.)
              </p>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject Focus
              </label>
              <div className="relative">
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="input-field appearance-none bg-white"
                >
                  {subjectCategories.map((category) => (
                    <optgroup key={category.name} label={category.name}>
                      {category.subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSubjectColorClass(formData.subject)}`}>
                  {subjectCategories.flatMap(cat => cat.subjects).find(sub => sub.id === formData.subject)?.name || 'General'}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Select the subject area you want to focus on
              </p>
            </div>
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select the industry relevant to your target job role
              </p>
            </div>
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="input-field"
              >
                {difficultyLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Interview Type */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviewTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.type === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 bg-${type.color}-100 rounded-lg`}>
                      <Icon className={`w-5 h-5 text-${type.color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{type.name}</h3>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interview Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="input-field"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            <div>
              <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions
              </label>
              <select
                id="questionCount"
                name="questionCount"
                value={formData.questionCount}
                onChange={handleChange}
                className="input-field"
              >
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
                <option value={15}>15 questions</option>
                <option value={20}>20 questions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resume Selection */}
        {resumes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resume (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select a resume to help generate more personalized questions
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resumes.map((resume) => (
                <div
                  key={resume._id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedResume?._id === resume._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedResume(resume)}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900 truncate max-w-xs">
                        {resume.file?.originalName || resume.title || 'Resume'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Focus Areas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Focus Areas</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select areas you'd like to focus on during the interview
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {focusAreas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => handleFocusAreaToggle(area)}
                className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                  formData.focusAreas.includes(area)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={creating}
            className="btn-primary inline-flex items-center px-8 py-3 text-lg"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Interview...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Create & Start Interview
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InterviewCreator; 