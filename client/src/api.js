import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL,
});

export const reportBug = async (title, description) => {
  const response = await api.post('/submit', {
    title,
    body: description,
  });
  return response.data.issue_url;
};

export const foo = 'bar';
