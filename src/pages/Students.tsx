// Students.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, User, Mail, Phone, MapPin, Calendar, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Student {
  _id: string;
  name: string;
  email: string;
  enrollmentNumber: string;
  department: string;
  admissionYear: string;
  admissionType: 'Regular' | 'DSY';
  yearOfStudy?: number | 'Graduated';
  semester?: number | 'N/A';
  phone: string;
  address: string;
  dateOfBirth: string;
}

const Students: React.FC = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [searchTerm, yearFilter, departmentFilter, academicYearFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (yearFilter) params.append('yearOfStudy', yearFilter);
      if (departmentFilter) params.append('department', departmentFilter);
      if (academicYearFilter) params.append('academicYear', academicYearFilter);

      const queryString = params.toString();
      const url = queryString ? `/api/students?${queryString}` : '/api/students';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to delete this student? This will also delete all their results.')) {
      return;
    }
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(students.filter(s => s._id !== studentId));
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  const StudentCard: React.FC<{ student: Student }> = ({ student }) => (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{student.name}</h3>
            <p className="text-sm text-neutral-600">{student.enrollmentNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setEditingStudent(student)} className="p-2 text-neutral-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit3 className="h-4 w-4" /></button>
          <button onClick={() => handleDeleteStudent(student._id)} className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center text-neutral-600"><Mail className="h-4 w-4 mr-2" /><span>{student.email}</span></div>
          <div className="flex items-center text-neutral-600"><Phone className="h-4 w-4 mr-2" /><span>{student.phone}</span></div>
          <div className="flex items-center text-neutral-600"><GraduationCap className="h-4 w-4 mr-2" /><span>{student.department}</span></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-neutral-600"><Calendar className="h-4 w-4 mr-2" /><span>Year {student.yearOfStudy}, Sem {student.semester}</span></div>
          <div className="flex items-center text-neutral-600"><MapPin className="h-4 w-4 mr-2" /><span className="truncate">{student.address}</span></div>
          <div className="text-neutral-500">Admission: {student.admissionYear} ({student.admissionType})</div>
        </div>
      </div>
    </div>
  );

  const AddEditStudentModal: React.FC<{ student: Student | null; onClose: () => void; onSave: () => void; }> = ({ student, onClose, onSave }) => {
    const [formData, setFormData] = useState({
      name: student?.name || '',
      email: student?.email || '',
      enrollmentNumber: student?.enrollmentNumber || '',
      department: student?.department || '',
      admissionYear: student?.admissionYear || '2024-25',
      admissionType: student?.admissionType || 'Regular',
      phone: student?.phone || '',
      address: student?.address || '',
      dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : ''
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setFormError('');
      try {
        const url = student ? `/api/students/${student._id}` : '/api/students';
        const method = student ? 'PUT' : 'POST';
        const response = await fetch(url, {
          method,
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
          onSave();
          onClose();
        } else {
          setFormError(data.message);
        }
      } catch (err) {
        setFormError('Failed to save student details. Please try again.');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 flex justify-center z-50 backdrop-blur-sm bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="p-6 border-b border-neutral-200"><h2 className="text-xl font-semibold text-neutral-900">{student ? 'Edit Student' : 'Add New Student'}</h2></div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {formError && <div className="p-3 bg-red-100 text-red-800 border border-red-200 rounded-lg">{formError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-lg"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-lg"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Enrollment Number *</label>
                  <input type="text" required value={formData.enrollmentNumber} onChange={(e) => setFormData({...formData, enrollmentNumber: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-lg"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Department *</label>
                  <select required value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-lg">
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Admission Year *</label>
                  <select required value={formData.admissionYear} onChange={(e) => setFormData({ ...formData, admissionYear: e.target.value })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg">
                    <option value="2022-23">2022-23</option>
                    <option value="2023-24">2023-24</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2025-26">2025-26</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Admission Type *</label>
                  <select required value={formData.admissionType} onChange={(e) => setFormData({ ...formData, admissionType: e.target.value as 'Regular' | 'DSY' })} className="w-full px-3 py-2 border border-neutral-300 rounded-lg">
                    <option value="Regular">Regular (First Year)</option>
                    <option value="DSY">Direct Second Year (DSY)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-lg"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Date of Birth</label>
                  <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-lg"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                <textarea rows={3} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-lg"/>
              </div>
            </div>
            <div className="p-6 border-t border-neutral-200 mt-auto flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                {saving && <LoadingSpinner size="sm" className="mr-2" />}
                {saving ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Student Management</h1>
          <p className="text-neutral-600 mt-1">Manage student records and information</p>
        </div>
        <button onClick={() => { setEditingStudent(null); setShowAddModal(true); }} className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Add Student
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center space-x-2 mb-4"><Filter className="h-5 w-5 text-neutral-400" /><h2 className="font-semibold text-neutral-900">Filters</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input type="text" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Year of Study</label>
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg">
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Department</label>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg">
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Academic Year</label>
            <select value={academicYearFilter} onChange={(e) => setAcademicYearFilter(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-lg">
              <option value="">All Years</option>
              <option value="2023-24">2023-24</option>
              <option value="2024-25">2024-25</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800">{error}</p></div>}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="p-6 border-b border-neutral-200"><h2 className="text-lg font-semibold text-neutral-900">Students ({students.length})</h2></div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32"><LoadingSpinner size="lg" /></div>
          ) : students.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {students.map((student) => (<StudentCard key={student._id} student={student} />))}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No students found</h3>
              <p className="text-neutral-600 mb-4">
                {searchTerm || yearFilter || departmentFilter || academicYearFilter ? 'Try adjusting your filters' : 'Get started by adding your first student'}
              </p>
              {!(searchTerm || yearFilter || departmentFilter || academicYearFilter) && (
                <button onClick={() => { setEditingStudent(null); setShowAddModal(true); }} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" /> Add Student
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {(showAddModal || editingStudent) && (
        <AddEditStudentModal
          student={editingStudent}
          onClose={() => {
            setShowAddModal(false);
            setEditingStudent(null);
            setError('');
          }}
          onSave={() => {
            fetchStudents();
          }}
        />
      )}
    </div>
  );
};

export default Students;