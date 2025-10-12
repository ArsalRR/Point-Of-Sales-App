import { useState } from "react"
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
  TrendingUp,
  ArrowLeft,
  Shuffle,
  Loader2
} from "lucide-react"
import { postProduk, Getkode } from "@/api/Produkapi"
import Swal from "sweetalert2"
import { Link, useNavigate } from "react-router-dom"
const schema = yup.object().shape({
  kode_barang: yup
    .string()
    .required("Kode barang harus diisi")
    .trim(),
  nama_barang: yup
    .string()
    .required("Nama barang harus diisi")
    .trim(),
  harga: yup
    .string()
    .required("Harga harus diisi")
    .test("is-positive", "Harga harus lebih dari 0", function(value) {
      const numericValue = parseInt(value?.replace(/[^0-9]/g, '') || '0', 10)
      return numericValue > 0
    }),
  harga_renteng: yup.string(),
  jumlah_lainnya: yup.string(),
  stok: yup
    .string()
    .required("Stok tidak boleh negatif")
    .test("is-non-negative", "Stok tidak boleh negatif", function(value) {
      if (value === 'manual') return true
      const numericValue = parseInt(value || '0', 10)
      return numericValue >= 0
    }),
  satuan_barang: yup
    .string()
    .required("Satuan barang harus dipilih"),
  limit_stok: yup
    .number()
    .transform((value, originalValue) => originalValue === '' ? undefined : value)
    .required("Limit stok harus diisi")
    .min(0, "Limit stok tidak boleh negatif")
    .typeError("Limit stok harus berupa angka"),
})

export default function CreateProduk() {
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [showRentengan, setShowRentengan] = useState(false)
  const [showManualStok, setShowManualStok] = useState(false)
  const [manualStok, setManualStok] = useState("")
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
      limit_stok: "",
    }
  })

  const harga = watch("harga")
  const hargaRenteng = watch("harga_renteng")
  const stok = watch("stok")

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

  const calculateDiscount = () => {
    if (harga && hargaRenteng) {
      const hargaNormal = parseCurrency(harga)
      const hargaRentengValue = parseCurrency(hargaRenteng)
      if (hargaNormal > 0 && hargaRentengValue > 0) {
        const discount = ((hargaNormal - hargaRentengValue) / hargaNormal * 100).toFixed(1)
        return discount > 0 ? discount : 0
      }
    }
    return 0
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setSubmitError("")
    
    try {
      const finalData = {
        ...data,
        stok: showManualStok ? manualStok : data.stok
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/produk" className="md:hidden">
              <Button variant="ghost" size="sm" className="p-3 hover:bg-white/50">
                <ArrowLeft className="w-7 h-7" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tambah Produk Baru</h1>
              <p className="text-muted-foreground text-sm md:text-base">Lengkapi informasi produk di bawah ini</p>
            </div>
          </div>
          <Package className="w-10 h-10 md:w-12 md:h-12 text-blue-600" />
        </div>

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="kode_barang" className="text-sm font-medium">
                  Kode Barang 
                </Label>
                <div className="flex gap-2">
                  <Controller
                    name="kode_barang"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="kode_barang"
                        type="number"
                        placeholder="Masukkan Kode Barang"
                        className={`h-12 ${errors.kode_barang ? 'border-red-500' : ''}`}
                        autoComplete="off"
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateKode}
                    className="h-12 px-4"
                    title="Generate kode otomatis"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </div>
                {errors.kode_barang && (
                  <p className="text-sm text-red-500">{errors.kode_barang.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama_barang" className="text-sm font-medium">
                  Nama Barang 
                </Label>
                <Controller
                  name="nama_barang"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="nama_barang"
                      placeholder="Masukkan Nama Barang"
                      className={`h-12 ${errors.nama_barang ? 'border-red-500' : ''}`}
                      autoComplete="off"
                    />
                  )}
                />
                {errors.nama_barang && (
                  <p className="text-sm text-red-500">{errors.nama_barang.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit_stok" className="text-sm font-medium">
                  Limit Stok Produk 
                </Label>
                <Controller
                  name="limit_stok"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="limit_stok"
                      type="number"
                      placeholder="Masukkan Limit Barang"
                      className={`h-12 ${errors.limit_stok ? 'border-red-500' : ''}`}
                      autoComplete="off"
                    />
                  )}
                />
                {errors.limit_stok && (
                  <p className="text-sm text-red-500">{errors.limit_stok.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Informasi Harga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="space-y-2">
                <Label htmlFor="harga_renteng" className="text-sm font-medium">
                  Harga Rentengan / Lainnya
                </Label>
                <Controller
                  name="harga_renteng"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="harga_renteng"
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value)
                        field.onChange(formatted)
                        setShowRentengan(e.target.value.trim() !== '')
                      }}
                      placeholder="Masukkan Harga Rentengan"
                      className={`h-12 ${errors.harga_renteng ? 'border-red-500' : ''}`}
                      autoComplete="off"
                    />
                  )}
                />
                {errors.harga_renteng && (
                  <p className="text-sm text-red-500">{errors.harga_renteng.message}</p>
                )}
                {calculateDiscount() > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Diskon {calculateDiscount()}%
                  </Badge>
                )}
              </div>

              {showRentengan && (
                <div className="space-y-2">
                  <Label htmlFor="jumlah_lainnya" className="text-sm font-medium">
                    Isi Rentengan / Lainnya
                  </Label>
                  <Controller
                    name="jumlah_lainnya"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="jumlah_lainnya"
                        type="number"
                        placeholder="Masukkan Isi Rentengan"
                        className="h-12"
                        autoComplete="off"
                      />
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                Stok & Satuan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="stok" className="text-sm font-medium">
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
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="--Pilih Stok Barang--" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Masukkan Manual...</SelectItem>
                        {stokOptions.map((group, index) => (
                          <div key={index}>
                            <div className="px-2 py-1 text-sm font-semibold text-gray-600 bg-gray-100">
                              {group.group}
                            </div>
                            {group.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
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
                    placeholder="Masukkan Stok Manual"
                    className="h-12 mt-2 w-full"
                  />
                )}
                {errors.stok && (
                  <p className="text-sm text-red-500">{errors.stok.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="satuan_barang" className="text-sm font-medium">
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
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="Masukkan Satuan Barang" />
                      </SelectTrigger>
                      <SelectContent>
                        {satuanOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.satuan_barang && (
                  <p className="text-sm text-red-500">{errors.satuan_barang.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col md:flex-row gap-4 pt-6">
            <Link to="/produk" className="hidden md:block">
              <Button variant="outline" className="w-full md:w-auto h-12 px-8" type="button">
                Kembali
              </Button>
            </Link>
            <Button 
              type="submit"
              className="w-full md:flex-1 h-12 gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  SIMPAN
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}