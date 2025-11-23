const express = require('express');
const router = express.Router();
const busController = require('../controllers/bus.controller');

router.get('/', busController.getAllBuses);      // GET /api/buses
router.post('/', busController.createBus);       // POST /api/buses
router.put('/:id', busController.updateBus);     // PUT /api/buses/1
router.delete('/:id', busController.deleteBus);  // DELETE /api/buses/1

module.exports = router;