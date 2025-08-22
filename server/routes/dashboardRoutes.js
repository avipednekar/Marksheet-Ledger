import express from 'express';
// import { readDatabase } from '../utils/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const db = readDatabase();
    
    const totalStudents = db.students.length;
    const totalResults = db.results.length;
    const passedResults = db.results.filter(r => r.overallStatus === 'PASS').length;
    const failedResults = db.results.filter(r => r.overallStatus === 'FAIL').length;
    const pendingMakeups = db.results.filter(r => r.makeupRequired && r.makeupRequired.length > 0).length;
    
    // Calculate pass percentage
    const passPercentage = totalResults > 0 ? ((passedResults / totalResults) * 100).toFixed(1) : 0;
    
    // Get recent activity (last 10 results)
    const recentResults = db.results
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(result => {
        const student = db.students.find(s => s.id === result.studentId);
        return {
          id: result.id,
          studentName: student?.name || 'Unknown',
          examType: result.examType,
          status: result.overallStatus,
          percentage: result.percentage,
          createdAt: result.createdAt
        };
      });

    // Department-wise statistics
    const departmentStats = {};
    db.students.forEach(student => {
      if (!departmentStats[student.department]) {
        departmentStats[student.department] = {
          totalStudents: 0,
          passedResults: 0,
          failedResults: 0,
          totalResults: 0
        };
      }
      departmentStats[student.department].totalStudents++;
      
      const studentResults = db.results.filter(r => r.studentId === student.id);
      departmentStats[student.department].totalResults += studentResults.length;
      departmentStats[student.department].passedResults += studentResults.filter(r => r.overallStatus === 'PASS').length;
      departmentStats[student.department].failedResults += studentResults.filter(r => r.overallStatus === 'FAIL').length;
    });

    // Year-wise statistics
    const yearStats = {};
    for (let year = 1; year <= 4; year++) {
      const yearStudents = db.students.filter(s => s.yearOfStudy === year);
      const yearResults = db.results.filter(r => r.yearOfStudy === year);
      
      yearStats[year] = {
        totalStudents: yearStudents.length,
        totalResults: yearResults.length,
        passedResults: yearResults.filter(r => r.overallStatus === 'PASS').length,
        failedResults: yearResults.filter(r => r.overallStatus === 'FAIL').length,
        passPercentage: yearResults.length > 0 
          ? ((yearResults.filter(r => r.overallStatus === 'PASS').length / yearResults.length) * 100).toFixed(1)
          : 0
      };
    }

    // Exam type statistics
    const examTypeStats = {};
    ['ISE', 'MSE', 'ESE', 'Makeup'].forEach(examType => {
      const examResults = db.results.filter(r => r.examType === examType);
      examTypeStats[examType] = {
        totalResults: examResults.length,
        passedResults: examResults.filter(r => r.overallStatus === 'PASS').length,
        failedResults: examResults.filter(r => r.overallStatus === 'FAIL').length,
        passPercentage: examResults.length > 0
          ? ((examResults.filter(r => r.overallStatus === 'PASS').length / examResults.length) * 100).toFixed(1)
          : 0
      };
    });

    res.json({
      success: true,
      stats: {
        overview: {
          totalStudents,
          totalResults,
          passedResults,
          failedResults,
          pendingMakeups,
          passPercentage: parseFloat(passPercentage)
        },
        recentActivity: recentResults,
        departmentStats,
        yearStats,
        examTypeStats
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// Get performance trends
router.get('/trends', authenticateToken, (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const db = readDatabase();

    // Group results by time period
    const trends = {};
    
    db.results.forEach(result => {
      const date = new Date(result.createdAt);
      let key;
      
      if (period === 'monthly') {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!trends[key]) {
        trends[key] = {
          period: key,
          totalResults: 0,
          passedResults: 0,
          failedResults: 0,
          averagePercentage: 0,
          totalPercentage: 0
        };
      }

      trends[key].totalResults++;
      trends[key].totalPercentage += result.percentage;
      
      if (result.overallStatus === 'PASS') {
        trends[key].passedResults++;
      } else {
        trends[key].failedResults++;
      }
    });

    // Calculate average percentages
    Object.values(trends).forEach(trend => {
      trend.averagePercentage = trend.totalResults > 0 
        ? (trend.totalPercentage / trend.totalResults).toFixed(2)
        : 0;
      trend.passPercentage = trend.totalResults > 0
        ? ((trend.passedResults / trend.totalResults) * 100).toFixed(1)
        : 0;
      delete trend.totalPercentage;
    });

    const sortedTrends = Object.values(trends).sort((a, b) => a.period.localeCompare(b.period));

    res.json({
      success: true,
      trends: sortedTrends,
      period
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching performance trends'
    });
  }
});

export default router;