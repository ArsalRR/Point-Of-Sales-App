import { useEffect, useState, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Swal from "sweetalert2"
import AsyncSelect from "react-select/async"
import { getProduk } from "@/api/Produkapi"
import { postHargaPromo } from "@/api/HargaPromoapi"
import { Tag, PackageOpen, Percent, Search } from "lucide-react"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"



// Format dan parsing rupiah
const formatCurrency = (value) => {
  const numericValue = value.replace(/[^0-9]/g, "")
  if (!numericValue) return ""
  const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `Rp ${formatted}`
}

const parseCurrency = (value) => {
  return parseInt(value?.replace(/[^0-9]/g, "") || "0", 10)
}

// Validasi Yup
const schema = yup.object().shape({
  produk_id: yup.array().min(1, "Pilih minimal 1 produk"),
  min_qty: yup
    .number()
    .typeError("Minimal qty harus angka")
    .positive("Minimal qty harus lebih dari 0")
    .integer("Minimal qty harus bilangan bulat")
    .required("Minimal qty wajib diisi"),
  potongan_harga: yup.string().required("Potongan harga wajib diisi"),
})

export default function CreateHargaPromo() {
  const [formattedHarga, setFormattedHarga] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const produkCacheRef = useRef([]) 
  const isFetchingRef = useRef(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      produk_id: [],
      min_qty: "",
      potongan_harga: "",
    },
  })
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "white",
      borderColor: state.isFocused ? "#000" : "#e5e7eb",
      borderWidth: "2px",
      borderRadius: "0.5rem",
      minHeight: "44px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(0, 0, 0, 0.1)" : "none",
      "&:hover": {
        borderColor: "#000",
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "white",
      border: "2px solid #000",
      borderRadius: "0.5rem",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#000"
        : state.isFocused
        ? "#f3f4f6"
        : "white",
      color: state.isSelected ? "white" : "#000",
      cursor: "pointer",
      padding: "10px 12px",
      "&:active": {
        backgroundColor: "#000",
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#000",
      borderRadius: "0.375rem",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "white",
      fontWeight: "500",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "white",
      "&:hover": {
        backgroundColor: "#374151",
        color: "white",
      },
    }),
    loadingMessage: (base) => ({
      ...base,
      color: "#6b7280",
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: "#6b7280",
    }),
  }
  useEffect(() => {
    const fetchAllProduk = async () => {
      if (isFetchingRef.current || produkCacheRef.current.length > 0) return
      
      isFetchingRef.current = true
      try {
        const res = await getProduk()
        
        let dataArray = []
        if (Array.isArray(res)) {
          dataArray = res
        } else if (res?.data && Array.isArray(res.data)) {
          dataArray = res.data
        } else if (res?.data?.data && Array.isArray(res.data.data)) {
          dataArray = res.data.data
        }
        if (dataArray.length > 0) {
      
        }
        
        if (dataArray.length > 0) {
          const options = dataArray.map((p) => {
         
            const label = 
              p.nama_barang || 
            
              p.nama || 
              p.name || 
              p.product_name || 
              p.productName ||
              `Produk #${p.id}`
            
            return {
              value: p.id,
              label: label,
            }
          })
          produkCacheRef.current = options
        
        }
      } catch (error) {
      } finally {
        isFetchingRef.current = false
      }
    }
    
    fetchAllProduk()
  }, [])
  const loadOptions = (inputValue, callback) => {
    if (produkCacheRef.current.length === 0) {
      setTimeout(() => {
        callback([])
      }, 100)
      return
    }
    if (!inputValue || inputValue.length < 2) {
      callback(produkCacheRef.current.slice(0, 50))
      return
    }

    const searchLower = inputValue.toLowerCase()
    const filtered = produkCacheRef.current.filter((option) =>
      option.label.toLowerCase().includes(searchLower)
    )
    callback(filtered.slice(0, 100))
  }

  const onSubmit = async (data) => {
    const payload = {
      produk_id: data.produk_id.map((p) => p.value),
      min_qty: Number(data.min_qty),
      potongan_harga: parseCurrency(data.potongan_harga),
    }

    setIsLoading(true)
    try {
      await postHargaPromo(payload)
      Swal.fire({
      position: "top-end",
      toast: true,
      icon: "success",
      title: "Berhasil!",
      text: "Harga promo berhasil disimpan",
      confirmButtonColor: "#000",
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      navigate("/hargapromo")
    })
      reset()
      setFormattedHarga("")
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: error.response?.data?.message || "Terjadi kesalahan saat menyimpan data",
        confirmButtonColor: "#000",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
          <button
          onClick={() => navigate("/hargapromo")}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Kembali</span>
        </button>
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4">
            <Percent className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tambah Harga Promo
          </h1>
          <p className="text-gray-600">
            Buat penawaran menarik untuk meningkatkan penjualan produk Anda
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Pilih Produk
                  <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="produk_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      {...field}
                      cacheOptions
                      defaultOptions
                      loadOptions={loadOptions}
                      isMulti
                      placeholder="Ketik minimal 2 huruf untuk mencari..."
                      styles={customSelectStyles}
                      noOptionsMessage={({ inputValue }) =>
                        produkCacheRef.current.length === 0
                          ? "Memuat daftar produk..."
                          : inputValue.length < 2
                          ? "Ketik minimal 2 huruf"
                          : `Tidak ditemukan "${inputValue}"`
                      }
                      loadingMessage={() => "Mencari produk..."}
                      components={{
                        DropdownIndicator: () => (
                          <div className="px-2">
                            <Search className="w-4 h-4 text-gray-400" />
                          </div>
                        ),
                      }}
                    />
                  )}
                />
                {errors.produk_id && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <span className="text-lg">•</span>
                    {errors.produk_id.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  {produkCacheRef.current.length > 0
                    ? `${produkCacheRef.current.length} produk tersedia. Ketik untuk mencari cepat.`
                    : "Memuat daftar produk..."}
                </p>
              </div>

              {/* Minimal Quantity */}
              <div className="space-y-2">
                <Label 
                  htmlFor="min_qty" 
                  className="text-sm font-semibold text-gray-900 flex items-center gap-2"
                >
                  <PackageOpen className="w-4 h-4" />
                  Minimal Pembelian
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="min_qty"
                  type="number"
                  placeholder="Contoh: 10"
                  className="border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-20 h-11 text-base"
                  {...register("min_qty")}
                />
                {errors.min_qty && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <span className="text-lg">•</span>
                    {errors.min_qty.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Jumlah minimal pembelian untuk mendapat potongan harga
                </p>
              </div>

              {/* Potongan Harga */}
              <div className="space-y-2">
                <Label 
                  htmlFor="potongan_harga" 
                  className="text-sm font-semibold text-gray-900 flex items-center gap-2"
                >
                  <Percent className="w-4 h-4" />
                  Potongan Harga
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="potongan_harga"
                  type="text"
                  placeholder="Rp 0"
                  value={formattedHarga}
                  onChange={(e) => {
                    const value = e.target.value
                    const formatted = formatCurrency(value)
                    setFormattedHarga(formatted)
                    setValue("potongan_harga", formatted, {
                      shouldValidate: true,
                    })
                  }}
                  className="border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-20 h-11 text-base font-medium"
                  autoComplete="off"
                />
                {errors.potongan_harga && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <span className="text-lg">•</span>
                    {errors.potongan_harga.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Nilai potongan harga yang akan diberikan per produk
                </p>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-gray-200 my-6"></div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12 text-base transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan Harga Promo"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="mt-6 p-4 bg-white border-2 border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            💡 <strong>Tips:</strong> Promo akan langsung aktif setelah disimpan. Pastikan data yang dimasukkan sudah benar.
          </p>
        </div>
      </div>
    </div>
  )
}