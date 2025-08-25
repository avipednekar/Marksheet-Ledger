import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, FileText, Download, CheckCircle, XCircle, Clock, AlertTriangle, Edit3, Eye, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Subject {
  ise: number;
  mse: number;
  ese: number;
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

interface Student {
  id: string;
  name: string;
  enrollmentNumber: string;
  department: string;
  yearOfStudy: number;
  semester: number;
  academicYear: string;
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
  const [viewingResult, setViewingResult] = useState<Result | null>(null);
  const [editingResult, setEditingResult] = useState<Result | null>(null);

  // useEffect and fetchResults remain the same as the previous correct version...
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

  // Helper functions (getStatusIcon, getStatusColor, etc.) remain the same...
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
  // --- Updated ViewResultModal ---
  const ViewResultModal: React.FC<{ result: Result; onClose: () => void }> = ({ result, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Result Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">✕</button>
        </div>
        <div className="p-6 space-y-6">
          {/* Student & Exam Info panels remain the same */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Student Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Name</p>
                <p className="text-gray-900">{result.studentName}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Enrollment</p>
                <p className="text-gray-900">{result.enrollmentNumber}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Year & Semester</p>
                <p className="text-gray-900">Year {result.yearOfStudy}, Sem {result.semester}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Academic Year</p>
                <p className="text-gray-900">{result.academicYear}</p>
              </div>
            </div>
          </div>
           {/* Subject-wise Marks - Updated Table Structure */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Subject-wise Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">ISE (20)</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">MSE (30)</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">ESE (50)</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Total (100)</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Grade</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(result.subjects).map(([subject, data]) => (
                    <tr key={subject} className={data.status === 'FAIL' ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">{data.ise}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">{data.mse}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 font-bold">{data.ese}</td>
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

  const AddResultModal: React.FC<{ onClose: () => void; onAdd: (data: any) => void; }> = ({ onClose, onAdd }) => {
    const { token } = useAuth();
    
    // Form state
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [formData, setFormData] = useState({
      enrollmentNumber: '',
      academicYear: '2024-25',
      yearOfStudy: 0,
      semester: 0,
      department: '',
    });
    const [subjects, setSubjects] = useState([{ name: '', ise: '', mse: '', ese: '' }]);
    
    // Loading states
    const [isStudentsLoading, setIsStudentsLoading] = useState(true);
    const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);

    // 1. Fetch all students when the modal opens
    useEffect(() => {
      const fetchAllStudents = async () => {
        setIsStudentsLoading(true);
        try {
          const response = await fetch('/api/students', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) setAllStudents(data.students);
        } catch (err) { console.error("Failed to fetch students", err); }
        finally { setIsStudentsLoading(false); }
      };
      fetchAllStudents();
    }, [token]);

    // 2. When a student is selected, auto-populate their details
    useEffect(() => {
      if (selectedStudentId) {
        const student = allStudents.find(s => s.id === selectedStudentId);
        if (student) {
          setFormData({
            enrollmentNumber: student.enrollmentNumber,
            academicYear: student.academicYear,
            yearOfStudy: student.yearOfStudy,
            semester: student.semester,
            department: student.department,
          });
        }
      } else {
        setFormData({ enrollmentNumber: '', academicYear: '2024-25', yearOfStudy: 0, semester: 0, department: '' });
      }
    }, [selectedStudentId, allStudents]);

    // 3. When student details are populated, fetch the default subjects
    useEffect(() => {
      const fetchDefaultSubjects = async () => {
        if (formData.yearOfStudy && formData.semester && formData.department) {
          setIsSubjectsLoading(true);
          setSubjects([]);
          try {
            const params = new URLSearchParams({
              year: String(formData.yearOfStudy),
              semester: String(formData.semester),
              department: formData.department,
            });
            const response = await fetch(`/api/subjects?${params.toString()}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
              setSubjects(data.subjects.map((s: { name: string }) => ({ name: s.name, ise: '', mse: '', ese: '' })));
            } else { setSubjects([{ name: '', ise: '', mse: '', ese: '' }]); }
          } catch (error) { setSubjects([{ name: '', ise: '', mse: '', ese: '' }]); }
          finally { setIsSubjectsLoading(false); }
        }
      };
      fetchDefaultSubjects();
    }, [formData.yearOfStudy, formData.semester, formData.department, token]);

    const handleSubjectChange = (index: number, field: 'name' | 'ise' | 'mse' | 'ese', value: string) => {
      const newSubjects = [...subjects];
      newSubjects[index][field] = value;
      setSubjects(newSubjects);
    };

    const addSubject = () => setSubjects([...subjects, { name: '', ise: '', mse: '', ese: '' }]);
    const removeSubject = (index: number) => setSubjects(subjects.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const resultData = {
        studentId: formData.enrollmentNumber,
        academicYear: formData.academicYear,
        yearOfStudy: formData.yearOfStudy,
        semester: formData.semester,
        examType: 'ESE',
        subjects: subjects.reduce((acc, subject) => {
          if (subject.name) {
            acc[subject.name] = { ise: Number(subject.ise), mse: Number(subject.mse), ese: Number(subject.ese) };
          }
          return acc;
        }, {} as Record<string, any>),
      };
      onAdd(resultData);
    };


return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen">
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-gray-200"><h2 className="text-xl font-semibold text-gray-900">Add Semester Result</h2></div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Student *</label>
                  {isStudentsLoading ? <LoadingSpinner /> : (
                    <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                      <option value="">-- Select a Student --</option>
                      {allStudents.map(student => (
                        <option key={student.id} value={student.id}>{student.name} ({student.enrollmentNumber})</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input type="text" value={formData.department} className="w-full px-3 py-2 border bg-gray-100 border-gray-300 rounded-lg" disabled />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
                  <input type="text" value={formData.yearOfStudy || ''} className="w-full px-3 py-2 border bg-gray-100 border-gray-300 rounded-lg" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <input type="text" value={formData.semester || ''} className="w-full px-3 py-2 border bg-gray-100 border-gray-300 rounded-lg" disabled />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Subjects & Marks</h3>
                {isSubjectsLoading ? (
                  <div className="flex items-center justify-center p-4"><LoadingSpinner /><span className="ml-2">Loading Subjects...</span></div>
                ) : (
                  <div className="space-y-3">
                    {subjects.map((subject, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <input type="text" value={subject.name} onChange={(e) => handleSubjectChange(index, 'name', e.target.value)} className="col-span-12 md:col-span-5 px-3 py-2 border border-gray-300 rounded-lg" required />
                        <input type="number" placeholder="ISE (20)" value={subject.ise} onChange={(e) => handleSubjectChange(index, 'ise', e.target.value)} max="20" min="0" className="col-span-4 md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg" required />
                        <input type="number" placeholder="MSE (30)" value={subject.mse} onChange={(e) => handleSubjectChange(index, 'mse', e.target.value)} max="30" min="0" className="col-span-4 md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg" required />
                        <input type="number" placeholder="ESE (50)" value={subject.ese} onChange={(e) => handleSubjectChange(index, 'ese', e.target.value)} max="50" min="0" className="col-span-4 md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg" required />
                        <div className="col-span-12 md:col-span-1 flex justify-end">
                          <button type="button" onClick={() => removeSubject(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={addSubject} className="mt-3 inline-flex items-center px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg"><Plus className="h-4 w-4 mr-2" />Add Subject Manually</button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg">Cancel</button>
              <button type="submit" disabled={!selectedStudentId} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Save Result</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Main component return remains the same
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
              )}
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
    </div>
  );
};

export default Results;