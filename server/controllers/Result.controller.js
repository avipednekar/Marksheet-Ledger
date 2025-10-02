import Student from '../models/Student/student.model.js';
import Result from '../models/Student/result.model.js';
import mongoose from 'mongoose';
import { getSubjectsForStudent } from '../utils/subjectHelper.js';

const calculateGrade = (totalMarks) => {
  if (totalMarks >= 90) return 'A+';
  if (totalMarks >= 80) return 'A';
  if (totalMarks >= 70) return 'B+';
  if (totalMarks >= 60) return 'B';
  if (totalMarks >= 50) return 'C+';
  if (totalMarks >= 40) return 'C';
  return 'F';
};

const processResultData = (student, yearOfStudy, semester, subjects, extraSubjects = []) => {
  const processedSubjects = new Map();
  let grandTotalMarks = 0;
  let grandTotalMaxMarks = 0; 
  const failedSubjects = [];

  // Core subjects data based on student's curriculum
  const subjectsData = getSubjectsForStudent(student, semester, yearOfStudy) || [];

  // Merge in electives / MDM (if passed separately)
  const mergedSubjectsData = [...subjectsData, ...extraSubjects];
  const courseMap = new Map(mergedSubjectsData.map(course => [course.courseName, course]));

  for (const [subjectName, marks] of Object.entries(subjects)) {
    const subjectConfig = courseMap.get(subjectName);

    if (!subjectConfig) {
      console.warn(`⚠ Subject '${subjectName}' not found in course map (likely elective/MDM).`);
      continue; // Skip subjects not configured in the curriculum
    }

    let totalMarks = 0;
    let subjectMaxMarks = 0; 
    let isPassing = true;
    const componentMarks = new Map();

    subjectConfig.evaluationScheme.forEach(scheme => {
      // Normalize key for input matching (e.g., 'internalAssessment' -> 'internalassessment')
      const key = scheme.name.toLowerCase().replace(/[^a-z]/g, '');
      const studentMark = Number(marks[key]) || 0;

      subjectMaxMarks += scheme.maxMarks;

      // Check for component-level passing marks
      if (studentMark < (scheme.minPassingMarks || 0)) {
        isPassing = false;
      }

      totalMarks += studentMark;
      componentMarks.set(scheme.name, studentMark);
    });

    // Check for overall subject passing marks
    if (totalMarks < subjectConfig.minForPassing) {
      isPassing = false;
    }

    const status = isPassing ? 'PASS' : 'FAIL';
    const grade = calculateGrade((totalMarks / subjectMaxMarks) * 100);

    if (status === 'FAIL') failedSubjects.push(subjectName);

    processedSubjects.set(subjectName, {
      componentMarks: Object.fromEntries(componentMarks), // Convert map to plain object for schema
      total: totalMarks,
      grade,
      status,
      maxMarks: subjectMaxMarks // Include max marks for better context
    });

    grandTotalMarks += totalMarks;
    grandTotalMaxMarks += subjectMaxMarks;
  }

  return {
    subjects: Object.fromEntries(processedSubjects),
    totalMarks: grandTotalMarks,
    percentage: grandTotalMaxMarks ? (grandTotalMarks / grandTotalMaxMarks) * 100 : 0,
    overallStatus: failedSubjects.length ? 'FAIL' : 'PASS',
    failedSubjects,
    makeupRequired: failedSubjects
  };
};

export const createResult = async (req, res) => {
  try {
    const { enrollmentNumber, semester, subjects, yearOfStudy, academicYear, examType } = req.body;

    if (!enrollmentNumber || !semester || !subjects || !yearOfStudy || !academicYear || !examType) {
      return res.status(400).json({ success: false, message: "Missing required fields for creating a result." });
    }

    const student = await Student.findOne({ enrollmentNumber });
    if (!student) {
      return res.status(404).json({ success: false, message: `Student with enrollment '${enrollmentNumber}' not found` });
    }
    
    // Check if a result already exists to prevent duplicates for the given semester
    const existingResult = await Result.findOne({ studentId: student._id, semester: parseInt(semester) });
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
};

export const getAllResults = async (req, res) => {
  try {
    const { yearOfStudy, academicYear, semester, examType, status, search, limit = 20, page = 1 } = req.query;

    const pipeline = [];

    // 1. Join with Student collection
    pipeline.push({
      $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'studentInfo' }
    }, {
      $unwind: '$studentInfo'
    });

    // 2. Build Match Stage for filtering/searching
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

    // 3. Count total documents before pagination
    const total = await Result.aggregate([...pipeline, { $count: 'total' }]);
    const totalResults = total.length > 0 ? total[0].total : 0;
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    // 4. Sorting and Pagination
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
    pipeline.push({ $limit: parseInt(limit) });

    // 5. Projection
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
};

export const getResultByEnrollment = async (req, res) => {
  try {
    const results = await Result.find({ enrollmentNumber: req.params.enrollmentNumber }).sort({ semester: 1 });

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: "No results found for this enrollment number" });
    }
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching results" });
  }
};

export const getResultByEnrollmentAndSemester = async (req, res) => {
  try {
    const { enrollmentNumber, semester } = req.params;
    const result = await Result.findOne({ enrollmentNumber, semester: parseInt(semester) });

    if (!result) {
      return res.status(404).json({ success: false, message: "Result not found for the given enrollment and semester" });
    }
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching result" });
  }
};

export const getResultDetails = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid result ID format' });
    }

    const result = await Result.findById(req.params.id)
      .populate('studentId', 'name enrollmentNumber');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    // Format output to include student name and enrollment number directly
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
};

export const updateResult = async (req, res) => {
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

        // Recalculate all marks, grades, and status based on the new subjects data
        const updateData = processResultData(student, resultToUpdate.yearOfStudy, resultToUpdate.semester, subjects);

        const updatedResult = await Result.findByIdAndUpdate(id, updateData, {
            new: true, // Return the updated document
            runValidators: true,
        }).populate('studentId', 'name enrollmentNumber');

        if (!updatedResult) {
            // Should theoretically not happen if resultToUpdate passed, but good for safety
            return res.status(404).json({ success: false, message: 'Result not found after update attempt.' });
        }
        
        // Format output
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
};

export const deleteResult = async (req, res) => {
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
};