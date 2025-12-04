/**
 * Media Analysis Service
 * Provides analysis for video and audio recordings from interview sessions
 * Analyzes facial expressions, body language, speech patterns, tone, and more
 */

class MediaAnalysisService {
  constructor() {
    // In production, you would integrate with services like:
    // - Google Cloud Video Intelligence API
    // - AWS Rekognition for facial analysis
    // - Azure Cognitive Services
    // - AssemblyAI for speech analysis
    this.mockMode = !process.env.VIDEO_ANALYSIS_API_KEY;
  }

  /**
   * Analyze video recording for non-verbal communication
   * @param {string} videoUrl - URL of the video recording
   * @param {number} duration - Duration of the video in seconds
   * @returns {Object} Video analysis results
   */
  async analyzeVideo(videoUrl, duration = 0) {
    try {
      if (this.mockMode) {
        return this.generateMockVideoAnalysis(duration);
      }

      // TODO: Integrate with actual video analysis API
      // Example: Google Cloud Video Intelligence API
      // const videoAnalysis = await this.videoIntelligenceClient.annotateVideo({
      //   inputUri: videoUrl,
      //   features: ['FACE_DETECTION', 'PERSON_DETECTION']
      // });

      return this.generateMockVideoAnalysis(duration);
    } catch (error) {
      console.error('Video analysis error:', error);
      return this.generateMockVideoAnalysis(duration);
    }
  }

  /**
   * Analyze audio recording for speech patterns and vocal characteristics
   * @param {string} audioUrl - URL of the audio recording
   * @param {string} transcript - Text transcript of the audio
   * @param {number} duration - Duration of the audio in seconds
   * @returns {Object} Audio analysis results
   */
  async analyzeAudio(audioUrl, transcript = '', duration = 0) {
    try {
      if (this.mockMode) {
        return this.generateMockAudioAnalysis(transcript, duration);
      }

      // TODO: Integrate with actual audio analysis API
      // Example: AssemblyAI, Google Cloud Speech-to-Text with sentiment
      // const audioAnalysis = await this.speechClient.analyze({
      //   audioUri: audioUrl,
      //   enableSpeakerDiarization: true,
      //   enableAutomaticPunctuation: true
      // });

      return this.generateMockAudioAnalysis(transcript, duration);
    } catch (error) {
      console.error('Audio analysis error:', error);
      return this.generateMockAudioAnalysis(transcript, duration);
    }
  }

  /**
   * Perform comprehensive multimodal analysis
   * @param {Object} params - Analysis parameters
   * @returns {Object} Combined analysis results
   */
  async analyzeMultimodal({ videoUrl, audioUrl, transcript, textAnswer, duration }) {
    const results = {
      videoAnalysis: null,
      audioAnalysis: null,
      textAnalysis: null,
      combinedScore: 0,
      recommendations: []
    };

    // Analyze video if available
    if (videoUrl) {
      results.videoAnalysis = await this.analyzeVideo(videoUrl, duration);
    }

    // Analyze audio if available
    if (audioUrl || videoUrl) {
      results.audioAnalysis = await this.analyzeAudio(audioUrl || videoUrl, transcript, duration);
    }

    // Calculate combined score
    results.combinedScore = this.calculateCombinedScore(results);
    results.recommendations = this.generateRecommendations(results);

    return results;
  }

  /**
   * Generate mock video analysis for development/testing
   */
  generateMockVideoAnalysis(duration) {
    const baseScore = 60 + Math.random() * 30;
    
    return {
      facialExpressions: {
        confidence: Math.round(baseScore + Math.random() * 15),
        engagement: Math.round(baseScore + Math.random() * 10),
        stress: Math.round(30 + Math.random() * 20),
        positivity: Math.round(baseScore + Math.random() * 20),
        notes: 'Maintained good eye contact and displayed confident expressions'
      },
      eyeContact: {
        score: Math.round(baseScore + Math.random() * 15),
        percentage: Math.round(65 + Math.random() * 25),
        notes: 'Good eye contact maintained throughout most of the response'
      },
      bodyLanguage: {
        posture: Math.round(baseScore + Math.random() * 15),
        gestures: Math.round(baseScore + Math.random() * 10),
        movement: 'Controlled and professional',
        notes: 'Good posture with appropriate hand gestures to emphasize key points'
      },
      overall: Math.round(baseScore)
    };
  }

