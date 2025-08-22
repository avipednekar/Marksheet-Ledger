import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher/Teacher.model.js';
import { authenticateToken } from '../middleware/auth.js';
import { registerTeacher } from '../controllers/Teacher.controller.js';

const router = express.Router();

router.route("/register").post(registerTeacher);

// ## Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // 2. Find the teacher in MongoDB
    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
    
    // 3. Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, teacher.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // 4. Create JWT token
    const token = jwt.sign(
      { 
        id: teacher._id, // <-- Use teacher._id from MongoDB
        email: teacher.email,
        name: teacher.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


// router.get('/verify', authenticateToken, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Token is valid',
//     teacher: req.teacher,
//   });
// });

router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

export default router;