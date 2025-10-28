import React from 'react';
import { Eye, Edit3, AlertTriangle } from 'lucide-react';
import { Result } from '../../helpers/interfaces';
import { getStatusIcon, getStatusColor } from '../../helpers/Utils';

interface ResultCardProps {
  result: Result;
  onView: (result: Result) => void;
  onEdit: (result: Result) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onView, onEdit }) => (
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
          onClick={() => onView(result)}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEdit(result)}
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

export default ResultCard;