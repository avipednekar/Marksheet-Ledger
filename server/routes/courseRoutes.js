import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { courseData } from '../data/subjects.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { semester, department, elective } = req.query;
    const querySemester = parseInt(semester);
    
    let allCourses = [];
    
    Object.values(courseData).forEach(deptOrYear => {
        Object.values(deptOrYear).forEach(semOrGroup => {
            Object.values(semOrGroup).forEach(semCourses => {
                allCourses.push(...semCourses);
            });
        });
    });

    let filteredCourses = allCourses;

    if (semester) {
        
        
    }
    if (department) {
        
    }
    
    if (elective === 'true') {
      const electiveTypes = ['Program Elective', 'Open Elective', 'MDM'];
      filteredCourses = allCourses.filter(course => 
        electiveTypes.includes(course.courseType) && course.courseName.includes(`Semester ${querySemester}`) 
      );
    } else {
        
    }

    res.json({ success: true, courses: filteredCourses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching courses.' });
  }
});

export default router;