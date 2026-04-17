const express = require('express');
const router = express.Router();
const { getLogs, createLog, updateLog, deleteLog } = require('../controllers/calendarController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getLogs)
  .post(protect, createLog);
  
router.route('/:id')
  .put(protect, updateLog)
  .delete(protect, deleteLog);

module.exports = router;
