
import axios from "axios";
export const getProduk = async () => {
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}produk`,
      { headers }
    );
    return response.data.data || response.data; 
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};
export const postProduk = async (data) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(`${import.meta.env.VITE_API_URL}produk`, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Error posting product:', error);
    throw error;
  }
}
 export const editProduk = async (id, data) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.put(`${import.meta.env.VITE_API_URL}produk/${id}`, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Error editing product:', error);
    throw error;
  }
}
export const deleteProduk = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.delete(`${import.meta.env.VITE_API_URL}produk/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}
export const getProdukById = async (id) => {
  try {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}produk/${id}`,
      { headers }
    )
    return response.data.data ?? response.data
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    throw error
  }
}
export const Getkode = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}generate-kode`,
      { headers }
    );
    return response.data.kode;
  } catch (error) {
    console.error('Error generating product code:', error);
    throw error;
  }
};
