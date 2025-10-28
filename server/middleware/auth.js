import jwt from 'jsonwebtoken';
import Teacher from '../models/Teacher/Teacher.model.js'; 
 
export const authenticateToken = async (req, res, next) => {
  try {
    
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    
    const teacher = await Teacher.findById(decoded.id).select('-password');

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - teacher not found'
      });
    }

    
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