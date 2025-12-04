import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp, 
  TrendingDown,
  Eye,
  EyeOff,
  BookOpen,
  Target,
  Lightbulb,
  Award,
  BarChart3
} from 'lucide-react';
import MediaFeedback from './MediaFeedback';
import CompanySuggestions from './CompanySuggestions';

const AnswerFeedback = ({ question, answer, evaluation, showCorrectAnswer = true }) => {
  const [showCorrectAnswerSection, setShowCorrectAnswerSection] = useState(false);

  if (!evaluation) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">No evaluation available for this answer.</p>
      </div>
    );
  }

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

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const correctness = evaluation.correctness || {};
  const improvementAreas = evaluation.improvementAreas || [];
  const hasCorrectAnswer = question?.correctAnswer && question.correctAnswer.length > 0;

  return (
    <div className="space-y-6">
      {/* Overall Scores Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Score */}
        <div className={`border rounded-lg p-4 ${getScoreBg(evaluation.score || 0)}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Overall Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(evaluation.score || 0)}`}>
                {evaluation.score || 0}
              </div>
            </div>
            <Award className={`w-10 h-10 ${getScoreColor(evaluation.score || 0)}`} />
          </div>
        </div>

        {/* Correctness Score */}
        {correctness.correctnessScore !== undefined && (
          <div className={`border rounded-lg p-4 ${getScoreBg(correctness.correctnessScore)}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Correctness</div>
                <div className={`text-3xl font-bold ${getScoreColor(correctness.correctnessScore)}`}>
                  {correctness.correctnessScore}
                </div>
              </div>
              {correctness.isCorrect ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
            </div>
            <div className="mt-2 text-xs">
              {correctness.isCorrect ? (
                <span className="text-green-700 font-medium">✓ Fundamentally Correct</span>
              ) : (
                <span className="text-red-700 font-medium">✗ Needs Improvement</span>
              )}
            </div>
          </div>
        )}

        {/* Multimodal Score */}
        {evaluation.multimodalScore !== undefined && (
          <div className={`border rounded-lg p-4 ${getScoreBg(evaluation.multimodalScore)}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Delivery Score</div>
                <div className={`text-3xl font-bold ${getScoreColor(evaluation.multimodalScore)}`}>
                  {evaluation.multimodalScore}
                </div>
              </div>
              <BarChart3 className={`w-10 h-10 ${getScoreColor(evaluation.multimodalScore)}`} />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Content + Video + Audio
            </div>
          </div>
        )}
      </div>

      {/* Key Points Coverage */}
      {(correctness.keyPointsCovered?.length > 0 || correctness.keyPointsMissed?.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Key Points Analysis
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Points Covered */}
            {correctness.keyPointsCovered?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Points Covered ({correctness.keyPointsCovered.length})
                </h5>
                <ul className="space-y-2">
                  {correctness.keyPointsCovered.map((point, idx) => (
                    <li key={idx} className="text-sm text-green-700 flex items-start">
                      <span className="mr-2 mt-0.5">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Points Missed */}
            {correctness.keyPointsMissed?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="font-medium text-red-900 mb-3 flex items-center">
                  <XCircle className="w-4 h-4 mr-2" />
                  Points Missed ({correctness.keyPointsMissed.length})
                </h5>
                <ul className="space-y-2">
                  {correctness.keyPointsMissed.map((point, idx) => (
                    <li key={idx} className="text-sm text-red-700 flex items-start">
                      <span className="mr-2 mt-0.5">✗</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mistakes Made */}
      {correctness.mistakesMade?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <h4 className="font-semibold text-red-900 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Mistakes Identified
          </h4>
          <ul className="space-y-2">
            {correctness.mistakesMade.map((mistake, idx) => (
              <li key={idx} className="text-sm text-red-700 flex items-start">
                <span className="text-red-500 mr-2">⚠</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement Areas */}
      {improvementAreas.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
            What to Improve
          </h4>
          <div className="space-y-4">
            {improvementAreas.map((area, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{area.area}</h5>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(area.priority)}`}>
                    {area.priority?.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Suggestion:</strong> {area.suggestion}
                </p>
                {area.impact && (
                  <p className="text-sm text-gray-600 italic">
                    <strong>Impact:</strong> {area.impact}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correct Answer Section */}
      {hasCorrectAnswer && (
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-gray-900">Correct Answer</h4>
            <button
              onClick={() => setShowCorrectAnswerSection(!showCorrectAnswerSection)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              {showCorrectAnswerSection ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  Hide Correct Answer
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Show Correct Answer
                </>
              )}
            </button>
          </div>

          {showCorrectAnswerSection && (
            <div className="bg-white border border-blue-200 rounded p-4 mt-3">
              <div className="prose max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap">{question.correctAnswer}</p>
              </div>

              {/* Key Points from Correct Answer */}
              {question.keyPoints?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h5 className="text-sm font-semibold text-blue-900 mb-2">Key Points to Remember:</h5>
                  <ul className="list-disc list-inside space-y-1">
                    {question.keyPoints.map((point, idx) => (
                      <li key={idx} className="text-sm text-blue-800">{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Regular Feedback */}
      {evaluation.feedback && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h4 className="font-semibold text-gray-900 mb-4">General Feedback</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            {evaluation.feedback.strengths?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Strengths
                </h5>
                <ul className="space-y-1">
                  {evaluation.feedback.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-green-700 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {evaluation.feedback.weaknesses?.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h5 className="font-medium text-orange-900 mb-2 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Areas to Work On
                </h5>
                <ul className="space-y-1">
                  {evaluation.feedback.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-orange-700 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {evaluation.feedback.suggestions?.length > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Suggestions</h5>
              <ul className="space-y-1">
                {evaluation.feedback.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-blue-700 flex items-start">
                    <span className="mr-2">→</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Media Analysis (if available) */}
      {(evaluation.videoAnalysis || evaluation.audioAnalysis) && (
        <MediaFeedback evaluation={evaluation} />
      )}

      {/* Company Suggestions */}
      <CompanySuggestions 
        interviewId={evaluation.interviewId}
        skills={evaluation.skills || []}
        score={evaluation.score}
      />
    </div>
  );
};

export default AnswerFeedback;
