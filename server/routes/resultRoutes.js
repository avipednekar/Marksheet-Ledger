import express from 'express';
import Student from '../models/Student/student.model.js';
import Result from '../models/Student/result.model.js';
import { authenticateToken } from '../middleware/auth.js';
import mongoose from 'mongoose';

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
    const { studentId, yearOfStudy, academicYear, semester, examType, subjects } = req.body;

    const student = await Student.findOne({ enrollmentNumber: studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: `Student with Enrollment ID '${studentId}' not found.` });
    }

    // --- New Calculation Logic ---
    const processedSubjects = new Map();
    let grandTotalMarks = 0;
    const failedSubjects = [];

    for (const [subjectName, marks] of Object.entries(subjects)) {
      const ise = Number(marks.ise) || 0;
      const mse = Number(marks.mse) || 0;
      const ese = Number(marks.ese) || 0;

      // Validate marks for each component
      if (ise < 0 || ise > 20 || mse < 0 || mse > 30 || ese < 0 || ese > 50) {
        return res.status(400).json({ success: false, message: `Invalid marks for subject ${subjectName}. Please check the maximum marks for each component.` });
      }

      const subjectTotal = ise + mse + ese;

      // Apply new passing criteria for the subject
      const subjectStatus = (ese >= 20 && subjectTotal >= 40) ? 'PASS' : 'FAIL';
      const subjectGrade = calculateGrade(subjectTotal);

      if (subjectStatus === 'FAIL') {
        failedSubjects.push(subjectName);
      }

      processedSubjects.set(subjectName, {
        ise,
        mse,
        ese,
        total: subjectTotal,
        grade: subjectGrade,
        status: subjectStatus
      });

      grandTotalMarks += subjectTotal;
    }

    const subjectCount = processedSubjects.size;
    const overallStatus = failedSubjects.length > 0 ? 'FAIL' : 'PASS';
    const percentage = subjectCount > 0 ? (grandTotalMarks / subjectCount) : 0; 

    const newResult = await Result.create({
      studentId: student._id,
      yearOfStudy,
      academicYear,
      semester,
      examType: 'ESE', 
      subjects: processedSubjects,
      totalMarks: grandTotalMarks,
      percentage: parseFloat(percentage.toFixed(2)),
      overallStatus,
      failedSubjects,
      makeupRequired: failedSubjects,
    });

    res.status(201).json({ success: true, message: 'Result added successfully!', result: newResult });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A result already exists for this student, exam, and semester.' });
    }
    console.error('Error adding result:', error);
    res.status(500).json({ success: false, message: 'Error adding result' });
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