  /**
   * Generate mock audio analysis for development/testing
   */
  generateMockAudioAnalysis(transcript, duration) {
    const baseScore = 65 + Math.random() * 25;
    const wordCount = transcript ? transcript.split(/\s+/).length : 150;
    const estimatedDuration = duration || 120;
    const wordsPerMinute = Math.round((wordCount / estimatedDuration) * 60);
    
    // Detect filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally'];
    const detectedFillers = [];
    let fillerCount = 0;

    if (transcript) {
      const lowerTranscript = transcript.toLowerCase();
      fillerWords.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lowerTranscript.match(regex);
        if (matches) {
          fillerCount += matches.length;
          if (!detectedFillers.includes(filler)) {
            detectedFillers.push(filler);
          }
        }
      });
    }

    // Determine pace rating
    let paceRating = 'optimal';
    let paceScore = 85;
    if (wordsPerMinute < 120) {
      paceRating = 'too-slow';
      paceScore = 60;
    } else if (wordsPerMinute > 180) {
      paceRating = 'too-fast';
      paceScore = 65;
    }

    return {
      speechClarity: Math.round(baseScore + Math.random() * 10),
      pace: {
        wordsPerMinute,
        rating: paceRating,
        score: paceScore
      },
      tone: {
        confidence: Math.round(baseScore + Math.random() * 15),
        enthusiasm: Math.round(baseScore + Math.random() * 10),
        professionalism: Math.round(baseScore + Math.random() * 12)
      },
      fillerWords: {
        count: fillerCount,
        types: detectedFillers,
        frequency: wordCount > 0 ? Math.round((fillerCount / wordCount) * 100) : 0
      },
      pauses: {
        count: Math.round(estimatedDuration / 20),
        averageDuration: 1.5 + Math.random() * 1,
        appropriateness: Math.round(baseScore + Math.random() * 15)
      },
      volume: {
        average: Math.round(65 + Math.random() * 20),
        consistency: Math.round(baseScore + Math.random() * 15)
      },
      overall: Math.round(baseScore)
    };
  }

  /**
   * Calculate combined score from all analysis components
   */
  calculateCombinedScore(results) {
    let totalScore = 0;
    let componentCount = 0;

    if (results.videoAnalysis) {
      totalScore += results.videoAnalysis.overall;
      componentCount++;
    }

    if (results.audioAnalysis) {
      totalScore += results.audioAnalysis.overall;
      componentCount++;
    }

    return componentCount > 0 ? Math.round(totalScore / componentCount) : 0;
  }

  /**
   * Generate personalized recommendations based on analysis
   */
  generateRecommendations(results) {
    const recommendations = [];

    // Video-based recommendations
    if (results.videoAnalysis) {
      const video = results.videoAnalysis;
      
      if (video.eyeContact.score < 70) {
        recommendations.push({
          category: 'Non-Verbal',
          priority: 'high',
          title: 'Improve Eye Contact',
          suggestion: 'Look directly at the camera more frequently to establish better connection with interviewers.'
        });
      }

      if (video.bodyLanguage.posture < 70) {
        recommendations.push({
          category: 'Non-Verbal',
          priority: 'medium',
          title: 'Improve Posture',
          suggestion: 'Sit up straight and maintain an open, confident posture throughout the interview.'
        });
      }

      if (video.facialExpressions.stress > 60) {
        recommendations.push({
          category: 'Non-Verbal',
          priority: 'medium',
          title: 'Manage Stress Indicators',
          suggestion: 'Practice relaxation techniques before interviews to appear more calm and confident.'
        });
      }
    }

    // Audio-based recommendations
    if (results.audioAnalysis) {
      const audio = results.audioAnalysis;

      if (audio.pace.rating === 'too-fast') {
        recommendations.push({
          category: 'Speech',
          priority: 'high',
          title: 'Slow Down Your Speech',
          suggestion: `You're speaking at ${audio.pace.wordsPerMinute} WPM. Aim for 130-160 WPM for better clarity.`
        });
      }

      if (audio.pace.rating === 'too-slow') {
        recommendations.push({
          category: 'Speech',
          priority: 'medium',
          title: 'Increase Speech Pace',
          suggestion: `You're speaking at ${audio.pace.wordsPerMinute} WPM. Try to speak a bit faster to maintain engagement.`
        });
      }

      if (audio.fillerWords.count > 5) {
        recommendations.push({
          category: 'Speech',
          priority: 'high',
          title: 'Reduce Filler Words',
          suggestion: `You used ${audio.fillerWords.count} filler words (${audio.fillerWords.types.join(', ')}). Practice pausing instead.`
        });
      }

      if (audio.tone.confidence < 70) {
        recommendations.push({
          category: 'Speech',
          priority: 'medium',
          title: 'Speak with More Confidence',
          suggestion: 'Use a stronger, more assertive tone. Practice your answers to build confidence.'
        });
      }

      if (audio.speechClarity < 70) {
        recommendations.push({
          category: 'Speech',
          priority: 'high',
          title: 'Improve Speech Clarity',
          suggestion: 'Enunciate more clearly and avoid mumbling. Consider practicing pronunciation exercises.'
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate comprehensive feedback summary
   */
  generateFeedbackSummary(multimodalAnalysis) {
    const summary = {
      strengths: [],
      weaknesses: [],
      keyMetrics: {}
    };

    if (multimodalAnalysis.videoAnalysis) {
      const video = multimodalAnalysis.videoAnalysis;
      
      // Strengths
      if (video.eyeContact.score >= 75) {
        summary.strengths.push('Strong eye contact maintained throughout');
      }
      if (video.bodyLanguage.posture >= 75) {
        summary.strengths.push('Professional posture and body language');
      }
      if (video.facialExpressions.engagement >= 75) {
        summary.strengths.push('High level of engagement and attentiveness');
      }

      // Weaknesses
      if (video.eyeContact.score < 60) {
        summary.weaknesses.push('Limited eye contact with camera');
      }
      if (video.facialExpressions.stress > 70) {
        summary.weaknesses.push('Visible signs of stress or nervousness');
      }

      summary.keyMetrics.eyeContact = video.eyeContact.score;
      summary.keyMetrics.bodyLanguage = video.bodyLanguage.posture;
    }

    if (multimodalAnalysis.audioAnalysis) {
      const audio = multimodalAnalysis.audioAnalysis;

      // Strengths
      if (audio.pace.rating === 'optimal') {
        summary.strengths.push('Excellent speech pace and rhythm');
      }
      if (audio.fillerWords.count <= 3) {
        summary.strengths.push('Minimal use of filler words');
      }
      if (audio.tone.professionalism >= 75) {
        summary.strengths.push('Professional and confident tone');
      }

      // Weaknesses
      if (audio.fillerWords.count > 8) {
        summary.weaknesses.push('Excessive use of filler words');
      }
      if (audio.pace.rating !== 'optimal') {
        summary.weaknesses.push(`Speech pace is ${audio.pace.rating}`);
      }
      if (audio.speechClarity < 60) {
        summary.weaknesses.push('Speech clarity needs improvement');
      }

      summary.keyMetrics.speechClarity = audio.speechClarity;
      summary.keyMetrics.pace = audio.pace.score;
      summary.keyMetrics.fillerWords = audio.fillerWords.count;
    }

    return summary;
  }
}

module.exports = new MediaAnalysisService();
