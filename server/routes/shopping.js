const router = require('express').Router();
const auth = require('../middleware/auth');
const ShoppingItem = require('../models/ShoppingItem');

router.use(auth);

router.get('/:householdId', async (req, res) => {
  try {
    const items = await ShoppingItem.find({ household_id: req.params.householdId })
      .populate('added_by', 'name')
      .sort({ createdAt: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { household_id, name, quantity } = req.body;
    const item = await ShoppingItem.create({ household_id, name, quantity, added_by: req.user.id });
    await item.populate('added_by', 'name');
    req.app.get('io').to(household_id).emit('shopping:add', item);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const item = await ShoppingItem.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('added_by', 'name');
    req.app.get('io').to(item.household_id.toString()).emit('shopping:update', item);
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await ShoppingItem.findByIdAndDelete(req.params.id);
    if (item) req.app.get('io').to(item.household_id.toString()).emit('shopping:delete', item._id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
