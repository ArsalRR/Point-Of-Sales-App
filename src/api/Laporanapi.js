import axios from 'axios';

export const getlaporanharian = async () => {
  try {
    const token = localStorage.getItem("token")

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}penjualan-harian`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    return response 
  } catch (error) {
    console.error("Error getlaporanharian:", error)
    throw error
  }
}

export const getlaporanbulanan = async () => {
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/penjualan-bulanan`,
      { headers }
    );
    return response.data.data || response.data; 
  } catch (error) {
    console.error("Error fetching laporan bulanan:", error);
    throw error;
  }
};
