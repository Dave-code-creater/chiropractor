const { Router } = require('express');
const {
  getAllDoctors,
  getDoctorById,
  getDoctorProfile,
  createDoctor,
  updateDoctor,
  updateDoctorProfile,
  deleteDoctor,
  getDoctorAvailability,
  setDoctorAvailability,
  setOwnAvailability,
  getAllSpecializations,
  searchDoctors,
  getAvailableDoctors
} = require('../controllers/doctor.controller.js');

const asyncHandler = require('../helper/asyncHandler.js');
const { verifyToken, requireRole } = require('../middlewares/jwt.middleware.js');

const router = Router();

// Public routes (no authentication required)
router.get('/', asyncHandler(getAllDoctors)); // GET /doctors
router.get('/search', asyncHandler(searchDoctors)); // GET /doctors/search?q=term
router.get('/available', asyncHandler(getAvailableDoctors)); // GET /doctors/available?date=2024-01-01&time=10:00
router.get('/specializations', asyncHandler(getAllSpecializations)); // GET /doctors/specializations
router.get('/:id', asyncHandler(getDoctorById)); // GET /doctors/:id
router.get('/:id/availability', asyncHandler(getDoctorAvailability)); // GET /doctors/:id/availability

// Protected routes (authentication required)
router.use(verifyToken); // All routes below require authentication

// Doctor profile routes (for authenticated doctors)
router.get('/profile/me', asyncHandler(getDoctorProfile)); // GET /doctors/profile/me
router.put('/profile/me', asyncHandler(updateDoctorProfile)); // PUT /doctors/profile/me
router.put('/profile/availability', asyncHandler(setOwnAvailability)); // PUT /doctors/profile/availability

// Admin/Staff routes (for managing doctors)
router.post('/', requireRole(['admin', 'staff']), asyncHandler(createDoctor)); // POST /doctors
router.put('/:id', requireRole(['admin', 'staff']), asyncHandler(updateDoctor)); // PUT /doctors/:id
router.delete('/:id', requireRole(['admin', 'staff']), asyncHandler(deleteDoctor)); // DELETE /doctors/:id
router.put('/:id/availability', requireRole(['admin', 'staff']), asyncHandler(setDoctorAvailability)); // PUT /doctors/:id/availability

module.exports = router; 