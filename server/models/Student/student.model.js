import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  enrollmentNumber: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  
  admissionYear: { 
    type: String,
    required: true, 
  },
  admissionType: { 
    type: String,
    enum: ['Regular', 'DSY'],
    required: true,
    default: 'Regular',
  },
  cgpa: { 
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  
  phone: String,
  address: String,
  dateOfBirth: Date,
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;