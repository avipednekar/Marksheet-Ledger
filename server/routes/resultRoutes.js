import express from 'express';
import Student from '../models/Student/student.model.js';
import Result from '../models/Student/result.model.js';
import { authenticateToken } from '../middleware/auth.js';
import mongoose from 'mongoose';
import { getSubjectsForStudent } from '../utils/subjectHelper.js';

const router = express.Router();

const calculateGrade = (totalMarks) => {
  if (totalMarks >= 90) return 'A+';
  if (totalMarks >= 80) return 'A';
  if (totalMarks >= 70) return 'B+';
  if (totalMarks >= 60) return 'B';
  if (totalMarks >= 50) return 'C+';
  if (totalMarks >= 40) return 'C';
  return 'F';
};


router.post('/', authenticateToken, async (req, res) => {
  try {
    const { enrollmentNumber, semester, subjects } = req.body;

    if (!enrollmentNumber || !semester || !subjects) {
      return res.status(400).json({ success: false, message: "Enrollment number, semester, and subjects are required" });
    }

    const student = await Student.findOne({ enrollmentNumber });
    if (!student) {
      return res.status(404).json({ success: false, message: `Student with enrollment '${enrollmentNumber}' not found` });
    }

    const semesterNum = parseInt(semester);
    const validSubjects = getSubjectsForStudent(student, semesterNum);

    if (!validSubjects || validSubjects.length === 0) {
      return res.status(404).json({ success: false, message: "No subjects found for this student/semester" });
    }

    // Validate provided subjects against student's allowed subjects
    for (const [subjectName] of Object.entries(subjects)) {
      const def = validSubjects.find(s => s.courseName === subjectName);
      if (!def) {
        return res.status(400).json({ success: false, message: `Invalid subject '${subjectName}' for this student in semester ${semester}` });
      }
    }

    // Save or update result
    let result = await Result.findOne({ enrollmentNumber, semester: semesterNum });
    if (result) {
      result.subjects = subjects;
      await result.save();
      return res.json({ success: true, message: "Result updated successfully", result });
    } else {
      result = new Result({
        enrollmentNumber,
        semester: semesterNum,
        subjects
      });
      await result.save();
      return res.json({ success: true, message: "Result added successfully", result });
    }
  } catch (error) {
    console.error("Error saving result:", error);
    res.status(500).json({ success: false, message: "Error saving result" });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { yearOfStudy, academicYear, semester, examType, status, search, limit = 20, page = 1 } = req.query;

    const pipeline = [];

    pipeline.push({
      $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'studentInfo' }
    }, {
      $unwind: '$studentInfo'
    });

    const matchStage = {};
    if (yearOfStudy) matchStage.yearOfStudy = parseInt(yearOfStudy);
    if (academicYear) matchStage.academicYear = academicYear;
    if (semester) matchStage.semester = parseInt(semester);
    if (examType) matchStage.examType = examType;
    if (status) matchStage.overallStatus = status;

    if (search) {
      matchStage.$or = [
        { 'studentInfo.name': { $regex: search, $options: 'i' } },
        { 'studentInfo.enrollmentNumber': { $regex: search, $options: 'i' } }
      ];
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    const total = await Result.aggregate([...pipeline, { $count: 'total' }]);
    const totalResults = total.length > 0 ? total[0].total : 0;
    const totalPages = Math.ceil(totalResults / limit);

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
    pipeline.push({ $limit: parseInt(limit) });

    // --- KEY CHANGE: Add a $project stage to reshape the output ---
    pipeline.push({
      $project: {
        _id: 0, // Exclude the original _id
        id: '$_id', // Create a new 'id' field from the value of '_id'
        
        // Explicitly include all other fields you want to send to the frontend
        studentName: '$studentInfo.name',
        enrollmentNumber: '$studentInfo.enrollmentNumber',
        yearOfStudy: 1,
        academicYear: 1,
        semester: 1,
        examType: 1,
        subjects: 1,
        overallStatus: 1,
        totalMarks: 1,
        percentage: 1,
        failedSubjects: 1,
        makeupRequired: 1,
        createdAt: 1,
        updatedAt: 1
      }
    });

    const results = await Result.aggregate(pipeline);

    res.json({
      success: true,
      results,
      total: totalResults,
      page: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ success: false, message: 'Error fetching results' });
  }
});

