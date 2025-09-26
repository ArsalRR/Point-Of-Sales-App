import { useState } from "react"
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
import { postProduk } from "@/api/Produkapi"
import { Link, useNavigate } from "react-router-dom"
import {
  Package,
  Save,
  DollarSign,
  Hash,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calculator,
  Box,
  TrendingUp
} from "lucide-react"
import Swal from "sweetalert2"

const initialFormData = {
  kode_barang: "",
  nama_barang: "",
  harga: "",
  harga_renteng: "",
  stok: "",
  satuan_barang: "",
  limit_stok: "",
}

export default function CreateProduk() {
  const [formData, setFormData] = useState(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const satuanOptions = [
    { value: "pcs", label: "Pieces (pcs)" },
    { value: "pack", label: "Pack" },
    { value: "box", label: "Box" },
    { value: "kg", label: "Kilogram (kg)" },
    { value: "liter", label: "Liter" },
    { value: "meter", label: "Meter" },
    { value: "unit", label: "Unit" },
    { value: "karton", label: "Karton" },
    { value: "lusin", label: "Lusin" },
    { value: "custom", label: "Lainnya" }
  ]

  const validateForm = () => {
    const newErrors = {}

    if (!formData.kode_barang.trim()) {
      newErrors.kode_barang = "Kode barang harus diisi"
    }

    if (!formData.nama_barang.trim()) {
      newErrors.nama_barang = "Nama barang harus diisi"
    }

    if (!formData.harga || formData.harga <= 0) {
      newErrors.harga = "Harga harus lebih dari 0"
    }

    if (!formData.stok || formData.stok < 0) {
      newErrors.stok = "Stok tidak boleh negatif"
    }

    if (!formData.limit_stok || formData.limit_stok < 0) {
      newErrors.limit_stok = "Limit stok harus diisi dan tidak boleh negatif"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  const handleSelectChange = (value) => {
    if (value === "custom") {
      return // Let user type custom value
    }
    setFormData(prev => ({
      ...prev,
      satuan_barang: value
    }))
  }

  const formatCurrency = (value) => {
    if (!value) return ""
    return new Intl.NumberFormat('id-ID').format(value)
  }

  const calculateDiscount = () => {
    if (formData.harga && formData.harga_renteng) {
      const discount = ((formData.harga - formData.harga_renteng) / formData.harga * 100).toFixed(1)
      return discount > 0 ? discount : 0
    }
    return 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSuccess(false)
    
    try {
      await postProduk(formData)
      setSuccess(true)
      setFormData(initialFormData)
      
      setTimeout(() => {
        navigate('/produk')
      }, 2000)
    } catch (error) {
      console.error("Error submitting product:", error)
      setErrors({ submit: 'Gagal menambahkan produk. Silakan coba lagi.' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      Swal.fire({
        title: "Berhasil!",
        text: "Produk berhasil ditambahkan ke sistem",
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        toast: true,
        position: "top-end",
        didClose: () => {
          navigate('/produk')
        }
      })
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tambah Produk Baru</h1>
              <p className="text-muted-foreground">Lengkapi informasi produk di bawah ini</p>
            </div>
          </div>
          <Package className="w-12 h-12 text-blue-600" />
        </div>

        {/* Error Alert */}
        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="kode_barang" className="text-sm font-medium">
                    Kode Barang *
                  </Label>
                  <Input
                    id="kode_barang"
                    name="kode_barang"
                    value={formData.kode_barang}
                    onChange={handleChange}
                    placeholder="PRD001"
                    className={`h-12 ${errors.kode_barang ? 'border-red-500' : ''}`}
                  />
                  {errors.kode_barang && (
                    <p className="text-sm text-red-500">{errors.kode_barang}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nama_barang" className="text-sm font-medium">
                    Nama Barang *
                  </Label>
                  <Input
                    id="nama_barang"
                    name="nama_barang"
                    value={formData.nama_barang}
                    onChange={handleChange}
                    placeholder="Masukkan nama produk"
                    className={`h-12 ${errors.nama_barang ? 'border-red-500' : ''}`}
                  />
                  {errors.nama_barang && (
                    <p className="text-sm text-red-500">{errors.nama_barang}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Informasi Harga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="harga" className="text-sm font-medium">
                    Harga Normal *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="harga"
                      name="harga"
                      type="number"
                      value={formData.harga}
                      onChange={handleChange}
                      placeholder="10000"
                      className={`h-12 pl-12 ${errors.harga ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.harga && (
                    <p className="text-sm text-red-500">{errors.harga}</p>
                  )}
                  {formData.harga && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(formData.harga)} Rupiah
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harga_renteng" className="text-sm font-medium">
                    Harga Grosir/Renteng
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="harga_renteng"
                      name="harga_renteng"
                      type="number"
                      value={formData.harga_renteng}
                      onChange={handleChange}
                      placeholder="9500"
                      className={`h-12 pl-12 ${errors.harga_renteng ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.harga_renteng && (
                    <p className="text-sm text-red-500">{errors.harga_renteng}</p>
                  )}
                  {formData.harga_renteng && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(formData.harga_renteng)} Rupiah
                      </p>
                      {calculateDiscount() > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Diskon {calculateDiscount()}%
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock & Unit Information */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                Stok & Satuan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stok" className="text-sm font-medium">
                    Stok Awal *
                  </Label>
                  <div className="relative">
                    <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="stok"
                      name="stok"
                      type="number"
                      value={formData.stok}
                      onChange={handleChange}
                      placeholder="50"
                      className={`h-12 pl-10 ${errors.stok ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.stok && (
                    <p className="text-sm text-red-500">{errors.stok}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limit_stok" className="text-sm font-medium">
                    Minimum Stok *
                  </Label>
                  <Input
                    id="limit_stok"
                    name="limit_stok"
                    type="number"
                    value={formData.limit_stok}
                    onChange={handleChange}
                    placeholder="10"
                    className={`h-12 ${errors.limit_stok ? 'border-red-500' : ''}`}
                  />
                  {errors.limit_stok && (
                    <p className="text-sm text-red-500">{errors.limit_stok}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Peringatan jika stok di bawah nilai ini
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="satuan_barang" className="text-sm font-medium">
                    Satuan Barang
                  </Label>
                  <Select onValueChange={handleSelectChange} value={formData.satuan_barang}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Pilih satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {satuanOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.satuan_barang === "custom" && (
                    <Input
                      name="satuan_barang"
                      value={formData.satuan_barang}
                      onChange={handleChange}
                      placeholder="Masukkan satuan custom"
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-4 pt-6">
            <Link to="/produk" className="flex-1">
              <Button variant="outline" className="w-full h-12" type="button">
                Batal
              </Button>
            </Link>
            <Button 
              type="submit" 
              className="flex-2 h-12 gap-2" 
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
                  Simpan Produk
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}