import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, FileText, Download, CheckCircle, XCircle, Clock, AlertTriangle, Edit3, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Subject {
  componentMarks: Record<string, number>;
  total: number;
  grade: string;
  status: string;
}

interface Result {
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

const Results: React.FC = () => {
  const { token } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchAddModal, setShowBatchAddModal] = useState(false);
  const [viewingResult, setViewingResult] = useState<Result | null>(null);
  const [editingResult, setEditingResult] = useState<Result | null>(null);

  useEffect(() => {
    fetchResults();
  }, [token, searchTerm, yearFilter, examTypeFilter, statusFilter, academicYearFilter, semesterFilter]);

  const fetchResults = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm); // Server-side search
      if (yearFilter) params.append('yearOfStudy', yearFilter);
      if (examTypeFilter) params.append('examType', examTypeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (academicYearFilter) params.append('academicYear', academicYearFilter);
      if (semesterFilter) params.append('semester', semesterFilter);

      const response = await fetch(`/api/results?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleAddResult = async (newResultData: any) => {
    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newResultData)
      });
      const data = await response.json();
      if (data.success) {
        fetchResults(); // Refresh the list
        setShowAddModal(false);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert('Failed to add result');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAIL':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-50';
      case 'B+':
      case 'B':
        return 'text-blue-600 bg-blue-50';
      case 'C+':
      case 'C':
        return 'text-orange-600 bg-orange-50';
      case 'F':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const ResultCard: React.FC<{ result: Result }> = ({ result }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{result.studentName}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(result.overallStatus)}`}>
              {getStatusIcon(result.overallStatus)}
              <span className="ml-1">{result.overallStatus}</span>
            </span>
          </div>
          <p className="text-sm text-gray-600">{result.enrollmentNumber}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
            <span>Year {result.yearOfStudy}</span>
            <span>•</span>
            <span>Sem {result.semester}</span>
            <span>•</span>
            <span>{result.examType}</span>
            <span>•</span>
            <span>{result.academicYear}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewingResult(result)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => setEditingResult(result)}
            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Edit result"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{result.percentage.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Percentage</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{result.totalMarks}</p>
          <p className="text-sm text-gray-600">Total Marks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{Object.keys(result.subjects).length}</p>
          <p className="text-sm text-gray-600">Subjects</p>
        </div>
      </div>

      {result.failedSubjects.length > 0 && (
        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-red-900">Failed Subjects:</p>
            <p className="text-red-800">{result.failedSubjects.join(', ')}</p>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Added on {new Date(result.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  );

  const ViewResultModal: React.FC<{ result: Result; onClose: () => void }> = ({ result, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Result Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">✕</button>
        </div>
        <div className="p-6 space-y-6">
          {/* Student Info Panel (no change needed here) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Student Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="font-medium text-gray-700">Name</p><p className="text-gray-900">{result.studentName}</p></div>
              <div><p className="font-medium text-gray-700">Enrollment</p><p className="text-gray-900">{result.enrollmentNumber}</p></div>
              <div><p className="font-medium text-gray-700">Year & Semester</p><p className="text-gray-900">Year {result.yearOfStudy}, Sem {result.semester}</p></div>
              <div><p className="font-medium text-gray-700">Academic Year</p><p className="text-gray-900">{result.academicYear}</p></div>
            </div>
          </div>

          {/* FIX: Dynamic Subject Performance Table */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Subject-wise Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-2/5">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-2/5">Component Marks</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Total</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Grade</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(result.subjects).map(([subjectName, data]) => (
                    <tr key={subjectName} className={data.status === 'FAIL' ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{subjectName}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {/* Dynamically list all component marks */}
                          {Object.entries(data.componentMarks).map(([compName, compMark]) => (
                            <span key={compName} className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                              {compName}: <span className="font-semibold">{compMark}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 font-bold">{data.total}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getGradeColor(data.grade)}`}>{data.grade}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(data.status)}`}>{data.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"><Download className="h-4 w-4 mr-2" />Export PDF</button>
        </div>
      </div>
    </div>
  );

  const AddResultModal: React.FC<{ onClose: () => void; onAdd: (data: any) => Promise<void>; }> = ({ onClose, onAdd }) => {
    const { token } = useAuth();
    const [enrollmentId, setEnrollmentId] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [studentDetails, setStudentDetails] = useState<any>(null);
    const [nextSlot, setNextSlot] = useState<any>(null);
    const [subjects, setSubjects] = useState<any[]>([]);

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
        setErrorMessage(err.message);
      }
    };

    useEffect(() => {
      if (status === 'loaded' && nextSlot) {
        const fetchSubjects = async () => {
          try {
            const params = new URLSearchParams({
              enrollmentNumber: enrollmentId,
              semester: nextSlot.semester.toString(),
              year: nextSlot.yearOfStudy
            });
            const response = await fetch(`/api/subjects?${params}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
              throw new Error(data.message || 'Could not load subjects for this semester.');
            }

            let loadedSubjects = data.subjects.map((s: any) => ({ ...s, ise: '', mse: '', ese: '' }));

            // 🚀 Add MDM for sem >= 3
            if (nextSlot.semester >= 3) {
              loadedSubjects.push({
                courseName: "MDM",
                evaluationScheme: [{ name: "ESE", maxMarks: 100, minPassingMarks: 40 }],
                ese: ''
              });
            }

            // 🚀 Add Program + Open Electives for sem >= 5
            if (nextSlot.semester >= 5) {
              loadedSubjects.push(
                {
                  courseName: "Program Elective",
                  evaluationScheme: [{ name: "ESE", maxMarks: 100, minPassingMarks: 40 }],
                  ese: ''
                },
                {
                  courseName: "Open Elective",
                  evaluationScheme: [{ name: "ESE", maxMarks: 100, minPassingMarks: 40 }],
                  ese: ''
                }
              );
            }

            setSubjects(loadedSubjects);
            setErrorMessage('');
          } catch (err: any) {
            setErrorMessage(err.message);
            setSubjects([]);
          }
        };
        fetchSubjects();
      }
    }, [status, nextSlot, enrollmentId, token]);

    const handleSubjectChange = (index: number, field: string, value: string) => {
      const newSubjects = [...subjects];
      newSubjects[index][field] = value;
      setSubjects(newSubjects);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);

      const resultData = {
        enrollmentNumber: enrollmentId,
        ...nextSlot,
        examType: 'ESE',
        subjects: subjects.reduce((acc, subject) => {
          if (subject.courseName) {
            const marksPayload: Record<string, number> = {};
            subject.evaluationScheme.forEach((scheme: { name: string; }) => {
              const key = scheme.name.toLowerCase().replace(/[^a-z]/g, '');
              marksPayload[key] = Number(subject[key]) || 0;
            });
            acc[subject.courseName] = marksPayload;
          }
          return acc;
        }, {}),
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
                  <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><span className="font-medium text-sm">Name:</span><p>{studentDetails.name}</p></div>
                    <div><span className="font-medium text-sm">Dept:</span><p>{studentDetails.department}</p></div>
                    <div><span className="font-medium text-sm">Year:</span><p>{nextSlot.yearOfStudy}</p></div>
                    <div><span className="font-medium text-sm">Semester:</span><p>{nextSlot.semester}</p></div>
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
                                const key = scheme.name.toLowerCase().replace(/[^a-z]/g, '');
                                return (
                                  <input
                                    key={scheme.name}
                                    type="number"
                                    placeholder={`${scheme.name} (${scheme.maxMarks})`}
                                    value={subject[key] || ''}
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

  const BatchAddResultModal: React.FC<{ onClose: () => void; onAdd: (data: any) => Promise<void>; }> = ({ onClose, onAdd }) => {
    const { token } = useAuth();
    const [filters, setFilters] = useState({ department: "", academicYear: "" });
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    // const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchFilteredStudents = async () => {
      // setLoading(true);
      setErrorMessage("");
      try {
        const params = new URLSearchParams(filters as any);
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
        // setLoading(false);
      }
    };

    const fetchSubjects = async (student: any) => {
      // setLoading(true);
      try {
        // 1. Get academic status (like AddResultModal)
        const response = await fetch(`/api/students/${student.enrollmentNumber}/academic-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        const studentDetails = data.student;
        const nextSlot = data.nextResultSlot;

        // 2. Fetch subjects for nextSlot
        const params = new URLSearchParams({
          enrollmentNumber: student.enrollmentNumber,
          semester: nextSlot.semester.toString(),
          year: nextSlot.yearOfStudy
        });
        const subjResponse = await fetch(`/api/subjects?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const subjData = await subjResponse.json();
        if (!subjResponse.ok || !subjData.success) throw new Error(subjData.message);

        let loadedSubjects = subjData.subjects.map((s: any) => ({ ...s, ise: "", mse: "", ese: "" }));

        if (nextSlot.semester >= 3) {
          loadedSubjects.push({
            courseName: "MDM",
            evaluationScheme: [{ name: "ESE", maxMarks: 100, minPassingMarks: 40 }],
            ese: ""
          });
        }
        if (nextSlot.semester >= 5) {
          loadedSubjects.push(
            { courseName: "Program Elective", evaluationScheme: [{ name: "ESE", maxMarks: 100, minPassingMarks: 40 }], ese: "" },
            { courseName: "Open Elective", evaluationScheme: [{ name: "ESE", maxMarks: 100, minPassingMarks: 40 }], ese: "" }
          );
        }
        // console.log("Details: ",studentDetails);
        setSubjects(loadedSubjects);
        setSelectedStudent({ ...studentDetails, nextSlot });
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        // setLoading(false);
      }
    };


    const handleSubjectChange = (index: number, field: string, value: string) => {
      const updated = [...subjects];
      updated[index][field] = value;
      setSubjects(updated);
    };

    const handleSave = async () => {
      if (!selectedStudent) return;
      setSaving(true);

      const resultData = {
        enrollmentNumber: selectedStudent.enrollmentNumber,
        ...selectedStudent.nextSlot,
        examType: "ESE",
        subjects: subjects.reduce((acc, subject) => {
          const marks: Record<string, number> = {};
          subject.evaluationScheme.forEach((scheme: any) => {
            const key = scheme.name.toLowerCase().replace(/[^a-z]/g, "");
            marks[key] = Number(subject[key]) || 0;
          });
          acc[subject.courseName] = marks;
          return acc;
        }, {})
      };

      try {
        await onAdd(resultData);
        setSelectedStudent(null);
        setSubjects([]);
      } catch (err) {
        console.error("Save failed", err);
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
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="border px-2 py-1 rounded"
              >
                <option value="">Department</option>
                <option value="Computer Science">CSE</option>
                <option value="IT">IT</option>
                <option value="MECH">MECH</option>
              </select>

              <select
                onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                className="border px-2 py-1 rounded"
              >
                <option value="">Admission Year</option>
                <option value="2022-23">2022-23</option>
                <option value="2023-24">2023-24</option>
                <option value="2024-25">2024-25</option>
              </select>
            </div>

            <button onClick={fetchFilteredStudents} className="bg-blue-600 text-white px-3 py-2 rounded">Search Students</button>

            {/* Error */}
            {errorMessage && <div className="p-3 bg-red-100 text-red-700 rounded">{errorMessage}</div>}

            {/* Student List */}
            {studentsList.length > 0 && !selectedStudent && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Select a Student</h3>
                <ul className="border rounded divide-y max-h-56 overflow-y-auto">
                  {studentsList.map(stu => (
                    <li key={stu.enrollmentNumber}>
                      <button onClick={() => fetchSubjects(stu)} className="w-full text-left px-3 py-2 hover:bg-gray-50">
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
                <div className="bg-gray-50 p-4 rounded">
                  <p><strong>{selectedStudent.name}</strong> ({selectedStudent.enrollmentNumber})</p>
                  <p>{selectedStudent.department}</p>
                </div>

                {subjects.map((subject, index) => (
                  <div key={index} className="border p-3 rounded space-y-2">
                    <p className="font-medium">{subject.courseName}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {subject.evaluationScheme.map((scheme: any) => {
                        const key = scheme.name.toLowerCase().replace(/[^a-z]/g, "");
                        return (
                          <input
                            key={scheme.name}
                            type="number"
                            placeholder={`${scheme.name} (${scheme.maxMarks})`}
                            value={subject[key] || ""}
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
                  <button onClick={() => setSelectedStudent(null)} className="px-4 py-2 border rounded bg-gray-100">Back</button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">
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

  const EditResultModal: React.FC<{ result: Result; onClose: () => void; onSave: () => void; }> = ({ result, onClose, onSave }) => {
    const { token } = useAuth();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
      const fetchSubjectConfigsAndPopulateMarks = async () => {
        setLoading(true);
        setFormError('');
        try {
          // Step 1: Fetch the subject configuration (with evaluation schemes)
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

          // Step 2: Map configs and populate with existing marks from the result object
          const populatedSubjects = data.subjects.map((config: any) => {
            const existingSubjectData = result.subjects[config.courseName];
            const marks: Record<string, number | ''> = {};

            config.evaluationScheme.forEach((scheme: any) => {
              const key = scheme.name.toLowerCase().replace(/[^a-z]/g, '');
              // Use existing mark if available, otherwise default to empty string
              marks[key] = existingSubjectData?.componentMarks[scheme.name] ?? '';
            });

            return {
              ...config,
              ...marks
            };
          });

          setSubjects(populatedSubjects);

        } catch (err: any) {
          setFormError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchSubjectConfigsAndPopulateMarks();
    }, [result, token]);

    const handleMarkChange = (subjectIndex: number, key: string, value: string) => {
      const newSubjects = [...subjects];
      newSubjects[subjectIndex][key] = value;
      setSubjects(newSubjects);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setFormError('');

      // Dynamically build the payload, just like in the AddResultModal
      const subjectsPayload = subjects.reduce((acc, subject) => {
        const marks: Record<string, number> = {};
        subject.evaluationScheme.forEach((scheme: any) => {
          const key = scheme.name.toLowerCase().replace(/[^a-z]/g, '');
          marks[key] = Number(subject[key]) || 0;
        });
        acc[subject.courseName] = marks;
        return acc;
      }, {});

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen">
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b"><h2 className="text-xl font-semibold">Edit Result</h2></div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><span className="font-medium text-sm">Name:</span><p>{result.studentName}</p></div>
                <div><span className="font-medium text-sm">Enrollment:</span><p>{result.enrollmentNumber}</p></div>
                <div><span className="font-medium text-sm">Year:</span><p>{result.yearOfStudy}</p></div>
                <div><span className="font-medium text-sm">Semester:</span><p>{result.semester}</p></div>
              </div>

              {formError && <div className="p-3 bg-red-100 text-red-700 rounded">{formError}</div>}

              {loading ? <div className="text-center p-8"><LoadingSpinner /></div> : (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Update Subject Marks</h3>
                  <div className="space-y-3">
                    {subjects.map((subject, index) => (
                      <div key={subject.courseCode} className="space-y-2 border p-3 rounded">
                        <p className="font-medium">{subject.courseName}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {/* Dynamically create inputs based on the scheme */}
                          {subject.evaluationScheme.map((scheme: any) => {
                            const key = scheme.name.toLowerCase().replace(/[^a-z]/g, '');
                            return (
                              <input
                                key={scheme.name}
                                type="number"
                                placeholder={`${scheme.name} (${scheme.maxMarks})`}
                                value={subject[key]}
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
              <button type="submit" disabled={loading || saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                {saving ? <LoadingSpinner size="sm" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results Management</h1>
          <p className="text-gray-600 mt-1">View and manage student exam results</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Result
        </button>

        <button
          onClick={() => setShowBatchAddModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Batch Add Result
        </button>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Advanced Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Student name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
            <select
              value={examTypeFilter}
              onChange={(e) => setExamTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="ISE">ISE</option>
              <option value="MSE">MSE</option>
              <option value="ESE">ESE</option>
              <option value="Makeup">Makeup</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Years</option>
              <option value="2023-24">2023-24</option>
              <option value="2024-25">2024-25</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>
        </div>
      </div>
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Results List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Results ({results?.length})
            </h2>
            <button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : results?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || yearFilter || examTypeFilter || statusFilter || academicYearFilter || semesterFilter
                  ? 'Try adjusting your filters'
                  : 'Get started by adding exam results'
                }
              </p>
              {!(searchTerm || yearFilter || examTypeFilter || statusFilter || academicYearFilter || semesterFilter) && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Result
                </button>
              ) && (
                  <button
                    onClick={() => setShowBatchAddModal(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Batch Add Result
                  </button>
                )
              }
            </div>
          )}
        </div>
      </div>
      {/* View Result Modal */}
      {viewingResult && (
        <ViewResultModal
          result={viewingResult}
          onClose={() => setViewingResult(null)}
        />
      )}

      {/* Add Result Modal */}
      {showAddModal && (
        <AddResultModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddResult}
        />
      )}

      {showBatchAddModal && (
        <BatchAddResultModal
          onClose={() => setShowBatchAddModal(false)}
          onAdd={handleAddResult}
        />
      )}

      {editingResult && (
        <EditResultModal
          result={editingResult}
          onClose={() => setEditingResult(null)}
          onSave={() => {
            setEditingResult(null);
            fetchResults();
          }}
        />
      )}
    </div>
  );
};

export default Results;