import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "../../api/Userapi"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Eye, EyeOff, Package } from "lucide-react"
import Swal from "sweetalert2"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await login(email, password)
      if (result?.access_token) {
        localStorage.setItem("token", result.access_token)
        localStorage.setItem("token_type", result.token_type || "Bearer")
      }
      navigate("/dashboard")
    } catch (error) {
      Swal.fire({
        title: "Login Gagal",
        text: "Periksa kembali email atau password",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-5xl">
        <Card className="overflow-hidden shadow-xl rounded-3xl border-gray-200">
          <div className="grid md:grid-cols-2">
            <div className="hidden md:flex flex-col items-center justify-center bg-black p-12 rounded-l-3xl">
              <div className="mb-8">
                <img 
                  src="/icons/login.png" 
                  alt="Toko IFA" 
                  className="w-full max-w-sm h-auto rounded-lg"
                />
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Package className="h-7 w-7 text-white" />
                  <h1 className="text-3xl font-bold text-white">
                    Toko IFA
                  </h1>
                </div>
                <p className="text-gray-300 text-sm">
                  Belanja Sekarang
                </p>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="p-8 md:p-12 bg-white rounded-r-3xl">
              <CardHeader className="space-y-2 px-0 pt-0">
                <div className="md:hidden flex justify-center mb-6">
                  <div className="bg-black text-white p-6 rounded-2xl shadow-lg">
                    <Package className="h-12 w-12" />
                  </div>
                </div>

                <CardTitle className="text-3xl font-bold text-gray-900">
                  Selamat Datang 😀
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Silakan login terlebih dahulu!
                </CardDescription>
              </CardHeader>

              <CardContent className="px-0 pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-900 font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Masukkan email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-gray-50 border-gray-300 focus:border-black focus:ring-black"
                      
                    />
                  </div>

                      <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-900 font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pr-10 bg-gray-50 border-gray-300 focus:border-black focus:ring-black"
                        
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-500 hover:text-black"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-black hover:bg-gray-800 text-white mt-8 transition-all duration-300 shadow-lg hover:shadow-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="mr-2">Loading...</span>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>

                  {/* Register Link - Uncomment if needed */}
                  {/* <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                      Belum punya akun?{" "}
                      <a
                        href="/register"
                        className="text-black hover:underline font-semibold"
                      >
                        Daftar sekarang
                      </a>
                    </p>
                  </div> */}
                </form>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}