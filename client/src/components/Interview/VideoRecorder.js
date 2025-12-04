import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Play, Square, Upload, X, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import transcriptionService from '../../services/transcriptionService';

const VideoRecorder = ({ 
  onRecordingComplete, 
  onUploadComplete,
  onTranscriptUpdate,
  onAnalysisUpdate,
  maxDuration = 300, // 5 minutes default
  showPreview = true 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize transcription service
  useEffect(() => {
    const initTranscription = async () => {
      await transcriptionService.initialize();
    };
    
    initTranscription();
  }, []);

  // Request camera and microphone permissions
  const requestPermissions = async () => {
    try {
      const constraints = {
        video: videoEnabled ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: audioEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Ensure the video element displays the stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Play the video to ensure it's visible
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Auto-play prevented:', playError);
          // This is common in some browsers, but the stream should still be visible
        }
      }

      setHasPermission(true);
      setPermissionError(null);
      toast.success('Camera and microphone access granted');
    } catch (error) {
      console.error('Permission error:', error);
      setPermissionError(error.message);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Camera/microphone access denied. Please allow access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera or microphone found. Please connect a device.');
      } else {
        toast.error('Failed to access camera/microphone: ' + error.message);
      }
    }
  };

  // Ensure video stream is properly attached when stream changes
  useEffect(() => {
    if (streamRef.current && videoRef.current) {
      // Only set the srcObject if it's not already set or if it's a different stream
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }
  }, [streamRef.current]);

  // Additional effect to ensure video plays when stream is available
  useEffect(() => {
    if (hasPermission && streamRef.current && videoRef.current) {
      const videoElement = videoRef.current;
      
      // Ensure the video element displays the stream
      if (videoElement.srcObject !== streamRef.current) {
        videoElement.srcObject = streamRef.current;
      }
      
      // Try to play the video
      const playVideo = async () => {
        try {
          if (videoElement.paused) {
            await videoElement.play();
          }
        } catch (error) {
          console.warn('Could not auto-play video:', error);
        }
      };
      
      playVideo();
    }
  }, [hasPermission]);

  // Handle transcript updates from transcription service
  const handleTranscriptUpdate = (transcriptData) => {
    setTranscript(transcriptData.full);
    if (onTranscriptUpdate) {
      onTranscriptUpdate(transcriptData);
    }
  };

  // Handle analysis updates from transcription service
  const handleAnalysisUpdate = (analysisData) => {
    setAnalysis(analysisData);
    if (onAnalysisUpdate) {
      onAnalysisUpdate(analysisData);
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!streamRef.current) {
      toast.error('Please enable camera/microphone first');
      return;
    }

    try {
      // Clear previous recording
      chunksRef.current = [];
      setRecordedBlob(null);
      setPreviewUrl(null);
      setTranscript('');

      // Create MediaRecorder
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      };

      // Fallback to vp8 if vp9 not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        
        if (onRecordingComplete) {
          onRecordingComplete(blob, url, duration);
        }

        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        // Stop transcription
        if (isRecording) {
          transcriptionService.stopTranscription();
        }

        toast.success('Recording completed successfully');
      };

      // Start recording
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setDuration(0);

      // Start transcription
      await transcriptionService.startTranscription(
        handleTranscriptUpdate,
        handleAnalysisUpdate
      );

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            stopRecording();
            toast.info('Maximum recording duration reached');
          }
          
          return newDuration;
        });
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Failed to start recording: ' + error.message);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop transcription
      transcriptionService.stopTranscription();
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      toast.success('Recording resumed');
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      toast.success('Recording paused');
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRecordedBlob(null);
    setPreviewUrl(null);
    setDuration(0);
    chunksRef.current = [];
    setTranscript('');
    setAnalysis(null);
    toast.success('Recording deleted');
  };

  // Toggle video
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      // Stop transcription if active
      if (transcriptionService.isRecording()) {
        transcriptionService.stopTranscription();
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Permission Request */}
      {!hasPermission && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Camera className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Camera and Microphone Access Required
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                To record your interview responses, we need access to your camera and microphone. 
                Your recordings are only used for interview analysis.
              </p>
              <button
                onClick={requestPermissions}
                className="btn-primary text-sm"
              >
                <Camera className="w-4 h-4 mr-2" />
                Enable Camera & Microphone
              </button>
            </div>
          </div>
          {permissionError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">{permissionError}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Preview / Recording View */}
      {hasPermission && !recordedBlob && (
        <div className="bg-black rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-64 object-contain bg-black"
            onPlay={() => console.log('Video playing')}
            onError={(e) => console.error('Video error:', e)}
          />
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">REC {formatDuration(duration)}</span>
            </div>
          )}

          {/* Max duration indicator */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-xs">
            Max: {formatDuration(maxDuration)}
          </div>

          {/* Transcript overlay */}
          {isRecording && transcript && (
            <div className="absolute bottom-20 left-0 right-0 bg-black bg-opacity-70 text-white p-2 mx-4 rounded">
              <div className="text-xs h-8 overflow-y-auto">
                {transcript}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4"
              >
                <Video className="w-6 h-6" />
              </button>
            ) : (
              <>
                <button
                  onClick={togglePause}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full p-3"
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
                <button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4"
                >
                  <Square className="w-6 h-6" />
                </button>
              </>
            )}

            <button
              onClick={toggleVideo}
              className={`${videoEnabled ? 'bg-gray-700' : 'bg-red-600'} hover:bg-opacity-80 text-white rounded-full p-3`}
            >
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleAudio}
              className={`${audioEnabled ? 'bg-gray-700' : 'bg-red-600'} hover:bg-opacity-80 text-white rounded-full p-3`}
            >
              {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Recorded Video Preview */}
      {recordedBlob && showPreview && (
        <div className="space-y-3">
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              ref={previewVideoRef}
              src={previewUrl}
              controls
              className="w-full h-64 object-contain bg-black"
            />
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Transcript</h4>
              <p className="text-gray-800 text-sm">{transcript}</p>
            </div>
          )}

          {/* Analysis */}
          {analysis && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 p-2 rounded text-center">
                <div className="font-medium text-blue-700">Confidence</div>
                <div className="text-blue-900">{analysis.confidence}%</div>
              </div>
              <div className="bg-purple-50 p-2 rounded text-center">
                <div className="font-medium text-purple-700">Clarity</div>
                <div className="text-purple-900">{analysis.clarity}%</div>
              </div>
              <div className="bg-green-50 p-2 rounded text-center">
                <div className="font-medium text-green-700">Speed</div>
                <div className="text-green-900">{analysis.speechRate} WPM</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded text-center">
                <div className="font-medium text-yellow-700">Filler Words</div>
                <div className="text-yellow-900">{analysis.fillerWords.length}</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Recording completed ({formatDuration(duration)})
              </span>
            </div>
            <button
              onClick={deleteRecording}
              className="text-red-600 hover:text-red-700 p-1"
              title="Delete recording"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;