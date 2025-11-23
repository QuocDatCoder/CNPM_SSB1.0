const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');

router.get('/', routeController.getAllRoutes );          // GET /api/routes
router.get('/:id', routeController.getRouteById);    // GET /api/routes/1
router.get('/:id/stops', routeController.getStopsOfRoute); // GET /api/routes/1/stops

module.exports = router;