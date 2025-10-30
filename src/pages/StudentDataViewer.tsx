import React, { useState } from 'react';

interface Course {
  course_code: string;
  ise?: string | number;
  ese?: string | number;
  mk?: string | number;
  credits?: string | number;
}

interface StudentData {
  prn: string;
  name: string;
  branch: string;
  result: string;
  marks: Course[];
}

interface SubjectStudent {
  prn: string;
  name: string;
  ise?: string | number;
  ese?: string | number;
  mk?: string | number;
  total?: string | number;
  result?: string;
}

const StudentDataViewer: React.FC = () => {
  const [searchType, setSearchType] = useState<'prn' | 'subject'>('prn');
  const [prn, setPrn] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectResults, setSubjectResults] = useState<SubjectStudent[]>([]);
  const [branch, setBranch] = useState<'FY' | 'CSE'>('FY');
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStudentData = async (p = 1) => {
    if (searchType === 'prn' && !prn) {
      setError('Please enter a PRN.');
      return;
    }
    if (searchType === 'subject' && !subject) {
      setError('Please enter a subject code.');
      return;
    }

    setLoading(true);
    setError(null);
    setStudentData(null);
    setSubjectResults([]);

    try {
      if (searchType === 'prn') {
        const url =
          branch === 'FY'
            ? `http://localhost:3000/fy_students/${prn}`
            : `http://localhost:3000/cse_students/${prn}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Student not found.');
        const data = await res.json();
        setStudentData(data);
      } else {
        const url = `http://localhost:3000/fy_students/subject/${subject}?page=${p}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Subject not found.');
        const data = await res.json();
        setSubjectResults(data.students || []);
        setPage(data.page);
        setTotalPages(data.total_pages);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudentData(1);
  };

  const renderCell = (value: string | number | undefined) =>
    value === undefined || value === 'N/A' ? '' : value;

  const renderTotal = (ise?: string | number, ese?: string | number, mk?: string | number) => {
    const iseVal = parseFloat(ise as string) || 0;
    const eseVal = parseFloat(ese as string) || 0;
    const mkVal = parseFloat(mk as string) || 0;
    return mkVal > 0 ? iseVal + mkVal : iseVal + eseVal;
  };

  const validCourses =
    studentData?.marks?.filter((course) => {
      const ise = renderCell(course.ise);
      const ese = renderCell(course.ese);
      const mk = renderCell(course.mk);
      return ise !== '' || ese !== '' || mk !== '';
    }) || [];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">Student Result Viewer</h1>

      {/* 🔄 Search Type Switch */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          type="button"
          className={`px-4 py-2 rounded-lg ${searchType === 'prn' ? 'bg-indigo-600 text-white' : 'bg-neutral-200'}`}
          onClick={() => setSearchType('prn')}
        >
          Search by PRN
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-lg ${searchType === 'subject' ? 'bg-indigo-600 text-white' : 'bg-neutral-200'}`}
          onClick={() => setSearchType('subject')}
        >
          Search by Subject
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
        {searchType === 'prn' ? (
          <input
            type="text"
            value={prn}
            onChange={(e) => setPrn(e.target.value)}
            placeholder="Enter Student PRN"
            className="flex-1 p-3 border rounded-lg shadow-sm"
          />
        ) : (
          <div className="relative flex-1">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter Subject Code"
              className="w-full p-3 border rounded-lg shadow-sm"
              list="subject-suggestions"
            />
           
          </div>
        )}

        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value as 'FY' | 'CSE')}
          className="p-3 border rounded-lg shadow-sm"
        >
          <option value="FY">FY</option>
          <option value="CSE">CSE</option>
        </select>

        <button
          type="submit"
          className="py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md"
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

      {studentData && searchType === 'prn' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-2xl font-bold mb-4">{studentData.name}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4 text-neutral-700">
            <p><strong>PRN:</strong> {studentData.prn}</p>
            <p><strong>Branch:</strong> {studentData.branch}</p>
            <p className="col-span-2">
              <strong>Result:</strong>{' '}
              <span className="font-bold ml-2 px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-800">
                {studentData.result}
              </span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-2 text-left">Course Code</th>
                  <th className="px-4 py-2 text-left">ISE</th>
                  <th className="px-4 py-2 text-left">ESE</th>
                  <th className="px-4 py-2 text-left">MK</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2 text-left">Credits</th>
                </tr>
              </thead>
              <tbody>
                {validCourses.map((m, i) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    <td className="px-4 py-2">{m.course_code}</td>
                    <td className="px-4 py-2">{renderCell(m.ise)}</td>
                    <td className="px-4 py-2">{renderCell(m.ese)}</td>
                    <td className="px-4 py-2">{renderCell(m.mk)}</td>
                    <td className="px-4 py-2 font-semibold">{renderTotal(m.ise, m.ese, m.mk).toFixed(2)}</td>
                    <td className="px-4 py-2">{renderCell(m.credits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subjectResults.length > 0 && searchType === 'subject' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
          <h2 className="text-2xl font-bold mb-4">
            Subject: <span className="text-indigo-700">{subject}</span>
          </h2>
          <table className="min-w-full border border-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-2">PRN</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">ISE</th>
                <th className="px-4 py-2">ESE</th>
                <th className="px-4 py-2">MK</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {subjectResults.map((s, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="px-4 py-2">{s.prn}</td>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.ise}</td>
                  <td className="px-4 py-2">{s.ese}</td>
                  <td className="px-4 py-2">{s.mk}</td>
                  <td className="px-4 py-2 font-semibold">{renderTotal(s.ise, s.ese, s.mk).toFixed(2)}</td>
                  <td className="px-4 py-2">{s.result}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => fetchStudentData(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 bg-neutral-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-2 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchStudentData(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-neutral-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDataViewer;