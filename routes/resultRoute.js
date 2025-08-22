

const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const parentController = require('../controllers/parentsController');
const { 
    authenticateToken, 
    authenticateAdminOnly,
    requireStudent 
} = require('../middleware/auth');

// Rate limiting middleware
const rateLimit = require('express-rate-limit');

// Rate limit for parent login attempts
const parentLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many login attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ===== STUDENT ROUTES =====
// Students can only submit/access their own results
router.post('/submit/:examId', authenticateToken, requireStudent, resultController.submitExam);
router.get('/exam/:examId', authenticateToken, requireStudent, resultController.getExamResult);
router.get('/student/all', authenticateToken, requireStudent, resultController.getStudentResults);

// ===== ADMIN ROUTES =====
// Admin can access all results
router.get('/admin/exam/:examId', authenticateAdminOnly, resultController.getExamResults);
router.delete('/admin/:submissionId', authenticateAdminOnly, resultController.deleteSubmission);

// ===== PARENT ROUTES =====
// Parent login - validates child's credentials (no authentication required)
router.post('/parent/login',  parentController.parentLogin);

// Get all results for a specific student (no authentication required after login)
router.get('/parent/:studentId', parentController.getStudentResults);

// Get detailed result for a specific exam submission
router.get('/parent/:studentId/submission/:submissionId', parentController.getDetailedResult);

// Get performance analytics for parent dashboard
router.get('/parent/:studentId/analytics', parentController.getPerformanceAnalytics);

module.exports = router;



