import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
})

export const reportBug = async (title, description) => {
  const response = await api.post('/report_bug', {
    title,
    body: description
  })
  return response.data.issue_url;
}
