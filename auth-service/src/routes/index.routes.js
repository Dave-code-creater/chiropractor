const { Router } = require('express');
const healthRoutes = require('./health.routes.js');
const authRoutes = require('./auth.routes.js');

const router = Router();
router.use('/', healthRoutes);
router.use('/', authRoutes);

module.exports = router;
