import { useEffect, useRef } from "react"

const NotaPembelian = ({ transactionData, onClose }) => {
  const hasPrinted = useRef(false)
  useEffect(() => {
    if (hasPrinted.current) return
    
    const timer = setTimeout(() => {
      window.print()
      hasPrinted.current = true
      
      setTimeout(() => {
        onClose()
      }, 300)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

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
        <style jsx>{`
          * {
            font-size: 12px;
            font-family: 'Times New Roman';
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          td, th, tr, table {
            border-top: 1px solid black;
            border-collapse: collapse;
          }

          td.description, th.description {
            width: 70px;
            max-width: 70px;
          }

          td.quantity, th.quantity {
            width: 30px;
            max-width: 30px;
            word-break: break-word;
          }

          td.price, th.price {
            width: 50px;
            max-width: 50px;
            word-break: break-word;
            text-align: right;
          }

          .centered {
            text-align: center;
            align-content: center;
          }

          .ticket {
            width: 160px;
            max-width: 160px;
            margin: auto;
            margin-bottom: 20px;
          }

          /* pastikan hanya struk yang dicetak */
          @media print {
            body * {
              visibility: hidden;
            }
            .ticket, .ticket * {
              visibility: visible;
            }
            .ticket {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }

          @page {
            size: 58mm auto;
            margin: 0;
            padding: 0;
          }
        `}</style>

        <div className="ticket">
          <p className="centered">
            TOKO IFA<br />
            Jl. Perumahan Limas No. 05<br />
            Telp: 085868287956<br />
            {currentDate}<br />
          </p>

          <table>
            <thead>
              <tr>
                <th className="quantity">Jml</th>
                <th className="description">Produk</th>
                <th className="price">Rp</th>
              </tr>
            </thead>
            <tbody>
              {transactionData.items.map((item, index) => (
                <tr key={index}>
                  <td className="quantity">{item.jumlah}</td>
                  <td className="description">{item.nama_barang}</td>
                  <td className="price">
                    {formatCurrency(item.jumlah * item.harga)}
                  </td>
                </tr>
              ))}
              <tr>
                <td></td>
                <td className="description">Subtotal</td>
                <td className="price">
                  Rp {formatCurrency(transactionData.subtotal)}
                </td>
              </tr>
              {transactionData.diskon > 0 && (
                <tr>
                  <td></td>
                  <td className="description">Diskon</td>
                  <td className="price">
                    -Rp {formatCurrency(transactionData.diskon)}
                  </td>
                </tr>
              )}
              <tr>
                <td></td>
                <td className="description"><strong>Total</strong></td>
                <td className="price">
                  <strong>Rp {formatCurrency(transactionData.total)}</strong>
                </td>
              </tr>
              <tr>
                <td></td>
                <td className="description">Jumlah Uang</td>
                <td className="price">
                  Rp {formatCurrency(transactionData.total_uang)}
                </td>
              </tr>
              <tr>
                <td></td>
                <td className="description">Kembalian</td>
                <td className="price">
                  Rp {formatCurrency(transactionData.kembalian)}
                </td>
              </tr>
                <tr>
                <td></td>
                <td className="description">Diskon</td>
                <td className="price">
                  Rp {formatCurrency(transactionData.diskon)}
                </td>
              </tr>
            </tbody>
          </table>

          <p className="centered">
            Terima Kasih<br />Atas Kunjungan Anda
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotaPembelian