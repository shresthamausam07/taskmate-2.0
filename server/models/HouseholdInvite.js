const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  household_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
  inviter_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, { timestamps: true });

inviteSchema.index({ household_id: 1, recipient_id: 1 }, { unique: true });

module.exports = mongoose.model('HouseholdInvite', inviteSchema);
