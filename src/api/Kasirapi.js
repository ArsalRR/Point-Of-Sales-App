import axios from "axios";

export const postKasir = async (data) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}transaksi`,
      data,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error posting kasir:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getTransaksi = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}transaksi`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching transaksi:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
