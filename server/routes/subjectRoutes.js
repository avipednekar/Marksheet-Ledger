// routes/subjectRoutes.js
import express from 'express';
import { subjectMappings } from '../data/subjects.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const circuitBranches = ["Computer Science", "AIML", "Electronics", "Electrical", "Information Technology"];
const coreBranches = ["Civil", "Mechanical", "Biotechnology", "Civil and Environment"];

router.get('/', authenticateToken, (req, res) => {
  const { year, semester, department } = req.query;

  if (!year || !semester || !department) {
    return res.status(400).json({ success: false, message: 'Year, semester, and department are required.' });
  }

  try {
    let subjects = [];
    const yearNum = parseInt(year);
    const semesterNum = parseInt(semester);

    if (yearNum === 1) {
      let group = circuitBranches.includes(department) ? 'Circuit' : (coreBranches.includes(department) ? 'Core' : '');
      if (group) {
        subjects = subjectMappings[1]?.[group]?.[semesterNum] || [];
      }
    } else {
      subjects = subjectMappings[yearNum]?.[department]?.[semesterNum] || [];
    }

    if (subjects.length === 0) {
      return res.status(404).json({ success: false, message: 'No subjects found for the selected criteria. Please add them manually.' });
    }
    res.json({ success: true, subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching subjects.' });
  }
});

export default router;