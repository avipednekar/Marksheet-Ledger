import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  componentMarks: {
    type: Map,
    of: Number,
    default: {}
  },
  total: {
    type: Number,
    required: true,
    min: 0,
    max: 100, // Total marks are consistently out of 100
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
}, { _id: false });

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required'],
  },
  yearOfStudy: {
    type: Number,
    required: [true, 'Year of study is required'],
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
  },
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: ['ISE', 'MSE', 'ESE', 'Makeup'],
  },
  subjects: {
    type: Map,
    of: subjectSchema,
    required: true,
  },
  overallStatus: {
    type: String,
    enum: ['PASS', 'FAIL'],
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  failedSubjects: {
    type: [String],
    default: [],
  },
  makeupRequired: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true
});

resultSchema.index({ studentId: 1, academicYear: 1, semester: 1, examType: 1 }, { unique: true });

const Result = mongoose.model('Result', resultSchema);

export default Result;