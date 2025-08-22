import express from 'express';
import Student from '../models/Student/student.model.js';
import Result from '../models/Student/result.model.js';
import MakeupHistory from '../models/Student/makeup.model.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all students with filtering and searching
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { yearOfStudy, academicYear, department, search } = req.query;
    const filter = {};

    if (yearOfStudy) filter.yearOfStudy = yearOfStudy;
    if (academicYear) filter.academicYear = academicYear;
    if (department) filter.department = department;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { enrollmentNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      students,
      total: students.length,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Error fetching students' });
  }
});

// Add new student
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { enrollmentNumber, email } = req.body;

    // Check for duplicate enrollment number or email
    const existingStudent = await Student.findOne({ $or: [{ enrollmentNumber }, { email }] });
    if (existingStudent) {
      const message = existingStudent.enrollmentNumber === enrollmentNumber
        ? 'Student with this enrollment number already exists'
        : 'Student with this email already exists';
      return res.status(409).json({ success: false, message });
    }

    const newStudent = await Student.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      student: newStudent,
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ success: false, message: 'Error adding student' });
  }
});

// Update student
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      student: updatedStudent,
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Error updating student' });
  }
});

// Delete student
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Delete student and all related data
    await Result.deleteMany({ studentId });
    await MakeupHistory.deleteMany({ studentId });
    await Student.findByIdAndDelete(studentId);

    res.json({ success: true, message: 'Student and all related results deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Error deleting student' });
  }
});

export default router;