import { useEffect } from "react"
import Swal from "sweetalert2"
import useNetworkStatus from "@/hooks/useNetworkStatus"

export default function NetworkNotifier() {
  const isOnline = useNetworkStatus()

  useEffect(() => {
    if (!isOnline) {
      Swal.fire({
        icon: "error",
        title: "Koneksi Terputus",
        text: "Periksa koneksi internet Anda",
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        backdrop: true,
        didOpen: () => {
          Swal.showLoading()
        },
      })
    } else {
      Swal.close()
    }
  }, [isOnline])

  return null
}