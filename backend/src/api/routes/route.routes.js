const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');

router.post('/', routeController.createRoute);       // POST /api/routes
router.get('/', routeController.getRoutes);          // GET /api/routes
router.get('/:id', routeController.getRouteById);    // GET /api/routes/1
router.put('/:id', routeController.updateRoute);     // PUT /api/routes/1
router.delete('/:id', routeController.deleteRoute);  // DELETE /api/routes/1

module.exports = router;