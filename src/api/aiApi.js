import axios from "axios";

const API_BASE = "http://localhost:4000"; // Your backend base URL

// Generate AI questions
export const generateQuestions = async () => {
  const res = await axios.get(`${API_BASE}/ai/generate-questions`);
  return res.data;
};

// Score an answer
export const scoreAnswer = async (candidateId, question, answer) => {
  const res = await axios.post(`${API_BASE}/ai/score`, {
    candidateId,
    question,
    answer,
  });
  return res.data;
};

// Finalize candidate and generate summary
export const finalizeCandidate = async (candidateId) => {
  const res = await axios.post(`${API_BASE}/ai/finalize`, { candidateId });
  return res.data;
};
