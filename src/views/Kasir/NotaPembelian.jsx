import { useEffect, useRef } from "react"

const NotaPembelian = ({ transactionData, onClose }) => {
  const hasPrinted = useRef(false)

  useEffect(() => {
    if (hasPrinted.current) return

    const timer = setTimeout(() => {
      window.print()
      hasPrinted.current = true
      setTimeout(onClose, 300)
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  const rupiah = v =>
    new Intl.NumberFormat("id-ID").format(v)

  const date = new Date().toLocaleString("id-ID")

  return (
    <div className="ticket-wrapper">
      <style>{`
        @media print {
          @page {
            size: 57.5mm auto;
            margin: 0;
          }

          body, html {
            margin: 0;
            padding: 0;
            width: 57.5mm;
          }

          body * {
            visibility: hidden;
          }

          .ticket-wrapper,
          .ticket-wrapper * {
            visibility: visible;
          }

          .ticket-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 57.5mm;
            background: white;
          }
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background: white;
        }

        .ticket-wrapper {
          width: 57.5mm;
          font-family: Courier New, monospace;
          font-size: 10px;
          font-weight: 1000;
          color: #000;
        }

        .ticket {
          width: 48mm;
          margin: 0 auto;
          padding: 2mm 0;
        }

        .center {
          text-align: center;
          margin-bottom: 4px;
          font-weight: 1000;
        }

        .line {
          border-top: 1px solid #000;
          margin: 3px 0;
        }

        .item {
          margin-bottom: 4px;
        }

        .item-name {
          width: 100%;
          font-size: 9px;
          line-height: 1.15;
          word-break: break-word;
          margin-bottom: 1px;
          font-weight: 1000;
        }

        .item-info {
          display: flex;
          width: 100%;
          font-size: 8px;
          line-height: 1.1;
          font-weight: 1000;
        }

        .info-price {
          width: 40%;
          text-align: left;
          white-space: nowrap;
          font-weight: 1000;
        }

        .info-qty {
          width: 20%;
          text-align: center;
          white-space: nowrap;
          font-weight: 1000;
        }

        .info-total {
          width: 40%;
          text-align: right;
          white-space: nowrap;
          font-weight: 1000;
        }

        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          font-size: 9px;
          font-weight: 1000;
        }

        .total-big {
          font-size: 12px;
          font-weight: 1000;
        }

        .footer {
          text-align: center;
          margin-top: 6px;
          font-weight: 1000;
        }

        .small {
          font-size: 8px;
          font-weight: 1000;
        }

        .normal {
          font-size: 9px;
          font-weight: 1000;
        }
      `}</style>

      <div className="ticket">
        <div className="center">
          <div className="normal">TOKO IFA</div>
          <div className="small">Perumahan Limas Jln Limas Raya No 05</div>
          <div className="small">085868287956</div>
          <div className="small">{date}</div>
        </div>

        <div className="line"></div>

        {transactionData.items.map((i, idx) => (
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

        {transactionData.diskon > 0 && (
          <div className="row">
            <span>Diskon</span>
            <span>Rp{rupiah(transactionData.diskon)}</span>
          </div>
        )}

        <div className="row">
          <span>Sub Total</span>
          <span className="total-big">{rupiah(transactionData.total)}</span>
        </div>

        <div className="row">
          <span>Tunai</span>
          <span>{rupiah(transactionData.total_uang)}</span>
        </div>

        <div className="row">
          <span>Kembali</span>
          <span>{rupiah(transactionData.kembalian)}</span>
        </div>

        <div className="line"></div>

        <div className="footer">
          <div className="normal">Terima Kasih</div>
          <div className="small">Atas Kunjungan Anda</div>
        </div>
      </div>
    </div>
  )
}

export default NotaPembelian
