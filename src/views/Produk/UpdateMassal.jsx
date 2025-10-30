import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import AsyncSelect from 'react-select/async'
import Swal from 'sweetalert2'
import { Search, ArrowLeft, Check, X, Package, Layers, Trash2, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getProduk, updateMassal } from '@/api/Produkapi'

// Schema untuk mode multiple (semua produk harga sama)
const schemaMultiple = yup.object({
  produk_id: yup
    .array()
    .min(1, 'Pilih minimal satu produk')
    .required('Pilih minimal satu produk'),
  tipe_harga: yup
    .string()
    .oneOf(['harga', 'harga_renteng'], 'Pilih tipe harga')
    .required('Pilih tipe harga'),
  harga_baru: yup
    .string()
    .required('Harga baru harus diisi')
    .test('is-valid-price', 'Harga harus lebih dari 0', (value) => {
      if (!value) return false
      const numValue = value.replace(/[^\d]/g, '')
      return numValue !== '' && parseInt(numValue) > 0
    })
}).required()

// Schema untuk mode single (setiap produk punya harga sendiri)
const schemaSingle = yup.object({
  products: yup
    .array()
    .min(1, 'Tambahkan minimal satu produk')
    .of(
      yup.object({
        produk: yup.object().required('Pilih produk'),
        tipe_harga: yup.string().oneOf(['harga', 'harga_renteng']).required(),
        harga_baru: yup
          .string()
          .required('Harga harus diisi')
          .test('is-valid-price', 'Harga harus lebih dari 0', (value) => {
            if (!value) return false
            const numValue = value.replace(/[^\d]/g, '')
            return numValue !== '' && parseInt(numValue) > 0
          })
      })
    )
    .required()
}).required()

