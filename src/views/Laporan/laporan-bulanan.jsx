import { useEffect, useState } from "react"
import { getlaporanbulanan } from "@/api/Laporanapi"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function LaporanBulanan() {
  const [laporanBulanan, setLaporanBulanan] = useState(null)
  const [bulan, setBulan] = useState("09")
  const [tahun, setTahun] = useState("2025")

  const GetLaporanBulanan = async () => {
    try {
      const data = await getlaporanbulanan()
      setLaporanBulanan(data)
    } catch (error) {
    }
  }

  useEffect(() => {
    GetLaporanBulanan()
  }, [bulan, tahun])

  if (!laporanBulanan) return <p className="p-4">Loading...</p>

  const bulanList = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ]

  const tahunList = ["2023", "2024", "2025"]

  return (
    <div className="space-y-6 p-4">
      {/* Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold">Laporan Bulanan</h2>
        <div className="flex gap-2">
          <select
            className="border rounded-md p-2"
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
          >
            {bulanList.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
          <select
            className="border rounded-md p-2"
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
          >
            {tahunList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ringkasan Bulanan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Total Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              Rp {laporanBulanan?.totalKeseluruhan?.pembelian?.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Jumlah Terjual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {laporanBulanan?.totalKeseluruhan?.jumlah_terjual}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Keuntungan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              Rp {laporanBulanan?.totalKeseluruhan?.keuntungan?.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Detail Produk */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Detail Penjualan Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Jumlah Terjual</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laporanBulanan.laporanBulanan.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.waktu_pembelian.split(" ")[0]}</TableCell>
                  <TableCell>{item.produk?.nama_barang}</TableCell>
                  <TableCell>{item.total_jumlah_terjual}</TableCell>
                  <TableCell>
                    Rp {Number(item.total_pembelian).toLocaleString()}
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
