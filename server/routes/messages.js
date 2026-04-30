const router = require('express').Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');

router.use(auth);

router.get('/:householdId', async (req, res) => {
  try {
    const messages = await Message.find({ household_id: req.params.householdId })
      .populate('sender_id', 'name')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { household_id, content } = req.body;
    const msg = await Message.create({ household_id, sender_id: req.user.id, content });
    await msg.populate('sender_id', 'name');
    req.app.get('io').to(household_id).emit('message:new', msg);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Message.findOneAndDelete({ _id: req.params.id, sender_id: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
