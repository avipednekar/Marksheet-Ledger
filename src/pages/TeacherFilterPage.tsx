import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Filter } from "lucide-react";

const StudentFilterPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    prn: "",
    branch: "",
    teacher: "",
    subject: "",
    semester: "",
  });
  const [filterOptions, setFilterOptions] = useState<any>({});
  const [students, setStudents] = useState<any[]>([]);

  // Load filter dropdown options
  useEffect(() => {
    axios.get("http://localhost:5000/api/filters").then((res) => {
      setFilterOptions(res.data);
    });
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = async () => {
    const query = Object.entries(filters)
      .filter(([_, val]) => val !== "")
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join("&");

    const res = await axios.get(`http://localhost:5000/api/students?${query}`);
    setStudents(res.data);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 overflow-y-auto mt-16 p-6">
          <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                <Filter className="text-blue-600 h-6 w-6" /> Student Filter
              </h2>
              <button
                onClick={handleApplyFilters}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:shadow-md transition-all"
              >
                Apply Filters
              </button>
            </div>

            {/* Filter Inputs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <input
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                placeholder="Student Name"
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="prn"
                value={filters.prn}
                onChange={handleFilterChange}
                placeholder="PRN"
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <select
                name="branch"
                value={filters.branch}
                onChange={handleFilterChange}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Branch</option>
                {filterOptions.branches?.map((b: string) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                name="teacher"
                value={filters.teacher}
                onChange={handleFilterChange}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Teacher</option>
                {filterOptions.teachers?.map((t: string) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Subject</option>
                {filterOptions.subjects?.map((s: string) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Semester</option>
                {filterOptions.semesters?.map((sem: string) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-blue-50">
                  <tr>
                    {students.length > 0 &&
                      Object.keys(students[0]).map((key, i) => (
                        <th
                          key={i}
                          className="text-left text-sm font-semibold text-gray-700 p-3 border-b"
                        >
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 transition-colors border-b"
                    >
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="p-3 text-sm text-gray-700">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {students.length === 0 && (
              <p className="text-center text-gray-500 mt-6">
                No records found. Adjust filters and try again.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentFilterPage;