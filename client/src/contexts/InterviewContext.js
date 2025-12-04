import React, { createContext, useContext, useReducer } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const InterviewContext = createContext();

const initialState = {
  currentInterview: null,
  currentQuestion: null,
  questions: [],
  answers: [],
  sessionStatus: 'idle', // idle, loading, active, paused, completed
  loading: false,
  error: null,
  progress: {
    currentQuestionIndex: 0,
    totalQuestions: 0,
    completedQuestions: 0,
    timeElapsed: 0
  }
};

const interviewReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'SET_INTERVIEW':
      return {
        ...state,
        currentInterview: action.payload,
        questions: action.payload.questions || [],
        answers: action.payload.answers || [],
        progress: {
          currentQuestionIndex: 0,
          totalQuestions: action.payload.questions?.length || 0,
          completedQuestions: action.payload.answers?.length || 0,
          timeElapsed: 0
        }
      };
    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: action.payload,
        progress: {
          ...state.progress,
          totalQuestions: action.payload.length
        }
      };
    case 'SET_CURRENT_QUESTION':
      return {
        ...state,
        currentQuestion: action.payload,
        progress: {
          ...state.progress,
          currentQuestionIndex: action.payload.index
        }
      };
    case 'ADD_ANSWER':
      return {
        ...state,
        answers: [...state.answers, action.payload],
        progress: {
          ...state.progress,
          completedQuestions: state.answers.length + 1
        }
      };
    case 'UPDATE_ANSWER':
      return {
        ...state,
        answers: state.answers.map(answer => 
          answer.questionId === action.payload.questionId 
            ? { ...answer, ...action.payload }
            : answer
        )
      };
    case 'SET_SESSION_STATUS':
      return {
        ...state,
        sessionStatus: action.payload
      };
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: {
          ...state.progress,
          ...action.payload
        }
      };
    case 'RESET_INTERVIEW':
      return {
        ...initialState
      };
    default:
      return state;
  }
};

