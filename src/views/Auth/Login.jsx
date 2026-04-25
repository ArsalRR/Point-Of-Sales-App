import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { login } from "../../api/Userapi"
import { Eye, EyeOff, ShoppingBag, ArrowRight, Loader2 } from "lucide-react"
import Swal from "sweetalert2"

const schema = yup.object({
  email: yup.string().email("Email tidak valid").required("Email wajib diisi"),
  password: yup.string().required("Password wajib diisi"),
})

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(true)

  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    const timer = setTimeout(() => {
      setIsReadOnly(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await login(data.email, data.password)
      if (result?.access_token) {
        localStorage.setItem("token", result.access_token)
        localStorage.setItem("token_type", result.token_type || "Bearer")
        navigate("/dashboard")
      }
    } catch {
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

  const inputClass = (hasError) =>
    `w-full h-12 rounded-xl px-4 text-base text-black placeholder-zinc-300 bg-zinc-50 border outline-none
    transition-all duration-200
    focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5
    ${hasError
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100"
      : "border-zinc-200"
    }`

  return (
    <div className="flex min-h-screen">

      {/* ── KIRI 50%: IMAGE PANEL ── */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 relative overflow-hidden flex-col items-center justify-center gap-10 px-16">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-zinc-950 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center w-full">
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-white/70 text-xs font-medium tracking-widest uppercase">
              Toko Sembako IFA
            </span>
          </div>

          <div className="relative w-full max-w-xs">
            <div className="absolute inset-4 bg-white/5 blur-2xl rounded-3xl" />
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.8)]">
              <img
                src="/icons/login.png"
                alt="Toko IFA"
                className="w-full h-full object-cover grayscale brightness-90 contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-white text-2xl font-extralight tracking-tight leading-snug">
              Sistem Kasir IFA
            </h2>
            <p className="text-white/30 text-xs tracking-[0.2em] uppercase font-light">
              Melayani Transaksi
            </p>
          </div>

          <div className="flex items-center gap-3 w-32">
            <div className="flex-1 h-px bg-white/10" />
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex-1 h-px bg-white/10" />
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8 sm:px-16 py-12">
        <div className="w-full max-w-[360px]">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-black text-sm">Toko Sembako IFA</span>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-3">
              Selamat Datang Kembali
            </p>
            <h1 className="text-[2.6rem] font-bold text-black leading-[1.05] tracking-tight">
              Masuk<br />Akun
            </h1>
            <p className="text-zinc-400 text-sm mt-3 font-light leading-relaxed">
              Silahkan Isi Email dan Password yang Benar
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                 Email
              </label>
              <input
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                readOnly={isReadOnly}    
                {...register("email")}
                className={inputClass(errors.email)}
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  readOnly={isReadOnly}
                  {...register("password")}
                  className={`${inputClass(errors.password)} pr-12`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors duration-150"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 bg-black text-white text-sm font-medium rounded-xl
                flex items-center justify-center gap-2
                hover:bg-zinc-800 active:scale-[0.985]
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Login </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}