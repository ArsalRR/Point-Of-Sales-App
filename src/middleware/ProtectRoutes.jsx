import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getProfile } from "@/api/Userapi"
import { Spinner } from "@/components/ui/spinner"

export default function ProtectedRoute({ children, roles }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const getUserData = async () => {
    try {
      const response = await getProfile()
      setUser(response.data)
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token")
        localStorage.removeItem("token_type")
        navigate("/", { replace: true })
      } else {
        console.error("Gagal ambil profil:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      localStorage.removeItem("token")
      localStorage.removeItem("token_type")
      navigate("/", { replace: true })
      return
    }
    getUserData()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Memuat...</span>
      </div>
    )
  }

  // cek role
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  if (!children) {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1) 
    } else {
      navigate("/dashboard") 
    }
    return null
  }

  return children
}