export const InterviewProvider = ({ children }) => {
  const [state, dispatch] = useReducer(interviewReducer, initialState);

  // Create new interview
  const createInterview = async (interviewData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.post('/interview', interviewData);
      dispatch({ type: 'SET_INTERVIEW', payload: response.data.interview });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Interview created successfully!');
      return { success: true, interview: response.data.interview };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create interview';
      dispatch({ type: 'SET_ERROR', payload: message });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Start interview session
  const startInterview = async (interviewId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.post(`/interview/${interviewId}/start`);
      dispatch({ type: 'SET_INTERVIEW', payload: response.data.interview });
      dispatch({ type: 'SET_SESSION_STATUS', payload: 'active' });
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: { 
        ...response.data.interview.questions[0], 
        index: 0 
      }});
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Interview started!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to start interview';
      dispatch({ type: 'SET_ERROR', payload: message });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Submit answer
  const submitAnswer = async (questionId, answer, audioUrl = null, videoUrl = null) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.post(`/interview/${state.currentInterview._id}/submit-answer`, {
        questionId,
        answer,
        audioUrl,
        videoUrl
      });

      const answerData = {
        questionId,
        answer,
        audioUrl,
        videoUrl,
        evaluation: response.data.evaluation,
        timestamp: new Date().toISOString()
      };

      dispatch({ type: 'ADD_ANSWER', payload: answerData });
      // If the server returned an updated interview (including performance when completed), update state
      if (response.data.interview) {
        dispatch({ type: 'SET_INTERVIEW', payload: response.data.interview });
        if (response.data.interview.status === 'completed') {
          dispatch({ type: 'SET_SESSION_STATUS', payload: 'completed' });
        } else {
          // Move to next question locally based on updated interview.session.currentQuestion
          const nextIndex = response.data.interview.session?.currentQuestion || state.progress.currentQuestionIndex + 1;
          if (nextIndex < (response.data.interview.questions || state.questions).length) {
            const nextQ = (response.data.interview.questions || state.questions)[nextIndex];
            dispatch({ type: 'SET_CURRENT_QUESTION', payload: { ...nextQ, index: nextIndex } });
          }
        }
      } else {
        // Fallback: advance to next question
        const nextIndex = state.progress.currentQuestionIndex + 1;
        if (nextIndex < state.questions.length) {
          dispatch({ type: 'SET_CURRENT_QUESTION', payload: { 
            ...state.questions[nextIndex], 
            index: nextIndex 
          }});
        } else {
          dispatch({ type: 'SET_SESSION_STATUS', payload: 'completed' });
        }
      }

      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Answer submitted successfully!');
      return { success: true, evaluation: response.data.evaluation };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit answer';
      dispatch({ type: 'SET_ERROR', payload: message });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Pause interview
  const pauseInterview = async () => {
    try {
      if (state.currentInterview) {
        await api.post(`/interview/${state.currentInterview._id}/pause`);
        dispatch({ type: 'SET_SESSION_STATUS', payload: 'paused' });
        toast.success('Interview paused');
      }
    } catch (error) {
      toast.error('Failed to pause interview');
    }
  };

  // Resume interview
  const resumeInterview = async () => {
    try {
      if (state.currentInterview) {
        await api.post(`/interview/${state.currentInterview._id}/resume`);
        dispatch({ type: 'SET_SESSION_STATUS', payload: 'active' });
        toast.success('Interview resumed');
      }
    } catch (error) {
      toast.error('Failed to resume interview');
    }
  };

  // End interview
  const endInterview = async () => {
    try {
      if (state.currentInterview) {
        const response = await api.post(`/interview/${state.currentInterview._id}/end`);
        dispatch({ type: 'SET_SESSION_STATUS', payload: 'completed' });
        dispatch({ type: 'SET_INTERVIEW', payload: response.data.interview });
        
        // Trigger analytics update after interview completion
        try {
          await api.get('/analytics?refresh=true');
        } catch (analyticsError) {
          console.log('Analytics refresh failed:', analyticsError);
        }
        
        toast.success('Interview completed! Analytics updated.');
        return { success: true, performance: response.data.performance };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to end interview';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Load interview
  const loadInterview = async (interviewId) => {
    try {
      console.log('Loading interview with ID:', interviewId);
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get(`/interview/${interviewId}`);
      const interview = response.data.interview;
      console.log('Loaded interview:', interview);
      
      dispatch({ type: 'SET_INTERVIEW', payload: interview });
      
      // Set session status based on interview status
      if (interview.status === 'in-progress') {
        dispatch({ type: 'SET_SESSION_STATUS', payload: 'active' });
        // Find the current question based on session data
        const currentQuestionIndex = interview.session?.currentQuestion || interview.answers?.length || 0;
        if (currentQuestionIndex < interview.questions.length) {
          dispatch({ type: 'SET_CURRENT_QUESTION', payload: { 
            ...interview.questions[currentQuestionIndex], 
            index: currentQuestionIndex 
          }});
        }
      } else if (interview.status === 'paused') {
        dispatch({ type: 'SET_SESSION_STATUS', payload: 'paused' });
        // Find the current question for paused interview
        const currentQuestionIndex = interview.session?.currentQuestion || interview.answers?.length || 0;
        if (currentQuestionIndex < interview.questions.length) {
          dispatch({ type: 'SET_CURRENT_QUESTION', payload: { 
            ...interview.questions[currentQuestionIndex], 
            index: currentQuestionIndex 
          }});
        }
      } else if (interview.status === 'completed') {
        dispatch({ type: 'SET_SESSION_STATUS', payload: 'completed' });
      } else {
        dispatch({ type: 'SET_SESSION_STATUS', payload: 'idle' });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: true, interview: interview };
    } catch (error) {
      console.error('Failed to load interview:', error);
      const message = error.response?.data?.message || 'Failed to load interview';
      dispatch({ type: 'SET_ERROR', payload: message });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Update progress
  const updateProgress = (progressData) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: progressData });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Reset interview state
  const resetInterview = () => {
    dispatch({ type: 'RESET_INTERVIEW' });
  };

  const value = {
    ...state,
    createInterview,
    startInterview,
    submitAnswer,
    pauseInterview,
    resumeInterview,
    endInterview,
    loadInterview,
    updateProgress,
    clearError,
    resetInterview
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}; 