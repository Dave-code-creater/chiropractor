const { Router } = require('express');
const AuthController = require('../controllers/auth.controller.js');
const asyncHandler = require('../helper/asyncHandler.js');

const router = Router();

router.post('/register', asyncHandler(AuthController.register));
router.post('/login', asyncHandler(AuthController.login));
router.post('/refresh', asyncHandler(AuthController.refresh));
router.post('/logout', asyncHandler(AuthController.logout));
router.post('/verify', asyncHandler(AuthController.verify));
router.post('/forgot-password', asyncHandler(AuthController.forgotPassword));
router.get('/users/:id', asyncHandler(AuthController.getUser));
router.put('/users/:id', asyncHandler(AuthController.updateUser));
router.delete('/users/:id', asyncHandler(AuthController.deleteUser));

module.exports = router;
