// src/interfaces.ts

export interface Subject {
  componentMarks: Record<string, number>;
  total: number;
  grade: string;
  status: string;
}

export interface Result {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  yearOfStudy: number;
  academicYear: string;
  semester: number;
  examType: string;
  subjects: Record<string, Subject>;
  overallStatus: string;
  totalMarks: number;
  percentage: number;
  failedSubjects: string[];
  makeupRequired: string[];
  createdAt: string;
  updatedAt: string;
}

// Interface for subject configuration retrieved for Add/Edit modals
export interface SubjectConfig {
  courseName: string;
  courseCode?: string; // Add/Edit uses courseCode in some parts
  evaluationScheme: {
    name: string;
    maxMarks: number;
    minPassingMarks: number;
  }[];
  // Dynamic fields for component marks (e.g., 'ise', 'mse', 'ese') will be added temporarily
  [key: string]: any;
}

// Interface for student details received in Add/Batch Add modals
export interface StudentDetails {
  name: string;
  department: string;
  enrollmentNumber: string;
  // Add other necessary student fields
}

// Interface for the next slot data
export interface NextResultSlot {
  yearOfStudy: number;
  semester: number;
  academicYear: string;
}