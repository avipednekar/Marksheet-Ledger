import React, { useState } from 'react';

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

  const showESE =
    studentData?.marks?.some(
      (course) => course.ese !== undefined && course.ese !== 'N/A'
    ) ?? false;

  const showMK =
    studentData?.marks?.some(
      (course) => course.mk !== undefined && course.mk !== 'N/A'
    ) ?? false;

  const validCourses =
    studentData?.marks?.filter((course) => {
      const code = (course.course_code || '').toString().toUpperCase();

      const isSummary =
        code.includes('CRDT') ||
        code.includes('CUML') ||
        code.includes('TOTAL') ||
        code.includes('SGPA') ||
        code.includes('CGPA') ||
        code.trim() === '';

      if (isSummary) return false;

      const hasISE = course.ise && course.ise !== 'N/A' && !Number.isNaN(course.ise);
      const hasESE = course.ese && course.ese !== 'N/A' && !Number.isNaN(course.ese);
      const hasMK = course.mk && course.mk !== 'N/A' && !Number.isNaN(course.mk);

      return hasISE || hasESE || hasMK;
    }) ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-neutral-900 mb-6">
        Student Result Viewer
      </h1>

      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        <input
          type="text"
          value={prn}
          onChange={(e) => setPrn(e.target.value)}
          placeholder="Enter Student PRN"
          className="flex-1 p-3 border border-neutral-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />

        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value as 'FY' | 'CSE')}
          className="p-3 border border-neutral-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="FY">FY</option>
          <option value="CSE">CSE</option>
        </select>

        <button
          type="submit"
          className="py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:bg-neutral-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}

      {studentData && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900">
            {studentData.name}
          </h2>

          <div className="grid grid-cols-2 gap-4 mt-4 text-neutral-700">
            <p>
              <strong>PRN:</strong> {prn}
            </p>
            <p>
              <strong>Branch:</strong> {renderCell(studentData.branch)}
            </p>
            <p className="col-span-2">
              <strong>Overall Result:</strong>
              <span className="font-bold ml-2 px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-800">
                {renderCell(studentData.result)}
              </span>
            </p>
          </div>

          <div className="overflow-x-auto mt-6">
            <table className="min-w-full bg-white border border-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Course Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    ISE
                  </th>
                  {showESE && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      ESE
                    </th>
                  )}
                  {showMK && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      MK
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Total Marks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Credits
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-200">
                {validCourses.map((course, index) => {
                  const iseVal = toNumber(course.ise);
                  const eseVal = toNumber(course.ese);
                  const mkVal = toNumber(course.mk);
                  let total = mkVal > 0 ? iseVal + mkVal : iseVal + eseVal;
                  total = Number(total.toFixed(2));

                  return (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="px-4 py-4 whitespace-nowrap font-medium text-neutral-800">
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
                      <td className="px-4 py-4 whitespace-nowrap font-semibold text-neutral-900">
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
  );
};

export default StudentDataViewer;