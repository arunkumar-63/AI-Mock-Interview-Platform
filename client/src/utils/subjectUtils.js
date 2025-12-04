// Utility functions for formatting subject names

export const formatSubjectName = (subject) => {
  const subjectNames = {
    'general': 'General',
    'dsa': 'Data Structures & Algorithms',
    'java': 'Java',
    'python': 'Python',
    'javascript': 'JavaScript',
    'c++': 'C++',
    'system-design': 'System Design',
    'database': 'Database',
    'networking': 'Networking',
    'os': 'Operating Systems',
    'ml': 'Machine Learning',
    'ai': 'Artificial Intelligence',
    'data-science': 'Data Science',
    'blockchain': 'Blockchain',
    'devops': 'DevOps',
    'cloud': 'Cloud Computing',
    'cybersecurity': 'Cybersecurity',
    'mobile': 'Mobile Development',
    'react': 'React',
    'node': 'Node.js'
  };

  return subjectNames[subject] || subject;
};

export const getSubjectColor = (subject) => {
  const subjectColors = {
    'general': 'gray',
    'dsa': 'blue',
    'java': 'red',
    'python': 'blue',
    'javascript': 'yellow',
    'c++': 'blue',
    'system-design': 'purple',
    'database': 'green',
    'networking': 'indigo',
    'os': 'pink',
    'ml': 'teal',
    'ai': 'purple',
    'data-science': 'green',
    'blockchain': 'indigo',
    'devops': 'blue',
    'cloud': 'sky',
    'cybersecurity': 'red',
    'mobile': 'orange',
    'react': 'blue',
    'node': 'green'
  };

  return subjectColors[subject] || 'gray';
};