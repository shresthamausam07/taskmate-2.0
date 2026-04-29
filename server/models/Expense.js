const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  household_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', default: null },
  payer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['general', 'food', 'housing', 'transport', 'utilities', 'entertainment', 'health', 'other'],
    default: 'general',
  },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['expense', 'settlement'], default: 'expense' },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
