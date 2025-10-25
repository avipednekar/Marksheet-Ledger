import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

// Define data interfaces
interface Course {
  course_code: string;
  ise?: string | number;
  ese?: string | number;
  mk?: string | number;
  credits?: string | number;
}

interface StudentData {
  name: string;
  branch: string;
  result: string;
  marks: Course[];
}

const StudentDataViewer: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [prn, setPrn] = useState<string>('');
  const [branch, setBranch] = useState<'FY' | 'CSE'>('FY');
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentData = async () => {
    if (!prn) {
      setError('Please enter a PRN.');
      return;
    }

    setLoading(true);
    setError(null);
    setStudentData(null);

    try {
      const baseUrl =
        branch === 'FY'
          ? `http://localhost:3000/fy_students/${prn}`
          : `http://localhost:3000/cse_students/${prn}`;

      const response = await fetch(baseUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Student not found.');
      }

      const data: StudentData = await response.json();
      setStudentData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudentData();
  };

  const renderCell = (value: string | number | undefined) => {
    if (value === undefined || value === 'N/A' || Number.isNaN(value)) {
      return '';
    }
    return value;
  };

  const toNumber = (val: string | number | undefined): number => {
    if (val === undefined || val === 'N/A' || val === '' || Number.isNaN(val)) return 0;
    return Number(val);
  };

  // Detect columns
  const showESE =
    studentData?.marks?.some(
      (course) => course.ese !== undefined && course.ese !== 'N/A'
    ) ?? false;

  const showMK =
    studentData?.marks?.some(
      (course) => course.mk !== undefined && course.mk !== 'N/A'
    ) ?? false;

  // Filter: valid courses with marks and exclude summary rows
  const validCourses =
    studentData?.marks?.filter((course) => {
      const code = (course.course_code || '').toString().toUpperCase();

      // Exclude summary/total rows
      const isSummary =
        code.includes('CRDT') ||
        code.includes('CUML') ||
        code.includes('TOTAL') ||
        code.includes('SGPA') ||
        code.includes('CGPA') ||
        code.trim() === '';

      if (isSummary) return false;

      // Must have at least one valid mark
      const hasISE = course.ise && course.ise !== 'N/A' && !Number.isNaN(course.ise);
      const hasESE = course.ese && course.ese !== 'N/A' && !Number.isNaN(course.ese);
      const hasMK = course.mk && course.mk !== 'N/A' && !Number.isNaN(course.mk);

      return hasISE || hasESE || hasMK;
    }) ?? [];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
              Student Result Viewer
            </h1>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-4 mb-8"
            >
              <input
                type="text"
                value={prn}
                onChange={(e) => setPrn(e.target.value)}
                placeholder="Enter Student PRN"
                className="flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value as 'FY' | 'CSE')}
                className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="FY">FY</option>
                <option value="CSE">CSE</option>
              </select>

              <button
                type="submit"
                className="py-3 px-6 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Error */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center">
                {error}
              </div>
            )}

            {/* Student Data */}
            {studentData && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-900">
                  {studentData.name}
                </h2>

                <div className="grid grid-cols-2 gap-4 mt-4 text-gray-700">
                  <p>
                    <strong>PRN:</strong> {prn}
                  </p>
                  <p>
                    <strong>Branch:</strong> {renderCell(studentData.branch)}
                  </p>
                  <p className="col-span-2">
                    <strong>Overall Result:</strong>
                    <span className="font-bold ml-2 px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                      {renderCell(studentData.result)}
                    </span>
                  </p>
                </div>

                {/* Marks Table */}
                <div className="overflow-x-auto mt-6">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ISE
                        </th>
                        {showESE && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ESE
                          </th>
                        )}
                        {showMK && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            MK
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Marks
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credits
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {validCourses.map((course, index) => {
                        const iseVal = toNumber(course.ise);
                        const eseVal = toNumber(course.ese);
                        const mkVal = toNumber(course.mk);
                        let total = mkVal > 0 ? iseVal + mkVal : iseVal + eseVal;
                        total = Number(total.toFixed(2));

                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-800">
                              {renderCell(course.course_code)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {renderCell(course.ise)}
                            </td>
                            {showESE && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                {renderCell(course.ese)}
                              </td>
                            )}
                            {showMK && (
                              <td className="px-4 py-4 whitespace-nowrap">
                                {renderCell(course.mk)}
                              </td>
                            )}
                            <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-900">
                              {total > 0 ? total : ''}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {renderCell(course.credits)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDataViewer;