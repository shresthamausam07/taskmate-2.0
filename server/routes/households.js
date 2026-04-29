const router = require('express').Router();
const auth = require('../middleware/auth');
const Household = require('../models/Household');

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
    h.members = h.members.filter((m) => m.toString() !== req.user.id);
    await h.save();
    res.json({ message: 'Left group' });
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
