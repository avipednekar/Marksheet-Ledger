// Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  BookOpen,
  Award,
  Calendar,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface DashboardStats {
  overview: {
    totalStudents: number;
    totalResults: number;
    passedResults: number;
    failedResults: number;
    pendingMakeups: number;
    passPercentage: number;
  };
  recentActivity: Array<{
    id: string;
    studentName: string;
    examType: string;
    status: string;
    percentage: number;
    createdAt: string;
  }>;
  departmentStats: Record<string, any>;
  yearStats: Record<string, any>;
  examTypeStats: Record<string, any>;
}

const Dashboard: React.FC = () => {
  const { teacher, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, [token]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchDashboardStats}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.overview.totalStudents || 0,
      icon: Users,
      color: 'indigo', // Updated
      change: '+12%'
    },
    {
      title: 'Results Published',
      value: stats?.overview.totalResults || 0,
      icon: FileText,
      color: 'violet', // Updated
      change: '+8%'
    },
    {
      title: 'Pass Percentage',
      value: `${stats?.overview.passPercentage || 0}%`,
      icon: TrendingUp,
      color: 'green', // Semantic
      change: '+5.2%'
    },
    {
      title: 'Pending Makeups',
      value: stats?.overview.pendingMakeups || 0,
      icon: AlertTriangle,
      color: 'orange', // Semantic
      change: '-3%'
    }
  ];

  const colorVariants = {
    indigo: 'from-indigo-500 to-indigo-600', // Updated
    violet: 'from-violet-500 to-violet-600', // Updated
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    // Page container (inherits bg-neutral-100)
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Welcome back, {teacher?.fullName}
            </h1>
            <p className="text-neutral-600 mt-1">
              Here's what's happening in your {teacher?.department} department today.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-neutral-400" />
            <span className="text-sm text-neutral-600">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>
 
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-600 mb-1">{card.title}</p>
                    <p className="text-3xl font-bold text-neutral-900">{card.value}</p>
                    <p className="text-sm text-green-600 mt-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {card.change} from last month
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${colorVariants[card.color as keyof typeof colorVariants]} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                Recent Activity
              </h2>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`h-2 w-2 rounded-full ${
                        activity.status === 'PASS' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-neutral-900">{activity.studentName}</p>
                        <p className="text-sm text-neutral-600">
                          {activity.examType} - {activity.percentage}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.status === 'PASS' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {activity.status}
                      </span>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Year-wise Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center">
              <Award className="h-5 w-5 mr-2 text-indigo-600" />
              Year-wise Performance
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats?.yearStats && Object.entries(stats.yearStats).map(([year, data]: [string, any]) => (
                <div key={year} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">Year {year}</p>
                    <p className="text-sm text-neutral-600">{data.totalStudents} students</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">{data.passPercentage}%</p>
                    <div className="w-16 bg-neutral-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${data.passPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exam Type Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Exam Type Performance</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats?.examTypeStats && Object.entries(stats.examTypeStats).map(([examType, data]: [string, any]) => (
              <div key={examType} className="text-center">
                <div className="bg-neutral-50 rounded-lg p-4 mb-3">
                  <h3 className="font-semibold text-neutral-900 text-lg">{examType}</h3>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">{data.passPercentage}%</p>
                  <p className="text-sm text-neutral-600">{data.totalResults} results</p>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${data.passPercentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;