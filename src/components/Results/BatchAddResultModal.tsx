// src/components/BatchAddResultModal.tsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMarkKey } from '../../helpers/Utils';
import { SubjectConfig, StudentDetails, NextResultSlot } from '../../helpers/interfaces';

interface BatchAddResultModalProps {
  onClose: () => void;
  onAdd: (data: any) => Promise<void>;
}

interface StudentInList {
  name: string;
  enrollmentNumber: string;
  // Include department/year if the filter doesn't capture it entirely
}

interface SelectedStudentData extends StudentDetails {
  nextSlot: NextResultSlot;
}


const BatchAddResultModal: React.FC<BatchAddResultModalProps> = ({ onClose, onAdd }) => {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ department: "", academicYear: "" });
  const [studentsList, setStudentsList] = useState<StudentInList[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudentData | null>(null);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchFilteredStudents = async () => {
    setLoadingStudents(true);
    setErrorMessage("");
    setSelectedStudent(null);
    setSubjects([]);

    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/students/filter?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to fetch students");
      setStudentsList(data.students);
    } catch (err: any) {
      setErrorMessage(err.message);
      setStudentsList([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchSubjects = async (student: StudentInList) => {
    setErrorMessage("");
    try {
      // 1. Get academic status (for next result slot details)
      const statusResponse = await fetch(`/api/students/${student.enrollmentNumber}/academic-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statusData = await statusResponse.json();
      if (!statusResponse.ok) throw new Error(statusData.message || "Failed to get student academic status.");

      const studentDetails: StudentDetails = statusData.student;
      const nextSlot: NextResultSlot = statusData.nextResultSlot;
      
      if (!nextSlot) throw new Error(`${studentDetails.name} has no determined next result slot.`);

      // 2. Fetch subjects for nextSlot
      const params = new URLSearchParams({
        enrollmentNumber: student.enrollmentNumber,
        semester: nextSlot.semester.toString(),
        year: nextSlot.yearOfStudy.toString()
      });
      const subjResponse = await fetch(`/api/subjects?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const subjData = await subjResponse.json();
      if (!subjResponse.ok || !subjData.success) throw new Error(subjData.message || "Could not load subjects for this semester.");

      let loadedSubjects: SubjectConfig[] = subjData.subjects.map((s: SubjectConfig) => {
        const initialMarks: Record<string, string> = {};
        s.evaluationScheme.forEach(scheme => {
          initialMarks[getMarkKey(scheme.name)] = '';
        });
        return { ...s, ...initialMarks };
      });

      // Add MDM for sem >= 3
      if (nextSlot.semester >= 3) {
        loadedSubjects.push({
          courseName: "MDM",
          evaluationScheme: [{ name: "ESE", maxMarks: 100, minPassingMarks: 40 }],
          ese: ""
        } as SubjectConfig);
      }
      // Add Program + Open Electives for sem >= 5
      if (nextSlot.semester >= 5) {
        loadedSubjects.push(
          { courseName: "Program Elective", evaluationScheme: [{ name: "ESE", maxMarks: 100, minPassingMarks: 40 }], ese: "" } as SubjectConfig,
          { courseName: "Open Elective", evaluationScheme: [{ name: "ESE", maxMarks: 100, minPassingMarks: 40 }], ese: "" } as SubjectConfig
        );
      }
      
      setSubjects(loadedSubjects);
      setSelectedStudent({ ...studentDetails, nextSlot });

    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };


  const handleSubjectChange = (index: number, field: string, value: string) => {
    const updated = [...subjects];
    (updated[index] as any)[field] = value;
    setSubjects(updated);
  };

  const handleSave = async () => {
    if (!selectedStudent || !selectedStudent.nextSlot) return;
    setSaving(true);
    setErrorMessage('');

    const resultData = {
      enrollmentNumber: selectedStudent.enrollmentNumber,
      ...selectedStudent.nextSlot,
      examType: "ESE",
      subjects: subjects.reduce((acc, subject) => {
        if (subject.courseName) {
          const marksPayload: Record<string, number> = {};
          subject.evaluationScheme.forEach((scheme: any) => {
            const key = getMarkKey(scheme.name);
            marksPayload[scheme.name] = Number((subject as any)[key]) || 0; // Use original scheme name as key
          });
          acc[subject.courseName] = { componentMarks: marksPayload };
        }
        return acc;
      }, {} as Record<string, { componentMarks: Record<string, number> }>)
    };

    try {
      await onAdd(resultData);
      setSelectedStudent(null);
      setSubjects([]);
      // Refresh the list of students to remove the one just added for
      // better UX, assuming successful save means their next slot changes.
      await fetchFilteredStudents(); 

    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save result.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Batch Add Result</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Filter Section */}
          <div className="grid grid-cols-2 gap-4">
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="border px-3 py-2 rounded-lg"
            >
              <option value="">Select Department</option>
              <option value="Computer Science">CSE</option>
              <option value="IT">IT</option>
              <option value="MECH">MECH</option>
            </select>

            <select
              value={filters.academicYear}
              onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
              className="border px-3 py-2 rounded-lg"
            >
              <option value="">Select Admission Year</option>
              <option value="2022-23">2022-23</option>
              <option value="2023-24">2023-24</option>
              <option value="2024-25">2024-25</option>
            </select>
          </div>

          <button 
            onClick={fetchFilteredStudents} 
            disabled={loadingStudents}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingStudents ? "Searching..." : "Search Students"}
          </button>

          {/* Error */}
          {errorMessage && <div className="p-3 bg-red-100 text-red-700 rounded">{errorMessage}</div>}

          {/* Student List */}
          {studentsList.length > 0 && !selectedStudent && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Select a Student ({studentsList.length} Found)</h3>
              <ul className="border rounded divide-y max-h-56 overflow-y-auto">
                {studentsList.map(stu => (
                  <li key={stu.enrollmentNumber}>
                    <button 
                      onClick={() => fetchSubjects(stu)} 
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      {stu.name} ({stu.enrollmentNumber})
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Subject Entry */}
          {selectedStudent && (
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 p-4 rounded text-sm">
                <p><strong>{selectedStudent.name}</strong> ({selectedStudent.enrollmentNumber})</p>
                <p>{selectedStudent.department} | Year {selectedStudent.nextSlot.yearOfStudy}, Sem {selectedStudent.nextSlot.semester}</p>
                <p className='mt-1 text-xs text-gray-600'>Adding result for **{selectedStudent.nextSlot.academicYear}**</p>
              </div>

              {subjects.map((subject, index) => (
                <div key={index} className="border p-3 rounded space-y-2">
                  <p className="font-medium">{subject.courseName}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {subject.evaluationScheme.map((scheme: any) => {
                      const key = getMarkKey(scheme.name);
                      return (
                        <input
                          key={scheme.name}
                          type="number"
                          placeholder={`${scheme.name} (${scheme.maxMarks})`}
                          value={(subject as any)[key] || ""}
                          onChange={e => handleSubjectChange(index, key, e.target.value)}
                          className="px-2 py-1 border rounded"
                          min="0"
                          max={scheme.maxMarks}
                          required
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex justify-end space-x-3">
                <button onClick={() => setSelectedStudent(null)} className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200">Back</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Save Result"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchAddResultModal;