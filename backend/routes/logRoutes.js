const express = require('express');
const router = express.Router();
const { getLogs, getStats } = require('../controllers/logController');

router.get('/', getLogs);
router.get('/stats', getStats);

module.exports = router;
