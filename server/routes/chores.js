const router = require('express').Router();
const auth = require('../middleware/auth');
const Chore = require('../models/Chore');

router.use(auth);

router.get('/:householdId', async (req, res) => {
  try {
    const chores = await Chore.find({ household_id: req.params.householdId })
      .populate('assigned_to', 'name')
      .sort({ createdAt: -1 });
    res.json(chores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { household_id, title, assigned_to, frequency, due_date } = req.body;
    const chore = await Chore.create({ household_id, title, assigned_to, frequency, due_date });
    await chore.populate('assigned_to', 'name');
    res.status(201).json(chore);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const chore = await Chore.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('assigned_to', 'name');
    res.json(chore);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Chore.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
