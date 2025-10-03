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

export const getlaporanbulanan = async (bulan, tahun, tglAwal = "") => {
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const params = {
      bulan: bulan,
      tahun: tahun
    };
    if (tglAwal) {
      params.tgl_awal = tglAwal;
    }
    
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}penjualan-bulanan`,
      { 
        headers,
        params
      }
    );
    
    return response.data.data || response.data; 
  } catch (error) {
    throw error;
  }
};