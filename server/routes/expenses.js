const router = require('express').Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const ExpenseSplit = require('../models/ExpenseSplit');
const Household = require('../models/Household');

router.use(auth);

// Net balance across all group expenses for the current user
router.get('/group-balance', async (req, res) => {
  try {
    const households = await Household.find({ members: req.user.id });
    const householdIds = households.map((h) => h._id);
    const expenses = await Expense.find({ household_id: { $in: householdIds } });
    const expenseIds = expenses.map((e) => e._id);
    const splits = await ExpenseSplit.find({ expense_id: { $in: expenseIds } });

    let balance = 0;
    expenses.forEach((exp) => {
      const iAmPayer = exp.payer_id.toString() === req.user.id;
      if (iAmPayer) {
        splits.forEach((s) => {
          if (s.expense_id.toString() === exp._id.toString() &&
              s.user_id.toString() !== req.user.id &&
              !s.is_paid) {
            balance += s.amount_owed;
          }
        });
      } else {
        const mySplit = splits.find(
          (s) => s.expense_id.toString() === exp._id.toString() && s.user_id.toString() === req.user.id
        );
        if (mySplit && !mySplit.is_paid) balance -= mySplit.amount_owed;
      }
    });

    res.json({ balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
    const { household_id, amount, description, category, paid_by_id, split_among } = req.body;
    const household = await Household.findById(household_id);
    if (!household) return res.status(404).json({ message: 'Group not found' });

    const payer = paid_by_id || req.user.id;
    const expense = await Expense.create({ household_id, payer_id: payer, amount, description, category });

    // Use provided split_among list, or fall back to all household members
    const memberIds = (split_among && split_among.length > 0)
      ? split_among
      : household.members.map((m) => m.toString());

    const splitAmount = parseFloat((amount / memberIds.length).toFixed(2));
    const splits = memberIds.map((memberId) => ({
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

router.put('/:id', async (req, res) => {
  try {
    const { amount, description, category, paid_by_id, split_among } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Not found' });

    if (description) expense.description = description;
    if (amount)      expense.amount = parseFloat(amount);
    if (category)    expense.category = category;
    if (paid_by_id)  expense.payer_id = paid_by_id;
    await expense.save();

    const payer = expense.payer_id.toString();
    const memberIds = split_among && split_among.length > 0
      ? split_among
      : (await Household.findById(expense.household_id))?.members.map((m) => m.toString()) || [];

    await ExpenseSplit.deleteMany({ expense_id: expense._id });
    const splitAmount = parseFloat((expense.amount / memberIds.length).toFixed(2));
    await ExpenseSplit.insertMany(memberIds.map((memberId) => ({
      expense_id: expense._id,
      user_id: memberId,
      amount_owed: splitAmount,
      is_paid: memberId.toString() === payer,
    })));

    await expense.populate('payer_id', 'name email');
    res.json(expense);
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

router.put('/settle-all/:householdId', async (req, res) => {
  try {
    const expenses = await Expense.find({ household_id: req.params.householdId });
    const expenseIds = expenses.map((e) => e._id);
    await ExpenseSplit.updateMany(
      { expense_id: { $in: expenseIds }, user_id: req.user.id, is_paid: false },
      { is_paid: true }
    );
    res.json({ message: 'Settled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
