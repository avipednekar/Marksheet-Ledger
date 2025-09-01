// models/course.model.js
import mongoose from 'mongoose';

const evaluationComponentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  minPassingMarks: { type: Number, default: 0 }
}, { _id: false });

const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, unique: true },
  courseName: { type: String, required: true },
  credits: { type: Number, required: true },
  courseType: { 
    type: String, 
    required: true,
    enum: ['Core', 'Lab', 'Value Added', 'Program Elective', 'Open Elective', 'MDM']
  },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  minForPassing: { type: Number, required: true },
  evaluationScheme: [evaluationComponentSchema]
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
export default Course;