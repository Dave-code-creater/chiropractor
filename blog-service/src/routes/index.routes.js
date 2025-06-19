const { Router } = require('express');
const healthRoutes = require('./health.routes.js');
const postRoutes = require('./posts.routes.js');

const router = Router();

router.use('/', healthRoutes);
router.use('/', postRoutes);

module.exports = router;
