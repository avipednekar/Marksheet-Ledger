// src/components/AddResultModal.tsx

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { getMarkKey } from '../../helpers/Utils';
import { SubjectConfig, StudentDetails, NextResultSlot } from '../../helpers/interfaces';
 
interface AddResultModalProps {
  onClose: () => void;
  onAdd: (data: any) => Promise<void>;
}

const AddResultModal: React.FC<AddResultModalProps> = ({ onClose, onAdd }) => {
  const { token } = useAuth();
  const [enrollmentId, setEnrollmentId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [nextSlot, setNextSlot] = useState<NextResultSlot | null>(null);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);

  const handleSearch = async () => {
    if (!enrollmentId) return;
    setStatus('loading');
    setErrorMessage('');
    setStudentDetails(null);
    setNextSlot(null);
    setSubjects([]);

    try {
      const response = await fetch(`/api/students/${enrollmentId}/academic-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setStudentDetails(data.student);
      setNextSlot(data.nextResultSlot);
      setStatus('loaded');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Student not found or API error.');
    }
  };

  useEffect(() => {
    if (status === 'loaded' && nextSlot) {
      const fetchSubjects = async () => {
        try {
          const params = new URLSearchParams({
            enrollmentNumber: enrollmentId,
            semester: nextSlot.semester.toString(),
            year: nextSlot.yearOfStudy.toString() // Assuming yearOfStudy is a number and needs to be stringified
          });
          const response = await fetch(`/api/subjects?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || 'Could not load subjects for this semester.');
          }

          let loadedSubjects: SubjectConfig[] = data.subjects.map((s: SubjectConfig) => {
            // Initialize mark fields to empty string
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
              ese: ''
            } as SubjectConfig);
          }

          // Add Program + Open Electives for sem >= 5
          if (nextSlot.semester >= 5) {
            loadedSubjects.push(
              {
                courseName: "Program Elective",
                evaluationScheme: [{ name: "ESE", maxMarks: 100, minPassingMarks: 40 }],
                ese: ''
              } as SubjectConfig,
              {
                courseName: "Open Elective",
                evaluationScheme: [{ name: "ESE", maxMarks: 100, minPassingMarks: 40 }],
                ese: ''
              } as SubjectConfig
            );
          }

          setSubjects(loadedSubjects);
          setErrorMessage('');
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to load subject data.');
          setSubjects([]);
        }
      };
      fetchSubjects();
    }
  }, [status, nextSlot, enrollmentId, token]);

  const handleSubjectChange = (index: number, field: string, value: string) => {
    const newSubjects = [...subjects];
    // Ensure the field is treated as a string key on the SubjectConfig
    (newSubjects[index] as any)[field] = value;
    setSubjects(newSubjects);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextSlot || !studentDetails) return;
    setIsSaving(true);

    const resultData = {
      enrollmentNumber: enrollmentId,
      ...nextSlot,
      examType: 'ESE', // Assuming ESE is the default type for the added result
      subjects: subjects.reduce((acc, subject) => {
        if (subject.courseName) {
          const marksPayload: Record<string, number> = {};
          subject.evaluationScheme.forEach((scheme) => {
            const key = getMarkKey(scheme.name);
            // Use Number() to convert the string mark to number, defaulting to 0
            marksPayload[scheme.name] = Number((subject as any)[key]) || 0; // Use original scheme name as key in componentMarks
          });
          acc[subject.courseName] = { componentMarks: marksPayload };
        }
        return acc;
      }, {} as Record<string, { componentMarks: Record<string, number> }>),
      // The API will calculate total, percentage, grade, and status on the server-side
    };

    try {
      await onAdd(resultData);
    } catch (error) {
      console.error("Failed to add result:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b"><h2 className="text-xl font-semibold">Add Result</h2></div>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter Enrollment ID</label>
              <div className="flex space-x-2">
                <input type="text" value={enrollmentId} onChange={(e) => setEnrollmentId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., 2324001241" />
                <button type="button" onClick={handleSearch} disabled={status === 'loading'} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                  {status === 'loading' ? <LoadingSpinner size="sm" /> : 'Find'}
                </button>
              </div>
            </div>

            {errorMessage && <div className="p-3 bg-red-100 text-red-700 rounded">{errorMessage}</div>}

            {status === 'loaded' && studentDetails && nextSlot && (
              <>
                <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span><p className="text-gray-900">{studentDetails.name}</p></div>
                  <div><span className="font-medium">Dept:</span><p className="text-gray-900">{studentDetails.department}</p></div>
                  <div><span className="font-medium">Year:</span><p className="text-gray-900">{nextSlot.yearOfStudy}</p></div>
                  <div><span className="font-medium">Semester:</span><p className="text-gray-900">{nextSlot.semester}</p></div>
                </div>

                {subjects.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Subjects for Academic Year {nextSlot.academicYear}</h3>
                    <div className="space-y-3">
                      {subjects.map((subject, index) => (
                        <div key={index} className="space-y-2 border p-3 rounded">
                          <p className="font-medium">{subject.courseName}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {subject.evaluationScheme.map((scheme: any) => {
                              const key = getMarkKey(scheme.name);
                              // Access the dynamic property on the subject object
                              const markValue = (subject as any)[key] || '';
                              return (
                                <input
                                  key={scheme.name}
                                  type="number"
                                  placeholder={`${scheme.name} (${scheme.maxMarks})`}
                                  value={markValue}
                                  onChange={(e) => handleSubjectChange(index, key, e.target.value)}
                                  max={scheme.maxMarks}
                                  min="0"
                                  required
                                  className="px-2 py-1 border rounded"
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="p-6 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border rounded-lg">Cancel</button>
            <button type="submit" disabled={status !== 'loaded' || subjects.length === 0 || isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 w-28 text-center">
              {isSaving ? <LoadingSpinner size="sm" /> : 'Save Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResultModal;