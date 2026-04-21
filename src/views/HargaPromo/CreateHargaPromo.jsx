import { useEffect, useState, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Swal from "sweetalert2"
import AsyncSelect from "react-select/async"
import CreatableSelect from "react-select/creatable"
import { getProduk } from "@/api/Produkapi"
import { postHargaPromo, getHargaPromo } from "@/api/HargaPromoapi"
import { Tag, PackageOpen, Percent, Search, ArrowLeft, FolderOpen, DollarSign } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const formatCurrency = (value) => {
  const numericValue = value.replace(/[^0-9]/g, "")
  if (!numericValue) return ""
  const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `Rp ${formatted}`
}

const parseCurrency = (value) => {
  return parseInt(value?.replace(/[^0-9]/g, "") || "0", 10)
}

const schema = yup.object().shape({
  produk_id: yup.array().min(1, "Pilih minimal 1 produk"),
  min_qty: yup
    .number()
    .typeError("Minimal qty harus angka")
    .positive("Minimal qty harus lebih dari 0")
    .integer("Minimal qty harus bilangan bulat")
    .required("Minimal qty wajib diisi"),
  potongan_harga: yup.string().required("Potongan harga wajib diisi"),
  kat_promo: yup.string().nullable(),
  tipe_harga: yup.string().required("Pilih tipe harga").default("harga"),
})

export default function CreateHargaPromo() {
  const [formattedHarga, setFormattedHarga] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [existingPromos, setExistingPromos] = useState([])
  const [katPromoOptions, setKatPromoOptions] = useState([])
  const [selectedTipeHarga, setSelectedTipeHarga] = useState("harga")
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
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      produk_id: [],
      min_qty: "",
      potongan_harga: "",
      kat_promo: null,
      tipe_harga: "harga",
    },
  })

  const selectedProducts = watch("produk_id")
  const minQty = watch("min_qty")
  const tipeHarga = watch("tipe_harga")

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
        
        try {
          const promoRes = await getHargaPromo()
          let promoData = []
          if (Array.isArray(promoRes)) {
            promoData = promoRes
          } else if (promoRes?.data && Array.isArray(promoRes.data)) {
            promoData = promoRes.data
          } else if (promoRes?.data?.data && Array.isArray(promoRes.data.data)) {
            promoData = promoRes.data.data
          }
          setExistingPromos(promoData)
          
          const uniqueKatPromo = [...new Set(
            promoData
              .map(promo => promo.kat_promo)
              .filter(kat => kat && kat.trim() !== "")
          )]
          
          const katPromoOpts = uniqueKatPromo.map(kat => ({
            value: kat,
            label: kat
          }))
          
          setKatPromoOptions(katPromoOpts)
        } catch (error) {
          console.error("Error fetching promo:", error)
        }

        if (dataArray.length > 0) {
          const options = dataArray.map((p) => {
            const hargaDisplay = p.harga_renteng 
              ? `Harga: Rp${Number(p.harga).toLocaleString()} | Renteng: Rp${Number(p.harga_renteng).toLocaleString()}`
              : `Rp${Number(p.harga).toLocaleString()}`
            const label = `${p.nama_barang} - ${hargaDisplay}`
            return {
              value: p.id,
              label: label,
              nama_barang: p.nama_barang,
              harga: p.harga,
              harga_renteng: p.harga_renteng || null,
            }
          })
          produkCacheRef.current = options
        }
      } catch (error) {
        console.error(error)
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
  
  const getExistingPromoInfo = (produkId, tipeHarga = null) => {
    return existingPromos
      .filter((promo) => {
        const produkIds = Array.isArray(promo.produk_id)
          ? promo.produk_id
          : [promo.produk_id]
        const matchProduk = produkIds.includes(produkId)
        const matchTipe = tipeHarga ? promo.tipe_harga === tipeHarga : true
        return matchProduk && matchTipe
      })
      .map((promo) => ({
        min_qty: promo.min_qty,
        potongan_harga: promo.potongan_harga,
        tipe_harga: promo.tipe_harga,
      }))
  }
  
  const formatOptionLabel = ({ value, label, data }) => {
    const promoInfo = getExistingPromoInfo(value)

    return (
      <div className="flex items-center justify-between w-full py-1">
        <span className="flex-1">{label}</span>
        {promoInfo.length > 0 && (
          <div className="flex gap-1 ml-2 flex-shrink-0">
            {promoInfo.map((info, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-[10px] bg-blue-100 text-blue-800 border-blue-300 px-1.5 py-0"
              >
                Min {info.min_qty}
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  const validateDuplicatePromo = (selectedProducts, minQty, tipeHarga) => {
    if (!minQty || !selectedProducts || selectedProducts.length === 0) {
      return { isValid: true }
    }

    for (const product of selectedProducts) {
      const existingPromoForProduct = existingPromos.filter((promo) => {
        const produkIds = Array.isArray(promo.produk_id)
          ? promo.produk_id
          : [promo.produk_id]
        return produkIds.includes(product.value) && promo.tipe_harga === tipeHarga
      })
      const hasSameMinQty = existingPromoForProduct.find(
        (promo) => promo.min_qty === Number(minQty)
      )

      if (hasSameMinQty) {
        return {
          isValid: false,
          productName: product.nama_barang,
          tipeHarga: tipeHarga === "harga" ? "Harga Reguler" : "Harga Renteng/dll",
          minQty: minQty,
        }
      }
    }

    return { isValid: true }
  }

  const onSubmit = async (data) => {
    const validation = validateDuplicatePromo(data.produk_id, data.min_qty, data.tipe_harga)

    if (!validation.isValid) {
      const message = `Produk <strong>${validation.productName}</strong> dengan <strong>${validation.tipeHarga}</strong> sudah memiliki promo dengan minimal qty <strong>${validation.minQty}</strong>.<br><br>Silakan gunakan minimal qty yang berbeda atau pilih tipe harga lain.`

      Swal.fire({
        icon: "warning",
        title: "Duplikasi Terdeteksi!",
        html: message,
        confirmButtonColor: "#000",
      })
      return
    }

    if (data.tipe_harga === "harga_renteng") {
      const produkTanpaRenteng = data.produk_id.filter(
        product => !product.harga_renteng || product.harga_renteng === 0
      )
      
      if (produkTanpaRenteng.length > 0) {
        Swal.fire({
          icon: "warning",
          title: "Produk Tidak Memiliki Harga Renteng/dll",
          html: `Produk <strong>${produkTanpaRenteng.map(p => p.nama_barang).join(", ")}</strong> tidak memiliki harga renteng atau lainnya. Silakan pilih tipe harga reguler.`,
          confirmButtonColor: "#000",
        })
        return
      }
    }

    const payload = {
      produk_id: data.produk_id.map((p) => p.value),
      min_qty: Number(data.min_qty),
      potongan_harga: parseCurrency(data.potongan_harga),
      kat_promo: data.kat_promo || null,
      tipe_harga: data.tipe_harga, // Mengirim tipe_harga ke backend
    }

    console.log("Payload yang dikirim:", payload)

    setIsLoading(true)
    try {
      const response = await postHargaPromo(payload)
      const result = response.data || response
      const sukses = result.sukses || 0
      const gagal = result.gagal || []

      if (sukses > 0) {
        let message = `${sukses} produk berhasil ditambahkan dengan ${data.tipe_harga === "harga" ? "Harga Reguler" : "Harga Renteng/dll"}`
        if (gagal.length > 0) {
          message += `. ${gagal.length} produk ditolak karena duplikasi.`
        }

        Swal.fire({
          position: "top-end",
          toast: true,
          icon: "success",
          title: "Berhasil!",
          text: message,
          confirmButtonColor: "#000",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          navigate("/hargapromo")
        })
        reset()
        setFormattedHarga("")
        setSelectedTipeHarga("harga")
      } else {
        Swal.fire({
          icon: "error",
          title: "Semua Produk Ditolak!",
          text: "Semua produk yang dipilih sudah memiliki promo dengan kombinasi yang sama.",
          confirmButtonColor: "#000",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text:
          error.response?.data?.message ||
          "Terjadi kesalahan saat menyimpan data",
        confirmButtonColor: "#000",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const duplicateCheck = validateDuplicatePromo(selectedProducts, minQty, tipeHarga)

  // Helper untuk mendapatkan harga yang akan dipotong
  const getTargetHarga = () => {
    if (!selectedProducts || selectedProducts.length === 0) return null
    if (selectedProducts.length === 1) {
      const product = selectedProducts[0]
      return tipeHarga === "harga" ? product.harga : product.harga_renteng
    }
    return null
  }

  const targetHarga = getTargetHarga()

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/hargapromo")}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Kembali</span>
        </button>

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
              {/* Pilih Produk */}
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
                      formatOptionLabel={formatOptionLabel}
                      placeholder="Ketik nama produk untuk mencari..."
                      styles={customSelectStyles}
                      noOptionsMessage={({ inputValue }) =>
                        produkCacheRef.current.length === 0
                          ? "Memuat daftar produk..."
                          : inputValue.length < 2
                          ? "Ketik 2 karakter atau lebih untuk mencari"
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
                
                {selectedProducts && selectedProducts.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {selectedProducts.map((product) => {
                      const promoInfo = getExistingPromoInfo(product.value, tipeHarga)
                      if (promoInfo.length === 0) return null

                      return (
                        <div
                          key={product.value}
                          className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs"
                        >
                          <span className="font-medium text-blue-900 flex-shrink-0">
                            {product.nama_barang}:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {promoInfo.map((info, idx) => (
                              <span key={idx} className="text-blue-700">
                                Min {info.min_qty} = -Rp
                                {info.potongan_harga.toLocaleString()}
                                {idx < promoInfo.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  {produkCacheRef.current.length > 0
                    ? `${produkCacheRef.current.length} produk tersedia. Ketik 2 karakter untuk mencari cepat.`
                    : "Memuat daftar produk..."}
                </p>
              </div>

              {/* Radio Group untuk Pilih Tipe Harga */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Pilih Tipe Harga untuk Potongan
                  <span className="text-red-500">*</span>
                </Label>
                
                <Controller
                  name="tipe_harga"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedTipeHarga(value)
                      }}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="harga" id="harga" />
                        <Label htmlFor="harga" className="font-normal text-sm cursor-pointer">
                          Harga Reguler
                          {targetHarga && (
                            <span className="ml-2 text-gray-500">
                              (Rp{targetHarga?.toLocaleString()})
                            </span>
                          )}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="harga_renteng" id="harga_renteng" />
                        <Label htmlFor="harga_renteng" className="font-normal text-sm cursor-pointer">
                          Harga Renteng atau dan lain lain
                          {targetHarga && (
                            <span className="ml-2 text-gray-500">
                              (Rp{targetHarga?.toLocaleString()})
                            </span>
                          )}
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                
                {errors.tipe_harga && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <span className="text-lg">•</span>
                    {errors.tipe_harga.message}
                  </p>
                )}

                <p className="text-xs text-gray-500">
                  Pilih tipe harga yang akan mendapatkan potongan (Harga Reguler atau Harga Renteng/dll)
                </p>
              </div>

              {/* Kategori Promo */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Kategori Promo
                </Label>
                <Controller
                  name="kat_promo"
                  control={control}
                  render={({ field }) => (
                    <CreatableSelect
                      value={field.value ? { value: field.value, label: field.value } : null}
                      onChange={(option) => field.onChange(option ? option.value : null)}
                      isClearable
                      options={katPromoOptions}
                      placeholder="Pilih atau ketik kategori promo..."
                      styles={customSelectStyles}
                      formatCreateLabel={(inputValue) => `Buat kategori: "${inputValue}"`}
                      noOptionsMessage={() => "Ketik untuk membuat kategori baru"}
                    />
                  )}
                />
                {errors.kat_promo && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                    <span className="text-lg">•</span>
                    {errors.kat_promo.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Opsional. Pilih dari daftar atau buat kategori baru untuk mengelompokkan promo
                </p>
              </div>

              {/* Minimal Pembelian */}
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
                
                {!duplicateCheck.isValid && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-400 flex-shrink-0"
                    >
                      ⚠️ Perhatian
                    </Badge>
                    <p className="text-sm text-yellow-800">
                      Produk <strong>{duplicateCheck.productName}</strong> dengan{" "}
                      <strong>{duplicateCheck.tipeHarga}</strong> sudah
                      memiliki promo dengan minimal qty{" "}
                      <strong>{duplicateCheck.minQty}</strong>. Gunakan minimal qty yang berbeda.
                    </p>
                  </div>
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
              <div className="border-t-2 border-gray-200 my-6"></div>

              {/* Tombol Aksi */}
              <div className="flex flex-col sm:flex-row gap-3">
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
                  className="w-full sm:flex-1 bg-black hover:bg-gray-800 text-white font-semibold h-12 text-base transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}