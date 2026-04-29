const mongoose = require('mongoose');

const shoppingItemSchema = new mongoose.Schema({
  household_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: String, default: '' },
  is_checked: { type: Boolean, default: false },
  added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ShoppingItem', shoppingItemSchema);
