import { Home, Package, ScanLine } from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import LaporanMenu from "./LaporanMenu"

export default function BottomNav() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/produk", icon: Package, label: "Produk" },
    { path: "/kasir", icon: ScanLine, label: "Kasir" }
  ]

  return (
    <>
      <nav className="md:hidden fixed bottom-3 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-full shadow-2xl border border-gray-100 z-50 px-3 py-3">
        <ul className="flex justify-around items-center relative">
          {navItems.map((item, index) => {
            const IconComponent = item.icon
            const active = isActive(item.path)
            
            return (
              <li key={item.path} className="relative">
                <Link
                  to={item.path}
                  className={`relative flex flex-col items-center px-3 py-2 rounded-xl group ${
                    active 
                      ? "text-white bg-black transform scale-105" 
                      : "text-gray-500 hover:text-black hover:scale-105 hover:bg-gray-50"
                  } transition-all duration-200 ease-out`}
                >
                  {/* Icon dengan styling langsung tanpa wrapper */}
                  <IconComponent className="h-5 w-5 mb-1" />
                  
                  {/* Label */}
                  <span className="text-xs font-medium">
                    {item.label}
                  </span>
                  
                  {/* Active indicator dot */}
                  {active && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  )}
                </Link>
              </li>
            )
          })}
          
          {/* Laporan Menu dengan styling yang konsisten */}
          <li className="relative">
            <div className="flex flex-col items-center px-3 py-2 rounded-xl text-gray-500 hover:text-black hover:scale-105 hover:bg-gray-50 transition-all duration-200 ease-out">
              <LaporanMenu />
            </div>
          </li>
        </ul>
        
        {/* Minimalist decorative line */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gray-200 rounded-full"></div>
      </nav>
    </>
  )
}