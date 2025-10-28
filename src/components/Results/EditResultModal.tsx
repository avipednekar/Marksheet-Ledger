import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { Result, SubjectConfig } from '../../helpers/interfaces';
import { getMarkKey } from '../../helpers/Utils';

interface EditResultModalProps {
  result: Result;
  onClose: () => void;
  onSave: () => void; 
}

const EditResultModal: React.FC<EditResultModalProps> = ({ result, onClose, onSave }) => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchSubjectConfigsAndPopulateMarks = async () => {
      setLoading(true);
      setFormError('');
      try {
        const params = new URLSearchParams({
          enrollmentNumber: result.enrollmentNumber,
          semester: result.semester.toString(),
          year: result.yearOfStudy.toString()
        });
        const response = await fetch(`/api/subjects?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Could not load subject configurations to edit.');
        }

        const populatedSubjects: SubjectConfig[] = data.subjects.map((config: SubjectConfig) => {
          const existingSubjectData = result.subjects[config.courseName];
          const marks: Record<string, number | ''> = {};

          config.evaluationScheme.forEach((scheme) => {
            const key = getMarkKey(scheme.name);
            const existingMark = existingSubjectData?.componentMarks[scheme.name];
            marks[key] = existingMark !== undefined ? existingMark : '';
          });

          return {
            ...config,
            ...marks
          } as SubjectConfig; 
        });

        setSubjects(populatedSubjects);

      } catch (err: any) {
        setFormError(err.message || 'Failed to fetch subject details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectConfigsAndPopulateMarks();
  }, [result, token]);

  const handleMarkChange = (subjectIndex: number, key: string, value: string) => {
    const newSubjects = [...subjects];
    (newSubjects[subjectIndex] as any)[key] = value;
    setSubjects(newSubjects);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  setFormError('');

  const subjectsPayload = subjects.reduce((acc, subject) => {
    const marks: Record<string, number> = {};
    subject.evaluationScheme.forEach((scheme: any) => {
      const key = getMarkKey(scheme.name);
      marks[key] = Number((subject as any)[key]) || 0;
    });
    acc[subject.courseName] = marks;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  try {
    const response = await fetch(`/api/results/${result.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subjects: subjectsPayload }) 
    });

    const data = await response.json();
    if (data.success) {
      onSave(); 
    } else {
      setFormError(data.message || 'Failed to update result.');
    }
  } catch (err) {
    setFormError('A network error occurred. Please try again.');
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b"><h2 className="text-xl font-semibold">Edit Result</h2></div>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="font-medium">Name:</span><p className="text-gray-900">{result.studentName}</p></div>
              <div><span className="font-medium">Enrollment:</span><p className="text-gray-900">{result.enrollmentNumber}</p></div>
              <div><span className="font-medium">Year:</span><p className="text-gray-900">{result.yearOfStudy}</p></div>
              <div><span className="font-medium">Semester:</span><p className="text-gray-900">{result.semester}</p></div>
            </div>

            {formError && <div className="p-3 bg-red-100 text-red-700 rounded">{formError}</div>}

            {loading ? <div className="text-center p-8"><LoadingSpinner size="lg"/></div> : (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Update Subject Marks</h3>
                <div className="space-y-3">
                  {subjects.map((subject, index) => (
                    <div key={subject.courseCode || subject.courseName} className="space-y-2 border p-3 rounded">
                      <p className="font-medium">{subject.courseName}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {subject.evaluationScheme.map((scheme: any) => {
                          const key = getMarkKey(scheme.name);
                          const markValue = (subject as any)[key] || '';
                          return (
                            <input
                              key={scheme.name}
                              type="number"
                              placeholder={`${scheme.name} (${scheme.maxMarks})`}
                              value={markValue}
                              onChange={(e) => handleMarkChange(index, key, e.target.value)}
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
          </div>
          <div className="p-6 border-t flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white border rounded-lg">Cancel</button>
            <button type="submit" disabled={loading || saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 w-28 text-center">
              {saving ? <LoadingSpinner size="sm" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditResultModal;