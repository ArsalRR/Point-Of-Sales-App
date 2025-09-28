import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Album } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function LaporanMenu() {

  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex flex-col items-center ${
          isActive("/laporanharian") || isActive("/laporanbulanan")
            ? "text-black"
            : "text-gray-500"
        } hover:text-black`}
      >
        <Album className="h-5 w-5 mb-1" />
        <span className="text-xs">Laporan</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pilih Jenis Laporan</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <Link to="/laporanharian" onClick={() => setOpen(false)}>
              <Button className="w-full">Laporan Harian</Button>
            </Link>
            <Link to="/laporanbulanan" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full">
                Laporan Bulanan
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
