import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Swal from "sweetalert2"
import AsyncSelect from "react-select/async"
import { getProduk } from "@/api/Produkapi"
import { editHargaPromo, getHargaPromoById,  } from "@/api/HargaPromoapi"
import { Tag, PackageOpen, Percent, ArrowLeft, Loader2 } from "lucide-react"
const formatCurrency = (value) => {
  const numericValue = String(value).replace(/[^0-9]/g, "")
  if (!numericValue) return ""
  const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `Rp ${formatted}`
}

const parseCurrency = (value) => {
  return parseInt(String(value)?.replace(/[^0-9]/g, "") || "0", 10)
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

export default function EditHargaPromo() {
  const { id } = useParams() 
  const navigate = useNavigate()
  
  const [formattedHarga, setFormattedHarga] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingData, setIsFetchingData] = useState(true)
  const produkCacheRef = useRef([])
  const isFetchingRef = useRef(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      produk_id: [],
      min_qty: "",
      potongan_harga: "",
    },
  })

  // Custom styles untuk react-select
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
          const options = dataArray.map((p) => {
            const label = 
              p.nama_produk || 
              p.nama_barang || 
              p.namaBarang || 
              p.nama || 
              p.name || 
              `Produk #${p.id}`
            
            return {
              value: p.id,
              label: label,
            }
          })
          produkCacheRef.current = options
        }
      } catch (error) {
        console.error("Gagal fetch produk:", error)
      } finally {
        isFetchingRef.current = false
      }
    }
    
    fetchAllProduk()
  }, [])
  useEffect(() => {
    const fetchHargaPromo = async () => {
      if (!id) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "ID Harga Promo tidak ditemukan",
          confirmButtonColor: "#000",
        }).then(() => navigate("/harga-promo"))
        return
      }

      setIsFetchingData(true)
      try {
        const res = await getHargaPromoById(id)
        const data = res?.data?.data || res?.data || res
        
        console.log("Data promo:", data)

        if (data) {
          setValue("min_qty", data.min_qty)
          const formatted = formatCurrency(String(data.potongan_harga))
          setFormattedHarga(formatted)
          setValue("potongan_harga", formatted)
          const waitForCache = setInterval(() => {
            if (produkCacheRef.current.length > 0) {
              clearInterval(waitForCache)
              let selectedIds = []
              if (Array.isArray(data.produk_id)) {
                selectedIds = data.produk_id
              } else if (data.produk_id) {
                selectedIds = [data.produk_id]
              }
              const selectedOptions = produkCacheRef.current.filter(opt => 
                selectedIds.includes(opt.value)
              )
              
              setValue("produk_id", selectedOptions)
            }
          }, 100)
          setTimeout(() => clearInterval(waitForCache), 5000)
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Data",
          text: error.response?.data?.message || "Tidak dapat memuat data harga promo",
          confirmButtonColor: "#000",
        }).then(() => navigate("/hargapromo"))
      } finally {
        setIsFetchingData(false)
      }
    }

    fetchHargaPromo()
  }, [id, setValue, navigate])
  const loadOptions = (inputValue, callback) => {
    if (produkCacheRef.current.length === 0) {
      setTimeout(() => callback([]), 100)
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
      await editHargaPromo(id, payload)
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Harga promo berhasil diperbarui",
        confirmButtonColor: "#000",
      }).then(() => navigate("/hargapromo"))
    } catch (error) {
      console.error("Gagal update promo:", error)
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: error.response?.data?.message || "Terjadi kesalahan saat memperbarui data",
        confirmButtonColor: "#000",
      })
    } finally {
      setIsLoading(false)
    }
  }
  if (isFetchingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-900" />
          <p className="text-gray-600 font-medium">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
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
            Edit Harga Promo
          </h1>
          <p className="text-gray-600">
            Perbarui informasi promo untuk produk Anda
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Select Produk */}
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
                    />
                  )}
                />
                {errors.produk_id && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <span className="text-lg">•</span>
                    {errors.produk_id.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
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

              {/* Action Buttons */}
              <div className="flex gap-3">
               <Button
  type="button"
  onClick={() => navigate("/hargapromo")}
  className="hidden sm:flex flex-1 bg-white hover:bg-gray-100 text-black border-2 border-gray-300 font-semibold h-12 text-base transition-all duration-200"
>
  Batal
</Button>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold h-12 text-base transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Memperbarui...
                    </span>
                  ) : (
                    "Perbarui Promo"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="mt-6 p-4 bg-white border-2 border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            💡 <strong>Info:</strong> Perubahan akan langsung diterapkan setelah disimpan.
          </p>
        </div>
      </div>
    </div>
  )
}