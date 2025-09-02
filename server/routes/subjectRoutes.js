// routes/subjectRoutes.js
import express from 'express';
import { getSubjectsForStudent } from '../utils/subjectHelper.js';
import { authenticateToken } from '../middleware/auth.js';
import Student from '../models/Student/student.model.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  const { enrollmentNumber, semester, year } = req.query;

  if (!enrollmentNumber || !semester) {
    return res.status(400).json({ success: false, message: 'Enrollment number and semester are required.' });
  }

  try {
    const student = await Student.findOne({ enrollmentNumber });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const semesterNum = parseInt(semester);
    const subjects = getSubjectsForStudent(student, semesterNum,year);

    if (!subjects || subjects.length === 0) {
      return res.status(404).json({ success: false, message: 'No subjects found for this student/semester.' });
    }

    res.json({ success: true, subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ success: false, message: 'Error fetching subjects' });
  }
});

export default router;