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

const processResultData = (student, yearOfStudy, semester, subjects) => {
  const processedSubjects = new Map();
  let grandTotalMarks = 0;
  let grandTotalMaxMarks = 0; 
  const failedSubjects = [];

  const subjectsData = getSubjectsForStudent(student, semester, yearOfStudy);

  if (!subjectsData || subjectsData.length === 0) {
    throw new Error(`Subject data not found for student's year and semester.`);
  }

  const courseMap = new Map(subjectsData.map(course => [course.courseName, course]));

  for (const [subjectName, marks] of Object.entries(subjects)) {
    const subjectConfig = courseMap.get(subjectName);
    
    if (!subjectConfig) {
      console.warn(`Warning: Configuration for subject '${subjectName}' not found. Skipping validation.`);
      continue;
    }

    let totalMarks = 0;
    let subjectMaxMarks = 0; 
    let isPassing = true;
    const componentMarks = new Map();

    subjectConfig.evaluationScheme.forEach(scheme => {
      const key = scheme.name.toLowerCase().replace(/[^a-z]/g, '');
      const studentMark = Number(marks[key]) || 0;
      
      subjectMaxMarks += scheme.maxMarks; 

      if (studentMark < 0 || studentMark > scheme.maxMarks) {
        throw new Error(`Invalid marks for ${scheme.name} in subject ${subjectName}. Marks must be between 0 and ${scheme.maxMarks}.`);
      }
      
      if (scheme.minPassingMarks && studentMark < scheme.minPassingMarks) {
        isPassing = false;
      }
      
      totalMarks += studentMark;
      componentMarks.set(scheme.name, studentMark);
    });

    if (totalMarks < subjectConfig.minForPassing) {
        isPassing = false;
    }
    
    const subjectStatus = isPassing ? 'PASS' : 'FAIL';
    const normalizedMarksForGrade = (totalMarks / subjectMaxMarks) * 100;
    const subjectGrade = calculateGrade(normalizedMarksForGrade);

    if (subjectStatus === 'FAIL') {
      failedSubjects.push(subjectName);
    }

    processedSubjects.set(subjectName, {
      componentMarks,
      total: totalMarks,
      grade: subjectGrade,
      status: subjectStatus
    });
    
    grandTotalMarks += totalMarks;
    grandTotalMaxMarks += subjectMaxMarks; 
  }

  const overallStatus = failedSubjects.length > 0 ? 'FAIL' : 'PASS';
  
  const percentage = grandTotalMaxMarks > 0 ? (grandTotalMarks / grandTotalMaxMarks) * 100 : 0;

  return {
    subjects: Object.fromEntries(processedSubjects),
    totalMarks: grandTotalMarks,
    percentage: parseFloat(percentage.toFixed(2)),
    overallStatus,
    failedSubjects,
    makeupRequired: failedSubjects
  };
};

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { enrollmentNumber, semester, subjects, yearOfStudy, academicYear, examType } = req.body;

    if (!enrollmentNumber || !semester || !subjects || !yearOfStudy || !academicYear || !examType) {
      return res.status(400).json({ success: false, message: "Missing required fields for creating a result." });
    }

    const student = await Student.findOne({ enrollmentNumber });
    if (!student) {
      return res.status(404).json({ success: false, message: `Student with enrollment '${enrollmentNumber}' not found` });
    }
    
    // Check if a result already exists to prevent duplicates
    const existingResult = await Result.findOne({ studentId: student._id, semester });
    if (existingResult) {
        return res.status(409).json({ success: false, message: `Result for semester ${semester} already exists for this student.` });
    }

    // Use the centralized processing function with the student object
    const calculatedData = processResultData(student, yearOfStudy, semester, subjects);

    const result = new Result({
      studentId: student._id,
      enrollmentNumber,
      semester,
      yearOfStudy,
      academicYear,
      examType,
      ...calculatedData
    });
    
    await result.save();
    res.status(201).json({ success: true, message: "Result added successfully", result });

  } catch (error) {
    console.error("Error saving result:", error);
    res.status(500).json({ success: false, message: error.message || "Error saving result" });
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

    pipeline.push({
      $project: {
        _id: 0,
        id: '$_id',
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

router.get('/details/:id', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid result ID format' });
    }

    const result = await Result.findById(req.params.id)
      .populate('studentId', 'name enrollmentNumber');

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

        const resultToUpdate = await Result.findById(id);
        if (!resultToUpdate) {
             return res.status(404).json({ success: false, message: 'Result not found' });
        }
        
        const student = await Student.findById(resultToUpdate.studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found for the given result.' });
        }

        // Use the centralized processing function with the student object
        const updateData = processResultData(student, resultToUpdate.yearOfStudy, resultToUpdate.semester, subjects);

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
        res.status(500).json({ success: false, message: error.message || 'Error updating result' });
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