import { toast } from 'react-hot-toast';

class TranscriptionService {
  constructor() {
    this.isTranscribing = false;
    this.recognition = null;
    this.audioContext = null;
    this.analyzer = null;
    this.source = null;
    this.transcript = '';
    this.transcriptCallback = null;
    this.analysisCallback = null;
    this.speechAnalysis = {
      fillerWords: [],
      keywords: [],
      speechRate: 0,
      confidence: 0,
      clarity: 0,
      pauseCount: 0
    };
    this.wordCount = 0;
    this.startTime = null;
    this.pauseStartTime = null;
    this.totalPauseTime = 0;
  }

  // Initialize the transcription service
  async initialize() {
    try {
      // Check if Web Speech API is available
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Web Speech API not supported in this browser. Please use Chrome, Edge, or Safari.');
      }
      
      // Create audio context for analysis
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize transcription service:', error);
      toast.error('Transcription service not available: ' + error.message);
      return false;
    }
  }

  // Start real-time transcription
  async startTranscription(callback, analysisCallback) {
    try {
      this.transcriptCallback = callback;
      this.analysisCallback = analysisCallback;
      this.transcript = '';
      this.wordCount = 0;
      this.startTime = Date.now();
      this.totalPauseTime = 0;
      this.isTranscribing = true;

      // Set up speech recognition
      await this.setupSpeechRecognition();
      
      toast.success('Real-time transcription started');
      return true;
    } catch (error) {
      console.error('Failed to start transcription:', error);
      toast.error('Failed to start transcription: ' + error.message);
      this.isTranscribing = false;
      return false;
    }
  }

  // Set up speech recognition
  async setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
    
    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          this.transcript += transcript + ' ';
          this.wordCount += transcript.trim().split(/\s+/).length;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Call the callback with the current transcript
      if (this.transcriptCallback) {
        this.transcriptCallback({
          final: finalTranscript,
          interim: interimTranscript,
          full: this.transcript
        });
      }
      
      // Analyze the transcript
      this.analyzeTranscript(this.transcript);
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      // Don't show toast for no-speech errors as they're common
      if (event.error !== 'no-speech') {
        toast.error('Speech recognition error: ' + event.error);
      }
    };
    
    this.recognition.onend = () => {
      if (this.isTranscribing) {
        // Restart if still transcribing
        try {
          this.recognition.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
        }
      }
    };
    
    this.recognition.onaudiostart = () => {
      // Audio input started
      if (this.pauseStartTime) {
        this.totalPauseTime += Date.now() - this.pauseStartTime;
        this.pauseStartTime = null;
      }
    };
    
    this.recognition.onaudioend = () => {
      // Audio input ended
      this.pauseStartTime = Date.now();
    };
    
    this.recognition.start();
  }

  // Analyze the transcript for insights
  analyzeTranscript(transcript) {
    if (!transcript || !this.analysisCallback) return;
    
    // Count filler words
    const fillerWords = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'so', 'well', 'actually', 'basically', 'literally', 'totally', 'obviously', 'seriously', 'definitely'];
    const fillerWordMatches = [];
    
    fillerWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = transcript.match(regex);
      if (matches) {
        fillerWordMatches.push(...matches);
      }
    });
    
    // Extract keywords (simplified - in a real implementation, you'd use NLP)
    const words = transcript.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'where', 'when', 'why', 'how', 'who', 'whom', 'whose', 'which', 'if', 'then', 'than', 'as', 'not', 'no', 'yes', 'ok', 'okay'];
    const keywords = words.filter(word => word.length > 3 && !commonWords.includes(word) && word !== '');
    
    // Calculate speech rate (words per minute)
    let speechTime = (Date.now() - this.startTime - this.totalPauseTime) / 1000 / 60; // in minutes
    if (speechTime <= 0) speechTime = 0.01; // Avoid division by zero
    const speechRate = Math.round(this.wordCount / speechTime);
    
    // Estimate confidence and clarity (simplified)
    const fillerWordCount = fillerWordMatches.length;
    const confidence = Math.max(0, Math.min(100, 100 - (fillerWordCount * 3)));
    const clarity = Math.max(0, Math.min(100, 100 - (transcript.match(/\.\.\./g) || []).length * 5));
    
    // Count pauses (based on audio end events)
    const pauseCount = this.pauseStartTime ? 
      Math.floor((Date.now() - this.pauseStartTime) / 1000) : 0;
    
    this.speechAnalysis = {
      fillerWords: fillerWordMatches,
      keywords: [...new Set(keywords)].slice(0, 20), // Top 20 unique keywords
      speechRate,
      confidence,
      clarity,
      wordCount: this.wordCount,
      pauseCount
    };
    
    // Call the analysis callback
    this.analysisCallback(this.speechAnalysis);
  }

  // Stop transcription
  stopTranscription() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.analyzer) {
      this.analyzer.disconnect();
      this.analyzer = null;
    }
    
    this.isTranscribing = false;
    this.startTime = null;
    this.pauseStartTime = null;
    this.totalPauseTime = 0;
    toast.success('Transcription stopped');
  }

  // Get current transcript
  getTranscript() {
    return this.transcript;
  }

  // Get speech analysis
  getAnalysis() {
    return this.speechAnalysis;
  }

  // Check if transcription is active
  isRecording() {
    return this.isTranscribing;
  }
}

// Create a singleton instance
const transcriptionService = new TranscriptionService();

export default transcriptionService;