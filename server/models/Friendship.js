const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  requester_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
}, { timestamps: true });

friendshipSchema.index({ requester_id: 1, recipient_id: 1 }, { unique: true });

module.exports = mongoose.model('Friendship', friendshipSchema);
