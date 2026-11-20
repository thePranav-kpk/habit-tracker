const express = require('express');
const router = express.Router();
const {
  getVapidKey,
  subscribe,
  unsubscribe,
  sendTest,
  getMobileInfo
} = require('../controllers/notificationController');

router.get('/vapid-key', getVapidKey);
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.post('/test', sendTest);
router.get('/mobile-info', getMobileInfo);

module.exports = router;
