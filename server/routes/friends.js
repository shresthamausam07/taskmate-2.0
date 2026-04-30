const router = require('express').Router();
const auth = require('../middleware/auth');
const Friendship = require('../models/Friendship');
const Expense = require('../models/Expense');
const ExpenseSplit = require('../models/ExpenseSplit');
const User = require('../models/User');

router.use(auth);

router.get('/requests', async (req, res) => {
  try {
    const requests = await Friendship.find({ recipient_id: req.user.id, status: 'pending' })
      .populate('requester_id', 'name email');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/balances', async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ requester_id: req.user.id }, { recipient_id: req.user.id }],
      status: 'accepted',
    }).populate('requester_id recipient_id', 'name email');

    const results = await Promise.all(friendships.map(async (f) => {
      const friend = f.requester_id._id.toString() === req.user.id ? f.recipient_id : f.requester_id;
      const expenses = await Expense.find({
        household_id: null,
        $or: [{ payer_id: req.user.id }, { payer_id: friend._id }],
      });
      const expIds = expenses.map((e) => e._id);
      const splits = await ExpenseSplit.find({ expense_id: { $in: expIds } });

      let balance = 0;
      expenses.forEach((exp) => {
        const paidByMe = exp.payer_id.toString() === req.user.id;
        const mySplit = splits.find((s) => s.expense_id.toString() === exp._id.toString() && s.user_id.toString() === req.user.id);
        const friendSplit = splits.find((s) => s.expense_id.toString() === exp._id.toString() && s.user_id.toString() === friend._id.toString());
        if (paidByMe && friendSplit && !friendSplit.is_paid) balance += friendSplit.amount_owed;
        if (!paidByMe && mySplit && !mySplit.is_paid) balance -= mySplit.amount_owed;
      });

      return { friendship_id: f._id, friend, balance: parseFloat(balance.toFixed(2)) };
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;
    const target = await User.findOne({ email: email.toLowerCase() });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target._id.toString() === req.user.id) return res.status(400).json({ message: 'Cannot add yourself' });
    const exists = await Friendship.findOne({
      $or: [
        { requester_id: req.user.id, recipient_id: target._id },
        { requester_id: target._id, recipient_id: req.user.id },
      ],
    });
    if (exists) return res.status(400).json({ message: exists.status === 'accepted' ? 'Already friends' : 'Request already sent' });
    await Friendship.create({ requester_id: req.user.id, recipient_id: target._id });
    res.json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/accept', async (req, res) => {
  try {
    const f = await Friendship.findOneAndUpdate(
      { _id: req.params.id, recipient_id: req.user.id },
      { status: 'accepted' },
      { new: true }
    );
    if (!f) return res.status(404).json({ message: 'Request not found' });
    res.json(f);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Friendship.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:friendId/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find({
      household_id: null,
      $or: [
        { payer_id: req.user.id },
        { payer_id: req.params.friendId },
      ],
    }).populate('payer_id', 'name email').sort({ date: -1 });

    const ids = expenses.map((e) => e._id);
    const splits = await ExpenseSplit.find({ expense_id: { $in: ids } }).populate('user_id', 'name email');

    const filtered = expenses.filter((exp) => {
      const expSplits = splits.filter((s) => s.expense_id.toString() === exp._id.toString());
      const involvesFriend = expSplits.some((s) => s.user_id._id.toString() === req.params.friendId);
      const involvesMe = expSplits.some((s) => s.user_id._id.toString() === req.user.id);
      return involvesFriend && involvesMe;
    });

    const result = filtered.map((e) => ({
      ...e.toObject(),
      splits: splits.filter((s) => s.expense_id.toString() === e._id.toString()),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:friendId/expenses', async (req, res) => {
  try {
    const { amount, description, category, paidBy } = req.body;
    const payerId = paidBy === 'friend' ? req.params.friendId : req.user.id;
    const expense = await Expense.create({ household_id: null, payer_id: payerId, amount, description, category });
    const half = parseFloat((amount / 2).toFixed(2));
    await ExpenseSplit.insertMany([
      { expense_id: expense._id, user_id: req.user.id, amount_owed: half, is_paid: payerId.toString() === req.user.id },
      { expense_id: expense._id, user_id: req.params.friendId, amount_owed: half, is_paid: payerId.toString() === req.params.friendId },
    ]);
    await expense.populate('payer_id', 'name email');
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:friendId/settle', async (req, res) => {
  try {
    const expenses = await Expense.find({ household_id: null, $or: [{ payer_id: req.user.id }, { payer_id: req.params.friendId }] });
    const ids = expenses.map((e) => e._id);
    await ExpenseSplit.updateMany(
      { expense_id: { $in: ids }, user_id: { $in: [req.user.id, req.params.friendId] } },
      { is_paid: true }
    );
    res.json({ message: 'Settled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
