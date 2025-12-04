import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatSubjectName } from '../../utils/subjectUtils';
import { 
  ArrowLeft, 
  Building,
  Clock, 
  CheckCircle, 
  Calendar,
  BarChart3,
  Video,
  Mic,
  FileText,
  Download,
  Award,
  Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import AnswerFeedback from '../../components/Interview/AnswerFeedback';

const InterviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(0);

  useEffect(() => {
    loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/interview/${id}`);
      setInterview(response.data.interview);
    } catch (error) {
      toast.error('Failed to load interview details');
      navigate('/interview/history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Interview not found</p>
          <Link to="/interview/history" className="btn-primary mt-4">
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  const currentAnswer = interview.answers?.[selectedQuestion];
  const currentQuestion = interview.questions?.[selectedQuestion];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <button
          onClick={() => navigate('/interview/history')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {interview.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(interview.session?.startTime)}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Duration: {formatDuration(interview.session?.duration || 0)}
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {interview.type}
              </div>
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                {interview.difficulty}
              </div>
              <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {formatSubjectName(interview.subject)}
              </div>
            </div>
          </div>

          <div className={`text-center border rounded-lg p-4 ${getScoreBg(interview.performance?.overallScore || 0)}`}>
            <div className="text-sm text-gray-600 mb-1">Overall Score</div>
            <div className={`text-4xl font-bold ${getScoreColor(interview.performance?.overallScore || 0)}`}>
              {interview.performance?.overallScore || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Performance Summary
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {interview.performance?.metrics?.answeredQuestions || 0}
            </div>
            <div className="text-sm text-gray-600">Questions Answered</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {interview.performance?.metrics?.totalQuestions || 0}
            </div>
            <div className="text-sm text-gray-600">Total Questions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {interview.answers?.filter(a => a.evaluation?.correctness?.isCorrect).length || 0}
            </div>
            <div className="text-sm text-gray-600">Correct Answers</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {interview.performance?.metrics?.averageTimePerQuestion || 0}s
            </div>
            <div className="text-sm text-gray-600">Avg Time/Question</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(interview.performance?.metrics?.totalTime || 0)}
            </div>
            <div className="text-sm text-gray-600">Total Time</div>
          </div>
        </div>

        {/* Category Scores */}
        {interview.performance?.categoryScores && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(interview.performance.categoryScores).map(([category, score]) => (
              score > 0 && (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                    {score}%
                  </span>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Company Recommendations */}
      {interview.performance?.companyRecommendations && interview.performance.companyRecommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Recommended Companies
          </h2>
          <p className="text-gray-600 mb-4">
            Based on your interview performance and resume, here are companies that would be a good fit for you:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interview.performance.companyRecommendations.map((company, index) => (
              <div key={index} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{company.name}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {company.matchScore}% match
                  </span>
                </div>
                <p className="text-sm text-gray-700">{company.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Navigator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Questions & Answers ({interview.answers?.length || 0}/{interview.questions?.length || 0})
        </h2>

        <div className="flex flex-wrap gap-2 mb-6">
          {interview.questions?.map((q, idx) => {
            const hasAnswer = interview.answers?.some(a => a.questionId === q.questionId);
            return (
              <button
                key={idx}
                onClick={() => setSelectedQuestion(idx)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedQuestion === idx
                    ? 'bg-blue-600 text-white'
                    : hasAnswer
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Q{idx + 1}
                {hasAnswer && <CheckCircle className="w-3 h-3 inline ml-1" />}
              </button>
            );
          })}
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-900">
                  Question {selectedQuestion + 1}
                </h3>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {currentQuestion.category}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    {currentQuestion.difficulty}
                  </span>
                </div>
              </div>
              <p className="text-gray-800">{currentQuestion.question}</p>
            </div>

            {/* Answer and Feedback */}
            {currentAnswer ? (
              <div className="space-y-6">
                {/* Answer Content */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Your Answer
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Text Answer */}
                    {currentAnswer.answer && !currentAnswer.answer.match(/^\[(Audio|Video) Recording\]$/) && (
                      <div className="bg-white p-4 rounded border border-gray-200">
                        <p className="text-gray-800 whitespace-pre-wrap">{currentAnswer.answer}</p>
                      </div>
                    )}

                    {/* Media Indicators */}
                    <div className="flex flex-wrap gap-2">
                      {currentAnswer.videoUrl && (
                        <div className="flex items-center px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm">
                          <Video className="w-4 h-4 mr-2" />
                          Video Recording Provided
                        </div>
                      )}
                      {currentAnswer.audioUrl && (
                        <div className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                          <Mic className="w-4 h-4 mr-2" />
                          Audio Recording Provided
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comprehensive Feedback */}
                {currentAnswer.evaluation && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Comprehensive Feedback</h4>
                    <AnswerFeedback 
                      question={currentQuestion}
                      answer={currentAnswer}
                      evaluation={currentAnswer.evaluation}
                      showCorrectAnswer={true}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No answer provided for this question</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/interview/history')}
          className="btn-secondary"
        >
          Back to History
        </button>
        <button className="btn-primary inline-flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>
    </div>
  );
};

export default InterviewDetails;
