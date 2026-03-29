import { useEffect, useRef } from "react"

const NotaPembelian = ({ transactionData, onClose }) => {
  const hasPrinted = useRef(false)

  useEffect(() => {
    if (hasPrinted.current) return

    const timer = setTimeout(() => {
      window.print()
      hasPrinted.current = true
      setTimeout(() => {
        if (onClose) onClose()
      }, 300)
    }, 300)

    return () => clearTimeout(timer)
  }, [onClose])

  const rupiah = v =>
    new Intl.NumberFormat("id-ID").format(Number(v) || 0)

  const date = new Date().toLocaleString("id-ID")

  return (
    <div className="print-area">
      <style>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0;
          }

          html, body {
            margin: 0;
            padding: 0;
            width: 58mm;
          }

          body * {
            visibility: hidden;
          }

          .print-area,
          .print-area * {
            visibility: visible;
          }

          .print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 48mm;
          }
        }

        * {
          box-sizing: border-box;
        }

        .print-area {
          width: 48mm;
          font-family: "Courier New", Consolas, monospace;
          font-size: 10px;
          font-weight: 700;
          color: #000;
        }

        .ticket {
          width: 100%;
          padding: 2mm 0;
        }

        .center {
          text-align: center;
          margin-bottom: 4px;
        }

        .line {
          border-top: 1px solid #000;
          margin: 5px 0;
        }

        .item {
          margin-bottom: 5px;
        }

        .item-name {
          font-size: 10px;
          line-height: 1.3;
          word-wrap: break-word;
          margin-bottom: 2px;
        }

        .item-info {
          display: flex;
          width: 100%;
          font-size: 9px;
        }

        .info-price {
          width: 40%;
          text-align: left;
        }

        .info-qty {
          width: 20%;
          text-align: center;
        }

        .info-total {
          width: 40%;
          text-align: right;
        }

        .row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-bottom: 3px;
        }

        .total {
          font-size: 12px;
          font-weight: 700;
        }

        .footer {
          text-align: center;
          margin-top: 6px;
        }

        .small {
          font-size: 9px;
        }
      `}</style>

      <div className="ticket">
        <div className="center">
          <div>TOKO IFA</div>
          <div className="small">Perum Limas Raya No 05</div>
          <div className="small">085868287956</div>
          <div className="small">{date}</div>
        </div>

        <div className="line"></div>

        {transactionData?.items?.map((i, idx) => (
          <div key={idx} className="item">
            <div className="item-name">
              {i.nama_barang}
            </div>

            <div className="item-info">
              <div className="info-price">
                {rupiah(i.harga)}
              </div>
              <div className="info-qty">
                x{i.jumlah}
              </div>
              <div className="info-total">
                {rupiah(i.harga * i.jumlah)}
              </div>
            </div>
          </div>
        ))}

        <div className="line"></div>

        {Number(transactionData?.diskon) > 0 && (
          <div className="row">
            <span>Diskon</span>
            <span>{rupiah(transactionData.diskon)}</span>
          </div>
        )}

        <div className="row total">
          <span>Total</span>
          <span>{rupiah(transactionData?.total)}</span>
        </div>

        <div className="row">
          <span>Tunai</span>
          <span>{rupiah(transactionData?.total_uang)}</span>
        </div>

        <div className="row">
          <span>Kembali</span>
          <span>{rupiah(transactionData?.kembalian)}</span>
        </div>

        <div className="line"></div>

        <div className="footer">
          <div>Terima Kasih</div>
          <div className="small">Atas Kunjungan Anda</div>
        </div>
      </div>
    </div>
  )
}

export default NotaPembelian
