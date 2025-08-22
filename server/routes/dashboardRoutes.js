import express from 'express';
import Student from '../models/Student/student.model.js';
import Result from '../models/Student/result.model.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics using MongoDB Aggregation
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Overview Stats
    const totalStudents = await Student.countDocuments();
    const totalResults = await Result.countDocuments();
    const passedResults = await Result.countDocuments({ overallStatus: 'PASS' });
    const pendingMakeups = await Result.countDocuments({ 'makeupRequired.0': { $exists: true } });
    const passPercentage = totalResults > 0 ? (passedResults / totalResults) * 100 : 0;

    // Recent Activity
    const recentActivity = await Result.find()
      .populate('studentId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .then(results => results.map(r => ({
          id: r._id,
          studentName: r.studentId?.name || 'Unknown',
          examType: r.examType,
          status: r.overallStatus,
          percentage: r.percentage,
          createdAt: r.createdAt
      })));

    // Department-wise Stats using Aggregation
    const departmentStats = await Student.aggregate([
        {
            $lookup: {
                from: 'results',
                localField: '_id',
                foreignField: 'studentId',
                as: 'results'
            }
        },
        { $unwind: { path: '$results', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: '$department',
                totalStudents: { $addToSet: '$_id' },
                passedResults: { $sum: { $cond: [{ $eq: ['$results.overallStatus', 'PASS'] }, 1, 0] } },
                failedResults: { $sum: { $cond: [{ $eq: ['$results.overallStatus', 'FAIL'] }, 1, 0] } },
            }
        },
        {
            $project: {
                _id: 0,
                department: '$_id',
                totalStudents: { $size: '$totalStudents' },
                passedResults: 1,
                failedResults: 1,
                totalResults: { $add: ['$passedResults', '$failedResults'] }
            }
        }
    ]).then(stats => stats.reduce((acc, stat) => {
        acc[stat.department] = stat;
        return acc;
    }, {}));


    // Year-wise Stats
    const yearStats = await Result.aggregate([
        {
            $group: {
                _id: '$yearOfStudy',
                totalResults: { $sum: 1 },
                passedResults: { $sum: { $cond: [{ $eq: ['$overallStatus', 'PASS'] }, 1, 0] } }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                year: '$_id',
                totalResults: 1,
                passedResults: 1,
                failedResults: { $subtract: ['$totalResults', '$passedResults'] },
                passPercentage: {
                    $cond: [{ $eq: ['$totalResults', 0] }, 0, { $multiply: [{ $divide: ['$passedResults', '$totalResults'] }, 100] }]
                }
            }
        }
    ]).then(async stats => {
        const studentCounts = await Student.aggregate([
            { $group: { _id: '$yearOfStudy', totalStudents: { $sum: 1 } } }
        ]);
        const finalStats = {};
        for (let i = 1; i <= 4; i++) {
            const yearData = stats.find(s => s.year === i) || { totalResults: 0, passedResults: 0, failedResults: 0, passPercentage: 0 };
            const studentCountData = studentCounts.find(s => s._id === i) || { totalStudents: 0 };
            finalStats[i] = {
                ...yearData,
                totalStudents: studentCountData.totalStudents,
                passPercentage: parseFloat(yearData.passPercentage.toFixed(1))
            };
        }
        return finalStats;
    });

    // Exam Type Stats
    const examTypeStats = await Result.aggregate([
        {
            $group: {
                _id: '$examType',
                totalResults: { $sum: 1 },
                passedResults: { $sum: { $cond: [{ $eq: ['$overallStatus', 'PASS'] }, 1, 0] } }
            }
        },
         {
            $project: {
                _id: 0,
                examType: '$_id',
                totalResults: 1,
                passedResults: 1,
                failedResults: { $subtract: ['$totalResults', '$passedResults'] },
                passPercentage: {
                    $cond: [{ $eq: ['$totalResults', 0] }, 0, { $multiply: [{ $divide: ['$passedResults', '$totalResults'] }, 100] }]
                }
            }
        }
    ]).then(stats => ['ISE', 'MSE', 'ESE', 'Makeup'].reduce((acc, type) => {
        const data = stats.find(s => s.examType === type) || { totalResults: 0, passedResults: 0, failedResults: 0, passPercentage: 0 };
        acc[type] = { ...data, passPercentage: parseFloat(data.passPercentage.toFixed(1))};
        return acc;
    }, {}));


    res.json({
      success: true,
      stats: {
        overview: {
          totalStudents,
          totalResults,
          passedResults,
          failedResults: totalResults - passedResults,
          pendingMakeups,
          passPercentage: parseFloat(passPercentage.toFixed(1)),
        },
        recentActivity,
        departmentStats,
        yearStats,
        examTypeStats,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard statistics' });
  }
});

// ... (trends route can be similarly refactored using aggregation)

export default router;