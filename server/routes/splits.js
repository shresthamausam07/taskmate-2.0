const router = require('express').Router();
const auth = require('../middleware/auth');
const ExpenseSplit = require('../models/ExpenseSplit');

router.use(auth);

router.put('/:splitId/pay', async (req, res) => {
  try {
    const split = await ExpenseSplit.findByIdAndUpdate(req.params.splitId, { is_paid: true }, { new: true });
    res.json(split);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
