import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertTriangle, CheckCircle, TrendingUp, Timer } from 'lucide-react';
import transcriptionService from '../../services/transcriptionService';

const TranscriptionAnalyzer = ({ 
  onTranscriptUpdate, 
  onAnalysisUpdate,
  isRecording = false,
  className = ''
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState({
    fillerWords: [],
    keywords: [],
    speechRate: 0,
    confidence: 0,
    clarity: 0,
    wordCount: 0,
    pauseCount: 0
  });
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const transcriptEndRef = useRef(null);

  // Initialize the transcription service
  useEffect(() => {
    const initService = async () => {
      try {
        const initialized = await transcriptionService.initialize();
        setIsInitialized(initialized);
        if (!initialized) {
          setError('Transcription service not available in this browser. Please use Chrome, Edge, or Safari.');
        }
      } catch (err) {
        setError('Failed to initialize transcription service');
        console.error('Initialization error:', err);
      }
    };

    initService();
  }, []);

  // Start/stop transcription based on recording state
  useEffect(() => {
    if (isInitialized) {
      if (isRecording && !isTranscribing) {
        startTranscription();
      } else if (!isRecording && isTranscribing) {
        stopTranscription();
      }
    }

    return () => {
      if (isTranscribing) {
        stopTranscription();
      }
    };
  }, [isRecording, isInitialized]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  const startTranscription = async () => {
    try {
      const success = await transcriptionService.startTranscription(
        handleTranscriptUpdate,
        handleAnalysisUpdate
      );
      
      if (success) {
        setIsTranscribing(true);
        setError(null);
      }
    } catch (err) {
      setError('Failed to start transcription');
      console.error('Start transcription error:', err);
    }
  };

  const stopTranscription = () => {
    transcriptionService.stopTranscription();
    setIsTranscribing(false);
  };

  const handleTranscriptUpdate = (transcriptData) => {
    setTranscript(transcriptData.full);
    
    if (onTranscriptUpdate) {
      onTranscriptUpdate(transcriptData);
    }
  };

  const handleAnalysisUpdate = (analysisData) => {
    setAnalysis(analysisData);
    
    if (onAnalysisUpdate) {
      onAnalysisUpdate(analysisData);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getClarityColor = (clarity) => {
    if (clarity >= 80) return 'text-green-600';
    if (clarity >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSpeechRateColor = (rate) => {
    if (rate >= 150 && rate <= 180) return 'text-green-600'; // Ideal range
    if (rate >= 120 && rate <= 200) return 'text-yellow-600'; // Acceptable range
    return 'text-red-600';
  };

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Transcription Unavailable</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
          <span className="ml-2 text-gray-600">Initializing transcription service...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {isTranscribing ? (
            <div className="flex items-center space-x-2 text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Live Transcription</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500">
              <MicOff className="w-5 h-5" />
              <span className="font-medium">Transcription Paused</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Volume2 className="w-4 h-4" />
            <span>{analysis.wordCount} words</span>
          </div>
          <div className="flex items-center space-x-1">
            <Timer className="w-4 h-4" />
            <span>{analysis.pauseCount} pauses</span>
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Real-time Transcript</h3>
        <div className="bg-gray-50 rounded-lg p-3 h-32 overflow-y-auto">
          {transcript ? (
            <p className="text-gray-800 text-sm leading-relaxed">
              {transcript}
              <span ref={transcriptEndRef} className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1"></span>
            </p>
          ) : (
            <p className="text-gray-500 text-sm italic">
              {isTranscribing 
                ? 'Listening... Speak now to see real-time transcription' 
                : 'Transcript will appear here when recording starts'}
            </p>
          )}
        </div>
      </div>

      {/* Analysis */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Communication Analysis</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Confidence */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-700">Confidence</span>
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </div>
            <div className={`text-lg font-bold ${getConfidenceColor(analysis.confidence)}`}>
              {analysis.confidence}%
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Based on clarity and filler words
            </div>
          </div>

          {/* Clarity */}
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-purple-700">Clarity</span>
              <Volume2 className="w-4 h-4 text-purple-500" />
            </div>
            <div className={`text-lg font-bold ${getClarityColor(analysis.clarity)}`}>
              {analysis.clarity}%
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Speech clearness score
            </div>
          </div>

          {/* Speech Rate */}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-green-700">Speech Rate</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className={`text-lg font-bold ${getSpeechRateColor(analysis.speechRate)}`}>
              {analysis.speechRate} WPM
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Words per minute
            </div>
          </div>

          {/* Filler Words */}
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-yellow-700">Filler Words</span>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-lg font-bold text-yellow-700">
              {analysis.fillerWords.length}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {analysis.fillerWords.length > 0 
                ? analysis.fillerWords.slice(0, 3).join(', ') 
                : 'None detected'}
            </div>
          </div>
        </div>

        {/* Keywords */}
        {analysis.keywords.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Key Terms Detected</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.slice(0, 12).map((keyword, index) => (
                <span 
                  key={index} 
                  className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <h4 className="text-xs font-medium text-blue-700 mb-1">Communication Tips</h4>
          <ul className="text-xs text-blue-600 list-disc list-inside space-y-1">
            {analysis.confidence < 70 && (
              <li>Avoid filler words like "um" and "uh" to increase confidence score</li>
            )}
            {analysis.speechRate < 120 && (
              <li>Try to speak a bit faster to improve your speech rate</li>
            )}
            {analysis.speechRate > 200 && (
              <li>Slow down slightly to ensure clarity in your responses</li>
            )}
            {analysis.clarity < 70 && (
              <li>Speak clearly and enunciate your words for better clarity</li>
            )}
            <li>Take natural pauses between thoughts instead of using filler words</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionAnalyzer;