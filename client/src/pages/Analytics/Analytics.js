import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Users, 
  FileText,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle
} from 'lucide-react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
} from 'chart.js';
import api from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // Fetch both dashboard and analytics data
      const [dashboardResponse, analyticsResponse] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get(`/analytics?period=${timeRange}`)
      ]);
      
      // Combine the data
      const combinedData = {
        ...analyticsResponse.data,
        ...dashboardResponse.data
      };
      
      setAnalytics(combinedData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Set empty analytics on error
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const timeRanges = [
    { id: '7d', name: 'Last 7 days' },
    { id: '30d', name: 'Last 30 days' },
    { id: '90d', name: 'Last 90 days' },
    { id: '1y', name: 'Last year' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Process real analytics data
  const processedData = (() => {
    if (!analytics) {
      return {
        overallScore: 0,
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: 0,
        scoreTrend: [],
        skillDistribution: { technical: 0, communication: 0, problemSolving: 0, leadership: 0 },
        interviewTypes: {},
        monthlyProgress: [],
        topStrengths: ['Complete more interviews to see your strengths'],
        areasForImprovement: ['Complete more interviews to identify areas'],
        recentActivity: []
      };
    }

    const { 
      performanceMetrics, 
      typeDistribution, 
      trends, 
      recentActivity,
      topStrengths,
      areasForImprovement,
      averageScore,
      totalInterviews,
      completedInterviews
    } = analytics;

    // Extract score trend from trends data
    const scoreTrend = trends?.weekly?.map(week => week.averageScore) || [];
    
    // Extract monthly progress
    const monthlyProgress = trends?.monthly?.map(month => month.averageScore) || [];

    // Calculate skill distribution from category performance
    const categoryPerf = performanceMetrics?.categoryPerformance || {};
    const skillDistribution = {
      technical: categoryPerf.technical?.averageScore || 0,
      communication: categoryPerf.behavioral?.averageScore || 0,
      problemSolving: categoryPerf.case?.averageScore || 0,
      leadership: categoryPerf.systemDesign?.averageScore || 0
    };

    // Process top strengths - extract points from strength objects or handle string arrays
    let strengths = [];
    if (Array.isArray(topStrengths) && topStrengths.length > 0) {
      // Check if topStrengths contains objects with points arrays
      if (typeof topStrengths[0] === 'object' && topStrengths[0] !== null && topStrengths[0].points) {
        // Extract points from all strength objects
        topStrengths.forEach(strengthObj => {
          if (Array.isArray(strengthObj.points)) {
            strengths = [...strengths, ...strengthObj.points];
          }
        });
      } else if (typeof topStrengths[0] === 'string') {
        // Handle case where topStrengths is already an array of strings
        strengths = topStrengths.slice(0, 5);
      } else {
        // Handle case where topStrengths contains objects (fallback)
        topStrengths.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.points && Array.isArray(item.points)) {
              strengths = [...strengths, ...item.points];
            } else if (item.category) {
              // If it's an object with category but no points, use the category name
              strengths.push(item.category);
            }
          }
        });
      }
    }
    
    // Process areas for improvement - extract points from weakness objects or handle string arrays
    let improvements = [];
    if (Array.isArray(areasForImprovement) && areasForImprovement.length > 0) {
      // Check if areasForImprovement contains objects with points arrays
      if (typeof areasForImprovement[0] === 'object' && areasForImprovement[0] !== null && areasForImprovement[0].points) {
        // Extract points from all weakness objects
        areasForImprovement.forEach(weaknessObj => {
          if (Array.isArray(weaknessObj.points)) {
            improvements = [...improvements, ...weaknessObj.points];
          }
        });
      } else if (typeof areasForImprovement[0] === 'string') {
        // Handle case where areasForImprovement is already an array of strings
        improvements = areasForImprovement.slice(0, 5);
      } else {
        // Handle case where areasForImprovement contains objects (fallback)
        areasForImprovement.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            if (item.points && Array.isArray(item.points)) {
              improvements = [...improvements, ...item.points];
            } else if (item.category) {
              // If it's an object with category but no points, use the category name
              improvements.push(item.category);
            }
          }
        });
      }
    }

    // Fallback values if no strengths or improvements were extracted
    if (strengths.length === 0) {
      strengths = ['Problem Solving', 'Technical Skills', 'Communication'];
    }
    
    if (improvements.length === 0) {
      improvements = ['Leadership', 'Time Management', 'Public Speaking'];
    }

    return {
      overallScore: averageScore || 0,
      totalInterviews: totalInterviews || 0,
      completedInterviews: completedInterviews || 0,
      averageScore: averageScore || 0,
      scoreTrend,
      skillDistribution,
      interviewTypes: typeDistribution || {},
      monthlyProgress,
      topStrengths: strengths.slice(0, 5), // Limit to top 5
      areasForImprovement: improvements.slice(0, 5), // Limit to top 5
      recentActivity: recentActivity || []
    };
  })();

  const performanceData = {
    labels: processedData.scoreTrend.length > 0 
      ? processedData.scoreTrend.map((_, index) => `Week ${index + 1}`)
      : ['No Data'],
    datasets: [
      {
        label: 'Performance Score',
        data: processedData.scoreTrend.length > 0 ? processedData.scoreTrend : [0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const skillData = {
    labels: ['Technical', 'Communication', 'Problem Solving', 'Leadership'],
    datasets: [
      {
        data: [
          processedData.skillDistribution.technical,
          processedData.skillDistribution.communication,
          processedData.skillDistribution.problemSolving,
          processedData.skillDistribution.leadership
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const interviewTypeData = {
    labels: Object.keys(processedData.interviewTypes).map(type => 
      type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')
    ),
    datasets: [
      {
        label: 'Number of Interviews',
        data: Object.values(processedData.interviewTypes),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
      },
    ],
  };

  const radarData = {
    labels: ['Technical Skills', 'Communication', 'Problem Solving', 'Leadership', 'Adaptability', 'Teamwork'],
    datasets: [
      {
        label: 'Current Level',
        data: [
          processedData.skillDistribution.technical,
          processedData.skillDistribution.communication,
          processedData.skillDistribution.problemSolving,
          processedData.skillDistribution.leadership,
          processedData.averageScore || 0,
          processedData.averageScore || 0
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      },
    ],
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  // Format date for recent activity
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your performance and progress over time</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field w-auto"
          >
            {timeRanges.map((range) => (
              <option key={range.id} value={range.id}>
                {range.name}
              </option>
            ))}
          </select>
          <button 
            onClick={loadAnalytics}
            className="btn-secondary inline-flex items-center mr-2"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="btn-secondary inline-flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Score</p>
              <p className="text-2xl font-bold text-gray-900">{processedData.overallScore}%</p>
            </div>
            <div className={`p-3 rounded-full ${getScoreBgColor(processedData.overallScore)}`}>
              <TrendingUp className={`w-6 h-6 ${getScoreColor(processedData.overallScore)}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {getTrendIcon(analytics?.improvementRate || 0)}
            <span className={`ml-1 ${analytics?.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analytics?.improvementRate || 0}% from last period
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Interviews</p>
              <p className="text-2xl font-bold text-gray-900">{processedData.totalInterviews}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="ml-1 text-gray-600">{processedData.completedInterviews} completed</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{processedData.averageScore}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="ml-1 text-gray-600">
              {processedData.totalInterviews > 0 ? 'Across all interviews' : 'No data yet'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {processedData.totalInterviews > 0 
                  ? Math.round((processedData.completedInterviews / processedData.totalInterviews) * 100)
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {getTrendIcon(0)}
            <span className="ml-1 text-gray-600">Stable</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h2>
          <div className="h-64">
            <Line
              data={performanceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Skill Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skill Distribution</h2>
          <div className="h-64">
            <Doughnut
              data={skillData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interview Types */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Types</h2>
          <div className="h-64">
            <Bar
              data={interviewTypeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Skills Radar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills Assessment</h2>
          <div className="h-64">
            <Radar
              data={radarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Strengths */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Strengths</h2>
          <div className="space-y-3">
            {processedData.topStrengths.map((strength, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-800">{strength}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Strong</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h2>
          <div className="space-y-3">
            {processedData.areasForImprovement.map((area, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium text-yellow-800">{area}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-600">Needs Work</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {processedData.recentActivity && processedData.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {processedData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'interview' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    {activity.type === 'interview' ? (
                      <Users className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{activity.title}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${getScoreColor(activity.score)}`}>
                    {activity.score}%
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{activity.interviewType || activity.type}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity. Start your first interview to see data here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics; 