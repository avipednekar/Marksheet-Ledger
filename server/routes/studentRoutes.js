import express from 'express';
// import { readDatabase, writeDatabase, generateId } from '../utils/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all students with filtering
router.get('/', authenticateToken, (req, res) => {
  try {
    const { yearOfStudy, academicYear, semester, search, department } = req.query;
    
    const db = readDatabase();
    let students = db.students;

    // Apply filters
    if (yearOfStudy) {
      students = students.filter(s => s.yearOfStudy === parseInt(yearOfStudy));
    }

    if (academicYear) {
      students = students.filter(s => s.academicYear === academicYear);
    }

    if (semester) {
      students = students.filter(s => s.semester === parseInt(semester));
    }

    if (department) {
      students = students.filter(s => s.department.toLowerCase().includes(department.toLowerCase()));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.enrollmentNumber.toLowerCase().includes(searchLower) ||
        s.email.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      students,
      total: students.length
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students'
    });
  }
});

// Get single student
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    const student = db.students.find(s => s.id === id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      student
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student'
    });
  }
});

// Add new student
router.post('/', authenticateToken, (req, res) => {
  try {
    const studentData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'enrollmentNumber', 'department', 'yearOfStudy'];
    for (const field of requiredFields) {
      if (!studentData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    const db = readDatabase();
    
    // Check for duplicate enrollment number
    const existingStudent = db.students.find(s => 
      s.enrollmentNumber === studentData.enrollmentNumber
    );
    
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student with this enrollment number already exists'
      });
    }

    const newStudent = {
      id: generateId('ST'),
      ...studentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.students.push(newStudent);
    writeDatabase(db);

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      student: newStudent
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding student'
    });
  }
});

// Update student
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const db = readDatabase();
    const studentIndex = db.students.findIndex(s => s.id === id);

    if (studentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update student
    db.students[studentIndex] = {
      ...db.students[studentIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    writeDatabase(db);

    res.json({
      success: true,
      message: 'Student updated successfully',
      student: db.students[studentIndex]
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating student'
    });
  }
});

// Delete student
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    
    const studentIndex = db.students.findIndex(s => s.id === id);
    
    if (studentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove student and related results
    db.students.splice(studentIndex, 1);
    db.results = db.results.filter(r => r.studentId !== id);
    db.makeupHistory = db.makeupHistory.filter(m => m.studentId !== id);
    
    writeDatabase(db);

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting student'
    });
  }
});

export default router;