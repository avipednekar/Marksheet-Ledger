export const subjectMappings = {
  // --- FIRST YEAR ---
  1: {
    // Group A: Circuit Branches (CS, AIML, ECE, EE, IT)
    Circuit: {
      1: [ // Semester 1
        { name: "Engineering Mathematics-I" }, { name: "Optics and Modern Physics" },
        { name: "Communication Skills" }, { name: "Digital Electronics" },
        { name: "Programming in \"C\" Language" }, { name: "Optics and Modern Physics Lab" },
        { name: "Communication Skills Lab" }, { name: "Digital Electronics Lab" },
        { name: "Programming in \"C\" Language Lab" }, { name: "Web Design Lab" },
        { name: "Ecology, Energy & Environment" },
      ],
      2: [ // Semester 2
        { name: "Engineering Mathematics-II" }, { name: "Modern Chemistry" },
        { name: "Basic Electrical Engineering" }, { name: "Python programming" },
        { name: "Data Structure" }, { name: "Modern Chemistry Lab" },
        { name: "Basic Electrical Engineering Lab" }, { name: "Data Structure Lab" },
        { name: "Computer Aided Engineering Graphics" }, { name: "Co-Curricular Course" },
      ]
    },
    // Group B: Core Branches (Civil, Mech, Biotech)
    Core: {
      1: [ // Semester 1
        { name: "Engineering Mathematics-I" }, { name: "Applied Chemistry" },
        { name: "Basic Civil Engineering" }, { name: "Introduction to Python Programming" },
        { name: "Fundamentals of Electrical Engineering" }, { name: "Applied Chemistry Lab" },
        { name: "Basic Civil Engineering Lab" }, { name: "Introduction to Python Lab" },
        { name: "Fundamentals of Electrical Engineering Lab" }, { name: "Computer Aided Engineering Drawing" },
      ],
      2: [ // Semester 2
        { name: "Engineering Mathematics-II" }, { name: "General Physics and Optics" },
        { name: "Communication Skills" }, { name: "Engineering Mechanics" },
        { name: "Basic Mechanical Engineering" }, { name: "General Physics and Optics Lab" },
        { name: "Communication Skills Lab" }, { name: "Engineering Mechanics Lab" },
        { name: "Basic Mechanical Engineering Lab" }, { name: "Workshop Practice Lab" },
        { name: "Ecology, Energy & Environment" }, { name: "Co-Curricular Course" },
      ]
    }
  },
  // --- Add mappings for 2nd, 3rd, and 4th years here ---
  2: {
    "Computer Science": {
      3: [ { name: "Discrete Mathematics" }, { name: "Data Structures & Algorithms" } ],
      4: [ { name: "Operating Systems" }, { name: "Database Management Systems" } ]
    },
    "Mechanical": {
        3: [ { name: "Thermodynamics" }, { name: "Strength of Materials" } ],
        4: [ { name: "Fluid Mechanics" }, { name: "Theory of Machines" } ]
    }
  }
};