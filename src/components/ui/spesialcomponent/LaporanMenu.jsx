import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Album, FileText, Calendar, TrendingUp, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function LaporanMenu() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isActive = (path) => location.pathname.startsWith(path)

  const reports = [
    {
      title: "Laporan Harian",
      description: "Lihat transaksi dan penjualan hari ini",
      icon: FileText,
      path: "/laporanharian",
    },
    {
      title: "Laporan Bulanan",
      description: "Analisis performa penjualan bulanan",
      icon: Calendar,
      path: "/laporanbulanan",
    },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex flex-col items-center transition-all duration-200 ${
          isActive("/laporanharian") || isActive("/laporanbulanan")
            ? "text-black scale-105"
            : "text-gray-500"
        } hover:text-black hover:scale-105`}
      >
        <div
          className={`relative ${
            isActive("/laporanharian") || isActive("/laporanbulanan")
              ? "animate-pulse"
              : ""
          }`}
        >
          <Album className="h-5 w-5 mb-1" />
          {(isActive("/laporanharian") || isActive("/laporanbulanan")) && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-black rounded-full"></span>
          )}
        </div>
        <span className="text-xs font-medium">Laporan</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full p-0 gap-0 overflow-hidden bg-white">
          {/* Header dengan Pattern Hitam */}
          <div className="relative bg-black px-4 py-5 sm:p-6 text-white overflow-hidden">
            {/* Decorative Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-full -translate-y-16 translate-x-16 sm:-translate-y-20 sm:translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full translate-y-12 -translate-x-12 sm:translate-y-16 sm:-translate-x-16"></div>
            </div>

            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold text-white">
                    Laporan Penjualan
                  </DialogTitle>
                  <DialogDescription className="text-gray-300 text-xs sm:text-sm">
                    Pilih jenis laporan yang ingin dilihat
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="px-3 py-4 sm:p-6 space-y-2.5 sm:space-y-3 bg-gray-50">
            {reports.map((report, index) => {
              const Icon = report.icon
              return (
                <Link
                  key={index}
                  to={report.path}
                  onClick={() => setOpen(false)}
                  className="block group"
                >
                  <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-black transition-all duration-300 bg-white hover:shadow-xl">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

                    {/* Content */}
                    <div className="relative p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4">
                      {/* Icon */}
                      <div className="bg-gray-100 text-black p-2 sm:p-3 rounded-xl group-hover:bg-white/10 group-hover:text-white transition-all duration-300 flex-shrink-0 border border-gray-200 group-hover:border-white/20">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 group-hover:text-white transition-colors duration-300 text-sm sm:text-base">
                          {report.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-300 transition-colors duration-300 truncate">
                          {report.description}
                        </p>
                      </div>

                      {/* Arrow */}
                      <div className="bg-gray-100 group-hover:bg-white/10 p-1.5 sm:p-2 rounded-lg transition-all duration-300 flex-shrink-0 border border-gray-200 group-hover:border-white/20">
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>

                    {/* Bottom Line Accent */}
                    <div className="h-1 bg-gray-200 group-hover:bg-white transition-colors duration-300" />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-3 pb-3 sm:px-6 sm:pb-6 bg-gray-50">
            <Button
              variant="outline"
              className="w-full h-9 sm:h-10 text-xs sm:text-sm border-gray-300 hover:bg-black hover:text-white hover:border-black transition-all duration-300"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}