const mongoose = require('mongoose');

const choreSchema = new mongoose.Schema({
  household_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
  title: { type: String, required: true, trim: true },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  frequency: { type: String, enum: ['once', 'daily', 'weekly', 'monthly'], default: 'weekly' },
  due_date: { type: Date },
  is_completed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Chore', choreSchema);
