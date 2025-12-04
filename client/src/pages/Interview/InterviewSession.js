import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInterview } from '../../contexts/InterviewContext';
import VideoRecorder from '../../components/Interview/VideoRecorder';
import TranscriptionAnalyzer from '../../components/Interview/TranscriptionAnalyzer';
import { formatSubjectName } from '../../utils/subjectUtils';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Mic, 
  MicOff,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ArrowLeft,
  ArrowRight,
  Save,
  Volume2,
  XCircle,
  Video,
  Camera,
  BarChart3,
  Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { uploadFile } from '../../services/api';

const InterviewSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentInterview, 
    currentQuestion, 
    questions, 
    answers, 
    sessionStatus, 
    loading,
    startInterview, 
    submitAnswer, 
    pauseInterview, 
    resumeInterview, 
    endInterview, 
    loadInterview 
  } = useInterview();

  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  // per-question feedback removed; consolidated feedback will be shown after interview completion
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioUploadedUrl, setAudioUploadedUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [useVideoRecorder, setUseVideoRecorder] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [videoStream, setVideoStream] = useState(null);
  const [videoRecorder, setVideoRecorder] = useState(null);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoUploadedUrl, setVideoUploadedUrl] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [speechAnalysis, setSpeechAnalysis] = useState(null);
  const [showTranscription, setShowTranscription] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    console.log('Loading interview with ID:', id);
    if (id) {
      loadInterview(id);
    }
  }, [id]);

  useEffect(() => {
    console.log('Current interview updated:', currentInterview);
    if (currentInterview && sessionStatus === 'active') {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentInterview, sessionStatus]);

  // Sync local isRecording state with actual recording state
  useEffect(() => {
    // This will be triggered when video or audio recording starts/stops
  }, [isRecording, isVideoRecording]);

  // Sync local isPaused state with session status
  useEffect(() => {
    if (sessionStatus === 'paused') {
      setIsPaused(true);
    } else if (sessionStatus === 'active') {
      setIsPaused(false);
    }
  }, [sessionStatus]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setTimeElapsed(prev => prev + 1);
      }
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartInterview = async () => {
    try {
      await startInterview(id);
      toast.success('Interview started!');
    } catch (error) {
      toast.error('Failed to start interview');
    }
  };

  const handleSubmitAnswer = async () => {
    const answerToSubmit = answer.trim() || transcript || '';
    
    if (!answerToSubmit && !audioBlob && !videoBlob) {
      toast.error('Please provide an answer');
      return;
    }

    console.log('Submitting answer:', {
      questionId: currentQuestion?.questionId,
      answer: answerToSubmit,
      audioUrl: audioUploadedUrl,
      videoUrl: videoUploadedUrl
    });

    try {
      const result = await submitAnswer(
        currentQuestion.questionId, 
        answerToSubmit, 
        audioUploadedUrl, 
        videoUploadedUrl
      );
      
      console.log('Submit answer result:', result);
      
      if (result.success) {
        setAnswer('');
        setAudioBlob(null);
        setAudioUrl(null);
        setAudioUploadedUrl(null);
        audioChunksRef.current = [];
        setVideoBlob(null);
        setVideoPreviewUrl(null);
        setVideoUploadedUrl(null);
        setTranscript('');
        setSpeechAnalysis(null);
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      toast.error('Failed to submit answer');
    }
  };

  const handleNextQuestion = () => {
    // simply clear inputs and proceed; InterviewContext will advance currentQuestion
    setShowFeedback(false);
    setCurrentFeedback(null);
    setAnswer('');
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];
    setTranscript('');
    setSpeechAnalysis(null);
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      await resumeInterview();
      setIsPaused(false);
      toast.success('Interview resumed');
    } else {
      await pauseInterview();
      setIsPaused(true);
      toast.success('Interview paused');
    }
  };

  const handleEndInterview = async () => {
    if (window.confirm('Are you sure you want to end this interview?')) {
      try {
        const result = await endInterview();
        if (result.success) {
          toast.success('Interview completed!');
          navigate('/interview/history');
        }
      } catch (error) {
        toast.error('Failed to end interview');
      }
    }
  };

  const handleTranscriptUpdate = (transcriptData) => {
    setTranscript(transcriptData.full);
  };

  const handleAnalysisUpdate = (analysisData) => {
    setSpeechAnalysis(analysisData);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Recording started');
      
      // Start transcription for audio recording
      const transcriptionService = (await import('../../services/transcriptionService')).default;
      await transcriptionService.startTranscription(
        handleTranscriptUpdate,
        handleAnalysisUpdate
      );
    } catch (error) {
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast.success('Recording stopped');
      
      // Stop transcription
      import('../../services/transcriptionService').then(module => {
        const transcriptionService = module.default;
        if (transcriptionService.isRecording()) {
          transcriptionService.stopTranscription();
        }
      });
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;
    try {
      setUploadProgress(0);
      const res = await uploadFile(new File([audioBlob], 'answer.wav', { type: 'audio/wav' }), setUploadProgress);
      setAudioUploadedUrl(res.data.file.url);
      toast.success('Audio uploaded');
    } catch (e) {
      toast.error('Failed to upload audio');
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
        setVideoPreviewUrl(URL.createObjectURL(blob));
      };
      setVideoStream(stream);
      setVideoRecorder(recorder);
      recorder.start();
      setIsVideoRecording(true);
      toast.success('Video recording started');
    } catch (e) {
      toast.error('Failed to start video');
    }
  };

  const stopVideo = () => {
    if (videoRecorder && isVideoRecording) {
      videoRecorder.stop();
      videoStream.getTracks().forEach(t => t.stop());
      setIsVideoRecording(false);
      toast.success('Video recording stopped');
    }
  };

  const uploadVideo = async () => {
    if (!videoBlob) return;
    try {
      setUploadProgress(0);
      const res = await uploadFile(new File([videoBlob], 'answer.webm', { type: 'video/webm' }), setUploadProgress);
      setVideoUploadedUrl(res.data.file.url);
      toast.success('Video uploaded');
    } catch (e) {
      toast.error('Failed to upload video');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (!currentInterview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview not found</h2>
          <p className="text-gray-600 mb-4">The interview you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/interview/create')}
            className="btn-primary"
          >
            Create New Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/interview/history')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentInterview.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {formatSubjectName(currentInterview.subject)} • Question {currentQuestion ? currentQuestion.index + 1 : 0} of {questions.length}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeElapsed)}</span>
              </div>
              <button
                onClick={handlePauseResume}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
              <button
                onClick={handleEndInterview}
                className="btn-danger text-sm"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sessionStatus === 'idle' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start?</h2>
            <p className="text-gray-600 mb-8">
              Your interview is configured and ready to begin. Click the button below to start.
            </p>
            <button
              onClick={handleStartInterview}
              className="btn-primary inline-flex items-center px-8 py-3 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Interview
            </button>
          </div>
        )}

        {(sessionStatus === 'paused' || sessionStatus === 'active') && currentQuestion && (
          <div className="space-y-6">
            {/* Paused Notice */}
            {sessionStatus === 'paused' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Pause className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Interview is paused.</strong> You can continue answering questions - the interview will automatically resume when you submit your answer.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Question */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Question {currentQuestion.index + 1}
                </h2>
                                 <div className="flex items-center space-x-2 text-sm text-gray-500">
                   <span>{currentQuestion.category}</span>
                   <span>•</span>
                   <span>{currentQuestion.difficulty}</span>
                 </div>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer Input */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answer</h3>
              
              {/* Text Input */}
              <div className="mb-4">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={showFeedback}
                />
              </div>

              {/* Video Recording */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Video Response (Recommended)</h4>
                  <button
                    onClick={() => setUseVideoRecorder(!useVideoRecorder)}
                    className={`text-sm px-3 py-1 rounded-lg ${
                      useVideoRecorder 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {useVideoRecorder ? (
                      <>
                        <Camera className="w-4 h-4 inline mr-1" />
                        Camera Enabled
                      </>
                    ) : (
                      'Enable Camera'
                    )}
                  </button>
                </div>

                {useVideoRecorder && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="mb-4">
                      <VideoRecorder
                        onRecordingComplete={(blob, url, duration) => {
                          setVideoBlob(blob);
                          setVideoPreviewUrl(url);
                          setRecordingDuration(duration);
                        }}
                        onUploadComplete={(uploadedUrl) => {
                          setVideoUploadedUrl(uploadedUrl);
                        }}
                        onTranscriptUpdate={handleTranscriptUpdate}
                        onAnalysisUpdate={handleAnalysisUpdate}
                        maxDuration={300}
                        showPreview={true}
                      />
                    </div>
                    {videoBlob && !videoUploadedUrl && (
                      <button 
                        onClick={uploadVideo} 
                        className="btn-secondary mt-3 w-full"
                        disabled={uploadProgress > 0 && uploadProgress < 100}
                      >
                        {uploadProgress > 0 && uploadProgress < 100 ? (
                          <span>Uploading... {uploadProgress}%</span>
                        ) : (
                          'Upload Video Recording'
                        )}
                      </button>
                    )}
                    {videoUploadedUrl && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Video uploaded successfully
                      </div>
                    )}
                    
                    {/* Transcript and Analysis for Video */}
                    {(transcript || speechAnalysis) && (
                      <div className="mt-4">
                        {transcript && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Transcript</h4>
                            <p className="text-gray-800 text-sm">{transcript}</p>
                          </div>
                        )}
                        
                        {speechAnalysis && (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-blue-50 p-2 rounded text-center">
                              <div className="font-medium text-blue-700">Confidence</div>
                              <div className="text-blue-900">{speechAnalysis.confidence}%</div>
                            </div>
                            <div className="bg-purple-50 p-2 rounded text-center">
                              <div className="font-medium text-purple-700">Clarity</div>
                              <div className="text-purple-900">{speechAnalysis.clarity}%</div>
                            </div>
                            <div className="bg-green-50 p-2 rounded text-center">
                              <div className="font-medium text-green-700">Speed</div>
                              <div className="text-green-900">{speechAnalysis.speechRate} WPM</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Audio-Only Recording (Alternative) */}
              {!useVideoRecorder && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700">Audio Response (Alternative)</h4>
              <div className="flex items-center space-x-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${
                    isRecording 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Record Voice
                    </>
                  )}
                </button>
                {audioUrl && (
                  <div className="flex items-center space-x-2">
                    <audio controls src={audioUrl} className="h-8" />
                    {audioUploadedUrl ? (
                      <span className="text-green-600 text-sm">Uploaded</span>
                    ) : (
                      <button onClick={uploadAudio} className="btn-secondary text-sm">Upload Audio</button>
                    )}
                    <button
                      onClick={() => {
                        setAudioUrl(null);
                        setAudioBlob(null);
                        setAudioUploadedUrl(null);
                        audioChunksRef.current = [];
                      }}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
                </div>
              )}

              {/* Real-time Transcription and Analysis */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">Real-time Speech Analysis</h4>
                  <button
                    onClick={() => setShowTranscription(!showTranscription)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    {showTranscription ? 'Hide Analysis' : 'Show Analysis'}
                  </button>
                </div>
                
                {showTranscription && (
                  <TranscriptionAnalyzer
                    onTranscriptUpdate={handleTranscriptUpdate}
                    onAnalysisUpdate={handleAnalysisUpdate}
                    isRecording={isRecording || isVideoRecording}
                    className="mt-2"
                  />
                )}
                
                {speechAnalysis && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <div className="font-medium text-blue-700">Confidence</div>
                      <div className="text-blue-900">{speechAnalysis.confidence}%</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded text-center">
                      <div className="font-medium text-purple-700">Clarity</div>
                      <div className="text-purple-900">{speechAnalysis.clarity}%</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="font-medium text-green-700">Speed</div>
                      <div className="text-green-900">{speechAnalysis.speechRate} WPM</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              {!showFeedback && (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={(!answer.trim() && !audioUploadedUrl && !videoUploadedUrl) || loading}
                  className="btn-primary inline-flex items-center mt-4"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Submit Answer
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Per-question feedback removed by design: consolidated feedback will be shown after interview completion */}
          </div>
        )}

        {sessionStatus === 'completed' && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview Completed!</h2>
            <p className="text-gray-600 mb-8">
              Great job! You've completed your mock interview. Review your performance and feedback.
            </p>
            <div className="max-w-3xl mx-auto text-left">
              {/* Consolidated performance summary */}
              {currentInterview?.performance ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Consolidated Feedback</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Overall Score</div>
                      <div className={`text-3xl font-bold ${currentInterview.performance.overallScore >= 80 ? 'text-green-600' : currentInterview.performance.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {currentInterview.performance.overallScore}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Answered: {currentInterview.performance.metrics.answeredQuestions}/{currentInterview.performance.metrics.totalQuestions}</div>
                      <div>Avg time / question: {currentInterview.performance.metrics.averageTimePerQuestion}s</div>
                      <div>Total time: {currentInterview.performance.metrics.totalTime}s</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">
                        {currentInterview.performance.categoryScores.technical || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Technical</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">
                        {currentInterview.performance.categoryScores.behavioral || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Behavioral</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">
                        {currentInterview.performance.categoryScores.systemDesign || 0}%
                      </div>
                      <div className="text-sm text-gray-600">System Design</div>
                    </div>
                  </div>

                  {/* Strengths / weaknesses summary */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Strengths</h4>
                      <ul className="list-disc list-inside text-green-700">
                        {(currentInterview.performance.strengths || []).slice(0,5).map((s, i) => (
                          <li key={i}>{s.category}: {s.points.join('; ')}</li>
                        ))}
                        {(!currentInterview.performance.strengths || currentInterview.performance.strengths.length === 0) && (
                          <li>No automated strengths detected.</li>
                        )}
                      </ul>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">Areas for Improvement</h4>
                      <ul className="list-disc list-inside text-red-700">
                        {(currentInterview.performance.weaknesses || []).slice(0,5).map((w, i) => (
                          <li key={i}>{w.category}: {w.points.join('; ')}</li>
                        ))}
                        {(!currentInterview.performance.weaknesses || currentInterview.performance.weaknesses.length === 0) && (
                          <li>No automated weaknesses detected.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside text-gray-700">
                      {(currentInterview.performance.recommendations || []).slice(0,5).map((r, i) => (
                        <li key={i}><strong>{r.category} ({r.priority}):</strong> {r.recommendations.join('; ')}</li>
                      ))}
                      {(!currentInterview.performance.recommendations || currentInterview.performance.recommendations.length === 0) && (
                        <li>No automated recommendations available.</li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Company Recommendations */}
                  {currentInterview.performance.companyRecommendations && currentInterview.performance.companyRecommendations.length > 0 && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <Building className="w-5 h-5 mr-2" />
                        Recommended Companies
                      </h4>
                      <p className="text-sm text-blue-700 mb-4">
                        Based on your interview performance and resume, here are companies that would be a good fit for you:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentInterview.performance.companyRecommendations.map((company, index) => (
                          <div key={index} className="bg-white border border-blue-100 rounded-lg p-3 flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{company.name}</h5>
                              <p className="text-sm text-gray-600 mt-1">{company.reason}</p>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {company.matchScore}% match
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-gray-700">No consolidated feedback available yet. It will appear after the interview completes.</p>
                </div>
              )}

              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => navigate('/interview/history')}
                  className="btn-primary"
                >
                  View History
                </button>
                <button
                  onClick={() => navigate('/interview/create')}
                  className="btn-secondary"
                >
                  Start New Interview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewSession; 