const router = require('express').Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const ExpenseSplit = require('../models/ExpenseSplit');
const Household = require('../models/Household');

router.use(auth);

router.get('/:householdId', async (req, res) => {
  try {
    const expenses = await Expense.find({ household_id: req.params.householdId })
      .populate('payer_id', 'name email')
      .sort({ date: -1 });
    const ids = expenses.map((e) => e._id);
    const splits = await ExpenseSplit.find({ expense_id: { $in: ids } }).populate('user_id', 'name email');
    const result = expenses.map((e) => ({
      ...e.toObject(),
      splits: splits.filter((s) => s.expense_id.toString() === e._id.toString()),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { household_id, amount, description, category, paid_by_id } = req.body;
    const household = await Household.findById(household_id);
    if (!household) return res.status(404).json({ message: 'Group not found' });

    const payer = paid_by_id || req.user.id;
    const expense = await Expense.create({ household_id, payer_id: payer, amount, description, category });

    const splitAmount = parseFloat((amount / household.members.length).toFixed(2));
    const splits = household.members.map((memberId) => ({
      expense_id: expense._id,
      user_id: memberId,
      amount_owed: splitAmount,
      is_paid: memberId.toString() === payer.toString(),
    }));
    await ExpenseSplit.insertMany(splits);

    await expense.populate('payer_id', 'name email');
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    await ExpenseSplit.deleteMany({ expense_id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/splits/:splitId/pay', async (req, res) => {
  try {
    const split = await ExpenseSplit.findByIdAndUpdate(req.params.splitId, { is_paid: true }, { new: true });
    res.json(split);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
