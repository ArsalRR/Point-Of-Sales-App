import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Package,
  Save,
  DollarSign,
  Hash,
  Box,
  AlertCircle,
  ArrowLeft,
  Shuffle,
  Loader2,
  Settings,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { postProduk, Getkode } from "@/api/Produkapi"
import Swal from "sweetalert2"
import { Link, useNavigate } from "react-router-dom"

const schema = yup.object().shape({
  kode_barang: yup
    .string()
    .required("Kode barang wajib diisi")
    .trim(),
  nama_barang: yup
    .string()
    .required("Nama barang wajib diisi")
    .trim(),
  harga: yup
    .string()
    .required("Harga wajib diisi")
    .test("is-positive", "Harga harus lebih dari 0", function(value) {
      const numericValue = parseInt(value?.replace(/[^0-9]/g, '') || '0', 10)
      return numericValue > 0
    }),
  harga_renteng: yup.string(),
  jumlah_lainnya: yup.string(),
  stok: yup
    .mixed()
    .required("Stok wajib diisi")
    .test("is-valid-stock", "Stok tidak boleh negatif", function(value) {
      if (value === 'manual') return true
      if (!value && value !== 0) return false
      
      let numericValue = 0
      if (typeof value === 'string') {
        numericValue = parseInt(value || '0', 10)
      } else if (typeof value === 'number') {
        numericValue = value
      }
      return numericValue >= 0
    })
    .test("is-greater-than-limit", "Stok harus lebih banyak dari limit stok", function(value) {
      const { limit_stok } = this.parent
      if (!value || value === 'manual') return true
      
      let numericValue = 0
      if (typeof value === 'string') {
        numericValue = parseInt(value || '0', 10)
      } else if (typeof value === 'number') {
        numericValue = value
      }
      
      return numericValue > limit_stok
    }),
  satuan_barang: yup
    .string()
    .required("Satuan barang wajib dipilih"),
  limit_stok: yup
    .number()
    .default(30)
    .min(1, "Limit stok minimal 1")
    .max(999, "Limit stok maksimal 999")
    .typeError("Limit stok harus berupa angka"),
})

