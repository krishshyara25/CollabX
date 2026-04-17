const mongoose = require('mongoose');

const calendarLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('CalendarLog', calendarLogSchema);
