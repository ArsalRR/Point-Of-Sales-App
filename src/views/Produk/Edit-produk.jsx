import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { editProduk, getProdukById } from '@/api/Produkapi'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
  AlertCircle,
  Loader2,
  Box,
  ArrowLeft,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react"
import Swal from "sweetalert2"

// Validation Schema
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
    .required("Stok harus diisi")
    .test("is-non-negative", "Stok tidak boleh negatif", function(value) {
      const numericValue = parseInt(value || '0', 10)
      return numericValue >= 0
    }),
  satuan_barang: yup
    .string()
    .required("Satuan barang harus dipilih"),
  limit_stok: yup
    .string()
    .required("Limit stok harus diisi")
    .test("is-non-negative", "Limit stok tidak boleh negatif", function(value) {
      const numericValue = parseInt(value || '0', 10)
      return numericValue >= 0
    }),
})

export default function EditProduk() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [readOnly, setReadOnly] = useState(true)
  const [showManualStok, setShowManualStok] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      kode_barang: "",
      nama_barang: "",
      harga: "",
      harga_renteng: "",
      stok: "",
      satuan_barang: "",
      limit_stok: "",
      jumlah_lainnya: "",
    }
  })

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

  const currentStok = watch("stok")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getProdukById(id)
        reset({
          kode_barang: data.kode_barang || "",
          nama_barang: data.nama_barang || "",
          harga: data.harga ? data.harga.toString() : "",
          harga_renteng: data.harga_renteng ? data.harga_renteng.toString() : "",
          stok: data.stok ? data.stok.toString() : "",
          satuan_barang: data.satuan_barang || "",
          limit_stok: data.limit_stok ? data.limit_stok.toString() : "",
          jumlah_lainnya: data.jumlah_lainnya || "",
        })
        const stokValue = data.stok ? data.stok.toString() : ""
        const isManual = !stokOptions[0].options.some(opt => opt.value === stokValue)
        setShowManualStok(isManual)
        
        setError('') 
      } catch (err) {
        setError("Gagal memuat data produk")
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchData()
    }
  }, [id, reset])

  const formatCurrency = (value) => {
    if (!value || value === "0") return ""
    const numericValue = value.replace(/[^0-9]/g, '')
    if (!numericValue) return ''
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `Rp ${formatted}`
  }

  const parseCurrency = (value) => {
    if (!value) return 0
    return parseInt(value.toString().replace(/[^0-9]/g, ""), 10) || 0
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    setSubmitError('')

    try {
      const payload = {
        kode_barang: data.kode_barang.trim(),
        nama_barang: data.nama_barang.trim(),
        harga: parseCurrency(data.harga).toString(),
        harga_renteng: parseCurrency(data.harga_renteng).toString(),
        stok: parseInt(data.stok, 10),
        limit_stok: parseInt(data.limit_stok, 10),
        satuan_barang: data.satuan_barang,
        jumlah_lainnya: data.jumlah_lainnya || ""
      }

      await editProduk(id, payload)
      navigate('/produk')

      setTimeout(() => {
        Swal.fire({
          title: "Berhasil!",
          text: "Produk berhasil diperbarui",
          icon: "success",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          toast: true,
          position: "top-end"
        })
      }, 100)

    } catch (error) {
      let errorMessage = 'Gagal memperbarui produk'

      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
      }

      setSubmitError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Memuat data produk...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 mb-4 text-destructive" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Produk</h1>
            <p className="text-muted-foreground">Perbarui informasi produk</p>
          </div>
          <Package className="w-12 h-12 text-blue-600" />
        </div>

        {/* Mobile Back Button */}
        <div className="block md:hidden">
          <Link to="/produk">
            <Button variant="outline" size="lg" className="w-full mb-4">
              <ArrowLeft className="w-6 h-6 mr-2" />
              Kembali ke Daftar Produk
            </Button>
          </Link>
        </div>

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informasi Dasar */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link to="/produk" className="hidden md:block">
                  <Button variant="ghost" size="sm" className="p-2" type="button">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <Hash className="w-5 h-5" /> Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="kode_barang">Kode Barang *</Label>
                <div className="relative">
                  <Controller
                    name="kode_barang"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="kode_barang"
                        placeholder="PRD001"
                        readOnly={readOnly}
                        autoComplete="off"
                        className={`pr-10 ${errors.kode_barang ? 'border-red-500' : ''} ${
                          readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                        }`}
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setReadOnly(!readOnly)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                  >
                    {readOnly ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {errors.kode_barang && (
                  <p className="text-sm text-red-500">{errors.kode_barang.message}</p>
                )}
              </div>


              <div className="space-y-2">
                <Label htmlFor="nama_barang">Nama Barang *</Label>
                <Controller
                  name="nama_barang"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="nama_barang"
                      placeholder="Masukkan nama produk"
                      autoComplete="off"
                      className={errors.nama_barang ? 'border-red-500' : ''}
                    />
                  )}
                />
                {errors.nama_barang && (
                  <p className="text-sm text-red-500">{errors.nama_barang.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informasi Harga */}
           <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" /> Informasi Harga
        </CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Harga Jual */}
        <div className="space-y-2">
          <Label htmlFor="harga">Harga Jual *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Controller
              name="harga"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="harga"
                  value={formatCurrency(field.value)}
                  onChange={(e) => {
                    const numericValue = parseCurrency(e.target.value).toString()
                    field.onChange(numericValue)
                  }}
                  placeholder="Masukkan Harga"
                  autoComplete="off"
                  className={`pl-10 ${errors.harga ? 'border-red-500' : ''}`}
                />
              )}
            />
          </div>
          {errors.harga && (
            <p className="text-sm text-red-500">{errors.harga.message}</p>
          )}
        </div>

        {/* Harga Rentengan */}
        <div className="space-y-2">
          <Label htmlFor="harga_renteng">Harga Rentengan</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Controller
              name="harga_renteng"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="harga_renteng"
                  value={formatCurrency(field.value)}
                  onChange={(e) => {
                    const numericValue = parseCurrency(e.target.value).toString()
                    field.onChange(numericValue)
                  }}
                  placeholder="Masukkan Harga Rentengan"
                  autoComplete="off"
                  className={`pl-10 ${errors.harga_renteng ? 'border-red-500' : ''}`}
                />
              )}
            />
          </div>
          {errors.harga_renteng && (
            <p className="text-sm text-red-500">{errors.harga_renteng.message}</p>
          )}
        </div>

        {/* Update Massal */}
        <div className="md:col-span-2">
          <Card className="border border-dashed rounded-xl">
            <CardContent className="py-4 px-5">
              <h5 className="text-base font-semibold mb-1">
                Perlu Ubah Banyak Produk?
              </h5>
              <p className="text-sm text-muted-foreground mb-3">
                Gunakan fitur Update Keseluruhan untuk mengubah banyak produk sekaligus secara efisien
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/produk/update-massal" className="flex items-center">
                  <Layers className="w-4 h-4 mr-2" />
                  Update Keseluruhan
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Isi Rentengan */}
        <div className="space-y-2">
          <Label htmlFor="jumlah_lainnya">Isi Rentengan / Lainnya</Label>
          <Controller
            name="jumlah_lainnya"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="jumlah_lainnya"
                type="number"
                placeholder="Masukkan Isi Rentengan"
                autoComplete="off"
              />
            )}
          />
        </div>
      </CardContent>
    </Card>
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" /> Informasi Stok
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="stok">Stok *</Label>
                <Controller
                  name="stok"
                  control={control}
                  render={({ field }) => (
                    <>
                      {showManualStok ? (
                        <Input
                          {...field}
                          id="stok"
                          type="number"
                          min="0"
                          placeholder="Masukkan stok manual"
                          autoComplete="off"
                          className={errors.stok ? 'border-red-500' : ''}
                        />
                      ) : (
                        <Select
                          onValueChange={(value) => {
                            if (value === 'manual') {
                              setShowManualStok(true)
                              field.onChange('')
                            } else {
                              field.onChange(value)
                            }
                          }}
                          value={field.value}
                        >
                          <SelectTrigger className={errors.stok ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Pilih stok" />
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
                    </>
                  )}
                />
                {showManualStok && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowManualStok(false)
                      setValue('stok', '25')
                    }}
                    className="mt-2"
                  >
                    Gunakan Pilihan Dropdown
                  </Button>
                )}
                {errors.stok && (
                  <p className="text-sm text-red-500">{errors.stok.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit_stok">Batas Minimum *</Label>
                <Controller
                  name="limit_stok"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="limit_stok"
                      type="number"
                      min="0"
                      autoComplete="off"
                      className={errors.limit_stok ? 'border-red-500' : ''}
                    />
                  )}
                />
                {errors.limit_stok && (
                  <p className="text-sm text-red-500">{errors.limit_stok.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="satuan_barang">Satuan *</Label>
                <Controller
                  name="satuan_barang"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger className={errors.satuan_barang ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih satuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {satuanOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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

          <div className="flex gap-4">
            <Link to="/produk" className="flex-1 hidden md:block">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                disabled={submitting}
              >
                Batal
              </Button>
            </Link>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}