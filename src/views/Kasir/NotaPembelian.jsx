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

        /* FONT TETAP, DIPERTEBAL */
        .ticket-wrapper {
          width: 57.5mm;
          background: white;
          font-family: Courier New, monospace;
          font-size: 10px;
          font-weight: 900;
          color: #000;
          -webkit-font-smoothing: none;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeSpeed;
        }

        /* AREA CETAK */
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

        .item-header,
        .item-row {
          display: flex;
          width: 100%;
        }

        .item-header {
          font-size: 9px;
          margin-bottom: 2px;
          font-weight: 900;
          text-shadow: 0.3px 0 #000;
        }

        .item-row {
          font-size: 9px;
          margin-bottom: 2px;
          font-weight: 900;
          text-shadow: 0.3px 0 #000;
        }

        /* PEMBAGIAN KOLOM 48mm */
        .col-name {
          width: 25mm;
          text-align: left;
          word-break: break-word;
          text-shadow: 0.3px 0 #000;
        }

        .col-qty {
          width: 8mm;
          text-align: center;
          text-shadow: 0.3px 0 #000;
        }

        .col-price {
          width: 15mm;
          text-align: right;
          text-shadow: 0.3px 0 #000;
        }

        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
          font-size: 9px;
          font-weight: 900;
          text-shadow: 0.3px 0 #000;
        }

        .total-big {
          font-size: 12px;
          font-weight: 900;
          text-shadow: 0.4px 0 #000;
        }

        .footer {
          text-align: center;
          margin-top: 6px;
        }

        .small {
          font-size: 8px;
          font-weight: 900;
          text-shadow: 0.3px 0 #000;
        }

        .normal {
          font-size: 9px;
          font-weight: 900;
          text-shadow: 0.3px 0 #000;
        }

        .trim-text {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.1;
          max-height: 18px;
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

        <div className="item-header small">
          <div className="col-name">Produk</div>
          <div className="col-qty">Jml</div>
          <div className="col-price">Total</div>
        </div>

        <div className="line"></div>

        {transactionData.items.map((i, idx) => (
          <div key={idx} className="item-row normal">
            <div className="col-name trim-text">
              {i.nama_barang}
            </div>
            <div className="col-qty">
              {i.jumlah}
            </div>
            <div className="col-price">
              {rupiah(i.jumlah * i.harga)}
            </div>
          </div>
        ))}

        <div className="line"></div>

        {transactionData.diskon > 0 && (
          <div className="row normal">
            <span>Diskon</span>
            <span>-{rupiah(transactionData.diskon)}</span>
          </div>
        )}

        <div className="row normal">
          <span>Sub Total</span>
          <span className="total-big">
            {rupiah(transactionData.total)}
          </span>
        </div>

        <div className="row normal">
          <span>Tunai</span>
          <span>{rupiah(transactionData.total_uang)}</span>
        </div>

        <div className="row normal">
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