export default function CreateProduk() {
  const [loading, setLoading] = useState(false)
  const [showRentengan, setShowRentengan] = useState(false)
  const [showManualStok, setShowManualStok] = useState(false)
  const [manualStok, setManualStok] = useState("")
  const [showLimitStok, setShowLimitStok] = useState(false)
  const navigate = useNavigate()

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      kode_barang: "",
      nama_barang: "",
      harga: "",
      harga_renteng: "",
      jumlah_lainnya: "",
      stok: "",
      satuan_barang: "",
      limit_stok: 30,
    }
  })

  const harga = watch("harga")
  const hargaRenteng = watch("harga_renteng")
  const stok = watch("stok")
  const limitStok = watch("limit_stok")

  const satuanOptions = [
    { value: "PCS", label: "PCS" },
    { value: "Liter", label: "Liter" },
    { value: "KILOGRAM", label: "Kilogram" },
    { value: "MILIGRAM", label: "Miligram" },
    { value: "Bungkus", label: "Bungkus" },
    { value: "Galon", label: "Galon" }
  ]

  const stokOptions = [
    { 
      group: "Dus/Karton", 
      options: [
        { value: "25", label: "1 Dus Isi 25" },
        { value: "50", label: "1 Dus Isi 50" },
        { value: "100", label: "2 Dus" },
        { value: "150", label: "3 Dus" },
        { value: "200", label: "4 Dus" },
        { value: "250", label: "5 Dus" }
      ]
    },
  ]

  const generateKode = async () => {
    try {
      const randomCode = await Getkode()
      setValue("kode_barang", randomCode)
    } catch (error) {
      console.error("Error generating code:", error)
    }
  }

  const formatCurrency = (value) => {
    if (!value) return ''
    // Remove all non-digit characters
    const numericValue = value.toString().replace(/[^0-9]/g, '')
    if (!numericValue) return ''
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return formatted
  }

  const formatCurrencyForDisplay = (value) => {
    const formatted = formatCurrency(value)
    return formatted ? `Rp ${formatted}` : ''
  }

  const showErrorAlert = (errors) => {
    let errorMessages = []
    
    if (typeof errors === 'string') {
      errorMessages.push(errors)
    } else if (errors && typeof errors === 'object') {
      // Jika errors adalah array
      if (Array.isArray(errors)) {
        errorMessages = errors
      } 
      // Jika errors adalah object dengan field
      else if (errors.errors) {
        Object.values(errors.errors).forEach(errorArray => {
          if (Array.isArray(errorArray)) {
            errorMessages = [...errorMessages, ...errorArray]
          } else {
            errorMessages.push(errorArray)
          }
        })
      }
      // Jika errors langsung object
      else {
        Object.values(errors).forEach(error => {
          if (Array.isArray(error)) {
            errorMessages = [...errorMessages, ...error]
          } else {
            errorMessages.push(error)
          }
        })
      }
    }
  
    errorMessages = [...new Set(errorMessages)]  
  Swal.fire({
  title: '<div class="animate-pulse">⚠️ Perhatian!</div>',
  html: `
    <div class="text-left animate-fade-in">
      <div class="flex items-center justify-center mb-4">
        <div class="relative">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <div class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
            ${errorMessages.length}
          </div>
        </div>
      </div>
      
      <h3 class="text-center text-lg font-semibold text-gray-800 mb-2">
        Data Tidak Valid
      </h3>
      
      <p class="text-center text-gray-600 mb-4">
        Kami menemukan beberapa kesalahan:
      </p>
      
      <div class="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
        <ul class="space-y-2">
          ${errorMessages.map((msg, index) => `
            <li class="flex items-start gap-3 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <span class="flex-shrink-0 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">${index + 1}</span>
              <span class="text-gray-700">${msg}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      
      <div class="mt-4 text-center">
        <p class="text-xs text-gray-500">
          Silakan perbaiki data di atas sebelum melanjutkan
        </p>
      </div>
    </div>
  `,
  showConfirmButton: true,
  confirmButtonText: `
    <div class="flex items-center justify-center gap-2">
      <svg class="w-5 h-5 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
      Perbaiki Sekarang
    </div>
  `,
  confirmButtonColor: "#dc2626",
  showCloseButton: true,
  width: "500px",
  padding: "2rem",
  customClass: {
    popup: 'animate__animated animate__fadeInDown',
    confirmButton: 'rounded-full px-8 py-3 font-medium',
    closeButton: 'hover:bg-red-50 rounded-full'
  },
  backdrop: `
    rgba(0, 0, 0, 0.5)
    url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ef4444' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")
  `
})
  }

  const onSubmit = async (data) => {
    setLoading(true)
    
    try {
      const finalData = {
        ...data,
        stok: showManualStok ? manualStok : data.stok,
        harga: data.harga.toString().replace(/[^0-9]/g, ''),
        harga_renteng: data.harga_renteng ? data.harga_renteng.toString().replace(/[^0-9]/g, '') : '',
      }

      // Validate manual stock if shown
      if (showManualStok && (!manualStok || parseInt(manualStok) < 0)) {
        showErrorAlert("Stok tidak boleh negatif")
        setLoading(false)
        return
      }

      const response = await postProduk(finalData)
      
      // Check if response contains error (from backend validation)
      if (response && (response.status === 422 || response.errors)) {
        showErrorAlert(response.errors || response.message)
        setLoading(false)
        return
      }
      
      reset()
      setShowRentengan(false)
      setShowManualStok(false)
      setManualStok("")
      setShowLimitStok(false)
      
      navigate('/produk')
      
      setTimeout(() => {
        Swal.fire({
          title: "Berhasil!",
          text: "Produk berhasil ditambahkan ke sistem",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          toast: true,
          position: "top-end"
        })
      }, 100)
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data
        showErrorAlert(errorData.errors || errorData.message || 'Terjadi kesalahan')
      } 
      else if (error.errors || error.message) {
        showErrorAlert(error.errors || error.message)
      }
      else {
        showErrorAlert('Gagal menambahkan produk. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }
  const quickLimits = [20, 30, 50, 100]
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/produk" className="md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Tambah Produk Baru</h1>
              <p className="text-gray-600 text-xs md:text-sm mt-1">Lengkapi informasi produk di bawah ini</p>
            </div>
          </div>
          <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-700" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          {/* Card 1: Informasi Dasar */}
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardHeader className="pb-3 md:pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
                <Hash className="w-4 h-4 md:w-5 md:h-5" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 pt-4">
              {/* Kode Barang */}
              <div className="space-y-2">
                <Label htmlFor="kode_barang" className="text-sm font-medium text-gray-700">
                  Kode Barang *
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Controller
                      name="kode_barang"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="kode_barang"
                          placeholder="Masukkan kode barang"
                          className={`h-10 md:h-11 ${errors.kode_barang ? 'border-red-500' : 'border-gray-300'}`}
                          autoComplete="off"
                        />
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateKode}
                    className="h-10 md:h-11 px-3 border-gray-300 hover:bg-gray-50"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    <span className="text-sm">Generate</span>
                  </Button>
                </div>
                {errors.kode_barang && (
                  <p className="text-xs text-red-600">{errors.kode_barang.message}</p>
                )}
              </div>

              {/* Nama Barang */}
              <div className="space-y-2">
                <Label htmlFor="nama_barang" className="text-sm font-medium text-gray-700">
                  Nama Barang *
                </Label>
                <Controller
                  name="nama_barang"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="nama_barang"
                      placeholder="Masukkan nama barang"
                      className={`h-10 md:h-11 ${errors.nama_barang ? 'border-red-500' : 'border-gray-300'}`}
                      autoComplete="off"
                    />
                  )}
                />
                {errors.nama_barang && (
                  <p className="text-xs text-red-600">{errors.nama_barang.message}</p>
                )}
              </div>

              {/* Limit Stok */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Limit Stok Peringatan
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                        Default: {limitStok}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLimitStok(!showLimitStok)}
                    className="h-8 px-3 gap-2 text-xs text-gray-600 hover:text-gray-900"
                  >
                    {showLimitStok ? (
                      <>
                        <span>Sembunyikan</span>
                        <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <Settings className="w-3 h-3" />
                        <span>Ubah Limit</span>
                        <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </Button>
                </div>

                {showLimitStok && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="limit_stok" className="text-sm font-medium text-gray-700">
                          Limit Stok Kustom
                        </Label>
                        <span className="text-xs text-gray-500">
                          Sistem akan memberi peringatan saat stok mencapai limit
                        </span>
                      </div>
                      <Controller
                        name="limit_stok"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="limit_stok"
                            type="number"
                            placeholder="Masukkan limit stok"
                            className={`h-10 md:h-11 ${errors.limit_stok ? 'border-red-500' : 'border-gray-300'}`}
                            autoComplete="off"
                            min="1"
                            max="999"
                          />
                        )}
                      />
                      {errors.limit_stok && (
                        <p className="text-xs text-red-600">{errors.limit_stok.message}</p>
                      )}
                    </div>

                    {/* Quick Limits */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">
                        Pilih Cepat:
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {quickLimits.map((limit) => (
                          <Button
                            key={limit}
                            type="button"
                            variant={limitStok === limit ? "default" : "outline"}
                            size="sm"
                            onClick={() => setValue("limit_stok", limit)}
                            className={`px-3 text-xs ${limitStok === limit ? 'bg-gray-800 text-white hover:bg-gray-900' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                          >
                            {limit}
                          </Button>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setValue("limit_stok", 30)}
                          className="px-3 text-xs border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          Reset ke 30
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardHeader className="pb-3 md:pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                Informasi Harga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 pt-4">
              {/* Harga Jual */}
              <div className="space-y-2">
                <Label htmlFor="harga" className="text-sm font-medium">
                  Harga Jual *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                  <Controller
                    name="harga"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="harga"
                        onChange={(e) => {
                          const formattedValue = formatCurrency(e.target.value)
                          field.onChange(formattedValue)
                        }}
                        value={field.value ? `Rp ${field.value}` : ''}
                        placeholder="Masukkan Harga"
                        className={`h-12 pl-10 ${errors.harga ? 'border-red-500' : ''}`}
                        autoComplete="off"
                      />
                    )}
                  />
                </div>
                {errors.harga && (
                  <p className="text-sm text-red-500">{errors.harga.message}</p>
                )}
              </div>
              <div className="space-y-3">
             <div className="space-y-3">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div className="space-y-1">
      <Label className="text-sm font-medium text-gray-700 block">
        Harga Rentengan/Box DLL (Opsional)
      </Label>
      <div className="mt-0">
        <Badge 
          variant="outline" 
          className="text-xs bg-gray-100 text-gray-700 w-fit max-w-full truncate"
          title={hargaRenteng && hargaRenteng !== "" ? formatCurrencyForDisplay(hargaRenteng) : "Kosong (default 0)"}
        >
          <span className="truncate block">
            {hargaRenteng && hargaRenteng !== "" 
              ? formatCurrencyForDisplay(hargaRenteng) 
              : "Kosong (default 0)"
            }
          </span>
        </Badge>
      </div>
    </div>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setShowRentengan(!showRentengan)}
      className="h-9 px-3 gap-2 text-xs text-gray-600 hover:text-gray-900 self-start sm:self-center w-full sm:w-auto"
    >
      {showRentengan ? (
        <>
          <span className="hidden xs:inline">Sembunyikan</span>
          <span className="xs:hidden">Tutup</span>
          <ChevronUp className="w-3 h-3 ml-1" />
        </>
      ) : (
        <>
          <Settings className="w-3 h-3 hidden xs:inline" />
          <span className="text-xs">
            <span className="hidden sm:inline">Atur Harga Rentengan/Box DLL</span>
            <span className="sm:hidden">Atur Rentengan</span>
          </span>
          <ChevronDown className="w-3 h-3 ml-1" />
        </>
      )}
    </Button>
  </div>
