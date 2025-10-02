import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
    createResult, 
    getAllResults, 
    getResultByEnrollment, 
    getResultByEnrollmentAndSemester, 
    getResultDetails,
    updateResult,
    deleteResult 
} from '../controllers/Result.controller.js';

const router = express.Router();

router.post('/', authenticateToken, createResult);

router.get('/', authenticateToken, getAllResults);

router.get('/:enrollmentNumber', authenticateToken, getResultByEnrollment);

router.get('/:enrollmentNumber/:semester', authenticateToken, getResultByEnrollmentAndSemester);

router.get('/details/:id', authenticateToken, getResultDetails);

router.put('/:id', authenticateToken, updateResult);

router.delete('/:id', authenticateToken, deleteResult);

export default router;