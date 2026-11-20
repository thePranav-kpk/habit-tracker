const express = require('express');
const router = express.Router();
const {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabit,
  completeToday,
  snoozeHabit
} = require('../controllers/habitController');

router.route('/')
  .get(getHabits)
  .post(createHabit);

router.route('/:id')
  .put(updateHabit)
  .delete(deleteHabit);

router.post('/:id/toggle', toggleHabit);
router.post('/:id/complete-today', completeToday);
router.post('/:id/snooze', snoozeHabit);

module.exports = router;
