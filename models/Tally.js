const mongoose = require('mongoose');

const TallySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Tally', TallySchema);
