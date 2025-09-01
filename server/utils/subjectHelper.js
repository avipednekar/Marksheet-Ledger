import { subjectMappings } from '../data/subjects.js';

export function getSubjectsForStudent(student, semester) {
  let subjects = [];

  // 1. Core department subjects
  if (subjectMappings[student.yearOfStudy]?.[student.department]?.[semester]) {
    subjects.push(...subjectMappings[student.yearOfStudy][student.department][semester]);
  }

  // 2. MDM subjects (only if chosen & from sem 3 onwards)
  if (student.chosenMDM && subjectMappings.MDM?.[semester]?.[student.chosenMDM]) {
    subjects.push(...subjectMappings.MDM[semester][student.chosenMDM]);
  }

  // 3. Open Electives
  const oeChoice = student.chosenOE?.find(oe => oe.semester === semester);
  if (oeChoice) {
    const oeList = subjectMappings.OE?.[semester] || [];
    const chosenOE = oeList.find(oe => oe.courseCode === oeChoice.courseCode);
    if (chosenOE) subjects.push(chosenOE);
  }

  // 4. Program Electives
  const peChoice = student.chosenPE?.find(pe => pe.semester === semester);
  if (peChoice) {
    const peList = subjectMappings.PE?.[semester] || [];
    const chosenPE = peList.find(pe => pe.courseCode === peChoice.courseCode);
    if (chosenPE) subjects.push(chosenPE);
  }

  return subjects;
}