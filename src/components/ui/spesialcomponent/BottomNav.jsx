import { Home, Package, ScanLine, Album,} from "lucide-react"
import { useLocation, Link } from "react-router-dom"

export default function BottomNav() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav className="md:hidden fixed bottom-3 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-full shadow-lg z-50 px-4 py-2">
      <ul className="flex justify-between items-center">
        <li>
          <Link
            to="/dashboard"
            className={`flex flex-col items-center ${
              isActive("/dashboard") ? "text-black" : "text-gray-500"
            } hover:text-black`}
          >
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">Home</span>
          </Link>
        </li>
        <li>
          <Link
            to="/produk"
            className={`flex flex-col items-center ${
              isActive("/produk") ? "text-black" : "text-gray-500"
            } hover:text-black`}
          >
            <Package className="h-5 w-5 mb-1" />
            <span className="text-xs">Produk</span>
          </Link>
        </li>
        <li>
          <Link
            to="/kasir"
            className={`flex flex-col items-center ${
              isActive("/kasir") ? "text-black" : "text-gray-500"
            } hover:text-black`}
          >
            <ScanLine className="h-5 w-5 mb-1" />
            <span className="text-xs">Kasir</span>
          </Link>
        </li>
        <li>
          <Link
            to="/laporanharian"
            className={`flex flex-col items-center ${
              isActive("/laporanharian") ? "text-black" : "text-gray-500"
            } hover:text-black`}
          >
            <Album className="h-5 w-5 mb-1" />
            <span className="text-xs">Laporan</span>
          </Link>
        </li>
        <li>
        </li>
      </ul>
    </nav>
  )
}
