const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const doctorController = require('../controllers/doctor.controller');

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Doctor-facing endpoints for patient management and reporting
 */

// All doctor routes require authentication and doctor role
router.use(authenticate);
router.use(authorize(['doctor']));

/**
 * @swagger
 * /doctors/{doctorId}/patients:
 *   get:
 *     summary: Get patients assigned to the doctor
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
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
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/:doctorId/patients', doctorController.getDoctorPatients);

/**
 * @swagger
 * /doctors/{doctorId}/patients/{patientId}:
 *   get:
 *     summary: Get details for a specific patient assigned to the doctor
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patient details retrieved successfully
 *       404:
 *         description: Patient not found
 */
router.get('/:doctorId/patients/:patientId', doctorController.getPatientDetails);

/**
 * @swagger
 * /doctors/{doctorId}/stats:
 *   get:
 *     summary: Get doctor dashboard statistics
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           example: "last_30_days"
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/:doctorId/stats', doctorController.getDoctorStats);

module.exports = router;
