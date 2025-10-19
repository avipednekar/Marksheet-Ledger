import React, { useState } from 'react';
import Navbar from "../components/Navbar"; 
import Sidebar from "../components/Sidebar"; 

// Define the structure of the data we expect from the API
interface Course {
  course_code: string;
  ise: string | number;
  ese_or_mk: string | number;
  total_marks: string | number;
  credits: string | number;
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
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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
      const response = await fetch(`http://localhost:3000/student/${prn}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Student not found.');
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

  // Helper to display a value or an empty string if it's 'N/A'
  const renderCell = (value: string | number) => {
    return value !== 'N/A' ? value : '';
  };

  return (
    // Main container for the entire page layout
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Wrapper for Navbar and main content */}
      <div className="flex-1 flex flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Main content area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Student Result Viewer</h1>
            
            <form onSubmit={handleSearch} className="flex gap-4 mb-8">
              <input
                type="text"
                value={prn}
                onChange={(e) => setPrn(e.target.value)}
                placeholder="Enter Student PRN"
                className="flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                type="submit" 
                className="py-3 px-6 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed" 
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            <div>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center">
                  {error}
                </div>
              )}
              
              {studentData && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold text-gray-900">{studentData.name}</h2>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-gray-700">
                    <p><strong>PRN:</strong> {prn}</p>
                    <p><strong>Branch:</strong> {renderCell(studentData.branch)}</p>
                    <p className="col-span-2"><strong>Overall Result:</strong> 
                      <span className="font-bold ml-2 px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                        {renderCell(studentData.result)}
                      </span>
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto mt-6">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISE</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ESE / MK</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {/* MODIFICATION 1: Filter out rows where total_marks is 'N/A' before mapping */}
                        {studentData.marks
                          .filter(course => course.total_marks !== 'N/A')
                          .map((course, index) => {
                            // MODIFICATION 2: Round the total marks if it's a number
                            const displayMarks = typeof course.total_marks === 'number'
                              ? Math.round(course.total_marks)
                              : course.total_marks;

                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap">{renderCell(course.course_code)}</td>
                                <td className="px-4 py-4 whitespace-nowrap">{renderCell(course.ise)}</td>
                                <td className="px-4 py-4 whitespace-nowrap">{renderCell(course.ese_or_mk)}</td>
                                <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">{renderCell(displayMarks)}</td>
                                <td className="px-4 py-4 whitespace-nowrap">{renderCell(course.credits)}</td>
                              </tr>
                            );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDataViewer;