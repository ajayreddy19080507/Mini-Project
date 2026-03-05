const xlsx = require('xlsx');

function analyzeData(filePath) {
    console.log(`Analyzing ${filePath}...`);
    try {
        const wb = xlsx.readFile(filePath);

        const subjects = xlsx.utils.sheet_to_json(wb.Sheets['Subjects']);
        const faculty = xlsx.utils.sheet_to_json(wb.Sheets['Faculty']);
        const sections = xlsx.utils.sheet_to_json(wb.Sheets['Sections']);
        const semesters = xlsx.utils.sheet_to_json(wb.Sheets['Semesters']);

        console.log(`\n--- Overview ---`);
        console.log(`Subjects: ${subjects.length}`);
        console.log(`Faculty: ${faculty.length}`);
        console.log(`Sections: ${sections.length}`);
        console.log(`Semesters: ${semesters.length}`);

        // 1. Calculate section load
        const sectionLoads = {};
        for (const sec of sections) {
            const semData = semesters.find(s => s.Department === sec.Department && s.Year === sec.Year && s.Semester === sec.Semester);
            if (!semData) {
                console.warn(`WARNING: No curriculum found for Section ${sec.Department}-${sec.Year}-${sec.Name}`);
                continue;
            }

            const subCodes = semData.Subjects.split(',').map(s => s.trim());
            let totalPeriods = 0;

            for (const code of subCodes) {
                const subj = subjects.find(s => s.Code === code);
                if (subj) {
                    const duration = subj.Duration || (subj.Type === 'Lab' ? 3 : 1);
                    const sessions = subj.SessionsPerWeek || (subj.Type === 'Lab' ? 1 : 4);
                    totalPeriods += duration * sessions;
                } else {
                    console.warn(`WARNING: Subject ${code} in curriculum not found in Subjects sheet.`);
                }
            }

            const key = `${sec.Department}-${sec.Year}-${sec.Name}`;
            sectionLoads[key] = totalPeriods;

            if (totalPeriods > 42) {
                console.error(`\nCRITICAL ERROR: Section ${key} requires ${totalPeriods} periods per week, but there are only 42 slots available (6 days * 7 periods).`);
            } else {
                console.log(`Section ${key} requires ${totalPeriods}/42 periods.`);
            }
        }

        // 2. Calculate faculty availability vs requirement
        const subjectRequiredInstances = {};
        for (const sec of sections) {
            const semData = semesters.find(s => s.Department === sec.Department && s.Year === sec.Year && s.Semester === sec.Semester);
            if (!semData) continue;

            const subCodes = semData.Subjects.split(',').map(s => s.trim());
            for (const code of subCodes) {
                subjectRequiredInstances[code] = (subjectRequiredInstances[code] || 0) + 1;
            }
        }

        console.log(`\n--- Faculty Subject Coverage ---`);
        for (const subj of subjects) {
            const requiredCount = subjectRequiredInstances[subj.Code] || 0;
            if (requiredCount === 0) continue;

            const capableFaculty = faculty.filter(f => f.Subjects && f.Subjects.includes(subj.Code));

            if (capableFaculty.length === 0) {
                console.error(`CRITICAL ERROR: No faculty assigned to teach ${subj.Code} (${subj.Name}). Required for ${requiredCount} sections.`);
            } else {
                console.log(`${subj.Code} is required for ${requiredCount} sections. Capable Faculty: ${capableFaculty.map(f => f.Name).join(', ')}`);

                // Do they have enough combined MaxLoad?
                const duration = subj.Duration || (subj.Type === 'Lab' ? 3 : 1);
                const sessions = subj.SessionsPerWeek || (subj.Type === 'Lab' ? 1 : 4);
                const totalLoadRequired = requiredCount * duration * sessions;

                const totalAvailableLoad = capableFaculty.reduce((acc, f) => acc + (f.MaxLoad || 16), 0);

                if (totalAvailableLoad < totalLoadRequired) {
                    console.error(`  -> WARNING: Faculty overload! Subject ${subj.Code} requires ${totalLoadRequired} total periods, but assigned faculty only have a combined MaxLoad of ${totalAvailableLoad} (which they might also share with other subjects).`);
                }
            }
        }

    } catch (e) {
        console.error("Error parsing Excel:", e);
    }
}

analyzeData('sample_data_updated (6).xlsx');
