import express from 'express';
import Student from '../models/Student/student.model.js';
import Result from '../models/Student/result.model.js';
import { authenticateToken } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to calculate grade based on TOTAL marks (out of 100)
const calculateGrade = (totalMarks) => {
  if (totalMarks >= 90) return 'A+';
  if (totalMarks >= 80) return 'A';
  if (totalMarks >= 70) return 'B+';
  if (totalMarks >= 60) return 'B';
  if (totalMarks >= 50) return 'C+';
  if (totalMarks >= 40) return 'C';
  return 'F';
};

// --- POST /api/results ---
// Adds a new result for a student with the new evaluation criteria
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
    const percentage = subjectCount > 0 ? (grandTotalMarks / subjectCount) : 0; // Percentage is now based on total marks out of (subjects * 100)

    const newResult = await Result.create({
      studentId: student._id,
      yearOfStudy,
      academicYear,
      semester,
      examType: 'ESE', // The final result is always an ESE-type result
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

// --- Other routes (GET, PUT, DELETE) ---
// Note: The PUT route should also be updated with the same calculation logic if you allow editing subjects.
// GET and DELETE routes remain largely the same as they don't perform calculations.
// (The existing GET, PUT, DELETE routes from the previous step are assumed to be here)

// --- GET /api/results ---
// Fetches results with advanced filtering, server-side searching, and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      yearOfStudy,
      academicYear,
      semester,
      examType,
      status,
      search, // Search term from the frontend
      limit = 20, // Default limit to 20 results per page
      page = 1
    } = req.query;

    const pipeline = [];

    // Stage 1: Lookup to join with the students collection to get student details for searching
    pipeline.push({
      $lookup: {
        from: 'students', // The name of the students collection in MongoDB
        localField: 'studentId',
        foreignField: '_id',
        as: 'studentInfo'
      }
    }, {
      // Deconstruct the studentInfo array field from the input documents to output a document for each element
      $unwind: '$studentInfo'
    });

    // Stage 2: Build the match stage for filtering and searching
    const matchStage = {};
    if (yearOfStudy) matchStage.yearOfStudy = parseInt(yearOfStudy);
    if (academicYear) matchStage.academicYear = academicYear;
    if (semester) matchStage.semester = parseInt(semester);
    if (examType) matchStage.examType = examType;
    if (status) matchStage.overallStatus = status;

    // Add server-side search logic
    if (search) {
      matchStage.$or = [
        { 'studentInfo.name': { $regex: search, $options: 'i' } },
        { 'studentInfo.enrollmentNumber': { $regex: search, $options: 'i' } }
      ];
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Stage 3: Add fields to format the output to match the frontend's expectation
    pipeline.push({
      $addFields: {
        studentName: '$studentInfo.name',
        enrollmentNumber: '$studentInfo.enrollmentNumber'
      }
    });

    // Stage 4: Run a parallel query to count the total matching documents for pagination
    const total = await Result.aggregate([...pipeline, { $count: 'total' }]);
    const totalResults = total.length > 0 ? total[0].total : 0;
    const totalPages = Math.ceil(totalResults / limit);

    // Stage 5: Add sorting, skipping, and limiting for pagination
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
    pipeline.push({ $limit: parseInt(limit) });

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

// --- GET /api/results/:id ---
// Fetches a single result by its ID, populating student data
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

    // Format to match the frontend's expected flat structure
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
// --- PUT /api/results/:id ---
// Updates an existing result (functionality inferred from "Edit" button)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // If subjects are being updated, we must recalculate everything
        if (updateData.subjects) {
            const processedSubjects = new Map();
            let totalMarks = 0;
            const failedSubjects = [];

            for (const [subjectName, data] of Object.entries(updateData.subjects)) {
                const marksNum = Number(data.marks);
                const grade = calculateGrade(marksNum);
                const status = marksNum >= 40 ? 'PASS' : 'FAIL';

                processedSubjects.set(subjectName, { marks: marksNum, grade, status });
                totalMarks += marksNum;
                if (status === 'FAIL') failedSubjects.push(subjectName);
            }
            
            const subjectCount = processedSubjects.size;
            updateData.subjects = processedSubjects;
            updateData.totalMarks = totalMarks;
            updateData.percentage = subjectCount > 0 ? parseFloat(((totalMarks / (subjectCount * 100)) * 100).toFixed(2)) : 0;
            updateData.overallStatus = failedSubjects.length > 0 ? 'FAIL' : 'PASS';
            updateData.failedSubjects = failedSubjects;
            updateData.makeupRequired = failedSubjects;
        }

        const updatedResult = await Result.findByIdAndUpdate(id, updateData, {
            new: true, // Return the updated document
            runValidators: true,
        });

        if (!updatedResult) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }

        res.json({ success: true, message: 'Result updated successfully', result: updatedResult });
    } catch (error) {
        console.error('Error updating result:', error);
        res.status(500).json({ success: false, message: 'Error updating result' });
    }
});

// --- DELETE /api/results/:id ---
// Deletes a result (standard functionality for completeness)
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