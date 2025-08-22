import express from 'express';
// import { readDatabase, writeDatabase, generateId } from '../utils/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Calculate grade based on marks
const calculateGrade = (marks) => {
  if (marks >= 90) return 'A+';
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B+';
  if (marks >= 60) return 'B';
  if (marks >= 50) return 'C+';
  if (marks >= 40) return 'C';
  return 'F';
};

// Get results with advanced filtering
router.get('/', authenticateToken, (req, res) => {
  try {
    const { 
      yearOfStudy, 
      academicYear, 
      semester, 
      examType, 
      studentId,
      status,
      limit = 50,
      page = 1 
    } = req.query;
    
    const db = readDatabase();
    let results = db.results;

    // Apply filters
    if (yearOfStudy) {
      results = results.filter(r => r.yearOfStudy === parseInt(yearOfStudy));
    }

    if (academicYear) {
      results = results.filter(r => r.academicYear === academicYear);
    }

    if (semester) {
      results = results.filter(r => r.semester === parseInt(semester));
    }

    if (examType) {
      results = results.filter(r => r.examType === examType);
    }

    if (studentId) {
      results = results.filter(r => r.studentId === studentId);
    }

    if (status) {
      results = results.filter(r => r.overallStatus === status);
    }

    // Populate student data
    results = results.map(result => {
      const student = db.students.find(s => s.id === result.studentId);
      return {
        ...result,
        studentName: student?.name || 'Unknown',
        enrollmentNumber: student?.enrollmentNumber || 'Unknown'
      };
    });

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = results.slice(startIndex, endIndex);

    res.json({
      success: true,
      results: paginatedResults,
      total: results.length,
      page: parseInt(page),
      totalPages: Math.ceil(results.length / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching results'
    });
  }
});

// Get single result
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    const result = db.results.find(r => r.id === id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Populate student data
    const student = db.students.find(s => s.id === result.studentId);
    const populatedResult = {
      ...result,
      studentName: student?.name || 'Unknown',
      enrollmentNumber: student?.enrollmentNumber || 'Unknown'
    };

    res.json({
      success: true,
      result: populatedResult
    });
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching result'
    });
  }
});

// Add new result
router.post('/', authenticateToken, (req, res) => {
  try {
    const resultData = req.body;
    
    // Validate required fields
    const requiredFields = ['studentId', 'yearOfStudy', 'academicYear', 'semester', 'examType', 'subjects'];
    for (const field of requiredFields) {
      if (!resultData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    const db = readDatabase();
    
    // Check if student exists
    const student = db.students.find(s => s.id === resultData.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check for duplicate result entry
    const existingResult = db.results.find(r => 
      r.studentId === resultData.studentId &&
      r.yearOfStudy === resultData.yearOfStudy &&
      r.academicYear === resultData.academicYear &&
      r.semester === resultData.semester &&
      r.examType === resultData.examType
    );

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message: 'Result already exists for this student and exam'
      });
    }

    // Process subjects and calculate grades
    const processedSubjects = {};
    let totalMarks = 0;
    let failedSubjects = [];
    let makeupRequired = [];

    Object.entries(resultData.subjects).forEach(([subject, data]) => {
      const marks = parseInt(data.marks || data);
      const grade = calculateGrade(marks);
      const status = marks >= 40 ? 'PASS' : 'FAIL';
      
      processedSubjects[subject] = {
        marks,
        grade,
        status
      };
      
      totalMarks += marks;
      
      if (status === 'FAIL') {
        failedSubjects.push(subject);
        makeupRequired.push(subject);
      }
    });

    const subjectCount = Object.keys(processedSubjects).length;
    const percentage = (totalMarks / (subjectCount * 100)) * 100;
    const overallStatus = failedSubjects.length > 0 ? 'FAIL' : 'PASS';

    const newResult = {
      id: generateId('R'),
      studentId: resultData.studentId,
      yearOfStudy: parseInt(resultData.yearOfStudy),
      academicYear: resultData.academicYear,
      semester: parseInt(resultData.semester),
      examType: resultData.examType,
      subjects: processedSubjects,
      overallStatus,
      totalMarks,
      percentage: parseFloat(percentage.toFixed(2)),
      failedSubjects,
      makeupRequired,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.results.push(newResult);
    writeDatabase(db);

    res.status(201).json({
      success: true,
      message: 'Result added successfully',
      result: newResult
    });
  } catch (error) {
    console.error('Error adding result:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding result'
    });
  }
});

