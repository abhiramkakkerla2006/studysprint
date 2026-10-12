const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  course: { type: String, required: true, trim: true, maxlength: 60 },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
