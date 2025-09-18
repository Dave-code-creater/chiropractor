const express = require('express');
const UserController = require('../controllers/user.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Patient administration and profile management endpoints
 */

// Patient management
/**
 * @swagger
 * /users/patients:
 *   post:
 *     summary: Create a new patient record
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientCreateRequest'
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 */
router.post('/patients', authenticate, authorize('doctor', 'admin'), asyncHandler(UserController.createPatient));
/**
 * @swagger
 * /users/patients:
 *   get:
 *     summary: Get all patients
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/patients', authenticate, authorize('doctor'), asyncHandler(UserController.getAllPatients));
/**
 * @swagger
 * /users/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient retrieved successfully
 *       404:
 *         description: Patient not found
 */
router.get('/patients/:id', authenticate, authorize('doctor', 'admin', 'patient'), asyncHandler(UserController.getPatientById));
/**
 * @swagger
 * /users/patients/{id}:
 *   put:
 *     summary: Update patient information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientUpdateRequest'
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       404:
 *         description: Patient not found
 */
router.put('/patients/:id', authenticate, authorize('doctor', 'admin'), asyncHandler(UserController.updatePatient));
/**
 * @swagger
 * /users/patients/{id}/clinical-notes:
 *   post:
 *     summary: Add clinical notes for a patient
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClinicalNoteRequest'
 *     responses:
 *       201:
 *         description: Clinical note added successfully
 */
router.post('/patients/:id/clinical-notes', authenticate, authorize('doctor', 'admin'), asyncHandler(UserController.addClinicalNotes));
/**
 * @swagger
 * /users/patients/{id}/clinical-notes:
 *   get:
 *     summary: Get clinical notes for a patient
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Clinical notes retrieved successfully
 */
router.get('/patients/:id/clinical-notes', authenticate, authorize('doctor', 'admin', 'patient'), asyncHandler(UserController.getClinicalNotes));

// User profile
/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile', authenticate, asyncHandler(UserController.getProfile));
/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdateRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticate, asyncHandler(UserController.updateProfile));

module.exports = router; 
