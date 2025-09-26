import axios from 'axios';

export const getDasboard = async () => {
  try {
    const token = localStorage.getItem("token")

    const response = await axios.get(`${import.meta.env.VITE_API_URL}dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data 
  } catch (error) {
    console.error("Error fetching dashboard:", error)
    throw error
  }
}