</div>

                {showRentengan && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-2">
                      <Label htmlFor="harga_renteng" className="text-sm font-medium">
                        Harga Rentengan/Box DLL
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                        <Controller
                          name="harga_renteng"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="harga_renteng"
                              onChange={(e) => {
                                const formattedValue = formatCurrency(e.target.value)
                                field.onChange(formattedValue)
                              }}
                              value={field.value ? `Rp ${field.value}` : ''}
                              placeholder="Masukkan Harga Rentengan/Box DLL"
                              className={`h-12 pl-10 ${errors.harga_renteng ? 'border-red-500' : ''}`}
                              autoComplete="off"
                            />
                          )}
                        />
                      </div>
                      {errors.harga_renteng && (
                        <p className="text-sm text-red-500">{errors.harga_renteng.message}</p>  
                      )}
                    </div>

      
                    <div className="space-y-2">
                      <Label htmlFor="jumlah_lainnya" className="text-sm font-medium text-gray-700">
                        Isi Rentengan / Lainnya (Opsional)
                      </Label>
                      <Controller
                        name="jumlah_lainnya"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="jumlah_lainnya"
                            placeholder="Contoh: 3 Pcs, 5 Bungkus"
                            className="h-10 md:h-11 border-gray-300"
                            autoComplete="off"
                            value={field.value || ''}
                          />
                        )}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Informasi tambahan tentang rentengan (boleh kosong)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border border-gray-200 bg-white">
            <CardHeader className="pb-3 md:pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg text-gray-800">
                <Box className="w-4 h-4 md:w-5 md:h-5" />
                Stok & Satuan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 pt-4">
              {/* Stok Barang */}
              <div className="space-y-2">
                <Label htmlFor="stok" className="text-sm font-medium text-gray-700">
                  Stok Barang *
                </Label>
                <Controller
                  name="stok"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        setShowManualStok(value === 'manual')
                        if (value !== 'manual') {
                          setManualStok("")
                        }
                      }}
                      value={field.value}
                    >
                      <SelectTrigger className="h-10 md:h-11 w-full border-gray-300">
                        <SelectValue placeholder="-- Pilih Stok Barang --" />
                      </SelectTrigger>
                      <SelectContent className="border-gray-300">
                        <SelectItem value="manual" className="text-sm">Masukkan Manual...</SelectItem>
                        {stokOptions.map((group, index) => (
                          <div key={index}>
                            <div className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100">
                              {group.group}
                            </div>
                            {group.options.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-sm">
                                {option.label}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {showManualStok && (
                  <Input
                    type="number"
                    value={manualStok}
                    onChange={(e) => setManualStok(e.target.value)}
                    placeholder="Masukkan stok manual"
                    className="h-10 md:h-11 mt-2 w-full border-gray-300"
                    min="0"
                  />
                )}
                {errors.stok && (
                  <p className="text-xs text-red-600">{errors.stok.message}</p>
                )}
              </div>

              {/* Satuan Barang */}
              <div className="space-y-2">
                <Label htmlFor="satuan_barang" className="text-sm font-medium text-gray-700">
                  Satuan Barang *
                </Label>
                <Controller
                  name="satuan_barang"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger className="h-10 md:h-11 w-full border-gray-300">
                        <SelectValue placeholder="Pilih satuan barang" />
                      </SelectTrigger>
                      <SelectContent className="border-gray-300">
                        {satuanOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-sm">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.satuan_barang && (
                  <p className="text-xs text-red-600">{errors.satuan_barang.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 pt-4 md:pt-6">
            <Link to="/produk" className="flex-1 hidden md:block">
              <Button 
                variant="outline" 
                className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                type="button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <Button 
              type="submit"
              className="w-full sm:flex-1 h-11 bg-gray-900 text-white hover:bg-gray-800"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  SIMPAN PRODUK
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}