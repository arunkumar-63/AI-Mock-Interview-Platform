import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Users, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target,
  ArrowRight,
  Play,
  Upload,
  Eye,
  Calendar,
  Award
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedInterviews: 0,
    averageScore: 0,
    totalResumes: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/analytics/dashboard');
        const analyticsData = response.data;
        
        setStats({
          totalInterviews: analyticsData.totalInterviews || 0,
          completedInterviews: analyticsData.completedInterviews || 0,
          averageScore: analyticsData.averageScore || 0,
          totalResumes: analyticsData.totalResumes || 0,
          recentActivity: analyticsData.recentActivity || [],
          performanceTrend: analyticsData.performanceTrend || [],
          skillDistribution: analyticsData.skillDistribution || {
            technical: 0,
            communication: 0,
            problemSolving: 0,
            leadership: 0
          }
        });
      } catch (error) {
        console.error('Failed to load dashboard analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Generate performance chart data from API data
  const performanceData = (() => {
    if (!stats.performanceTrend || stats.performanceTrend.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Interview Score',
          data: [0],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        }]
      };
    }

    const labels = stats.performanceTrend.map((item, index) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const scores = stats.performanceTrend.map(item => item.score);

    return {
      labels,
      datasets: [{
        label: 'Interview Score',
        data: scores,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    };
  })();

  // Generate skill distribution chart data from API data
  const skillDistributionData = (() => {
    if (!stats.skillDistribution) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [100],
          backgroundColor: ['rgba(200, 200, 200, 0.5)'],
          borderWidth: 0,
        }]
      };
    }

    const { technical, communication, problemSolving, leadership } = stats.skillDistribution;
    const hasData = technical > 0 || communication > 0 || problemSolving > 0 || leadership > 0;

    if (!hasData) {
      return {
        labels: ['No Data Yet'],
        datasets: [{
          data: [100],
          backgroundColor: ['rgba(200, 200, 200, 0.5)'],
          borderWidth: 0,
        }]
      };
    }

    return {
      labels: ['Technical Skills', 'Communication', 'Problem Solving', 'Leadership'],
      datasets: [{
        data: [technical, communication, problemSolving, leadership],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderWidth: 0,
      }]
    };
  })();

  const quickActions = [
    {
      title: 'Start Mock Interview',
      description: 'Begin a new AI-powered interview session',
      icon: Play,
      href: '/interview/create',
      color: 'blue',
      bgColor: 'bg-blue-100',
      hoverBgColor: 'group-hover:bg-blue-200',
      textColor: 'text-blue-600'
    },
    {
      title: 'Upload Resume',
      description: 'Analyze and optimize your resume',
      icon: Upload,
      href: '/resume',
      color: 'purple',
      bgColor: 'bg-purple-100',
      hoverBgColor: 'group-hover:bg-purple-200',
      textColor: 'text-purple-600'
    },
    {
      title: 'View Analytics',
      description: 'Check your performance insights',
      icon: BarChart3,
      href: '/analytics',
      color: 'green',
      bgColor: 'bg-green-100',
      hoverBgColor: 'group-hover:bg-green-200',
      textColor: 'text-green-600'
    },
    {
      title: 'Interview History',
      description: 'Review past interview sessions',
      icon: Clock,
      href: '/interview/history',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      hoverBgColor: 'group-hover:bg-yellow-200',
      textColor: 'text-yellow-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Interview Journey</h2>
            <p className="text-blue-100 text-lg">
              Track your progress and improve your skills with AI-powered mock interviews.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
              <Award className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow h-36 flex flex-col justify-center">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Interviews</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalInterviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow h-36 flex flex-col justify-center">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
              <Target className="w-7 h-7 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedInterviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow h-36 flex flex-col justify-center">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl flex-shrink-0">
              <TrendingUp className="w-7 h-7 text-purple-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow h-36 flex flex-col justify-center">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-xl flex-shrink-0">
              <FileText className="w-7 h-7 text-yellow-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Resumes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalResumes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className="group p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-gray-50 to-white h-36 flex flex-col justify-center"
              >
                <div className="flex items-center space-x-4 w-full">
                  <div className={`p-3 ${action.bgColor} rounded-xl ${action.hoverBgColor} transition-colors flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${action.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{action.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Trend</h2>
          <div className="h-80">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Skill Distribution</h2>
          <div className="h-80">
            <Doughnut
              data={skillDistributionData}
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

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <Link
            to="/interview/history"
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            View all
          </Link>
        </div>
        <div className="space-y-4">
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`p-3 rounded-xl flex-shrink-0 ${
                  activity.type === 'interview' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {activity.type === 'interview' ? (
                    <Users className={`w-5 h-5 ${
                      activity.type === 'interview' ? 'text-blue-600' : 'text-purple-600'
                    }`} />
                  ) : (
                    <FileText className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{activity.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-gray-900">{activity.score}%</p>
                  <p className="text-xs text-gray-500 capitalize">{activity.status}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;