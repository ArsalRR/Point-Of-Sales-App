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

// Schema dengan pesan error bahasa Indonesia
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
  const [submitError, setSubmitError] = useState("")
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
    const numericValue = value.replace(/[^0-9]/g, '')
    if (!numericValue) return ''
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `Rp ${formatted}`
  }

  const parseCurrency = (value) => {
    return parseInt(value?.replace(/[^0-9]/g, '') || '0', 10)
  }

    const onSubmit = async (data) => {
    setLoading(true)
    setSubmitError("")
    
    try {
      const finalData = {
        ...data,
        stok: showManualStok ? manualStok : data.stok,
        // limit_stok tetap dari form
      }

      // Validate manual stock if shown
      if (showManualStok && (!manualStok || parseInt(manualStok) < 0)) {
        setSubmitError("Stok tidak boleh negatif")
        setLoading(false)
        return
      }

      await postProduk(finalData)
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
      setSubmitError('Gagal menambahkan produk. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // Quick limit options
  const quickLimits = [20, 30, 50, 100]

  // Komponen Input Harga dengan format otomatis
  const PriceInput = ({ field, error, placeholder, id }) => {
    const handleChange = (e) => {
      const inputValue = e.target.value
      // Hapus semua karakter non-digit
      const rawValue = inputValue.replace(/[^0-9]/g, '')
      // Parse ke integer dan simpan
      const numericValue = rawValue ? parseInt(rawValue, 10) : ""
      
      // Update form state dengan string
      field.onChange(numericValue.toString())
    }
    
    return (
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          id={id}
          value={formatCurrency(field.value)}
          onChange={handleChange}
          placeholder={placeholder}
          className={`h-10 md:h-11 pl-10 ${error ? 'border-red-500' : 'border-gray-300'}`}
          autoComplete="off"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
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

        {/* Error Alert */}
        {submitError && (
          <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800 whitespace-pre-line">
              {submitError}
            </AlertDescription>
          </Alert>
        )}

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

          {/* Card 2: Informasi Harga */}
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
                <Controller
                  name="harga"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="harga"
                      onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                      placeholder="Masukkan Harga"
                      className={`h-12 ${errors.harga ? 'border-red-500' : ''}`}
                      autoComplete="off"
                    />
                  )}
                />
                {errors.harga && (
                  <p className="text-sm text-red-500">{errors.harga.message}</p>
                )}
              </div>


              {/* Harga Rentengan (Optional) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Harga Rentengan (Opsional)
                    </Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                        {hargaRenteng && hargaRenteng !== "" ? formatCurrency(hargaRenteng) : "Kosong (default 0)"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRentengan(!showRentengan)}
                    className="h-8 px-3 gap-2 text-xs text-gray-600 hover:text-gray-900"
                  >
                    {showRentengan ? (
                      <>
                        <span>Sembunyikan</span>
                        <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <Settings className="w-3 h-3" />
                        <span>Atur Harga Renteng</span>
                        <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </Button>
                </div>

                {showRentengan && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {/* Harga Renteng */}
                     <div className="space-y-2">
                <Label htmlFor="harga" className="text-sm font-medium">
                  Harga  Rentengan
                </Label>
                <Controller
                  name="harga_renteng"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="harga_renteng"
                      onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                      placeholder="Masukkan Harga"
                      className={`h-12 ${errors.harga_renteng ? 'border-red-500' : ''}`}
                      autoComplete="off"
                    />
                  )}
                />
                {errors.harga_renteng && (
                  <p className="text-sm text-red-500">{errors.harga_renteng.message}</p>  
                )}
              </div>


                    {/* Jumlah Lainnya (Optional) */}
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

          {/* Card 3: Stok & Satuan */}
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

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 pt-4 md:pt-6">
            <Link to="/produk" className="w-full sm:w-auto">
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