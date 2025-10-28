import React from 'react';
import { Download } from 'lucide-react';
import { Result } from '../../helpers/interfaces';
import { getStatusColor, getGradeColor } from '../../helpers/Utils';

interface ViewResultModalProps {
  result: Result;
  onClose: () => void;
}

const ViewResultModal: React.FC<ViewResultModalProps> = ({ result, onClose }) => (
  <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Result Details</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">✕</button>
      </div>
      <div className="p-6 space-y-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Student Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="font-medium text-gray-700">Name</p><p className="text-gray-900">{result.studentName}</p></div>
            <div><p className="font-medium text-gray-700">Enrollment</p><p className="text-gray-900">{result.enrollmentNumber}</p></div>
            <div><p className="font-medium text-gray-700">Year & Semester</p><p className="text-gray-900">Year {result.yearOfStudy}, Sem {result.semester}</p></div>
            <div><p className="font-medium text-gray-700">Academic Year</p><p className="text-gray-900">{result.academicYear}</p></div>
          </div>
        </div>

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

export default ViewResultModal;