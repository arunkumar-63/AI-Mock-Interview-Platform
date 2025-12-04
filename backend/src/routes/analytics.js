const express = require('express');
const Interview = require('../models/Interview');
const Resume = require('../models/Resume');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics for user
// @access  Private
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get total interviews count
    const totalInterviews = await Interview.countDocuments({ user: req.user._id });

    // Get completed interviews
    const completedInterviews = await Interview.find({
      user: req.user._id,
      status: 'completed'
    });

    // Calculate average score
    const averageScore = completedInterviews.length > 0
      ? Math.round(completedInterviews.reduce((acc, interview) => 
          acc + (interview.performance?.overallScore || 0), 0) / completedInterviews.length)
      : 0;

    // Get total resumes count
    const totalResumes = await Resume.countDocuments({ user: req.user._id });

    // Get recent activity (last 5 interviews)
    const recentActivity = await Interview.find({ user: req.user._id })
      .sort({ 'session.startTime': -1 })
      .limit(5)
      .select('title status performance.overallScore session.startTime type')
      .lean();

    const formattedActivity = recentActivity.map(activity => ({
      id: activity._id,
      type: 'interview',
      title: activity.title || 'Mock Interview',
      date: activity.session?.startTime || new Date(),
      score: activity.performance?.overallScore || 0,
      status: activity.status,
      interviewType: activity.type
    }));

    // Get performance trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInterviews = await Interview.find({
      user: req.user._id,
      status: 'completed',
      'session.startTime': { $gte: thirtyDaysAgo }
    }).sort({ 'session.startTime': 1 });

    const performanceTrend = recentInterviews.map(interview => ({
      date: interview.session.startTime,
      score: interview.performance?.overallScore || 0,
      type: interview.type
    }));

    // Calculate skill distribution from completed interviews
    const skillDistribution = {
      technical: 0,
      communication: 0,
      problemSolving: 0,
      leadership: 0
    };
    let skillCount = 0;

    completedInterviews.forEach(interview => {
      if (interview.performance?.categoryScores) {
        const scores = interview.performance.categoryScores;
        if (scores.technical) {
          skillDistribution.technical += scores.technical;
          skillCount++;
        }
        if (scores.communication) {
          skillDistribution.communication += scores.communication;
          skillCount++;
        }
        if (scores['problem-solving'] || scores.problemSolving) {
          skillDistribution.problemSolving += (scores['problem-solving'] || scores.problemSolving);
          skillCount++;
        }
        if (scores.leadership) {
          skillDistribution.leadership += scores.leadership;
          skillCount++;
        }
      }
    });

    // Normalize to percentages
    if (skillCount > 0) {
      const total = Object.values(skillDistribution).reduce((sum, val) => sum + val, 0);
      if (total > 0) {
        Object.keys(skillDistribution).forEach(key => {
          skillDistribution[key] = Math.round((skillDistribution[key] / total) * 100);
        });
      }
    }

    // Get interview type distribution
    const interviewTypes = {};
    recentInterviews.forEach(interview => {
      const type = interview.type || 'general';
      interviewTypes[type] = (interviewTypes[type] || 0) + 1;
    });

    // Calculate strengths and areas for improvement
    const topStrengths = [];
    const areasForImprovement = [];
    
    if (completedInterviews.length > 0) {
      const allStrengths = [];
      const allWeaknesses = [];
      
      completedInterviews.forEach(interview => {
        // Extract points from strength objects
        if (interview.performance?.strengths && Array.isArray(interview.performance.strengths)) {
          interview.performance.strengths.forEach(strengthObj => {
            if (strengthObj.points && Array.isArray(strengthObj.points)) {
              allStrengths.push(...strengthObj.points);
            }
          });
        }
        
        // Extract points from weakness objects
        if (interview.performance?.weaknesses && Array.isArray(interview.performance.weaknesses)) {
          interview.performance.weaknesses.forEach(weaknessObj => {
            if (weaknessObj.points && Array.isArray(weaknessObj.points)) {
              allWeaknesses.push(...weaknessObj.points);
            }
          });
        }
      });
      
      // Get top 3 most mentioned strengths
      const strengthCounts = {};
      allStrengths.forEach(strength => {
        strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
      });
      topStrengths.push(...Object.entries(strengthCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([strength]) => strength));
      
      // Get top 3 most mentioned weaknesses
      const weaknessCounts = {};
      allWeaknesses.forEach(weakness => {
        weaknessCounts[weakness] = (weaknessCounts[weakness] || 0) + 1;
      });
      areasForImprovement.push(...Object.entries(weaknessCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([weakness]) => weakness));
    }

    // Default values if no data
    if (topStrengths.length === 0) {
      topStrengths.push('Complete more interviews to see your strengths');
    }
    if (areasForImprovement.length === 0) {
      areasForImprovement.push('Complete more interviews to identify areas for improvement');
    }

    // Calculate improvement rate
    let improvementRate = 0;
    if (recentInterviews.length >= 2) {
      const firstHalf = recentInterviews.slice(0, Math.ceil(recentInterviews.length / 2));
      const secondHalf = recentInterviews.slice(Math.ceil(recentInterviews.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, i) => sum + (i.performance?.overallScore || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, i) => sum + (i.performance?.overallScore || 0), 0) / secondHalf.length;
      
      improvementRate = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;
    }

    res.json({
      totalInterviews,
      completedInterviews: completedInterviews.length,
      averageScore,
      totalResumes,
      improvementRate,
      recentActivity: formattedActivity,
      performanceTrend,
      skillDistribution,
      interviewTypes,
      topStrengths,
      areasForImprovement
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard analytics',
      message: 'An error occurred while fetching analytics data'
    });
  }
});

