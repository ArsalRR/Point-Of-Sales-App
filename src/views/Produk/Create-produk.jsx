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
import { postProduk } from "@/api/Produkapi"
import Swal from "sweetalert2"
import { Link, useNavigate } from "react-router-dom"
const initialFormData = {
  kode_barang: "",
  nama_barang: "",
  harga: "",
  harga_renteng: "",
  jumlah_lainnya: "",
  stok: "",
  satuan_barang: "",
  limit_stok: "",
}

export default function CreateProduk() {
  const [formData, setFormData] = useState(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [showRentengan, setShowRentengan] = useState(false)
  const [showManualStok, setShowManualStok] = useState(false)
  const [manualStok, setManualStok] = useState("")
   const navigate = useNavigate()

  const satuanOptions = [
    { value: "PCS", label: "PCS" },
    { value: "Liter", label: "Liter" },
    { value: "KILOGRAM", label: "Kilogram" },
    { value: "MILIGRAM", label: "Miligram" },
    { value: "Bungkus", label: "Bungkus" },
    { value: "Galon", label: "Galon" }
  ]

  const stokOptions = [
    { value: "", label: "--Pilih Stok Barang--" },
    { value: "manual", label: "Masukkan Manual..." },
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

  const generateKode = () => {
    const randomCode = Math.floor(Math.random() * 999999) + 100000
    setFormData(prev => ({
      ...prev,
      kode_barang: randomCode.toString()
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.kode_barang.trim()) {
      newErrors.kode_barang = "Kode barang harus diisi"
    }

    if (!formData.nama_barang.trim()) {
      newErrors.nama_barang = "Nama barang harus diisi"
    }

    if (!formData.harga || parseCurrency(formData.harga) <= 0) {
      newErrors.harga = "Harga harus lebih dari 0"
    }

    if (!formData.limit_stok || formData.limit_stok < 0) {
      newErrors.limit_stok = "Limit stok harus diisi dan tidak boleh negatif"
    }

    const finalStok = showManualStok ? manualStok : formData.stok
    if (!finalStok || finalStok < 0) {
      newErrors.stok = "Stok tidak boleh negatif"
    }

    if (!formData.satuan_barang) {
      newErrors.satuan_barang = "Satuan barang harus dipilih"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let processedValue = value

    // Format currency for price fields
    if (name === 'harga' || name === 'harga_renteng') {
      processedValue = formatCurrency(value)
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }))

    // Show/hide rentengan field
    if (name === 'harga_renteng') {
      setShowRentengan(value.trim() !== '')
    }

    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Handle manual stock input
    if (name === 'stok') {
      setShowManualStok(value === 'manual')
      if (value !== 'manual') {
        setManualStok("")
      }
    }
  }

  const formatCurrency = (value) => {
    // Remove all non-digits
    const numericValue = value.replace(/[^0-9]/g, '')
    
    if (!numericValue) return ''
    
    // Format with thousands separators
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `Rp ${formatted}`
  }

  const parseCurrency = (value) => {
    return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0
  }

  const calculateDiscount = () => {
    if (formData.harga && formData.harga_renteng) {
      const hargaNormal = parseCurrency(formData.harga)
      const hargaRenteng = parseCurrency(formData.harga_renteng)
      if (hargaNormal > 0 && hargaRenteng > 0) {
        const discount = ((hargaNormal - hargaRenteng) / hargaNormal * 100).toFixed(1)
        return discount > 0 ? discount : 0
      }
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/produk">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            </Link>
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

        <div className="space-y-6">
          {/* Basic Information */}
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
                  Kode Barang *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="kode_barang"
                    name="kode_barang"
                    type="number"
                    value={formData.kode_barang}
                    onChange={handleChange}
                    placeholder="Masukkan Kode Barang"
                    className={`h-12 ${errors.kode_barang ? 'border-red-500' : ''}`}
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
                  placeholder="Masukkan Nama Barang"
                  className={`h-12 ${errors.nama_barang ? 'border-red-500' : ''}`}
                />
                {errors.nama_barang && (
                  <p className="text-sm text-red-500">{errors.nama_barang}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit_stok" className="text-sm font-medium">
                  Limit Stok Produk *
                </Label>
                <Input
                  id="limit_stok"
                  name="limit_stok"
                  type="number"
                  value={formData.limit_stok}
                  onChange={handleChange}
                  placeholder="Masukkan Limit Barang"
                  className={`h-12 ${errors.limit_stok ? 'border-red-500' : ''}`}
                />
                {errors.limit_stok && (
                  <p className="text-sm text-red-500">{errors.limit_stok}</p>
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
                <Input
                  id="harga"
                  name="harga"
                  value={formData.harga}
                  onChange={handleChange}
                  placeholder="Masukkan Harga"
                  className={`h-12 ${errors.harga ? 'border-red-500' : ''}`}
                />
                {errors.harga && (
                  <p className="text-sm text-red-500">{errors.harga}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="harga_renteng" className="text-sm font-medium">
                  Harga Rentengan / Lainnya
                </Label>
                <Input
                  id="harga_renteng"
                  name="harga_renteng"
                  value={formData.harga_renteng}
                  onChange={handleChange}
                  placeholder="Masukkan Harga Rentengan"
                  className={`h-12 ${errors.harga_renteng ? 'border-red-500' : ''}`}
                />
                {errors.harga_renteng && (
                  <p className="text-sm text-red-500">{errors.harga_renteng}</p>
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
                  <Input
                    id="jumlah_lainnya"
                    name="jumlah_lainnya"
                    type="number"
                    value={formData.jumlah_lainnya}
                    onChange={handleChange}
                    placeholder="Masukkan Isi Rentengan"
                    className="h-12"
                  />
                </div>
              )}
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
  <div className="space-y-2">
    <Label htmlFor="stok" className="text-sm font-medium">
      Stok Barang *
    </Label>
    <Select
      onValueChange={(value) => handleSelectChange("stok", value)}
      value={formData.stok}
    >
      <SelectTrigger className="h-12 w-full">
        <SelectValue placeholder="--Pilih Stok Barang--" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="manual">Masukkan Manual...</SelectItem>
        {stokOptions.slice(2).map((group, index) => (
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
      <p className="text-sm text-red-500">{errors.stok}</p>
    )}
  </div>

  <div className="space-y-2">
    <Label htmlFor="satuan_barang" className="text-sm font-medium">
      Satuan Barang *
    </Label>
    <Select
      onValueChange={(value) => handleSelectChange("satuan_barang", value)}
      value={formData.satuan_barang}
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
    {errors.satuan_barang && (
      <p className="text-sm text-red-500">{errors.satuan_barang}</p>
    )}
  </div>
</CardContent>

          </Card>

          <div className="flex gap-4 pt-6">
            <Link to="/produk">
            <Button variant="outline" className="flex-1 h-12" type="button">
              Kembali
            </Button>
            </Link>
            <Button 
              onClick={handleSubmit}
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
                  SIMPAN
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}