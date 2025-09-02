import { subjectMappings } from '../data/subjects.js';

export function getSubjectsForStudent(student, semester,year) {
  if (!student || !semester) {
    return [];
  }

  let group;
  if(student.department==='Computer Science'||'Electronics'){
    group='Circuit'
  } else{
    group='Core'
  }

  const departmentOrGroupKey = year == 1 ? group : student.department;

  const baseCurriculum = subjectMappings[year]?.[departmentOrGroupKey]?.[semester];

  // If no base curriculum is found for the student's year/dept/sem combination, return empty.
  if (!baseCurriculum) {
    console.warn(`No curriculum found for year: ${year}, key: ${departmentOrGroupKey}, semester: ${semester}`);
    return [];
  }
  
  const finalSubjects = [];

  // Find the student's choices for the current semester upfront.
  const chosenPE = student.chosenPE?.find(pe => pe.semester === semester);
  const chosenOE = student.chosenOE?.find(oe => oe.semester === semester);
  const chosenMDM = student.chosenMDM?.find(mdm => mdm.semester === semester);

  for (const subject of baseCurriculum) {
    switch (subject.courseType) {
      case 'Program Elective':
        if (chosenPE) finalSubjects.push(chosenPE);
        break;
      case 'Open Elective':
        if (chosenOE) finalSubjects.push(chosenOE);
        break;
      case 'MDM':
        if (chosenMDM) finalSubjects.push(chosenMDM);
        break;
      default:
        finalSubjects.push(subject);
        break;
    }
  }

  return finalSubjects;
}