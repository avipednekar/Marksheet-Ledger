import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, FileText, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

import { Result } from '../helpers/interfaces';

import ResultCard from '../components/Results/ResultCard';
import ViewResultModal from '../components/Results/ViewResultModal';
import AddResultModal from '../components/Results/AddResultModal';
import BatchAddResultModal from '../components/Results/BatchAddResultModal';
import EditResultModal from '../components/Results/EditResultModal';

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
      setError('');

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm); 
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
        setError(data.message || 'Failed to fetch results');
        setResults([]);
      }
    } catch (err) {
      setError('Failed to load results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResult = async (newResultData: any): Promise<void> => {
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
        fetchResults();
        setShowAddModal(false);
        setShowBatchAddModal(false);
        alert('Result added successfully!');
      } else {
        throw new Error(data.message || 'Failed to add result.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to add result'}`);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Results Management</h1>
          <p className="text-neutral-600 mt-1">View and manage student exam results</p>
        </div>
        <div className='flex space-x-4 mt-4 sm:mt-0'>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Result
          </button>

          <button
            onClick={() => setShowBatchAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Batch Add
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-neutral-400" />
          <h2 className="font-semibold text-neutral-900">Advanced Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Student name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Semester</label>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>{`Semester ${sem}`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Exam Type</label>
            <select
              value={examTypeFilter}
              onChange={(e) => setExamTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="ISE">ISE</option>
              <option value="MSE">MSE</option>
              <option value="ESE">ESE</option>
              <option value="Makeup">Makeup</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Academic Year</label>
            <select
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Years</option>
              <option value="2023-24">2023-24</option>
              <option value="2024-25">2024-25</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              Results ({results?.length})
            </h2>
            <button className="flex items-center px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
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
                <ResultCard 
                  key={result.id} 
                  result={result} 
                  onView={setViewingResult}
                  onEdit={setEditingResult}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No results found</h3>
              <p className="text-neutral-600 mb-4">
                {searchTerm || yearFilter || examTypeFilter || statusFilter || academicYearFilter || semesterFilter
                  ? 'Try adjusting your filters'
                  : 'Get started by adding exam results'
                }
              </p>
              {!(searchTerm || yearFilter || examTypeFilter || statusFilter || academicYearFilter || semesterFilter) && (
                <div className='flex justify-center space-x-4'>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Result
                  </button>
                  <button
                    onClick={() => setShowBatchAddModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Batch Add Result
                  </button>
                </div>
              )
              }
            </div>
          )}
        </div>
      </div>
      {viewingResult && (
        <ViewResultModal
          result={viewingResult}
          onClose={() => setViewingResult(null)}
        />
      )}

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