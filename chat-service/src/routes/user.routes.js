const { Router } = require('express');
const UserController = require('../controllers/user.controller.js');

const router = Router();

// Public webhook endpoint for auto-registration (no JWT required)
router.post('/auto-register', UserController.autoRegister);

// Simple JWT middleware inline to avoid import issues
const jwtAuth = (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected routes (require JWT)
router.use(jwtAuth);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get('/profile', UserController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', UserController.updateProfile);

/**
 * @swagger
 * /users/online-status:
 *   put:
 *     summary: Set online status
 *     responses:
 *       200:
 *         description: Online status updated
 */
router.put('/online-status', UserController.setOnlineStatus);

/**
 * @swagger
 * /users/doctors:
 *   get:
 *     summary: Get all doctors
 *     responses:
 *       200:
 *         description: List of doctors
 */
router.get('/doctors', UserController.getDoctors);

/**
 * @swagger
 * /users/staff:
 *   get:
 *     summary: Get all staff members
 *     responses:
 *       200:
 *         description: List of staff members
 */
router.get('/staff', UserController.getStaff);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search users
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', UserController.searchUsers);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/:userId', UserController.getUserById);

module.exports = router; 