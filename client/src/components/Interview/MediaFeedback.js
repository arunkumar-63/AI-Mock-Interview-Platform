import React from 'react';
import { 
  Eye, 
  User, 
  Mic, 
  Volume2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  BarChart3,
  MessageSquare
} from 'lucide-react';

const MediaFeedback = ({ evaluation }) => {
  if (!evaluation) return null;

  const { videoAnalysis, audioAnalysis, transcript, multimodalScore } = evaluation;

  // Helper to get color based on score
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

  // Helper to render score bar
  const ScoreBar = ({ label, score, icon: Icon }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
          <span className="text-gray-700">{label}</span>
        </div>
        <span className={`font-semibold ${getScoreColor(score)}`}>
          {score}/100
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${
            score >= 80 ? 'bg-green-500' : 
            score >= 60 ? 'bg-yellow-500' : 
            'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overall Multimodal Score */}
      {multimodalScore !== undefined && (
        <div className={`border rounded-lg p-4 ${getScoreBg(multimodalScore)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className={`w-8 h-8 ${getScoreColor(multimodalScore)}`} />
              <div>
                <h4 className="font-semibold text-gray-900">Overall Performance</h4>
                <p className="text-sm text-gray-600">Combined content and delivery score</p>
              </div>
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(multimodalScore)}`}>
              {multimodalScore}
            </div>
          </div>
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">Transcript</h4>
              <p className="text-sm text-blue-800 italic">&quot;{transcript}&quot;</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Analysis */}
        {videoAnalysis && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              Video Analysis
            </h4>

            <div className="space-y-4">
              {/* Eye Contact */}
              <div>
                <ScoreBar 
                  label="Eye Contact" 
                  score={videoAnalysis.eyeContact?.score || 0} 
                  icon={Eye}
                />
                <p className="text-xs text-gray-600 mt-1">
                  {videoAnalysis.eyeContact?.percentage}% maintained
                </p>
              </div>

              {/* Facial Expressions */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Facial Expressions</h5>
                <ScoreBar 
                  label="Confidence" 
                  score={videoAnalysis.facialExpressions?.confidence || 0} 
                />
                <ScoreBar 
                  label="Engagement" 
                  score={videoAnalysis.facialExpressions?.engagement || 0} 
                />
                <ScoreBar 
                  label="Positivity" 
                  score={videoAnalysis.facialExpressions?.positivity || 0} 
                />
              </div>

              {/* Body Language */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Body Language</h5>
                <ScoreBar 
                  label="Posture" 
                  score={videoAnalysis.bodyLanguage?.posture || 0} 
                  icon={User}
                />
                <ScoreBar 
                  label="Gestures" 
                  score={videoAnalysis.bodyLanguage?.gestures || 0} 
                />
                {videoAnalysis.bodyLanguage?.notes && (
                  <p className="text-xs text-gray-600 mt-1 italic">
                    {videoAnalysis.bodyLanguage.notes}
                  </p>
                )}
              </div>

              {/* Overall Video Score */}
              <div className={`border rounded p-3 ${getScoreBg(videoAnalysis.overall)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Video</span>
                  <span className={`text-xl font-bold ${getScoreColor(videoAnalysis.overall)}`}>
                    {videoAnalysis.overall}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audio Analysis */}
        {audioAnalysis && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Mic className="w-5 h-5 mr-2 text-purple-600" />
              Audio Analysis
            </h4>

            <div className="space-y-4">
              {/* Speech Clarity */}
              <ScoreBar 
                label="Speech Clarity" 
                score={audioAnalysis.speechClarity || 0} 
                icon={Volume2}
              />

              {/* Speaking Pace */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">Speaking Pace</span>
                  </div>
                  <span className={`font-semibold ${
                    audioAnalysis.pace?.rating === 'optimal' ? 'text-green-600' :
                    audioAnalysis.pace?.rating === 'too-fast' ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>
                    {audioAnalysis.pace?.wordsPerMinute} WPM
                  </span>
                </div>
                <div className={`text-xs px-2 py-1 rounded inline-block ${
                  audioAnalysis.pace?.rating === 'optimal' ? 'bg-green-100 text-green-700' :
                  audioAnalysis.pace?.rating === 'too-fast' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {audioAnalysis.pace?.rating?.replace('-', ' ').toUpperCase()}
                </div>
              </div>

              {/* Vocal Tone */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Vocal Tone</h5>
                <ScoreBar label="Confidence" score={audioAnalysis.tone?.confidence || 0} />
                <ScoreBar label="Enthusiasm" score={audioAnalysis.tone?.enthusiasm || 0} />
                <ScoreBar label="Professionalism" score={audioAnalysis.tone?.professionalism || 0} />
              </div>

              {/* Filler Words */}
              {audioAnalysis.fillerWords && (
                <div className={`border rounded p-3 ${
                  audioAnalysis.fillerWords.count <= 3 ? 'bg-green-50 border-green-200' :
                  audioAnalysis.fillerWords.count <= 7 ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Filler Words</span>
                    <span className={`text-lg font-bold ${
                      audioAnalysis.fillerWords.count <= 3 ? 'text-green-600' :
                      audioAnalysis.fillerWords.count <= 7 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {audioAnalysis.fillerWords.count}
                    </span>
                  </div>
                  {audioAnalysis.fillerWords.types?.length > 0 && (
                    <p className="text-xs text-gray-600">
                      Detected: {audioAnalysis.fillerWords.types.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Pauses */}
              {audioAnalysis.pauses && (
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Pauses</span>
                    <span className="text-gray-600">
                      {audioAnalysis.pauses.count} ({audioAnalysis.pauses.averageDuration?.toFixed(1)}s avg)
                    </span>
                  </div>
                  <ScoreBar 
                    label="Appropriateness" 
                    score={audioAnalysis.pauses.appropriateness || 0} 
                  />
                </div>
              )}

              {/* Overall Audio Score */}
              <div className={`border rounded p-3 ${getScoreBg(audioAnalysis.overall)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Audio</span>
                  <span className={`text-xl font-bold ${getScoreColor(audioAnalysis.overall)}`}>
                    {audioAnalysis.overall}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h4 className="font-semibold text-gray-900 mb-4">Content Analysis</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <ScoreBar label="Relevance" score={evaluation.relevance || 0} />
          <ScoreBar label="Clarity" score={evaluation.clarity || 0} />
          <ScoreBar label="Confidence" score={evaluation.confidence || 0} />
        </div>

        {/* Feedback */}
        {evaluation.feedback && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Strengths */}
            {evaluation.feedback.strengths?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Strengths
                </h5>
                <ul className="space-y-1">
                  {evaluation.feedback.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-green-700 flex items-start">
                      <TrendingUp className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {evaluation.feedback.weaknesses?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="font-medium text-red-900 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Areas for Improvement
                </h5>
                <ul className="space-y-1">
                  {evaluation.feedback.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-red-700 flex items-start">
                      <TrendingDown className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {evaluation.feedback?.suggestions?.length > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Suggestions for Improvement</h5>
            <ul className="space-y-1">
              {evaluation.feedback.suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-blue-700 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaFeedback;
