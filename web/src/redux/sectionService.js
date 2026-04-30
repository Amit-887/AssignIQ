import axios from 'axios';

const API_URL = '/api/sections/';

// Create section
const createSection = async (sectionData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL, sectionData, config);
  return response.data;
};

// Get teacher sections
const getTeacherSections = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + 'teacher', config);
  return response.data;
};

// Get available sections for students
const getAvailableSections = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + 'available', config);
  return response.data;
};

// Join section
const joinSection = async (joinCode, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL + 'join', { joinCode }, config);
  return response.data;
};

// Get student sections
const getStudentSections = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + 'student', config);
  return response.data;
};

// Get section details
const getSectionDetails = async (sectionId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + sectionId, config);
  return response.data;
};

// Remove student from section
const removeStudentFromSection = async (sectionId, studentId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + `${sectionId}/students/${studentId}`, config);
  return response.data;
};

const sectionService = {
  createSection,
  getTeacherSections,
  getAvailableSections,
  joinSection,
  getStudentSections,
  getSectionDetails,
  removeStudentFromSection,
};

export default sectionService;
