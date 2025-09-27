import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { getProfile } from "@/api/Userapi"
import { Loader2 } from "lucide-react"

export default function ProtectedRoute({ children, roles }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const getUserData = async () => {
    try {
      const response = await getProfile()
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem("token")
      localStorage.removeItem("token_type")
      window.location.href = "/"
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      localStorage.removeItem("token")
      localStorage.removeItem("token_type")
      window.location.href = "/"
      return
    }
    getUserData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Memuat...</span>
      </div>
    )
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