export default function UpdateMassal() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [updateMode, setUpdateMode] = useState(null) // 'single' or 'multiple'
  const produkCacheRef = useRef([])

  // Form untuk mode multiple
  const formMultiple = useForm({
    resolver: yupResolver(schemaMultiple),
    mode: 'onChange',
    defaultValues: {
      produk_id: [],
      harga_baru: 'Rp ',
      tipe_harga: 'harga'
    }
  })

  // Form untuk mode single
  const formSingle = useForm({
    resolver: yupResolver(schemaSingle),
    mode: 'onChange',
    defaultValues: {
      products: [
        {
          produk: null,
          tipe_harga: 'harga',
          harga_baru: 'Rp '
        }
      ]
    }
  })

  const currentForm = updateMode === 'single' ? formSingle : formMultiple

  useEffect(() => {
    const fetchProduk = async () => {
      setIsLoading(true)
      try {
        const res = await getProduk()
        const dataArray = Array.isArray(res) ? res : res.data || []
        produkCacheRef.current = dataArray
      } catch (error) {
        console.error('Error loading produk:', error)
        Swal.fire({
          icon: 'error',
          title: 'Gagal Memuat Data',
          text: 'Tidak dapat memuat daftar produk',
          confirmButtonColor: '#000'
        })
        produkCacheRef.current = []
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduk()
  }, [])

  const loadOptions = (inputValue, callback) => {
    if (inputValue.length < 2) {
      callback([])
      return
    }

    const filteredOptions = produkCacheRef.current
      .filter((p) => {
        const namaBarang = p.nama_barang || p.name || ''
        return namaBarang.toLowerCase().includes(inputValue.toLowerCase())
      })
      .map((p) => ({
        value: p.id,
        label: p.nama_barang || p.name,
        harga: p.harga || 0,
        harga_renteng: p.harga_renteng || 0
      }))

    callback(filteredOptions)
  }

  const formatOptionLabel = ({ label, harga, harga_renteng }) => (
    <div className="py-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </div>
      <div className="flex gap-4 text-xs text-gray-600 mt-1">
        <span>Satuan: Rp{harga?.toLocaleString('id-ID') || '0'}</span>
        <span>Renteng: Rp{harga_renteng?.toLocaleString('id-ID') || '0'}</span>
      </div>
    </div>
  )

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#000' : '#d1d5db',
      '&:hover': { borderColor: '#000' },
      boxShadow: state.isFocused ? '0 0 0 2px rgba(0, 0, 0, 0.1)' : 'none',
      minHeight: '44px',
      backgroundColor: '#fff',
      transition: 'all 0.2s'
    }),
    menu: (base) => ({
      ...base,
      zIndex: 50,
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? '#f3f4f6' 
        : state.isFocused 
        ? '#f9fafb' 
        : '#fff',
      color: '#000',
      cursor: 'pointer',
      padding: '10px 12px',
      transition: 'all 0.15s',
      borderLeft: state.isSelected ? '3px solid #000' : '3px solid transparent',
      fontWeight: state.isSelected ? '600' : '400',
      '&:active': {
        backgroundColor: '#f3f4f6'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#f3f4f6',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '2px'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#000',
      paddingLeft: '8px',
      paddingRight: '4px',
      fontSize: '13px',
      fontWeight: '500'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#6b7280',
      cursor: 'pointer',
      borderRadius: '0 4px 4px 0',
      transition: 'all 0.15s',
      '&:hover': {
        backgroundColor: '#000',
        color: '#fff'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
      fontSize: '14px'
    }),
    input: (base) => ({
      ...base,
      color: '#000'
    })
  }

  const formatCurrency = (value) => {
    const rawValue = value.replace(/[^\d]/g, '')
    return rawValue ? 'Rp ' + Number(rawValue).toLocaleString('id-ID') : 'Rp '
  }

  // Submit untuk mode multiple
  const onSubmitMultiple = async (data) => {
    const hargaBersih = data.harga_baru.replace(/[^\d]/g, '')

    try {
      const payload = {
        produk_ids: data.produk_id.map(p => p.value),
        [data.tipe_harga]: hargaBersih
      }
      
      await updateMassal(payload)
      
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `${data.tipe_harga === 'harga' ? 'Harga Satuan' : 'Harga Renteng'} berhasil diperbarui untuk ${data.produk_id.length} produk`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      })
      
      navigate('/produk')
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data',
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      })
    }
  }

  // Submit untuk mode single (satu-satu)
  const onSubmitSingle = async (data) => {
    try {
      // Kirim satu per satu
      for (const product of data.products) {
        const hargaBersih = product.harga_baru.replace(/[^\d]/g, '')
        const payload = {
          produk_ids: [product.produk.value],
          [product.tipe_harga]: hargaBersih
        }
        await updateMassal(payload)
      }
      
      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `Berhasil update ${data.products.length} produk dengan harga berbeda`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      })
      
      navigate('/produk')
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data',
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      })
    }
  }

  const getDefaultOptions = () => {
    return produkCacheRef.current.slice(0, 20).map(p => ({
      value: p.id,
      label: p.nama_barang || p.name,
      harga: p.harga || 0,
      harga_renteng: p.harga_renteng || 0
    }))
  }

  // Fungsi untuk mode single
  const addProductField = () => {
    const currentProducts = formSingle.watch('products')
    formSingle.setValue('products', [
      ...currentProducts,
      {
        produk: null,
        tipe_harga: 'harga',
        harga_baru: 'Rp '
      }
    ])
  }

  const removeProductField = (index) => {
    const currentProducts = formSingle.watch('products')
    if (currentProducts.length > 1) {
      formSingle.setValue('products', currentProducts.filter((_, i) => i !== index))
    }
  }

  // Mode Selection Screen
  if (updateMode === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-3 sm:px-4">
        <div className="container mx-auto max-w-4xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-black mb-4 sm:mb-6 transition-all duration-200 group md:hidden"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Kembali</span>
          </button>

          <Card className="shadow-2xl border-2 border-gray-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-black to-gray-800 text-white py-5 sm:py-8">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-center">
                Pilih Mode Update Harga
              </CardTitle>
              <p className="text-gray-300 text-xs sm:text-sm mt-2 sm:mt-3 text-center">
                Pilih cara update yang sesuai dengan kebutuhan Anda
              </p>
            </CardHeader>
            <CardContent className="pt-6 sm:pt-10 pb-6 sm:pb-10 px-4 sm:px-8 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Single Update Mode - Harga berbeda per produk */}
                <button
                  onClick={() => setUpdateMode('single')}
                  className="group relative bg-white border-2 border-gray-300 hover:border-black rounded-xl sm:rounded-2xl p-5 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 text-left"
                >
                  <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 group-hover:bg-black rounded-full flex items-center justify-center transition-all duration-300">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  
                  <div className="mb-4 sm:mb-6 pr-12 sm:pr-0">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                      Update Satu-Satu
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                      Pilih beberapa produk dengan harga berbeda-beda untuk setiap produknya.
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                      <span>Harga berbeda per produk</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                      <span>Tambah produk dinamis</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                      <span>Lebih fleksibel</span>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Mode Individual
                      </span>
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-black rotate-180 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </button>

                {/* Multiple Update Mode - Harga sama semua */}
                <button
                  onClick={() => setUpdateMode('multiple')}
                  className="group relative bg-white border-2 border-gray-300 hover:border-black rounded-xl sm:rounded-2xl p-5 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 text-left"
                >
                  <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 group-hover:bg-black rounded-full flex items-center justify-center transition-all duration-300">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  
                  <div className="mb-4 sm:mb-6 pr-12 sm:pr-0">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                      Update Massal
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                      Pilih beberapa produk dan update dengan harga yang sama untuk semua produk.
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                      <span>Harga sama semua produk</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                      <span>Update sekaligus</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                      <span>Lebih cepat</span>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Mode Bulk
                      </span>
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-black rotate-180 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Form untuk Mode Single (Satu-satu dengan harga berbeda)
  if (updateMode === 'single') {
    const products = formSingle.watch('products')
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-3 sm:px-4">
        <div className="container mx-auto max-w-3xl">
          <button
            onClick={() => setUpdateMode(null)}
            className="flex items-center gap-2 text-gray-700 hover:text-black mb-3 sm:mb-4 transition-all duration-200 group md:hidden"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-sm sm:text-base">Kembali ke Pilihan Mode</span>
          </button>

          <Card className="shadow-2xl border-2 border-gray-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-black to-gray-800 text-white py-4 sm:py-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
                    Update Harga Satu-Satu
                  </CardTitle>
                  <p className="text-gray-300 text-xs sm:text-sm mt-1 sm:mt-2">
                    Setiap produk dapat memiliki harga berbeda
                  </p>
                </div>
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 flex-shrink-0 ml-2" />
              </div>
            </CardHeader>
            <CardContent className="pt-5 sm:pt-8 pb-5 sm:pb-8 px-3 sm:px-6 bg-white">
              <form onSubmit={formSingle.handleSubmit(onSubmitSingle)} className="space-y-4 sm:space-y-6">
                {products.map((product, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-5 bg-gray-50 relative">
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProductField(index)}
                        className="absolute top-2 sm:top-4 right-2 sm:right-4 text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 sm:p-2 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}
                    
                    <div className="mb-3 sm:mb-4">
                      <Label className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 block">
                        Produk #{index + 1}
                      </Label>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {/* Pilih Produk */}
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                          Nama Produk
                        </Label>
                        <Controller
                          name={`products.${index}.produk`}
                          control={formSingle.control}
                          render={({ field }) => (
                            <AsyncSelect
                              {...field}
                              cacheOptions
                              defaultOptions={getDefaultOptions()}
                              loadOptions={loadOptions}
                              formatOptionLabel={formatOptionLabel}
                              placeholder="Ketik untuk mencari..."
                              styles={customSelectStyles}
                              noOptionsMessage={({ inputValue }) => {
                                if (isLoading) return 'Memuat...'
                                if (!inputValue || inputValue.length < 2) 
                                  return 'Ketik minimal 2 huruf'
                                return `Tidak ditemukan "${inputValue}"`
                              }}
                              components={{
                                DropdownIndicator: () => (
                                  <div className="px-3">
                                    <Search className="w-4 h-4 text-gray-500" />
                                  </div>
                                )
                              }}
                            />
                          )}
                        />
                        {formSingle.formState.errors.products?.[index]?.produk && (
                          <p className="text-xs sm:text-sm text-red-600 mt-1">
                            {formSingle.formState.errors.products[index].produk.message}
                          </p>
                        )}
                      </div>

                      {/* Tipe Harga */}
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                          Tipe Harga
                        </Label>
                        <Controller
                          name={`products.${index}.tipe_harga`}
                          control={formSingle.control}
                          render={({ field }) => (
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="grid grid-cols-2 gap-2 sm:gap-3"
                            >
                              <div className={`flex items-center space-x-2 border-2 rounded-lg p-2 sm:p-3 cursor-pointer transition-all ${
                                field.value === 'harga' 
                                  ? 'border-black bg-white' 
                                  : 'border-gray-300 bg-white hover:border-gray-400'
                              }`}>
                                <RadioGroupItem value="harga" id={`harga-${index}`} className="flex-shrink-0" />
                                <Label htmlFor={`harga-${index}`} className="cursor-pointer text-xs sm:text-sm font-medium">
                                  Satuan
                                </Label>
                              </div>
                              <div className={`flex items-center space-x-2 border-2 rounded-lg p-2 sm:p-3 cursor-pointer transition-all ${
                                field.value === 'harga_renteng' 
                                  ? 'border-black bg-white' 
                                  : 'border-gray-300 bg-white hover:border-gray-400'
                              }`}>
                                <RadioGroupItem value="harga_renteng" id={`harga_renteng-${index}`} className="flex-shrink-0" />
                                <Label htmlFor={`harga_renteng-${index}`} className="cursor-pointer text-xs sm:text-sm font-medium">
                                  Renteng
                                </Label>
                              </div>
                            </RadioGroup>
                          )}
                        />
                      </div>

                      {/* Input Harga */}
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                          Harga Baru
                        </Label>
                        <Controller
                          name={`products.${index}.harga_baru`}
                          control={formSingle.control}
                          render={({ field }) => (
                            <div className="relative">
                              <Input
                                {...field}
                                type="text"
                                placeholder="Contoh: 50000"
                                className="border-2 border-gray-300 focus:border-black h-10 sm:h-11 text-sm sm:text-base"
                                onChange={(e) => {
                                  const formatted = formatCurrency(e.target.value)
                                  field.onChange(formatted)
                                }}
                                onKeyPress={(e) => {
                                  if (!/[0-9]/.test(e.key)) {
                                    e.preventDefault()
                                  }
                                }}
                              />
                              {field.value && field.value !== 'Rp ' && (
                                <button
                                  type="button"
                                  onClick={() => field.onChange('Rp ')}
                                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        />
                        {formSingle.formState.errors.products?.[index]?.harga_baru && (
                          <p className="text-xs sm:text-sm text-red-600 mt-1">
                            {formSingle.formState.errors.products[index].harga_baru.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Tombol Tambah Produk */}
                <Button
                  type="button"
                  onClick={addProductField}
                  variant="outline"
                  className="w-full border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-black font-semibold h-10 sm:h-12 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Produk Lagi
                </Button>

                {/* Submit Buttons */}
                <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-10 sm:h-12 text-sm sm:text-base"
                    disabled={!formSingle.formState.isValid}
                  >
                    Update {products.length} Produk
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-gray-300 hover:border-black h-10 sm:h-12 text-sm sm:text-base"
                    onClick={() => setUpdateMode(null)}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                    Kembali
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Form untuk Mode Multiple (Harga sama semua produk)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-3 sm:px-4">
      <div className="container mx-auto max-w-2xl">
        <button
          onClick={() => setUpdateMode(null)}
          className="flex items-center gap-2 text-gray-700 hover:text-black mb-3 sm:mb-4 transition-all duration-200 group md:hidden"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold text-sm sm:text-base">Kembali ke Pilihan Mode</span>
        </button>

        <Card className="shadow-2xl border-2 border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-black to-gray-800 text-white py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
                  Update Harga Massal
                </CardTitle>
                <p className="text-gray-300 text-xs sm:text-sm mt-1 sm:mt-2">
                  Semua produk akan mendapat harga yang sama
                </p>
              </div>
              <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 flex-shrink-0 ml-2" />
            </div>
          </CardHeader>
          <CardContent className="pt-5 sm:pt-8 pb-5 sm:pb-8 px-3 sm:px-6 bg-white">
            <form onSubmit={formMultiple.handleSubmit(onSubmitMultiple)} className="space-y-5 sm:space-y-7">
              {/* Pilih Produk */}
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="produk_id" className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-0.5 sm:w-1 h-5 sm:h-6 bg-black rounded-full"></span>
                  Pilih Produk
                </Label>
                <Controller
                  name="produk_id"
                  control={formMultiple.control}
                  render={({ field }) => (
                    <AsyncSelect
                      {...field}
                      cacheOptions
                      defaultOptions={getDefaultOptions()}
                      loadOptions={loadOptions}
                      isMulti
                      formatOptionLabel={formatOptionLabel}
                      placeholder="Ketik untuk mencari produk..."
                      styles={customSelectStyles}
                      noOptionsMessage={({ inputValue }) => {
                        if (isLoading) return 'Memuat daftar produk...'
                        if (produkCacheRef.current.length === 0) 
                          return 'Tidak ada produk tersedia'
                        if (!inputValue || inputValue.length < 2) 
                          return 'Ketik minimal 2 huruf untuk mencari'
                        return `Tidak ditemukan "${inputValue}"`
                      }}
                      loadingMessage={() => 'Mencari produk...'}
                      components={{
                        DropdownIndicator: () => (
                          <div className="px-3">
                            <Search className="w-4 h-4 text-gray-500" />
                          </div>
                        )
                      }}
                    />
                  )}
                />
                {formMultiple.formState.errors.produk_id && (
                  <p className="text-xs sm:text-sm text-red-600 font-medium flex items-center gap-1.5 mt-2">
                    <span className="text-sm sm:text-base">⚠</span>
                    {formMultiple.formState.errors.produk_id.message}
                  </p>
                )}
                <p className="text-[10px] sm:text-xs text-gray-600 mt-2 ml-1">
                  💡 Gunakan <kbd className="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs bg-gray-200 rounded">Ctrl</kbd> / <kbd className="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs bg-gray-200 rounded">⌘</kbd> untuk memilih lebih dari satu
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Radio Group - Tipe Harga */}
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-0.5 sm:w-1 h-5 sm:h-6 bg-black rounded-full"></span>
                  Pilih Tipe Harga
                </Label>
                <Controller
                  name="tipe_harga"
                  control={formMultiple.control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
                    >
                      <div className={`relative flex items-start space-x-2 sm:space-x-3 border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all cursor-pointer ${
                        field.value === 'harga' 
                          ? 'border-black bg-gray-50 shadow-md' 
                          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                      }`}>
                        <RadioGroupItem 
                          value="harga" 
                          id="harga" 
                          className="mt-0.5 border-2 border-gray-400 data-[state=checked]:border-black data-[state=checked]:bg-black flex-shrink-0" 
                        />
                        <Label htmlFor="harga" className="flex-1 cursor-pointer">
                          <span className="font-semibold text-gray-900 text-sm sm:text-base block">Harga Satuan</span>
                          <p className="text-[10px] sm:text-xs text-gray-600 mt-1 sm:mt-1.5">Update harga pembelian satuan</p>
                        </Label>
                        {field.value === 'harga' && (
                          <Check className="absolute top-2 sm:top-3 right-2 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 text-black" />
                        )}
                      </div>
                      
                      <div className={`relative flex items-start space-x-2 sm:space-x-3 border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all cursor-pointer ${
                        field.value === 'harga_renteng' 
                          ? 'border-black bg-gray-50 shadow-md' 
                          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                      }`}>
                        <RadioGroupItem 
                          value="harga_renteng" 
                          id="harga_renteng" 
                          className="mt-0.5 border-2 border-gray-400 data-[state=checked]:border-black data-[state=checked]:bg-black flex-shrink-0" 
                        />
                        <Label htmlFor="harga_renteng" className="flex-1 cursor-pointer">
                          <span className="font-semibold text-gray-900 text-sm sm:text-base block">Harga Renteng</span>
                          <p className="text-[10px] sm:text-xs text-gray-600 mt-1 sm:mt-1.5">Update harga pembelian renteng</p>
                        </Label>
                        {field.value === 'harga_renteng' && (
                          <Check className="absolute top-2 sm:top-3 right-2 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 text-black" />
                        )}
                      </div>
                    </RadioGroup>
                  )}
                />
                {formMultiple.formState.errors.tipe_harga && (
                  <p className="text-xs sm:text-sm text-red-600 font-medium flex items-center gap-1.5 mt-2">
                    <span className="text-sm sm:text-base">⚠</span>
                    {formMultiple.formState.errors.tipe_harga.message}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Input Harga */}
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="harga_baru" className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-0.5 sm:w-1 h-5 sm:h-6 bg-black rounded-full"></span>
                  Harga Baru (Sama untuk Semua)
                </Label>
                <Controller
                  name="harga_baru"
                  control={formMultiple.control}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        id="harga_baru"
                        type="text"
                        placeholder="Contoh: 50000"
                        className="border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10 h-10 sm:h-12 text-sm sm:text-base transition-all pr-9 sm:pr-10"
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value)
                          field.onChange(formatted)
                        }}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault()
                          }
                        }}
                        autoComplete="off"
                      />
                      {field.value && field.value !== 'Rp ' && (
                        <button
                          type="button"
                          onClick={() => field.onChange('Rp ')}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  )}
                />
                {formMultiple.formState.errors.harga_baru && (
                  <p className="text-xs sm:text-sm text-red-600 font-medium flex items-center gap-1.5 mt-2">
                    <span className="text-sm sm:text-base">⚠</span>
                    {formMultiple.formState.errors.harga_baru.message}
                  </p>
                )}
                <p className="text-[10px] sm:text-xs text-gray-600 mt-2 ml-1">
                  💡 Harga akan otomatis terformat dengan pemisah ribuan
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6">
                <Button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-10 sm:h-12 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!formMultiple.formState.isValid || !formMultiple.formState.isDirty}
                >
                  {formMultiple.formState.isValid && formMultiple.formState.isDirty ? 'Update Sekarang' : 'Isi Form Terlebih Dahulu'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:border-black hover:bg-gray-50 text-black font-semibold h-10 sm:h-12 text-sm sm:text-base transition-all duration-200"
                  onClick={() => setUpdateMode(null)}
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  Kembali
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}