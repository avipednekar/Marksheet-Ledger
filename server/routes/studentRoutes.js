import express from 'express';
import Student from '../models/Student/student.model.js';
import Result from '../models/Student/result.model.js';
import MakeupHistory from '../models/Student/makeup.model.js';
import { authenticateToken } from '../middleware/auth.js';
import { faker } from '@faker-js/faker';

const router = express.Router();

function generateEnrollmentNumber(admissionYear) {
  const randomDigits = faker.number.int({ min: 1, max: 1300 }); 
  const prefix = admissionYear.replace("-", "").slice(2);
  const padded = randomDigits.toString().padStart(4, "0");
  return prefix + "00" + padded; 
}

function generateAdmissionYear() {
  const startYear = faker.number.int({ min: 2020, max: 2025 });
  const endYear = startYear + 1;
  return `${startYear}-${endYear.toString().slice(-2)}`;
}

router.get("/filter", authenticateToken, async (req, res) => {
  try {
    const { department, academicYear, yearOfStudy, semester } = req.query;

    const query = {};
    if (department) query.department = department;
    if (academicYear) query.admissionYear = academicYear;
    if (yearOfStudy) query.yearOfStudy = parseInt(yearOfStudy);
    if (semester) query.semester = parseInt(semester);

    const students = await Student.find(query).select("name enrollmentNumber department yearOfStudy semester");
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get("/add-multiple-dummy", async (req, res) => {
  try {
    let students = [];

    for (let i = 1; i <= 10; i++) {
      const admissionYear = generateAdmissionYear();
      const enrollmentNumber = await generateEnrollmentNumber(admissionYear);

      students.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        enrollmentNumber,
        department: "Computer Science",
        admissionYear,
        admissionType: faker.helpers.arrayElement(["Regular", "DSY"]),
        cgpa: parseFloat((Math.random() * 4 + 6).toFixed(2)), // 6.0 - 10.0
        phone: faker.number.int({ min: 1000000000, max: 9999999999 }).toString(),
        address: faker.location.streetAddress(),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 25, mode: "age" }),
      });
    }

    const insertedStudents = await Student.insertMany(students);
    res.json({ message: "10 dummy students added!", students: insertedStudents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all students with filtering and searching
router.get('/', authenticateToken, async (req, res) => {
  try {
    const studentsFromDB = await Student.find(req.query).sort({ createdAt: -1 });

    const students = studentsFromDB.map(student => {
      const admissionStartYear = parseInt(student.admissionYear.split('-')[0]);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth(); // 0-11

      // Assuming academic year starts in August (month 7)
      let academicYearOffset = currentYear - admissionStartYear;
      if (currentMonth < 7) {
        academicYearOffset--;
      }

      let yearOfStudy = academicYearOffset + 1;
      if (student.admissionType === 'DSY') {
        yearOfStudy += 1;
      }
      
      const semester = yearOfStudy * 2 - (currentMonth > 0 && currentMonth < 7 ? 0 : 1);
      
      return {
        ...student.toObject(),
        yearOfStudy: yearOfStudy > 4 ? 'Graduated' : yearOfStudy,
        semester: semester > 8 ? 'N/A' : semester,
      };
    });

    res.json({ success: true, students, total: students.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching students' });
  }
});

router.get('/:enrollmentNumber', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findOne({ enrollmentNumber: req.params.enrollmentNumber });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching student' });
  }
});

// Add new student
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { enrollmentNumber, email, admissionYear } = req.body;
    
    if (!admissionYear) {
        return res.status(400).json({ success: false, message: 'Admission Year is required.' });
    }

    const existingStudent = await Student.findOne({ $or: [{ enrollmentNumber }, { email }] });
    if (existingStudent) {
      return res.status(409).json({ success: false, message: 'Student with this enrollment number or email already exists' });
    }

    const newStudent = await Student.create(req.body);
    res.status(201).json({ success: true, message: 'Student added successfully', student: newStudent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding student' });
  }
});

router.put('/:enrollmentNumber/mdm', authenticateToken, async (req, res) => {
  try {
    const { chosenMDM, forceUpdate = false } = req.body; 
    // `forceUpdate: true` can be used only by admins if needed
    
    const student = await Student.findOne({ enrollmentNumber: req.params.enrollmentNumber });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Prevent overwriting if already set, unless admin forces
    if (student.chosenMDM && !forceUpdate) {
      return res.status(400).json({ 
        success: false, 
        message: `MDM already chosen as '${student.chosenMDM}'. Use 'forceUpdate: true' if admin wants to override.` 
      });
    }

    student.chosenMDM = chosenMDM;
    await student.save();

    res.json({ success: true, message: 'MDM choice updated', student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating MDM choice' });
  }
});

router.put('/:enrollmentNumber/oe', authenticateToken, async (req, res) => {
  try {
    const { semester, courseCode } = req.body;
    const student = await Student.findOne({ enrollmentNumber: req.params.enrollmentNumber });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Replace if exists, otherwise push
    const existingIndex = student.chosenOE.findIndex(oe => oe.semester === semester);
    if (existingIndex >= 0) {
      student.chosenOE[existingIndex].courseCode = courseCode;
    } else {
      student.chosenOE.push({ semester, courseCode });
    }

    await student.save();
    res.json({ success: true, message: 'Open Elective updated', student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating Open Elective' });
  }
});

router.put('/:enrollmentNumber/pe', authenticateToken, async (req, res) => {
  try {
    const { semester, courseCode } = req.body;
    const student = await Student.findOne({ enrollmentNumber: req.params.enrollmentNumber });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Replace if exists, otherwise push
    const existingIndex = student.chosenPE.findIndex(pe => pe.semester === semester);
    if (existingIndex >= 0) {
      student.chosenPE[existingIndex].courseCode = courseCode;
    } else {
      student.chosenPE.push({ semester, courseCode });
    }

    await student.save();
    res.json({ success: true, message: 'Program Elective updated', student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating Program Elective' });
  }
});

// Update student
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      student: updatedStudent,
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Error updating student' });
  }
});

// Delete student
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Delete student and all related data
    await Result.deleteMany({ studentId });
    await MakeupHistory.deleteMany({ studentId });
    await Student.findByIdAndDelete(studentId);

    res.json({ success: true, message: 'Student and all related results deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Error deleting student' });
  }
});

// Add this new route to your studentRoutes.js file

router.get('/:enrollmentId/academic-status', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findOne({ enrollmentNumber: req.params.enrollmentId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const existingResults = await Result.find({ studentId: student._id }).sort({ semester: 1 });
    
    let nextSemester = (student.admissionType === 'DSY') ? 3 : 1;
    if (existingResults.length > 0) {
        nextSemester = existingResults[existingResults.length - 1].semester + 1;
    }

    if (nextSemester > 8) {
      return res.status(400).json({ success: false, message: 'Student has completed all 8 semesters.' });
    }

    const admissionStartYear = parseInt(student.admissionYear.split('-')[0]);
    const yearOffset = Math.floor((nextSemester - 1) / 2);
    const academicYearStart = admissionStartYear + yearOffset;
    const academicYear = `${academicYearStart}-${(academicYearStart + 1).toString().slice(-2)}`;

    res.json({
      success: true,
      student: { id: student._id, name: student.name, department: student.department, enrollmentNumber:student.enrollmentNumber },
      nextResultSlot: {
        yearOfStudy: Math.ceil(nextSemester / 2),
        semester: nextSemester,
        academicYear,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;