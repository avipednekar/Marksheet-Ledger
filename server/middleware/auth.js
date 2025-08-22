import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher/Teacher.model.js'; // <-- Import the Mongoose model

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify teacher exists using the Mongoose Teacher model
    // Mongoose's findById is cleaner and handles string-to-ObjectId conversion
    const teacher = await Teacher.findById(decoded.id).select('-password');

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - teacher not found'
      });
    }

    // Attach the Mongoose document to the request object
    req.teacher = teacher;

    next();
  } catch (error) {
    console.error('Token verification error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};