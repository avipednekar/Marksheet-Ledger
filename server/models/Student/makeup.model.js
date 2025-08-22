import mongoose from 'mongoose';

const makeupHistorySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  originalResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Result',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
  },
  examDate: {
    type: Date,
    default: Date.now,
  },
  marks: {
    type: Number,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PASS', 'FAIL'],
    required: true,
  },
}, {
  timestamps: true
});

const MakeupHistory = mongoose.model('MakeupHistory', makeupHistorySchema);

export default MakeupHistory;