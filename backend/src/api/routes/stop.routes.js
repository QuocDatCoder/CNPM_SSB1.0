const express = require('express');
const router = express.Router();
const stopController = require('../controllers/stop.controller');

router.post('/', stopController.createStop);         // POST /api/stops
router.get('/', stopController.getAllStops);         // GET /api/stops
router.get('/:id', stopController.getStopById);      // GET /api/stops/1
router.put('/:id', stopController.updateStop);       // PUT /api/stops/1
router.delete('/:id', stopController.deleteStop);    // DELETE /api/stops/1

module.exports = router;