// Update result
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const db = readDatabase();
    const resultIndex = db.results.findIndex(r => r.id === id);

    if (resultIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Process updated subjects if provided
    if (updateData.subjects) {
      const processedSubjects = {};
      let totalMarks = 0;
      let failedSubjects = [];
      let makeupRequired = [];

      Object.entries(updateData.subjects).forEach(([subject, data]) => {
        const marks = parseInt(data.marks || data);
        const grade = calculateGrade(marks);
        const status = marks >= 40 ? 'PASS' : 'FAIL';
        
        processedSubjects[subject] = {
          marks,
          grade,
          status
        };
        
        totalMarks += marks;
        
        if (status === 'FAIL') {
          failedSubjects.push(subject);
          makeupRequired.push(subject);
        }
      });

      const subjectCount = Object.keys(processedSubjects).length;
      const percentage = (totalMarks / (subjectCount * 100)) * 100;
      const overallStatus = failedSubjects.length > 0 ? 'FAIL' : 'PASS';

      updateData.subjects = processedSubjects;
      updateData.totalMarks = totalMarks;
      updateData.percentage = parseFloat(percentage.toFixed(2));
      updateData.overallStatus = overallStatus;
      updateData.failedSubjects = failedSubjects;
      updateData.makeupRequired = makeupRequired;
    }

    // Update result
    db.results[resultIndex] = {
      ...db.results[resultIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    writeDatabase(db);

    res.json({
      success: true,
      message: 'Result updated successfully',
      result: db.results[resultIndex]
    });
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating result'
    });
  }
});

// Get makeup exam tracking for a student
router.get('/makeup-tracking/:studentId', authenticateToken, (req, res) => {
  try {
    const { studentId } = req.params;
    const db = readDatabase();

    // Get all failed results for the student
    const failedResults = db.results.filter(r => 
      r.studentId === studentId && r.overallStatus === 'FAIL'
    );

    // Get makeup history for the student
    const makeupHistory = db.makeupHistory.filter(m => m.studentId === studentId);

    // Organize makeup data by subject
    const makeupTracking = {};
    
    failedResults.forEach(result => {
      result.failedSubjects.forEach(subject => {
        if (!makeupTracking[subject]) {
          makeupTracking[subject] = {
            subject,
            originalResultId: result.id,
            originalExamType: result.examType,
            originalMarks: result.subjects[subject].marks,
            attempts: [],
            status: 'PENDING',
            maxAttempts: 3
          };
        }

        // Add makeup attempts for this subject
        const subjectMakeups = makeupHistory.filter(m => 
          m.subject === subject && m.originalResultId === result.id
        );
        
        makeupTracking[subject].attempts = subjectMakeups;
        
        // Update status based on latest attempt
        if (subjectMakeups.length > 0) {
          const latestAttempt = subjectMakeups[subjectMakeups.length - 1];
          makeupTracking[subject].status = latestAttempt.status;
        }
      });
    });

    res.json({
      success: true,
      studentId,
      makeupTracking: Object.values(makeupTracking)
    });
  } catch (error) {
    console.error('Error fetching makeup tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching makeup tracking'
    });
  }
});

// Add makeup exam result
router.post('/makeup', authenticateToken, (req, res) => {
  try {
    const { studentId, originalResultId, subject, marks, examDate } = req.body;

    if (!studentId || !originalResultId || !subject || marks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const db = readDatabase();

    // Check if original result exists
    const originalResult = db.results.find(r => r.id === originalResultId);
    if (!originalResult) {
      return res.status(404).json({
        success: false,
        message: 'Original result not found'
      });
    }

    // Count existing attempts for this subject
    const existingAttempts = db.makeupHistory.filter(m => 
      m.studentId === studentId && 
      m.originalResultId === originalResultId && 
      m.subject === subject
    ).length;

    if (existingAttempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum makeup attempts (3) reached for this subject'
      });
    }

    const marksInt = parseInt(marks);
    const grade = calculateGrade(marksInt);
    const status = marksInt >= 40 ? 'PASS' : 'FAIL';

    const makeupRecord = {
      id: generateId('MH'),
      studentId,
      originalResultId,
      subject,
      attemptNumber: existingAttempts + 1,
      examDate: examDate || new Date().toISOString(),
      marks: marksInt,
      grade,
      status,
      createdAt: new Date().toISOString()
    };

    db.makeupHistory.push(makeupRecord);

    // If passed, update the original result
    if (status === 'PASS') {
      const resultIndex = db.results.findIndex(r => r.id === originalResultId);
      if (resultIndex !== -1) {
        // Update subject status in original result
        db.results[resultIndex].subjects[subject] = {
          ...db.results[resultIndex].subjects[subject],
          marks: marksInt,
          grade,
          status: 'PASS'
        };

        // Remove from failed subjects and makeup required
        db.results[resultIndex].failedSubjects = db.results[resultIndex].failedSubjects.filter(s => s !== subject);
        db.results[resultIndex].makeupRequired = db.results[resultIndex].makeupRequired.filter(s => s !== subject);

        // Update overall status if no more failed subjects
        if (db.results[resultIndex].failedSubjects.length === 0) {
          db.results[resultIndex].overallStatus = 'PASS';
        }

        db.results[resultIndex].updatedAt = new Date().toISOString();
      }
    }

    writeDatabase(db);

    res.status(201).json({
      success: true,
      message: 'Makeup exam result added successfully',
      makeupRecord
    });
  } catch (error) {
    console.error('Error adding makeup result:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding makeup result'
    });
  }
});

export default router;