router.get('/:enrollmentNumber', authenticateToken, async (req, res) => {
  try {
    const results = await Result.find({ enrollmentNumber: req.params.enrollmentNumber });
    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "No results found" });
    }
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching results" });
  }
});

router.get('/:enrollmentNumber/:semester', authenticateToken, async (req, res) => {
  try {
    const { enrollmentNumber, semester } = req.params;
    const result = await Result.findOne({ enrollmentNumber, semester: parseInt(semester) });
    if (!result) {
      return res.status(404).json({ success: false, message: "Result not found" });
    }
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching result" });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid result ID format' });
    }

    const result = await Result.findById(req.params.id)
      .populate('studentId', 'name enrollmentNumber'); // Populate student info

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    const formattedResult = {
        ...result.toObject(),
        studentName: result.studentId?.name || 'Unknown',
        enrollmentNumber: result.studentId?.enrollmentNumber || 'Unknown'
    };

    res.json({ success: true, result: formattedResult });
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ success: false, message: 'Error fetching result' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { subjects } = req.body;

        if (!subjects) {
            return res.status(400).json({ success: false, message: 'Subjects data is required for an update.' });
        }

        const processedSubjects = new Map();
        let grandTotalMarks = 0;
        const failedSubjects = [];

        for (const [subjectName, marks] of Object.entries(subjects)) {
            const ise = Number(marks.ise) || 0;
            const mse = Number(marks.mse) || 0;
            const ese = Number(marks.ese) || 0;

            if (ise < 0 || ise > 20 || mse < 0 || mse > 30 || ese < 0 || ese > 50) {
                return res.status(400).json({ success: false, message: `Invalid marks for subject ${subjectName}.` });
            }

            const subjectTotal = ise + mse + ese;
            const subjectStatus = (ese >= 20 && subjectTotal >= 40) ? 'PASS' : 'FAIL';
            const subjectGrade = calculateGrade(subjectTotal);

            if (subjectStatus === 'FAIL') {
                failedSubjects.push(subjectName);
            }

            processedSubjects.set(subjectName, {
                ise, mse, ese,
                total: subjectTotal,
                grade: subjectGrade,
                status: subjectStatus
            });
            grandTotalMarks += subjectTotal;
        }
        
        const subjectCount = processedSubjects.size;
        const overallStatus = failedSubjects.length > 0 ? 'FAIL' : 'PASS';
        const percentage = subjectCount > 0 ? (grandTotalMarks / subjectCount) : 0;
        
        const updateData = {
            subjects: processedSubjects,
            totalMarks: grandTotalMarks,
            percentage: parseFloat(percentage.toFixed(2)),
            overallStatus,
            failedSubjects,
            makeupRequired: failedSubjects
        };

        const updatedResult = await Result.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate('studentId', 'name enrollmentNumber');

        if (!updatedResult) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }
        
        const formattedResult = {
            ...updatedResult.toObject(),
            studentName: updatedResult.studentId?.name || 'Unknown',
            enrollmentNumber: updatedResult.studentId?.enrollmentNumber || 'Unknown'
        };

        res.json({ success: true, message: 'Result updated successfully', result: formattedResult });
    } catch (error) {
        console.error('Error updating result:', error);
        res.status(500).json({ success: false, message: 'Error updating result' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deletedResult = await Result.findByIdAndDelete(req.params.id);

        if (!deletedResult) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }

        res.json({ success: true, message: 'Result deleted successfully' });
    } catch (error) {
        console.error('Error deleting result:', error);
        res.status(500).json({ success: false, message: 'Error deleting result' });
    }
});

export default router;