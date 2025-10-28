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

export interface SubjectConfig {
  courseName: string;
  courseCode?: string; 
  evaluationScheme: {
    name: string;
    maxMarks: number;
    minPassingMarks: number;
  }[];
  [key: string]: any;
}

export interface StudentDetails {
  name: string;
  department: string;
  enrollmentNumber: string;
}

export interface NextResultSlot {
  yearOfStudy: number;
  semester: number;
  academicYear: string;
}