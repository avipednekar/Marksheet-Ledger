import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { courseData } from '../data/subjects.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { semester, department, elective } = req.query;
    const querySemester = parseInt(semester);
    
    let allCourses = [];
    // Flatten the course data into a single array
    Object.values(courseData).forEach(deptOrYear => {
        Object.values(deptOrYear).forEach(semOrGroup => {
            Object.values(semOrGroup).forEach(semCourses => {
                allCourses.push(...semCourses);
            });
        });
    });

    let filteredCourses = allCourses;

    if (semester) {
        // This is a simplified semester check; a real implementation might need to check year as well
        // For now, we assume course codes are unique enough.
    }
    if (department) {
        // This logic is complex with the nested structure, so we primarily filter by elective type
    }
    
    if (elective === 'true') {
      const electiveTypes = ['Program Elective', 'Open Elective', 'MDM'];
      filteredCourses = allCourses.filter(course => 
        electiveTypes.includes(course.courseType) && course.courseName.includes(`Semester ${querySemester}`) // Heuristic
      );
    } else {
        // Handle non-elective filtering if necessary
    }

    res.json({ success: true, courses: filteredCourses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching courses.' });
  }
});

export default router;