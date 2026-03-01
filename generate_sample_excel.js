const xlsx = require('xlsx');

// 1. Subjects Data
const subjectsData = [
    { Code: "CS101", Name: "Programming in C", Type: "Theory", Duration: 1, SessionsPerWeek: 4 },
    { Code: "CS102", Name: "Data Structures", Type: "Theory", Duration: 1, SessionsPerWeek: 4 },
    { Code: "CS103", Name: "Database Management", Type: "Theory", Duration: 1, SessionsPerWeek: 4 },
    { Code: "CS104", Name: "Operating Systems", Type: "Theory", Duration: 1, SessionsPerWeek: 4 },
    { Code: "CS105", Name: "Computer Networks", Type: "Theory", Duration: 1, SessionsPerWeek: 4 },
    { Code: "CSL101", Name: "C Programming Lab", Type: "Lab", Duration: 3, SessionsPerWeek: 1 },
    { Code: "CSL102", Name: "DBMS Lab", Type: "Lab", Duration: 3, SessionsPerWeek: 1 }
];

// 2. Faculty Data
const facultyData = [
    { Name: "Dr. Smith", Designation: "Professor", Department: "CSE", MaxLoad: 12, Subjects: "CS101, CS104" },
    { Name: "Prof. Johnson", Designation: "Associate Professor", Department: "CSE", MaxLoad: 16, Subjects: "CS102, CS105" },
    { Name: "Ajay", Designation: "Assistant Professor", Department: "CSE", MaxLoad: 16, Subjects: "CS103" },
    { Name: "Ms. Davis", Designation: "Assistant Professor", Department: "CSE", MaxLoad: 12, Subjects: "CSL101, CSL102" },
    { Name: "Mr. Wilson", Designation: "Assistant Professor", Department: "CSE", MaxLoad: 16, Subjects: "CS101, CS102" }
];

// 3. Sections Data
const sectionsData = [
    { Name: "A", Department: "CSE", Year: 1, Semester: 1 },
    { Name: "B", Department: "CSE", Year: 1, Semester: 1 },
    { Name: "A", Department: "CSE", Year: 2, Semester: 1 }
];

// 4. Semesters (Curriculum mapping) Data
const semestersData = [
    { Department: "CSE", Year: 1, Semester: 1, Subjects: "CS101, CS102, CSL101" },
    { Department: "CSE", Year: 2, Semester: 1, Subjects: "CS103, CS104, CS105, CSL102" }
];

// Create workbook and add sheets
const wb = xlsx.utils.book_new();

const wsSubjects = xlsx.utils.json_to_sheet(subjectsData);
xlsx.utils.book_append_sheet(wb, wsSubjects, "Subjects");

const wsFaculty = xlsx.utils.json_to_sheet(facultyData);
xlsx.utils.book_append_sheet(wb, wsFaculty, "Faculty");

const wsSections = xlsx.utils.json_to_sheet(sectionsData);
xlsx.utils.book_append_sheet(wb, wsSections, "Sections");

const wsSemesters = xlsx.utils.json_to_sheet(semestersData);
xlsx.utils.book_append_sheet(wb, wsSemesters, "Semesters");

// Write file
xlsx.writeFile(wb, "sample_data_updated.xlsx");
console.log("Created sample_data_updated.xlsx successfully!");
