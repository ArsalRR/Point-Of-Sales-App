import { useState, useEffect } from 'react'
import { ShoppingCart, Scan, Trash2, Plus, Minus, CreditCard, Search, X, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { postKasir,getTransaksi } from '@/api/Kasirapi'
import { getProfile } from '@/api/Userapi'
import Swal from 'sweetalert2'
const PrintReceipt = ({ transactionData, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print()
      setTimeout(() => {
        onClose()
      }, 1000)
    }, 500)

    return () => clearTimeout(timer)
  }, [onClose])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID').format(amount)
  }

  const currentDate = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto p-4">
        {/* Print styles */}
        <style jsx>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
          @page {
            size: 58mm auto;
            margin: 0;
            padding: 0;
          }
          .receipt-content {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            width: 160px;
            margin: 0 auto;
          }
          .receipt-table {
            width: 100%;
            border-collapse: collapse;
          }
          .receipt-table th,
          .receipt-table td {
            border-top: 1px solid #000;
            padding: 2px;
            font-size: 10px;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
        `}</style>

        <div className="print-area">
          <div className="receipt-content">
            <div className="text-center mb-4">
              <strong>TOKO IFA</strong><br />
              Jl. Perumahan Limas No. 08<br />
              Telp: 085868287956<br />
              {currentDate}<br />
              No Trans: {transactionData.no_transaksi}
            </div>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th style={{width: '20%'}}>Jml</th>
                  <th style={{width: '50%'}}>Produk</th>
                  <th style={{width: '30%'}} className="text-right">Rp</th>
                </tr>
              </thead>
              <tbody>
                {transactionData.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.jumlah}</td>
                    <td>{item.nama_barang}</td>
                    <td className="text-right">{formatCurrency(item.jumlah * item.harga)}</td>
                  </tr>
                ))}
                <tr>
                  <td></td>
                  <td>Subtotal</td>
                  <td className="text-right">Rp {formatCurrency(transactionData.subtotal)}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>Diskon</td>
                  <td className="text-right">Rp {formatCurrency(transactionData.diskon)}</td>
                </tr>
                <tr>
                  <td></td>
                  <td><strong>Total</strong></td>
                  <td className="text-right"><strong>Rp {formatCurrency(transactionData.total)}</strong></td>
                </tr>
                <tr>
                  <td></td>
                  <td>Jumlah Uang</td>
                  <td className="text-right">Rp {formatCurrency(transactionData.total_uang)}</td>
                </tr>
                <tr>
                  <td></td>
                  <td>Kembalian</td>
                  <td className="text-right">Rp {formatCurrency(transactionData.kembalian)}</td>
                </tr>
              </tbody>
            </table>

            <div className="text-center mt-4">
              Terima Kasih<br />
              Atas Kunjungan Anda
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ListKasir() {
  const [transaksi, setTransaksi] = useState([]);
  const [formData, setFormData] = useState({
    produk_id: '',
    jumlah_terjual_per_hari: '',

    diskon: '',
    total_uang: '',
    kembalian: 0
  });
  const [scan, setScan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [cart, setCart] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [user, setUser] = useState(null); 

 useEffect(() => {
    fetchTransaksi();
    fetchUser(); // ambil data user
  }, []);

  const fetchUser = async () => {
    try {
      const res = await getProfile();
      setUser(res.data); 
    } catch (error) {
      console.error("Gagal ambil user:", error);
    }
  };

   const fetchTransaksi = async () => {
    try {
      const res = await getTransaksi();
      setTransaksi(Array.isArray(res.data) ? res.data : []); 
    } catch (error) {}
  };


  const postTransaksi = async (data) => {
    try {
      setIsProcessing(true);
      const res = await postKasir(data);
      const subtotal = cart.reduce((s, i) => s + (i.harga * i.jumlah), 0);
      const diskon = parseFloat(formData.diskon) || 0;
      const total = subtotal - diskon;
      const total_uang = parseFloat(formData.total_uang) || 0;
      const kembalian = total_uang - total;

      const transactionData = {
        no_transaksi: res.no_transaksi,
        items: cart.map(item => ({
          jumlah: item.jumlah,
          nama_barang: item.nama_barang,
          harga: item.harga,
        
        })),
        subtotal: subtotal,
        diskon: diskon,
        total: total,
        total_uang: total_uang,
        kembalian: kembalian
      };

      setPrintData(transactionData);
    
    Swal.fire({
  title: "Berhasil",
  text: "Transaksi Berhasil",
  icon: "success",
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000
});
      setCart([]);
      setFormData({
        produk_id: '',
        jumlah_terjual_per_hari: '',
        diskon: '',
        total_uang: '',
        kembalian: 0
      });
      setShowPrint(true);
      
    } catch (error) {
      console.error('Error posting transaksi:', error);
    Swal.fire({
  title: "Berhasil",
  text: "Sedang Memperosess",
  icon: "success",
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000
});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

   const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      Swal.fire({
        title: "Gagal",
        text: "User belum terdeteksi",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }
    if (cart.length === 0) {
      Swal.fire({
        title: "Gagal",
        text: "Keranjang masih kosong",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000
      }); 
      return;
    }

    const payload = {
      produk_id: cart.map((i) => i.kode_barang),
      jumlah_terjual_per_hari: cart.map((i) => i.jumlah),
      satuan: cart.map((i) => i.satuan),
      users_id: user.id, // otomatis ambil dari user login
      diskon: formData.diskon,
    };
    postTransaksi(payload);
  };

  const lookupProduct = (kode) => {
    if (!Array.isArray(transaksi)) return null;
    const product = transaksi.find(item => item.kode_barang === kode);
    return product || null;
  };

  const searchProducts = (query) => {
    if (!query.trim() || !Array.isArray(transaksi)) return [];
    const lowercaseQuery = query.toLowerCase();
    return transaksi.filter(item => 
      item.nama_barang.toLowerCase().includes(lowercaseQuery) ||
      item.kode_barang.toLowerCase().includes(lowercaseQuery)
    ).slice(0, 5); 
  };

  const addProductToCart = (product) => {
    if (!product) return;

    const exist = cart.find((c) => c.kode_barang === product.kode_barang);
    if (exist) {
      setCart(cart.map((c) => 
        c.kode_barang === product.kode_barang 
          ? { ...c, jumlah: c.jumlah + 1 } 
          : c
      ));
    } else {
      setCart([...cart, { ...product, jumlah: 1, potongan_harga: 0 }]);
    }
    
    Swal.fire({
  title: "Berhasil",
  text: `${product.nama_barang} ditambahkan ke keranjang`,
  icon: "success",
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000
});
  };

  const onAddByScan = () => {
    if (!scan) return;
    const prod = lookupProduct(scan);
    if (!prod) {
      Swal.fire({
  title: "Gagal",
  text: "Kode barang yang Anda masukkan tidak ditemukan",
  icon: "error",
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000
});
      return;
    }

    addProductToCart(prod);
    setScan('');
  };

  const handleScanKeyPress = (e) => {
    if (e.key === 'Enter') {
      onAddByScan();
    }
  };

  const handleSearchSelect = (product) => {
    addProductToCart(product);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const updateQty = (kode, qty) => {
    if (qty <= 0) {
      removeItem(kode);
      return;
    }
    setCart(cart.map((c) => c.kode_barang === kode ? { ...c, jumlah: qty } : c));
  };

const removeItem = (kode) => {
  const item = cart.find(c => c.kode_barang === kode);
  setCart(cart.filter((c) => c.kode_barang !== kode));
};

  const subtotal = (item) => {
    const basePrice = item.harga * item.jumlah;
    const discount = parseFloat(formData.diskon) || 0;
    return Math.max(0, basePrice - (discount / cart.length));
  };
  
  const total = cart.reduce((s, i) => s + subtotal(i), 0);
  const searchResults = searchProducts(searchQuery);

  // Show print component if needed
  if (showPrint && printData) {
    return (
      <PrintReceipt 
        transactionData={printData} 
        onClose={() => {
          setShowPrint(false);
          setPrintData(null);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Point of Sale</CardTitle>
                <p className="text-gray-600 mt-1">Sistem Kasir Terpadu</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scan className="w-5 h-5" />
                  Tambah Produk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Label htmlFor="scan" className="text-sm font-medium text-gray-700 mb-2 block">
                    Scan Barcode
                  </Label>
                  <div className="relative flex gap-3">
                    <Input 
                      id="scan"
                      value={scan} 
                      onChange={(e) => setScan(e.target.value)}
                      onKeyPress={handleScanKeyPress}
                      placeholder="Scan atau ketik kode barang..." 
                      className="flex-1"
                      autoComplete="off"
                    />
                    <Button onClick={onAddByScan} disabled={!scan}>
                      Tambah
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                    Cari Produk
                  </Label>
                  <div className="relative">
                    <Input 
                      id="search"
                      value={searchQuery} 
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchResults(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowSearchResults(searchQuery.length > 0)}
                      onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                      placeholder="Ketik nama produk untuk mencari..." 
                      className="pl-10 pr-10"
                      autoComplete="off"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {showSearchResults && searchResults.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto shadow-lg">
                      <CardContent className="p-0">
                        {searchResults.map((product) => (
                          <button
                            key={product.kode_barang}
                            onClick={() => handleSearchSelect(product)}
                            className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{product.nama_barang}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {product.kode_barang}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    Rp {product.harga.toLocaleString()} / {product.satuan}
                                  </span>
                                </div>
                              </div>
                              <Badge variant={product.stok > 10 ? "default" : "destructive"} className="ml-2">
                                Stok: {product.stok}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {showSearchResults && searchQuery && searchResults.length === 0 && (
                    <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
                      <CardContent className="p-4 text-center text-gray-500">
                        Tidak ada produk yang ditemukan
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="w-5 h-5" />
                  Keranjang Belanja
                  {cart.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {cart.length} item
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Keranjang masih kosong</h3>
                    <p className="text-gray-500">Scan barcode atau cari produk untuk menambah item</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <Card key={item.kode_barang} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{item.nama_barang}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.kode_barang}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  Rp {item.harga.toLocaleString()} / {item.satuan}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => updateQty(item.kode_barang, item.jumlah - 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Input 
                                type="number" 
                                value={item.jumlah} 
                                onChange={(e) => updateQty(item.kode_barang, Math.max(1, Number(e.target.value)))} 
                                className="w-16 text-center h-8 px-2"
                                min="1"
                              />
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => updateQty(item.kode_barang, item.jumlah + 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="text-right min-w-0">
                              <div className="font-bold text-gray-900">
                                Rp {subtotal(item).toLocaleString()}
                              </div>
                            </div>
                            
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.kode_barang)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({cart.length} item)</span>
                    <span className="font-medium">
                      Rp {cart.reduce((s, i) => s + (i.harga * i.jumlah), 0).toLocaleString()}
                    </span>
                  </div>
                  
                  {formData.diskon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon</span>
                      <span className="font-medium text-green-600">
                        -Rp {parseFloat(formData.diskon).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      Rp {total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">        
                  <div>
                    <Label htmlFor="diskon">Potongan Harga</Label>
                    <Input 
                      id="diskon"
                      type="number" 
                      name="diskon" 
                      value={formData.diskon} 
                      onChange={handleChange} 
                      placeholder="Masukkan potongan harga"
                      className="mt-1"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <Label htmlFor="total_uang">Total Uang</Label>
                    <Input 
                      id="total_uang"
                      type="number" 
                      name="total_uang" 
                      value={formData.total_uang} 
                      onChange={(e) => {
                        handleChange(e);
                        const totalUang = parseFloat(e.target.value) || 0;
                        const kembalian = totalUang - total;
                        setFormData(prev => ({
                          ...prev,
                          kembalian: kembalian >= 0 ? kembalian : 0
                        }));
                      }}
                      placeholder="Masukkan total uang"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="kembalian">Kembalian</Label>
                    <Input 
                      id="kembalian"
                      type="number" 
                      name="kembalian" 
                      value={formData.kembalian || 0}
                      placeholder="Kembalian akan dihitung otomatis"
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                </div>

                 <Button 
                onClick={handleSubmit}
                disabled={cart.length === 0 || isProcessing}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
              </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (cart.length === 0) return;
                    
                    if (confirm('Semua item dalam keranjang akan dihapus. Apakah Anda yakin?')) {
                      setCart([]);
                      Swal.fire({
                        title: "Berhasil",
                        text: "Keranjang berhasil dikosongkan",
                        icon: "success",
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000
                      });
                    }
                  }}
                  disabled={cart.length === 0}
                  className="w-full"
                >
                  Kosongkan Keranjang
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setScan('');
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="w-full"
                >
                  Reset Scanner & Pencarian
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}