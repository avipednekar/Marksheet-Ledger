import express from 'express';
import XLSX from 'xlsx';
const router = express.Router();

const workbook = XLSX.readFile('D:\\Marksheet ledger\\server\\routes\\ESE_June_2020_B Tech-FY_Semester_II__Combined_Ledger_Sheet-15.12.2020.xlsx');
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

router.get('/filters', (req, res) => {
  const branches = [...new Set(data.map(d => d.Branch))].filter(Boolean);
  const teachers = [...new Set(data.map(d => d.Teacher))].filter(Boolean);
  const subjects = [...new Set(data.map(d => d.Subject))].filter(Boolean);
  const semesters = [...new Set(data.map(d => d.Semester))].filter(Boolean);
  res.json({ branches, teachers, subjects, semesters });
});

router.get('/students', (req, res) => {
  const { name, prn, branch, teacher, subject, semester } = req.query;

  let filtered = data;

  if (name)
    filtered = filtered.filter(d =>
      d.Name && d.Name.toLowerCase().includes(name.toLowerCase())
    );

  if (prn)
    filtered = filtered.filter(d =>
      d.PRN && d.PRN.toString().includes(prn)
    );

  if (branch)
    filtered = filtered.filter(d => d.Branch === branch);

  if (teacher)
    filtered = filtered.filter(d => d.Teacher === teacher);

  if (subject)
    filtered = filtered.filter(d => d.Subject === subject);

  if (semester)
    filtered = filtered.filter(d => d.Semester === semester);

  res.json(filtered);
});

export default router;