import axios from 'axios'

export const getHargaPromo = async () => {
  try {
    const token = localStorage.getItem("token")
    const response = await axios.get(`${import.meta.env.VITE_API_URL}hargapromo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data.data
  } catch (error) {
    console.error("Error fetching harga promo:", error)
    throw error
  }

}
export const postHargaPromo = async (data) => {
  try {
    const token = localStorage.getItem("token")
    const response = await axios.post(`${import.meta.env.VITE_API_URL}hargapromo`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error posting harga promo:", error)
    throw error
  }
}
export const editHargaPromo = async (id, data) => {
  try {
    const token = localStorage.getItem("token")
    const response = await axios.put(`${import.meta.env.VITE_API_URL}hargapromo/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error editing harga promo:", error)
    throw error
  }
}
export const getHargaPromoById = async (id) => {
  try {
    const token = localStorage.getItem("token")
    const response = await axios.get(`${import.meta.env.VITE_API_URL}hargapromo/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error deleting harga promo:", error)
    throw error
  }

}
export const deleteHargaPromo = async (id) => {
  try {
    const token = localStorage.getItem("token")
    const response = await axios.delete(`${import.meta.env.VITE_API_URL}hargapromo/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (error) {
    console.error("Error deleting harga promo:", error)
    throw error
  }
}


