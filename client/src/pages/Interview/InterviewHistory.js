import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatSubjectName } from '../../utils/subjectUtils';
import { 
  Users, 
  Clock, 
  Target, 
  Eye, 
  Trash2,
  Calendar,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  Download,
  Play,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const InterviewHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/interview');
      setInterviews(response.data.interviews || []);
    } catch (error) {
      toast.error('Failed to load interview history');
    } finally {
      setLoading(false);
    }
  };

  const deleteInterview = async (interviewId) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;

    try {
      await api.delete(`/interview/${interviewId}`);
      toast.success('Interview deleted successfully');
      loadInterviews();
    } catch (error) {
      toast.error('Failed to delete interview');
    }
  };

  const continueInterview = async (interviewId) => {
    try {
      // Navigate to the session page - InterviewContext will load the paused state
      navigate(`/interview/session/${interviewId}`);
    } catch (error) {
      console.error('Continue interview error:', error);
      toast.error('Failed to continue interview');
    }
  };

  const retakeInterview = async (interviewId) => {
    if (!window.confirm('This will create a new interview with the same settings but different questions. Continue?')) return;

    try {
      const loadingToast = toast.loading('Creating new interview...');
      const response = await api.post(`/interview/${interviewId}/retake`);
      toast.dismiss(loadingToast);
      toast.success('New interview created! Redirecting...');
      // Navigate to the new interview session
      setTimeout(() => {
        navigate(`/interview/session/${response.data.interview._id}`);
      }, 500);
    } catch (error) {
      console.error('Retake interview error:', error);
      const message = error.response?.data?.message || 'Failed to create new interview';
      toast.error(message);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAverageScore = (interviews) => {
    // Only consider completed interviews with valid scores
    const completedInterviewsWithScores = interviews.filter(
      i => i.status === 'completed' && typeof i.overallScore === 'number' && i.overallScore >= 0
    );
    
    if (completedInterviewsWithScores.length === 0) return 0;
    
    const totalScore = completedInterviewsWithScores.reduce(
      (sum, i) => sum + i.overallScore, 0
    );
    
    return Math.round(totalScore / completedInterviewsWithScores.length);
  };

  const calculateBestScore = (interviews) => {
    // Only consider completed interviews with valid scores
    const completedInterviewsWithScores = interviews.filter(
      i => i.status === 'completed' && typeof i.overallScore === 'number' && i.overallScore >= 0
    );
    
    if (completedInterviewsWithScores.length === 0) return 0;
    
    return Math.max(...completedInterviewsWithScores.map(i => i.overallScore));
  };

  const calculateInterviewBestScore = (interview) => {
    if (!interview.answers || interview.answers.length === 0) return 0;
    
    const validScores = interview.answers
      .map(a => a.evaluation?.score)
      .filter(score => typeof score === 'number' && score >= 0);
    
    if (validScores.length === 0) return 0;
    
    return Math.max(...validScores);
  };

  const calculateInterviewAverageScore = (interview) => {
    if (!interview.answers || interview.answers.length === 0) return 0;
    
    const validScores = interview.answers
      .map(a => a.evaluation?.score)
      .filter(score => typeof score === 'number' && score >= 0);
    
    if (validScores.length === 0) return 0;
    
    const totalScore = validScores.reduce((sum, score) => sum + score, 0);
    return Math.round(totalScore / validScores.length);
  };

  const filteredInterviews = interviews
    .filter(interview => {
      const matchesSearch = interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || interview.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'score':
          return (b.overallScore || 0) - (a.overallScore || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const interviewTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'technical', name: 'Technical' },
    { id: 'behavioral', name: 'Behavioral' },
    { id: 'case', name: 'Case Study' },
    { id: 'general', name: 'General' }
  ];

  const sortOptions = [
    { id: 'date', name: 'Date' },
    { id: 'score', name: 'Score' },
    { id: 'title', name: 'Title' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interview history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview History</h1>
          <p className="text-gray-600">Review your past interview sessions and performance</p>
        </div>
        <Link
          to="/interview/create"
          className="btn-primary inline-flex items-center"
        >
          <Users className="w-4 h-4 mr-2" />
          New Interview
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search interviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field"
          >
            {interviewTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                Sort by {option.name}
              </option>
            ))}
          </select>
          <button className="btn-secondary inline-flex items-center justify-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Interview List */}
      {filteredInterviews.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start your first interview to see your history here'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <Link
              to="/interview/create"
              className="btn-primary inline-flex items-center"
            >
              <Users className="w-4 h-4 mr-2" />
              Start First Interview
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview) => (
            <div
              key={interview._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {interview.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                      {interview.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>{interview.jobTitle}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span className="capitalize">{interview.type}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">{formatSubjectName(interview.subject)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                    </div>
                    {interview.duration && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{interview.duration} min</span>
                      </div>
                    )}
                  </div>

                  {/* Performance Metrics */}
                  {interview.overallScore && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${getScoreColor(interview.overallScore)}`}>
                          {interview.overallScore}%
                        </div>
                        <div className="text-xs text-gray-500">Overall Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {interview.questions?.length || 0}
                        </div>
                        <div className="text-xs text-gray-500">Questions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {interview.answers?.length || 0}
                        </div>
                        <div className="text-xs text-gray-500">Answered</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {interview.difficulty}
                        </div>
                        <div className="text-xs text-gray-500">Difficulty</div>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {interview.questions && interview.answers && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{interview.answers.length} / {interview.questions.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(interview.answers.length / interview.questions.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {/* Continue button for paused and in-progress interviews */}
                  {(interview.status === 'paused' || interview.status === 'in-progress') && (
                    <button
                      onClick={() => continueInterview(interview._id)}
                      className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg inline-flex items-center text-sm font-medium"
                      title="Continue interview"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Continue
                    </button>
                  )}
                  {/* Retake button for completed interviews */}
                  {interview.status === 'completed' && (
                    <button
                      onClick={() => retakeInterview(interview._id)}
                      className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg inline-flex items-center text-sm font-medium"
                      title="Retake interview"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Retake
                    </button>
                  )}
                  <Link
                    to={`/interview/details/${interview._id}`}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => deleteInterview(interview._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete interview"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              {interview.answers && interview.answers.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">
                          Best Score: {calculateInterviewBestScore(interview)}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          Avg Score: {calculateInterviewAverageScore(interview)}%
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/interview/details/${interview._id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredInterviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {filteredInterviews.length}
              </div>
              <div className="text-sm text-gray-500">Total Interviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {calculateAverageScore(filteredInterviews)}%
              </div>
              <div className="text-sm text-gray-500">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {filteredInterviews.filter(i => i.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {calculateBestScore(filteredInterviews)}%
              </div>
              <div className="text-sm text-gray-500">Best Score</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewHistory; 