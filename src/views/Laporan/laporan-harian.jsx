import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { getlaporanharian } from "@/api/Laporanapi"

export default function LaporanHarian() {
  const [laporan, setLaporan] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

 useEffect(() => {
  const fetchLaporan = async () => {
    try {
      const res = await getlaporanharian()
      if (res.status !== 200) {
        throw new Error("Gagal mengambil laporan harian")
      }
      setLaporan(res.data.laporan || []) 
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  fetchLaporan()
}, [])


  if (loading) return <p className="text-center mt-5">Loading...</p>
  if (error) return <p className="text-center mt-5 text-red-500">{error}</p>

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Harian</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No Transaksi</TableHead>
                <TableHead>Kode Barang</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporan.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.no_transaksi}</TableCell>
                  <TableCell>{item.produk?.kode_barang}</TableCell>
                  <TableCell>{item.produk?.nama_barang}</TableCell>
                  <TableCell>{item.jumlah_terjual_per_hari}</TableCell>
                  <TableCell>
                    Rp {parseInt(item.harga_saat_transaksi).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>{item.satuan_barang}</TableCell>
                  <TableCell>
                    Rp {parseInt(item.total_pendapatan).toLocaleString("id-ID")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
