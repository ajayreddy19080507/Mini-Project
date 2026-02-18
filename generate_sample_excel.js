const XLSX = require('xlsx');

// 1. Subjects Data
const subjects = [
    { Code: 'CS101', Name: 'Programming in C', Type: 'Theory', Duration: 1 },
    { Code: 'CS102', Name: 'Data Structures', Type: 'Theory', Duration: 1 },
    { Code: 'CS103', Name: 'Database Management', Type: 'Theory', Duration: 1 },
    { Code: 'CS104', Name: 'Operating Systems', Type: 'Theory', Duration: 1 },
    { Code: 'CS105', Name: 'Computer Networks', Type: 'Theory', Duration: 1 },
    { Code: 'CSL101', Name: 'C Programming Lab', Type: 'Lab', Duration: 3 },
    { Code: 'CSL102', Name: 'DBMS Lab', Type: 'Lab', Duration: 3 },
];

// 2. Faculty Data
const faculty = [
    { Name: 'Dr. Smith', Designation: 'Professor', MaxLoad: 10, Subjects: 'CS101, CS104' },
    { Name: 'Prof. Johnson', Designation: 'Associate Professor', MaxLoad: 12, Subjects: 'CS102, CS105' },
    { Name: 'Ajay', Designation: 'Assistant Professor', MaxLoad: 16, Subjects: 'CS103, CSL102' },
    { Name: 'Ms. Davis', Designation: 'Assistant Professor', MaxLoad: 16, Subjects: 'CSL101, CSL102' },
    { Name: 'Mr. Wilson', Designation: 'Assistant Professor', MaxLoad: 16, Subjects: 'CS101, CS102' },
];

// 3. Sections Data
const sections = [
    { Name: 'A', Department: 'CSE', Year: 1, Semester: 1 },
    { Name: 'B', Department: 'CSE', Year: 1, Semester: 1 },
    { Name: 'A', Department: 'CSE', Year: 2, Semester: 1 },
];

// 4. Curriculum (Semesters) Data
// Mapping Departments/Semesters to Subject Codes
const semesters = [
    { Department: 'CSE', Year: 1, Semester: 1, Subjects: 'CS101, CS102, CSL101' },
    { Department: 'CSE', Year: 2, Semester: 1, Subjects: 'CS103, CS104, CS105, CSL102' },
];

// Create Workbook
const wb = XLSX.utils.book_new();

// Add Sheets
const wsSubjects = XLSX.utils.json_to_sheet(subjects);
XLSX.utils.book_append_sheet(wb, wsSubjects, "Subjects");

const wsFaculty = XLSX.utils.json_to_sheet(faculty);
XLSX.utils.book_append_sheet(wb, wsFaculty, "Faculty");

const wsSections = XLSX.utils.json_to_sheet(sections);
XLSX.utils.book_append_sheet(wb, wsSections, "Sections");

const wsSemesters = XLSX.utils.json_to_sheet(semesters);
XLSX.utils.book_append_sheet(wb, wsSemesters, "Semesters");

// Write File
XLSX.writeFile(wb, "sample_data.xlsx");
console.log("sample_data.xlsx created successfully!");
