
import axios from 'axios';

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}login`, { email, password });
    const token = response.data.token;
    localStorage.setItem('token', token);
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};
export const logout = async () => {
  try {
    const token = localStorage.getItem("token")

    await axios.post(
      `${import.meta.env.VITE_API_URL}logout`,
      {}, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    localStorage.removeItem("token") 
  } catch (error) {
    console.error("Error logging out:", error)
    throw error
  }
}

export const getProfile = async () => {
  try {
    const token = localStorage.getItem("token")
    const response = await axios.get(`${import.meta.env.VITE_API_URL}user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data 
  } catch (error) {
    console.error("Error fetching profile:", error)
    throw error
  }
}