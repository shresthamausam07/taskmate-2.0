const mongoose = require('mongoose');
const { randomBytes } = require('crypto');

const householdSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  invite_code: { type: String, unique: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

householdSchema.pre('save', function () {
  if (!this.invite_code) {
    this.invite_code = randomBytes(3).toString('hex').toUpperCase();
  }
});

module.exports = mongoose.model('Household', householdSchema);
