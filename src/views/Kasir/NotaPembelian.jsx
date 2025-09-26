import { useEffect } from "react"

const NotaPembelian = ({ transactionData, onClose }) => {
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
    return new Intl.NumberFormat("id-ID").format(amount)
  }

  const currentDate = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
            .print-area,
            .print-area * {
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
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
        `}</style>

        <div className="print-area">
          <div className="receipt-content">
            <div className="text-center mb-4">
              <strong>TOKO IFA</strong>
              <br />
              Jl. Perumahan Limas No. 08
              <br />
              Telp: 085868287956
              <br />
              {currentDate}
              <br />
              No Trans: {transactionData.no_transaksi}
            </div>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Jml</th>
                  <th style={{ width: "50%" }}>Produk</th>
                  <th style={{ width: "30%" }} className="text-right">
                    Rp
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactionData.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.jumlah}</td>
                    <td>{item.nama_barang}</td>
                    <td className="text-right">
                      {formatCurrency(item.jumlah * item.harga)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td></td>
                  <td>Subtotal</td>
                  <td className="text-right">
                    Rp {formatCurrency(transactionData.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Diskon</td>
                  <td className="text-right">
                    Rp {formatCurrency(transactionData.diskon)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>
                    <strong>Total</strong>
                  </td>
                  <td className="text-right">
                    <strong>Rp {formatCurrency(transactionData.total)}</strong>
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Jumlah Uang</td>
                  <td className="text-right">
                    Rp {formatCurrency(transactionData.total_uang)}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td>Kembalian</td>
                  <td className="text-right">
                    Rp {formatCurrency(transactionData.kembalian)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="text-center mt-4">
              Terima Kasih
              <br />
              Atas Kunjungan Anda
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotaPembelian
