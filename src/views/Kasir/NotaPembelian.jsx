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

  const rupiah = (v) =>
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
            margin: 0 !important;
            padding: 0 !important;
            width: 57.5mm !important;
          }

          body * {
            visibility: hidden;
          }

          .ticket-wrapper,
          .ticket-wrapper * {
            visibility: visible !important;
          }

          .ticket-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 57.5mm !important;
            background: white !important;
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
          font-weight: 900;
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
        }

        .line {
          border-top: 1px solid #000;
          margin: 3px 0;
        }

        .item {
          margin-bottom: 3px;
        }

        .item-name {
          font-size: 9px;
          line-height: 1.15;
          word-break: break-word;
        }

        .item-detail {
          display: flex;
          font-size: 8px;
          line-height: 1.1;
        }

        .detail-price {
          width: 40%;
          text-align: left;
        }

        .detail-qty {
          width: 20%;
          text-align: center;
        }

        .detail-total {
          width: 40%;
          text-align: right;
        }

        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          font-size: 9px;
          font-weight: 900;
        }

        .total-big {
          font-size: 12px;
          font-weight: 900;
        }

        .footer {
          text-align: center;
          margin-top: 6px;
        }

        .small {
          font-size: 8px;
          font-weight: 900;
        }

        .normal {
          font-size: 9px;
          font-weight: 900;
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
            <div className="item-detail">
              <div className="detail-price">
                {rupiah(i.harga)}
              </div>
              <div className="detail-qty">
                {i.jumlah}
              </div>
              <div className="detail-total">
                {rupiah(i.harga * i.jumlah)}
              </div>
            </div>
          </div>
        ))}

        <div className="line"></div>

        {transactionData.diskon > 0 && (
          <div className="row">
            <span>Diskon</span>
            <span>-{rupiah(transactionData.diskon)}</span>
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
