const SERVER_HOST = import.meta.env.VITE_SERVER_HOST;
const SERVER_PORT = import.meta.env.VITE_SERVER_PORT;

const API_BASE_URL = `${SERVER_HOST}:${SERVER_PORT}`;
export default API_BASE_URL;
