import { useEffect, useRef } from "react"

export const buildStrukText = (trx) => {
  const line = "------------------------------"
  const doubleLine = "=============================="
  const rupiah = v => new Intl.NumberFormat("id-ID").format(Number(v) || 0)

  let text = ""
  text += "\n"
  text += "     TOKO IFA\n"
  text += "  Perum Limas Raya No 05\n"
  text += "    085868287956\n"
  text += new Date().toLocaleString("id-ID") + "\n"
  text += line + "\n"

  trx.items.forEach(i => {
    const namaBarang = i.nama_barang.length > 28
      ? i.nama_barang.substring(0, 28) + ".."
      : i.nama_barang
    text += namaBarang + "\n"

    const harga = rupiah(i.harga)
    const qty = "x" + i.jumlah
    const total = rupiah(i.harga * i.jumlah)

    const hargaPadded = harga.padEnd(12, " ")
    const qtyPadded = qty.padEnd(6, " ")
    const totalPadded = total.padStart(12, " ")
    text += `${hargaPadded}${qtyPadded}${totalPadded}\n`
  })

  text += line + "\n"

  if (Number(trx.diskon) > 0) {
    const diskonLabel = "Diskon".padEnd(16, " ")
    const diskonValue = rupiah(trx.diskon).padStart(14, " ")
    text += `${diskonLabel}${diskonValue}\n`
  }

  const totalLabel = "Total".padEnd(16, " ")
  const totalValue = rupiah(trx.total).padStart(14, " ")
  text += `${totalLabel}${totalValue}\n`

  const tunaiLabel = "Tunai".padEnd(16, " ")
  const tunaiValue = rupiah(trx.total_uang).padStart(14, " ")
  text += `${tunaiLabel}${tunaiValue}\n`

  const kembaliLabel = "Kembali".padEnd(16, " ")
  const kembaliValue = rupiah(trx.kembalian).padStart(14, " ")
  text += `${kembaliLabel}${kembaliValue}\n`

  text += line + "\n"
  text += "     Terima Kasih\n"
  text += "  Atas Kunjungan Anda\n"
  text += doubleLine + "\n"
  text += "\n\n\n"

  return text
}

const isAndroid = () => /Android/i.test(navigator.userAgent)
const sendToRawBT = (text) => {
  try {
    const encoded = encodeURIComponent(text)
    const intent = `intent:${encoded}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end`
    window.location.href = intent
  } catch (err) {
    console.error("Gagal membuka RawBT:", err)
  }
}

const printDesktop = (printAreaRef) => {
  if (!printAreaRef?.current) {
    window.print()
    return
  }

  const style = `
    <style>
      @page {
        size: 58mm auto;
        margin: 0;
      }

      html, body {
        margin: 0;
        padding: 0;
        width: 58mm;
        overflow: hidden;
      }

      body {
        font-family: "Courier New", monospace;
        font-size: 10px;
        font-weight: 700;
        color: #000;
      }

      .print-area {
        width: 48mm;
        max-width: 48mm;
        margin: 0 auto;
        overflow: hidden;
      }

      .ticket {
        width: 48mm;
      }

      .center {
        text-align: center;
        margin-bottom: 4px;
      }

      .line {
        border-top: 1px solid #000;
        margin: 4px 0;
      }

      .item {
        margin-bottom: 4px;
      }

      .item-name {
        font-size: 10px;
        line-height: 1.2;
        word-break: break-all;
      }

      .item-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        font-size: 9px;
      }

      .item-table td {
        padding: 0;
        overflow: hidden;
        white-space: nowrap;
      }

      .col-price { width: 40%; text-align: left; }
      .col-qty   { width: 20%; text-align: center; }
      .col-total { width: 40%; text-align: right; }

      .row {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        margin-bottom: 2px;
      }

      .row span {
        max-width: 48%;
        overflow: hidden;
        white-space: nowrap;
      }

      .total {
        font-size: 12px;
      }

      .footer {
        text-align: center;
        margin-top: 6px;
      }

      .small {
        font-size: 9px;
      }
    </style>
  `

  const content = printAreaRef.current.outerHTML

  const iframe = document.createElement("iframe")
  iframe.style.cssText = "position:fixed;top:-9999px;width:0;height:0;border:0;"
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow.document
  doc.open()
  doc.write(`<!DOCTYPE html><html><head>${style}</head><body>${content}</body></html>`)
  doc.close()

  iframe.onload = () => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    setTimeout(() => document.body.removeChild(iframe), 1500)
  }
}

export const handlePrint = (transactionData, printAreaRef) => {
  if (isAndroid()) {
    const text = buildStrukText(transactionData)
    sendToRawBT(text)
  } else {
    printDesktop(printAreaRef)
  }
}
const NotaPembelian = ({ transactionData, onClose }) => {
  const hasPrinted = useRef(false)
  const printAreaRef = useRef(null)

  useEffect(() => {
    if (hasPrinted.current) return

    const timer = setTimeout(() => {
      handlePrint(transactionData, printAreaRef)
      hasPrinted.current = true

      setTimeout(() => {
        if (onClose) onClose()
      }, 500)
    }, 300)

    return () => clearTimeout(timer)
  }, [transactionData, onClose])

  const rupiah = v =>
    new Intl.NumberFormat("id-ID").format(Number(v) || 0)

  const date = new Date().toLocaleString("id-ID")

  return (
    <div className="print-area" ref={printAreaRef}>
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
            overflow: hidden;
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
            width: 45mm;
            margin: 0 auto;
          }
        }

        * {
          box-sizing: border-box;
        }

        .print-area {
          width: 48mm;
          max-width: 48mm;
          margin: 0 auto;
          overflow: hidden;
          font-family: "Courier New", monospace;
          font-size: 10px;
          font-weight: 700;
        }

        .ticket {
          width: 48mm;
        }

        .center {
          text-align: center;
          margin-bottom: 4px;
        }

        .line {
          border-top: 1px solid #000;
          margin: 4px 0;
        }

        .item {
          margin-bottom: 4px;
        }

        .item-name {
          word-break: break-all;
        }

        .item-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          font-size: 9px;
        }

        .item-table td {
          padding: 0;
          white-space: nowrap;
          overflow: hidden;
        }

        .col-price { width: 40%; text-align: left; }
        .col-qty   { width: 20%; text-align: center; }
        .col-total { width: 40%; text-align: right; }

        .row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-bottom: 2px;
        }

        .row span {
          max-width: 48%;
          overflow: hidden;
          white-space: nowrap;
        }

        .total {
          font-size: 12px;
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
            <div className="item-name">{i.nama_barang}</div>

            <table className="item-table">
              <tbody>
                <tr>
                  <td className="col-price">{rupiah(i.harga)}</td>
                  <td className="col-qty">x{i.jumlah}</td>
                  <td className="col-total">
                    {rupiah(i.harga * i.jumlah)}
                  </td>
                </tr>
              </tbody>
            </table>
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