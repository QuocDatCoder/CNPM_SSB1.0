import express from 'express';
import { updateLocation, updateStudentStatus } from '../controllers/tracking.controller.js';
import { verifyToken, isDriver } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Endpoint cập nhật vị trí xe (chỉ tài xế được phép)
router.post('/location', verifyToken, isDriver, updateLocation);

// Endpoint cập nhật trạng thái học sinh (chỉ tài xế được phép)
router.post('/student-status', verifyToken, isDriver, updateStudentStatus);

export default router;
