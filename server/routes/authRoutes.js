import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher/Teacher.model.js';
import { authenticateToken } from '../middleware/auth.js';
import { registerTeacher } from '../controllers/Teacher.controller.js';

const router = express.Router();

router.route("/register").post(registerTeacher);

// ## Login route (Updated for Cookies)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const teacher = await Teacher.findOne({ email });
    if (!teacher || !(await bcrypt.compare(password, teacher.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // --- CHANGED: Access token is now short-lived ---
    const accessToken = jwt.sign(
      { id: teacher._id, email: teacher.email, fullName: teacher.fullName },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // 15 minutes is a standard, secure lifespan
    );

    const refreshToken = jwt.sign(
      { id: teacher._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    teacher.refreshToken = refreshToken;
    await teacher.save();

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' 
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' 
    });

    // --- CHANGED: Do NOT send the refresh token in the response body ---
    res.json({
      success: true,
      message: 'Login successful',
      accessToken, // Client only receives the access token
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        department: teacher.department,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ## Refresh route (Updated for Cookies)
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not found' });
  }

  try {
    const teacher = await Teacher.findOne({ refreshToken });
    if (!teacher) {
      return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err || teacher._id.toString() !== decoded.id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const accessToken = jwt.sign(
        { id: teacher._id, email: teacher.email, fullName: teacher.fullName },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } // Should also be short-lived
      );

      res.json({ success: true, accessToken });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ## Logout route (Updated for Cookies)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const teacher = req.teacher;
    teacher.refreshToken = '';
    await teacher.save();

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// This route remains unchanged
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    teacher: req.teacher,
  });
});

export default router;