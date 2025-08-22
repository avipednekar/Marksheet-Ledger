import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  enrollmentNumber: {
    type: String,
    required: [true, 'Enrollment number is required'],
    unique: true,
    trim: true,
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'],
  },
  yearOfStudy: {
    type: Number,
    required: [true, 'Year of study is required'],
    min: 1,
    max: 4,
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8,
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

const Student = mongoose.model('Student', studentSchema);

export default Student;