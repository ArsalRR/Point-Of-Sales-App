import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import AsyncSelect from 'react-select/async'
import Swal from 'sweetalert2'
import { Search, ArrowLeft, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getProduk, updateMassal } from '@/api/Produkapi'
const schema = yup.object({
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

export default function UpdateMassal() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const produkCacheRef = useRef([])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty }
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      produk_id: [],
      harga_baru: 'Rp ',
      tipe_harga: 'harga'
    }
  })

  const watchedFields = watch()
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
  const onSubmit = async (data) => {
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
        text: `${data.tipe_harga === 'harga' ? 'Harga Satuan' : 'Harga Renteng'} berhasil diperbarui`,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <button
  onClick={() => navigate(-1)}
  className="flex items-center gap-2 text-gray-700 hover:text-black mb-4 transition-all duration-200 group block md:hidden"
>
  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
  <span className="font-semibold">Kembali</span>
</button>

        <Card className="shadow-2xl border-2 border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-black to-gray-800 text-white py-6">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Update Harga Keseluruhan
            </CardTitle>
            <p className="text-gray-300 text-sm mt-2">
              Perbarui harga produk secara massal dengan mudah
            </p>
          </CardHeader>
          <CardContent className="pt-8 pb-8 px-6 bg-white">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
              <div className="space-y-3">
                <Label htmlFor="produk_id" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-6 bg-black rounded-full"></span>
                  Pilih Produk
                </Label>
                <Controller
                  name="produk_id"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      {...field}
                      cacheOptions
                      defaultOptions={getDefaultOptions()}
                      loadOptions={loadOptions}
                      isMulti
                      formatOptionLabel={formatOptionLabel}
                      placeholder="Ketik Untuk Mencari Produk"
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
                {errors.produk_id && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1.5 mt-2">
                    <span className="text-base">⚠</span>
                    {errors.produk_id.message}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-2 ml-1">
                  💡 Gunakan <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 rounded">Ctrl</kbd> / <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 rounded">⌘</kbd> untuk memilih lebih dari satu
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Radio Group - Tipe Harga */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-6 bg-black rounded-full"></span>
                  Pilih Tipe Harga
                </Label>
                <Controller
                  name="tipe_harga"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      <div className={`relative flex items-start space-x-3 border-2 rounded-xl p-4 transition-all cursor-pointer ${
                        field.value === 'harga' 
                          ? 'border-black bg-gray-50 shadow-md' 
                          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                      }`}>
                        <RadioGroupItem 
                          value="harga" 
                          id="harga" 
                          className="mt-0.5 border-2 border-gray-400 data-[state=checked]:border-black data-[state=checked]:bg-black" 
                        />
                        <Label htmlFor="harga" className="flex-1 cursor-pointer">
                          <span className="font-semibold text-gray-900 text-base block">Harga Satuan</span>
                          <p className="text-xs text-gray-600 mt-1.5">Update harga pembelian satuan</p>
                        </Label>
                        {field.value === 'harga' && (
                          <Check className="absolute top-3 right-3 w-5 h-5 text-black" />
                        )}
                      </div>
                      
                      <div className={`relative flex items-start space-x-3 border-2 rounded-xl p-4 transition-all cursor-pointer ${
                        field.value === 'harga_renteng' 
                          ? 'border-black bg-gray-50 shadow-md' 
                          : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                      }`}>
                        <RadioGroupItem 
                          value="harga_renteng" 
                          id="harga_renteng" 
                          className="mt-0.5 border-2 border-gray-400 data-[state=checked]:border-black data-[state=checked]:bg-black" 
                        />
                        <Label htmlFor="harga_renteng" className="flex-1 cursor-pointer">
                          <span className="font-semibold text-gray-900 text-base block">Harga Renteng</span>
                          <p className="text-xs text-gray-600 mt-1.5">Update harga pembelian renteng</p>
                        </Label>
                        {field.value === 'harga_renteng' && (
                          <Check className="absolute top-3 right-3 w-5 h-5 text-black" />
                        )}
                      </div>
                    </RadioGroup>
                  )}
                />
                {errors.tipe_harga && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1.5 mt-2">
                    <span className="text-base">⚠</span>
                    {errors.tipe_harga.message}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Input Harga */}
              <div className="space-y-3">
                <Label htmlFor="harga_baru" className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-6 bg-black rounded-full"></span>
                  Harga Baru
                </Label>
                <Controller
                  name="harga_baru"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        id="harga_baru"
                        type="text"
                        placeholder="Contoh: 50000"
                        className="border-2 border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10 h-12 text-base transition-all pr-10"
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                />
                {errors.harga_baru && (
                  <p className="text-sm text-red-600 font-medium flex items-center gap-1.5 mt-2">
                    <span className="text-base">⚠</span>
                    {errors.harga_baru.message}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-2 ml-1">
                  💡 Harga akan otomatis terformat dengan pemisah ribuan
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3 pt-6">
                <Button
                  type="submit"
                  className="w-full bg-black hover:bg-gray-800 text-white font-semibold h-12 text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isValid || !isDirty}
                >
                  {isValid && isDirty ? 'Update Sekarang' : 'Isi Form Terlebih Dahulu'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:border-black hover:bg-gray-50 text-black font-semibold h-12 text-base transition-all duration-200"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
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