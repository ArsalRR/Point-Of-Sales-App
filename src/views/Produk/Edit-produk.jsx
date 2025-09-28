import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
} from "lucide-react"
import Swal from "sweetalert2"

export default function EditProduk() {
  const [produk, setProduk] = useState({})
  const { id } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false) 
  const [errors, setErrors] = useState({})
  const [readOnly, setReadOnly] = useState(true)

  const initialFormData = {
    kode_barang: "",
    nama_barang: "",
    harga: "",
    harga_renteng: "",
    stok: 0,
    satuan_barang: "",
    limit_stok: 0,
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
    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getProdukById(id)      
        setProduk(data)
        setFormData({
          kode_barang: data.kode_barang || "",
          nama_barang: data.nama_barang || "",
          harga: data.harga ? data.harga.toString() : "",
          harga_renteng: data.harga_renteng ? data.harga_renteng.toString() : "",
          stok: Number(data.stok) || 0,
          satuan_barang: data.satuan_barang || "",
          limit_stok: Number(data.limit_stok) || 0,
        })
        setError('') // Clear any previous errors
      } catch (err) {
        console.error("Gagal ambil produk:", err)
        setError("Gagal memuat data produk")
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchData()
    }
  }, [id])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.kode_barang?.trim()) {
      newErrors.kode_barang = "Kode barang harus diisi"
    }
    
    if (!formData.nama_barang?.trim()) {
      newErrors.nama_barang = "Nama barang harus diisi"
    }
    
    const hargaNum = parseCurrency(formData.harga)
    if (!hargaNum || hargaNum <= 0) {
      newErrors.harga = "Harga harus lebih dari 0"
    }
    
    if (Number(formData.stok) < 0) {
      newErrors.stok = "Stok tidak boleh negatif"
    }
    
    if (Number(formData.limit_stok) < 0) {
      newErrors.limit_stok = "Limit stok tidak boleh negatif"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, satuan_barang: value }))
  }

  const formatCurrency = (value) => {
    if (!value || value === "0") return ""
    let val = value.toString().replace(/[^,\d]/g, "")
    let split = val.split(",")
    let remainder = split[0].length % 3
    let rupiah = split[0].substr(0, remainder)
    let thousands = split[0].substr(remainder).match(/\d{3}/gi)

    if (thousands) {
      let separator = remainder ? "." : ""
      rupiah += separator + thousands.join(".")
    }
    
    rupiah = split[1] !== undefined ? rupiah + "," + split[1] : rupiah
    return rupiah ? "Rp " + rupiah : ""
  }

  const parseCurrency = (value) => {
    if (!value) return 0
    return parseInt(value.toString().replace(/[^0-9]/g, ""), 10) || 0
  }

  const handleCurrencyChange = (fieldName, value) => {
    const numericValue = parseCurrency(value)
    setFormData(prev => ({ ...prev, [fieldName]: numericValue.toString() }))
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setErrors({})

    try {
      const payload = {
        kode_barang: formData.kode_barang.trim(),
        nama_barang: formData.nama_barang.trim(),
        harga: parseCurrency(formData.harga).toString(),
        harga_renteng: parseCurrency(formData.harga_renteng).toString(),
        stok: Number(formData.stok), 
        limit_stok: Number(formData.limit_stok),
        satuan_barang: formData.satuan_barang || "pcs"
      }
      const result = await editProduk(id, payload)
      console.log('Update result:', result) 

      await Swal.fire({
        title: "Berhasil!",
        text: "Produk berhasil diperbarui",
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        toast: true,
        position: "top-end"
      })

      navigate('/produk')
      
    } catch (error) {
      console.error("Error updating product:", error)
      
      let errorMessage = 'Gagal memperbarui produk'
      let fieldErrors = {}
      
      if (error.response?.data) {
        if (error.response.data.errors) {
          fieldErrors = error.response.data.errors
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
      }
      
      setErrors({ ...fieldErrors, submit: errorMessage })
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Produk</h1>
            <p className="text-muted-foreground">Perbarui informasi produk: {produk.nama_barang}</p>
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
        
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link to="/produk">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            </Link>
                <Hash className="w-5 h-5" /> Informasi Dasar
              </CardTitle>
            </CardHeader>
           <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Kode Barang */}
  <div className="mb-4">
    <label htmlFor="kode_barang" className="block text-sm font-medium text-gray-700 mb-1">
      Kode Barang *
    </label>
    <div className="relative">
      <input
        id="kode_barang"
        name="kode_barang"
        value={formData.kode_barang}
        onChange={handleChange}
        placeholder="PRD001"
        readOnly={readOnly}
        className={`
          block w-full pr-10 px-3 py-2 border rounded-md
          ${errors.kode_barang ? 'border-red-500' : 'border-gray-300'}
          ${readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        `}
      />
      <button
        type="button"
        onClick={() => setReadOnly(!readOnly)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
      >
        {readOnly ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
    {errors.kode_barang && <p className="text-sm text-red-500 mt-1">{errors.kode_barang}</p>}
  </div>

  {/* Nama Barang */}
  <div className="mb-4">
    <label htmlFor="nama_barang" className="block text-sm font-medium text-gray-700 mb-1">
      Nama Barang *
    </label>
    <input
      id="nama_barang"
      name="nama_barang"
      value={formData.nama_barang}
      onChange={handleChange}
      placeholder="Masukkan nama produk"
      className={`
        block w-full px-3 py-2 border rounded-md
        ${errors.nama_barang ? 'border-red-500' : 'border-gray-300'}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      `}
    />
    {errors.nama_barang && <p className="text-sm text-red-500 mt-1">{errors.nama_barang}</p>}
  </div>
</CardContent>

          </Card>

          {/* Informasi Harga */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Informasi Harga
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="harga">Harga Jual *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="harga"
                    name="harga"
                    type="text"
                    value={formatCurrency(formData.harga)}
                    onChange={(e) => handleCurrencyChange('harga', e.target.value)}
                    placeholder="Masukkan Harga"
                    className={`pl-10 ${errors.harga ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.harga && <p className="text-sm text-red-500 mt-1">{errors.harga}</p>}
              </div>
              <div>
                <Label htmlFor="harga_renteng">Harga Rentengan</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="harga_renteng"
                    name="harga_renteng"
                    type="text"
                    value={formatCurrency(formData.harga_renteng)}
                    onChange={(e) => handleCurrencyChange('harga_renteng', e.target.value)}
                    placeholder="Masukkan Harga Rentengan"
                    className={`pl-10 ${errors.harga_renteng ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.harga_renteng && <p className="text-sm text-red-500 mt-1">{errors.harga_renteng}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Informasi Stok */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" /> Informasi Stok
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="stok">Stok *</Label>
                <Input
                  id="stok"
                  name="stok"
                  type="number"
                  min="0"
                  value={formData.stok}
                  onChange={handleChange}
                  className={errors.stok ? 'border-red-500' : ''}
                />
                {errors.stok && <p className="text-sm text-red-500 mt-1">{errors.stok}</p>}
              </div>
              <div>
                <Label htmlFor="limit_stok">Batas Minimum *</Label>
                <Input
                  id="limit_stok"
                  name="limit_stok"
                  type="number"
                  min="0"
                  value={formData.limit_stok}
                  onChange={handleChange}
                  className={errors.limit_stok ? 'border-red-500' : ''}
                />
                {errors.limit_stok && <p className="text-sm text-red-500 mt-1">{errors.limit_stok}</p>}
              </div>
              <div>
                <Label htmlFor="satuan_barang">Satuan</Label>
                <Select onValueChange={handleSelectChange} value={formData.satuan_barang}>
                  <SelectTrigger>
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
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Link to="/produk" className="flex-1">
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