// @route   GET /api/analytics
// @desc    Get comprehensive analytics for user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { period = '30d', refresh } = req.query;
    
    // If refresh is requested, clear any cached data and force fresh calculation
    if (refresh === 'true') {
      console.log('Refreshing analytics for user:', req.user._id);
    }
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case '30d':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case '90d':
        startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        break;
      case '1y':
        startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        break;
      default:
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    }

    // Get interview performance data
    const interviews = await Interview.find({
      user: req.user._id,
      status: 'completed',
      'session.startTime': { $gte: startDate }
    }).sort({ 'session.startTime': 1 });

    // Get resume data
    const resumes = await Resume.find({
      user: req.user._id,
      createdAt: { $gte: startDate }
    });

    // Calculate performance metrics
    const performanceMetrics = {
      totalInterviews: interviews.length,
      averageScore: 0,
      bestScore: 0,
      worstScore: 100,
      totalQuestions: 0,
      answeredQuestions: 0,
      averageTimePerQuestion: 0,
      categoryPerformance: {
        technical: { count: 0, averageScore: 0, totalScore: 0 },
        behavioral: { count: 0, averageScore: 0, totalScore: 0 },
        case: { count: 0, averageScore: 0, totalScore: 0 },
        systemDesign: { count: 0, averageScore: 0, totalScore: 0 },
        general: { count: 0, averageScore: 0, totalScore: 0 }
      },
      scoreDistribution: {
        excellent: 0, // 90-100
        good: 0,      // 70-89
        average: 0,   // 50-69
        poor: 0       // 0-49
      },
      timeAnalysis: {
        averageSessionDuration: 0,
        totalSessionTime: 0,
        sessionsCount: 0
      }
    };

    let totalScore = 0;
    let totalTime = 0;
    let totalSessionDuration = 0;

    interviews.forEach(interview => {
      const score = interview.performance?.overallScore || 0;
      totalScore += score;
      
      if (score > performanceMetrics.bestScore) {
        performanceMetrics.bestScore = score;
      }
      if (score < performanceMetrics.worstScore) {
        performanceMetrics.worstScore = score;
      }

      // Score distribution
      if (score >= 90) performanceMetrics.scoreDistribution.excellent++;
      else if (score >= 70) performanceMetrics.scoreDistribution.good++;
      else if (score >= 50) performanceMetrics.scoreDistribution.average++;
      else performanceMetrics.scoreDistribution.poor++;

      // Category performance
      if (interview.performance?.categoryScores) {
        Object.keys(interview.performance.categoryScores).forEach(category => {
          const categoryScore = interview.performance.categoryScores[category];
          if (categoryScore > 0) {
            const categoryKey = category === 'system-design' ? 'systemDesign' : category;
            if (performanceMetrics.categoryPerformance[categoryKey]) {
              performanceMetrics.categoryPerformance[categoryKey].count++;
              performanceMetrics.categoryPerformance[categoryKey].totalScore += categoryScore;
            }
          }
        });
      }

      // Time analysis
      if (interview.session?.startTime && interview.session?.endTime) {
        const sessionDuration = Math.round((interview.session.endTime - interview.session.startTime) / 1000 / 60); // in minutes
        totalSessionDuration += sessionDuration;
        performanceMetrics.timeAnalysis.sessionsCount++;
      }

      // Questions analysis
      performanceMetrics.totalQuestions += interview.questions?.length || 0;
      performanceMetrics.answeredQuestions += interview.answers?.length || 0;
      
      // Time per question
      if (interview.performance?.metrics?.averageTimePerQuestion) {
        totalTime += interview.performance.metrics.averageTimePerQuestion;
      }
    });

    // Calculate averages
    if (interviews.length > 0) {
      performanceMetrics.averageScore = Math.round(totalScore / interviews.length);
    }

    if (performanceMetrics.answeredQuestions > 0) {
      performanceMetrics.averageTimePerQuestion = Math.round(totalTime / performanceMetrics.answeredQuestions);
    }

    if (performanceMetrics.timeAnalysis.sessionsCount > 0) {
      performanceMetrics.timeAnalysis.averageSessionDuration = Math.round(totalSessionDuration / performanceMetrics.timeAnalysis.sessionsCount);
      performanceMetrics.timeAnalysis.totalSessionTime = totalSessionDuration;
    }

    // Calculate category averages
    Object.keys(performanceMetrics.categoryPerformance).forEach(category => {
      const cat = performanceMetrics.categoryPerformance[category];
      if (cat.count > 0) {
        cat.averageScore = Math.round(cat.totalScore / cat.count);
      }
    });

    // Get interview type distribution
    const typeDistribution = {};
    interviews.forEach(interview => {
      const type = interview.type;
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    // Get difficulty level distribution
    const difficultyDistribution = {};
    interviews.forEach(interview => {
      const difficulty = interview.difficulty;
      difficultyDistribution[difficulty] = (difficultyDistribution[difficulty] || 0) + 1;
    });

    // Get weekly/monthly trends
    const trends = calculateTrends(interviews, period);

    // Resume analytics
    const resumeAnalytics = {
      totalResumes: resumes.length,
      averageAnalysisScore: 0,
      topSkills: [],
      improvementAreas: []
    };

    if (resumes.length > 0) {
      let totalResumeScore = 0;
      const allSkills = [];
      const allImprovements = [];

      resumes.forEach(resume => {
        if (resume.analysis?.overallScore) {
          totalResumeScore += resume.analysis.overallScore;
        }
        
        if (resume.analysis?.strengths) {
          allSkills.push(...resume.analysis.strengths);
        }
        
        if (resume.analysis?.improvements) {
          allImprovements.push(...resume.analysis.improvements);
        }
      });

      resumeAnalytics.averageAnalysisScore = Math.round(totalResumeScore / resumes.length);
      
      // Get top skills (most mentioned)
      const skillCounts = {};
      allSkills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
      resumeAnalytics.topSkills = Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([skill, count]) => ({ skill, count }));

      // Get improvement areas (most mentioned)
      const improvementCounts = {};
      allImprovements.forEach(improvement => {
        improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
      });
      resumeAnalytics.improvementAreas = Object.entries(improvementCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([improvement, count]) => ({ improvement, count }));
    }

    res.json({
      period,
      performanceMetrics,
      typeDistribution,
      difficultyDistribution,
      trends,
      resumeAnalytics,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: 'An error occurred while fetching analytics data'
    });
  }
});

