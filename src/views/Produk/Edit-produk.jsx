import {useState, useEffect} from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom';
import { editProduk,getProdukById } from '@/api/Produkapi';
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
  Calculator,
  Box,
  TrendingUp
} from "lucide-react"
import Swal from "sweetalert2"

export default function EditProduk() {
  const [produk, setProduk] = useState({})
  const {id} = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})
  const initialFormData = {
    kode_barang: "",
    nama_barang: "",
    harga: "",
    harga_renteng: "",
    stok: "",
    satuan_barang: "",
    limit_stok: "",
  }
  const [formData, setFormData] = useState(initialFormData)

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

  useEffect(() => {
    const fetchProduk = async () => {
      try {
        const response = await editProduk(id)
        console.log(response.data)
        setProduk(response.data)
        setFormData({
          kode_barang: response.data.kode_barang,
          nama_barang: response.data.nama_barang,
          harga: response.data.harga,
          harga_renteng: response.data.harga_renteng,
          stok: response.data.stok,
          satuan_barang: response.data.satuan_barang,
          limit_stok: response.data.limit_stok,
        })
        setLoading(false)
      } catch (error) {
        setError('Gagal mengambil data produk')
        setLoading(false)
      }
    }
    fetchProduk()
  }, [id])

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
      return setFormData(prev => ({
        ...prev,
        satuan_barang: value,
        limit_stok: "",
      }))
    }
    setFormData(prev => ({
      ...prev,
      satuan_barang: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSuccess(false)
    
    try {
      await editProduk(id, formData)
      setSuccess(true)
      
      Swal.fire({
        title: "Berhasil!",
        text: "Produk berhasil diperbarui",
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
    } catch (error) {
      console.error("Error updating product:", error)
      setErrors({ submit: 'Gagal memperbarui produk. Silakan coba lagi.' })
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Memuat data produk...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Produk</h1>
              <p className="text-muted-foreground">Perbarui informasi produk di bawah ini</p>
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
                    Harga Satuan *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="harga"
                      name="harga"
                      type="number"
                      value={formData.harga}
                      onChange={handleChange}
                      placeholder="0"
                      className={`h-12 pl-10 ${errors.harga ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.harga && (
                    <p className="text-sm text-red-500">{errors.harga}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harga_renteng" className="text-sm font-medium">
                    Harga Rentengan
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="harga_renteng"
                      name="harga_renteng"
                      type="number"
                      value={formData.harga_renteng}
                      onChange={handleChange}
                      placeholder="0"
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Information */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                Informasi Stok
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stok" className="text-sm font-medium">
                    Stok Saat Ini *
                  </Label>
                  <div className="relative">
                    <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="stok"
                      name="stok"
                      type="number"
                      value={formData.stok}
                      onChange={handleChange}
                      placeholder="0"
                      className={`h-12 pl-10 ${errors.stok ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.stok && (
                    <p className="text-sm text-red-500">{errors.stok}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limit_stok" className="text-sm font-medium">
                    Batas Minimum Stok *
                  </Label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="limit_stok"
                      name="limit_stok"
                      type="number"
                      value={formData.limit_stok}
                      onChange={handleChange}
                      placeholder="0"
                      className={`h-12 pl-10 ${errors.limit_stok ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.limit_stok && (
                    <p className="text-sm text-red-500">{errors.limit_stok}</p>
                  )}
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
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
