import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Edit3,
  Eye,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Subject {
  marks: number;
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

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingResult, setViewingResult] = useState<Result | null>(null);
  const [editingResult, setEditingResult] = useState<Result | null>(null);

  useEffect(() => {
    fetchResults();
  }, [token, searchTerm, yearFilter, examTypeFilter, statusFilter, academicYearFilter, semesterFilter]);

  const fetchResults = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
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
        let filteredResults = data.results;

        // Client-side search filtering
        if (searchTerm) {
          filteredResults = filteredResults.filter((result: Result) =>
            result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            result.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setResults(filteredResults);
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
    // This is a placeholder for the actual API call
    console.log('Adding new result:', newResultData);
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
    setShowAddModal(false);
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
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Result Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Student Info */}
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

          {/* Exam Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Exam Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Exam Type</p>
                <p className="text-gray-900">{result.examType}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Overall Status</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.overallStatus)}`}>
                  {result.overallStatus}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-700">Total Marks</p>
                <p className="text-gray-900">{result.totalMarks}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Percentage</p>
                <p className="text-gray-900">{result.percentage.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          {/* Subject-wise Marks */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Subject-wise Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Marks</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Grade</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(result.subjects).map(([subject, data]) => (
                    <tr key={subject} className={data.status === 'FAIL' ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">{data.marks}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getGradeColor(data.grade)}`}>
                          {data.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(data.status)}`}>
                          {data.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Failed Subjects */}
          {result.failedSubjects.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">Failed Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {result.failedSubjects.map((subject) => (
                  <span key={subject} className="inline-flex px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                    {subject}
                  </span>
                ))}
              </div>
              <p className="text-sm text-red-700 mt-2">
                These subjects require makeup examination.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AddResultModal: React.FC<{ onClose: () => void; onAdd: (data: any) => void; }> = ({ onClose, onAdd }) => {
    const [studentId, setStudentId] = useState('');
    const [academicYear, setAcademicYear] = useState('2024-25');
    // --- Added State for Year of Study ---
    const [yearOfStudy, setYearOfStudy] = useState('');
    const [semester, setSemester] = useState('');
    const [examType, setExamType] = useState('ESE');
    const [subjects, setSubjects] = useState([{ name: '', marks: '' }]);

    // --- Logic to dynamically update available semesters ---
    const [availableSemesters, setAvailableSemesters] = useState<number[]>([]);

    useEffect(() => {
      if (yearOfStudy) {
        const yearNum = parseInt(yearOfStudy, 10);
        const newSemesters = [(yearNum * 2) - 1, yearNum * 2];
        setAvailableSemesters(newSemesters);

        // Reset semester if it's not valid for the new year
        if (!newSemesters.includes(parseInt(semester, 10))) {
          setSemester('');
        }
      } else {
        setAvailableSemesters([]);
        setSemester('');
      }
    }, [yearOfStudy]); // This effect runs whenever yearOfStudy changes


    const handleSubjectChange = (index: number, field: 'name' | 'marks', value: string) => {
      const newSubjects = [...subjects];
      newSubjects[index][field] = value;
      setSubjects(newSubjects);
    };

    const addSubject = () => {
      setSubjects([...subjects, { name: '', marks: '' }]);
    };

    const removeSubject = (index: number) => {
      const newSubjects = subjects.filter((_, i) => i !== index);
      setSubjects(newSubjects);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const resultData = {
        studentId,
        academicYear,
        // --- Added yearOfStudy to the submitted data ---
        yearOfStudy: Number(yearOfStudy),
        semester: Number(semester),
        examType,
        subjects: subjects.reduce((acc, subject) => {
          if (subject.name && subject.marks) {
            acc[subject.name] = Number(subject.marks);
          }
          return acc;
        }, {} as Record<string, number>),
      };
      onAdd(resultData);
    };

    // Helper to display year with ordinal (1st, 2nd, etc.)
    const getOrdinalYear = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen">
          <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add New Result</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">✕</button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* --- Modified grid to accommodate the new field --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Enrollment ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="2023-24">2023-24</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2025-26">2025-26</option>
                  </select>
                </div>
                {/* --- Added Year of Study Dropdown --- */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
                  <select value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                    <option value="">Select Year</option>
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>{getOrdinalYear(y)} Year</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  {/* --- Modified Semester Dropdown to be dynamic --- */}
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                    disabled={!yearOfStudy} // Disable until a year is selected
                  >
                    <option value="">Select Semester</option>
                    {availableSemesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                  <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="ISE">ISE</option>
                    <option value="MSE">MSE</option>
                    <option value="ESE">ESE</option>
                    <option value="Makeup">Makeup</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Subjects & Marks</h3>
                <div className="space-y-3">
                  {subjects.map((subject, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Subject Name (e.g., MATH101)"
                        value={subject.name}
                        onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Marks"
                        value={subject.marks}
                        onChange={(e) => handleSubjectChange(index, 'marks', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <button type="button" onClick={() => removeSubject(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addSubject}
                  className="mt-3 inline-flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Save Result
                </button>
              </div>
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
              Results ({results.length})
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
          ) : results.length > 0 ? (
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