// @route   GET /api/analytics/performance/:interviewId
// @desc    Get detailed performance for a specific interview
// @access  Private
router.get('/performance/:interviewId', authenticateToken, async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.interviewId,
      user: req.user._id
    });

    if (!interview) {
      return res.status(404).json({
        error: 'Interview not found',
        message: 'The requested interview does not exist'
      });
    }

    if (interview.status !== 'completed') {
      return res.status(400).json({
        error: 'Interview not completed',
        message: 'Performance analysis is only available for completed interviews'
      });
    }

    // Calculate detailed performance metrics
    const detailedPerformance = {
      overall: {
        score: interview.performance?.overallScore || 0,
        totalQuestions: interview.questions?.length || 0,
        answeredQuestions: interview.answers?.length || 0,
        completionRate: Math.round(((interview.answers?.length || 0) / (interview.questions?.length || 1)) * 100)
      },
      categoryBreakdown: {},
      questionAnalysis: [],
      timeAnalysis: {
        totalTime: interview.performance?.metrics?.totalTime || 0,
        averageTimePerQuestion: interview.performance?.metrics?.averageTimePerQuestion || 0,
        sessionDuration: interview.session?.duration || 0
      },
      strengths: interview.performance?.strengths || [],
      weaknesses: interview.performance?.weaknesses || [],
      recommendations: interview.performance?.recommendations || []
    };

    // Analyze each question
    if (interview.questions && interview.answers) {
      interview.questions.forEach(question => {
        const answer = interview.answers.find(a => a.questionId === question.questionId);
        const questionAnalysis = {
          questionId: question.questionId,
          question: question.question,
          category: question.category,
          difficulty: question.difficulty,
          answered: !!answer,
          score: answer?.evaluation?.score || 0,
          timeSpent: answer?.timeSpent || 0,
          feedback: answer?.evaluation?.feedback || null,
          keywords: answer?.evaluation?.keywords || null
        };
        detailedPerformance.questionAnalysis.push(questionAnalysis);
      });
    }

    // Calculate category breakdown
    const categoryScores = {};
    const categoryCounts = {};
    
    detailedPerformance.questionAnalysis.forEach(qa => {
      if (qa.answered) {
        if (!categoryScores[qa.category]) {
          categoryScores[qa.category] = 0;
          categoryCounts[qa.category] = 0;
        }
        categoryScores[qa.category] += qa.score;
        categoryCounts[qa.category]++;
      }
    });

    Object.keys(categoryScores).forEach(category => {
      detailedPerformance.categoryBreakdown[category] = {
        averageScore: Math.round(categoryScores[category] / categoryCounts[category]),
        totalQuestions: categoryCounts[category],
        answeredQuestions: categoryCounts[category]
      };
    });

    res.json({
      interview: {
        id: interview._id,
        title: interview.title,
        type: interview.type,
        difficulty: interview.difficulty,
        startTime: interview.session?.startTime,
        endTime: interview.session?.endTime
      },
      performance: detailedPerformance
    });

  } catch (error) {
    console.error('Error fetching interview performance:', error);
    res.status(500).json({
      error: 'Failed to fetch interview performance',
      message: 'An error occurred while fetching performance data'
    });
  }
});

// Helper function to calculate trends
function calculateTrends(interviews, period) {
  const trends = {
    weekly: [],
    monthly: []
  };

  if (interviews.length === 0) return trends;

  // Group interviews by week and month
  const weeklyData = {};
  const monthlyData = {};

  interviews.forEach(interview => {
    const date = new Date(interview.session.startTime);
    const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { count: 0, totalScore: 0 };
    }
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, totalScore: 0 };
    }

    weeklyData[weekKey].count++;
    weeklyData[weekKey].totalScore += interview.performance?.overallScore || 0;
    monthlyData[monthKey].count++;
    monthlyData[monthKey].totalScore += interview.performance?.overallScore || 0;
  });

  // Convert to arrays and calculate averages
  trends.weekly = Object.entries(weeklyData)
    .map(([week, data]) => ({
      week,
      count: data.count,
      averageScore: Math.round(data.totalScore / data.count)
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  trends.monthly = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      count: data.count,
      averageScore: Math.round(data.totalScore / data.count)
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return trends;
}

module.exports = router;