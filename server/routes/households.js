const router = require('express').Router();
const auth = require('../middleware/auth');
const Household = require('../models/Household');
const HouseholdInvite = require('../models/HouseholdInvite');
const Expense = require('../models/Expense');
const ExpenseSplit = require('../models/ExpenseSplit');
const Chore = require('../models/Chore');
const ShoppingItem = require('../models/ShoppingItem');
const Message = require('../models/Message');
const User = require('../models/User');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const households = await Household.find({ members: req.user.id }).populate('members', 'name email');
    res.json(households);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const h = await Household.create({ name, created_by: req.user.id, members: [req.user.id] });
    await h.populate('members', 'name email');
    res.status(201).json(h);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get pending invites for the current user
router.get('/invites', async (req, res) => {
  try {
    const invites = await HouseholdInvite.find({ recipient_id: req.user.id, status: 'pending' })
      .populate('household_id', 'name')
      .populate('inviter_id', 'name email');
    res.json(invites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Accept a household invite
router.put('/invites/:inviteId/accept', async (req, res) => {
  try {
    const invite = await HouseholdInvite.findOne({ _id: req.params.inviteId, recipient_id: req.user.id });
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    const h = await Household.findById(invite.household_id);
    if (!h) return res.status(404).json({ message: 'Group not found' });

    if (!h.members.includes(req.user.id)) {
      h.members.push(req.user.id);
      await h.save();
    }

    invite.status = 'accepted';
    await invite.save();

    await h.populate('members', 'name email');
    res.json(h);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Decline a household invite
router.delete('/invites/:inviteId', async (req, res) => {
  try {
    await HouseholdInvite.findOneAndDelete({ _id: req.params.inviteId, recipient_id: req.user.id });
    res.json({ message: 'Invite declined' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/join/:code', async (req, res) => {
  try {
    const h = await Household.findOne({ invite_code: req.params.code.toUpperCase() });
    if (!h) return res.status(404).json({ message: 'Invalid invite code' });
    if (!h.members.includes(req.user.id)) {
      h.members.push(req.user.id);
      await h.save();
    }
    await h.populate('members', 'name email');
    res.json(h);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/leave', async (req, res) => {
  try {
    const h = await Household.findById(req.params.id);
    if (!h) return res.status(404).json({ message: 'Group not found' });

    const expenses = await Expense.find({ household_id: h._id });
    const expenseIds = expenses.map((e) => e._id);

    // Check if user owes money (unpaid split assigned to them)
    const owes = await ExpenseSplit.findOne({
      expense_id: { $in: expenseIds },
      user_id: req.user.id,
      is_paid: false,
    });

    // Check if user is owed money (they paid, but others haven't settled)
    const paidByUser = expenses.filter((e) => e.payer_id.toString() === req.user.id).map((e) => e._id);
    const owed = paidByUser.length > 0 ? await ExpenseSplit.findOne({
      expense_id: { $in: paidByUser },
      user_id: { $ne: req.user.id },
      is_paid: false,
    }) : null;

    if (owes || owed) {
      return res.status(400).json({
        message: 'You have unsettled balances in this group. Please settle all expenses before leaving.',
      });
    }

    h.members = h.members.filter((m) => m.toString() !== req.user.id);
    await h.save();
    res.json({ message: 'Left group' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send an email invite to join a household
router.post('/:id/invite', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const h = await Household.findById(req.params.id);
    if (!h) return res.status(404).json({ message: 'Group not found' });

    // Only members can invite
    if (!h.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const target = await User.findOne({ email: email.toLowerCase() });
    if (!target) return res.status(404).json({ message: 'No user found with that email' });

    if (target._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }

    if (h.members.map((m) => m.toString()).includes(target._id.toString())) {
      return res.status(400).json({ message: 'That user is already in this group' });
    }

    await HouseholdInvite.create({
      household_id: h._id,
      inviter_id: req.user.id,
      recipient_id: target._id,
    });

    res.json({ message: `Invite sent to ${target.name}` });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An invite has already been sent to that user' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Delete group — only the creator can do this (cascade deletes all related data)
router.delete('/:id', async (req, res) => {
  try {
    const h = await Household.findById(req.params.id);
    if (!h) return res.status(404).json({ message: 'Group not found' });
    if (h.created_by.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the group creator can delete this group' });
    }

    const expenses = await Expense.find({ household_id: h._id });
    const expenseIds = expenses.map((e) => e._id);

    await ExpenseSplit.deleteMany({ expense_id: { $in: expenseIds } });
    await Expense.deleteMany({ household_id: h._id });
    await Chore.deleteMany({ household_id: h._id });
    await ShoppingItem.deleteMany({ household_id: h._id });
    await Message.deleteMany({ household_id: h._id });
    await HouseholdInvite.deleteMany({ household_id: h._id });
    await Household.findByIdAndDelete(h._id);

    res.json({ message: 'Group deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const h = await Household.findById(req.params.id).populate('members', 'name email');
    if (!h) return res.status(404).json({ message: 'Not found' });
    res.json(h);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
