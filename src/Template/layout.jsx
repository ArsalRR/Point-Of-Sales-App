import React, { useState, useEffect } from 'react'
import { 
  Home, 
  Album,
  BookOpenCheck,
  Package, 
  NotebookText,
  Settings,
  ChevronDown,
  Bell,
  User,
  LogOut,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  Menu,
  BadgeDollarSign,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

import { Badge } from '@/components/ui/badge'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { logout, getProfile } from '@/api/Userapi'
import { Link, useLocation } from 'react-router-dom'
import BottomNav from '@/components/ui/spesialcomponent/BottomNav'
import { getDasboard } from '@/api/Dasboardapi'
  

export default function ShadcnSidebar({ children }) {

  const isActive = (path) => location.pathname === path
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [totalProduk, setTotalProduk] = useState(0)
  const [openMenus, setOpenMenus] = useState({
    teams: false,
    account: false
  })
  const [user, setUser] = useState(null)
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const profile = await getProfile()
        const userData = profile.data ? profile.data : profile
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await getDasboard()
        setTotalProduk(data.totalProduk) 
      } catch (error) {
        console.error("Gagal ambil total produk", error)
      }
    }

    fetchCount()
  }, [])
  
  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }))
  }

  const navigationItems = [
    { title: "Dashboard", icon: Home, href: "/dashboard", badge: null },
    { title: "Data Produk", icon: Package, href: "/produk", badge: totalProduk },
    { title: "Kasir", icon: ScanLine, href: "/kasir", badge: null },
    { title: "Potongan Harga", icon: BadgeDollarSign , href: "/hargapromo", badge: null },
  ]

  const teamItems = [
    { title: "Laporan Harian", icon: Album, href: "/laporanharian" },
    { title: "Laporan Bulanan", icon: BookOpenCheck, href: "/laporanbulanan" },
  ]

  return (
    <TooltipProvider>
      <div className="flex min-h-screen relative">
        {/* Sidebar Desktop */}        
        <div 
          className={`
            ${isCollapsed ? 'w-16' : 'w-72'} 
            hidden sm:block
            transition-all duration-300 border-r bg-background flex-col fixed sm:static z-40 h-full
          `}
        >
          <div className="p-4 border-b flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="font-semibold text-lg">Toko IFA</h1>
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Tooltip key={item.title} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-3'} h-10`}
                        asChild
                      >
                        <Link to={item.href}>
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && (
                            <>
                              <span className="ml-3">{item.title}</span>
                              {item.badge && (
                                <Badge 
                                  variant={item.badge === "Pro" ? "default" : "secondary"}
                                  className="ml-auto text-xs"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>

            <div className="my-4 h-px bg-border" />
            
            <div className="space-y-1">
              <Collapsible
                open={openMenus.teams && !isCollapsed}
                onOpenChange={() => !isCollapsed && toggleMenu('teams')}
              >
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-3'} h-10`}
                      >
                        <NotebookText className="h-4 w-4" />
                        {!isCollapsed && (
                          <>
                            <span className="ml-3">Laporan Penjualan</span>
                            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${openMenus.teams ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p>Laporan</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                {!isCollapsed && (
                  <CollapsibleContent className="space-y-1 ml-6 mt-2">
                    {teamItems.map((item) => (
                      <Button
                        key={item.title}
                        variant={location.pathname === item.href ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start h-8"
                        asChild
                      >
                        <Link to={item.href}>
                          <item.icon className="h-3 w-3" />
                          <span className="ml-3 text-sm">{item.title}</span>
                        </Link>
                      </Button>
                    ))}
                  </CollapsibleContent>
                )}
              </Collapsible>
            </div>
          </nav>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen w-full">
          {/* Header */}
          <header className="h-16 border-b bg-background flex items-center justify-end px-6 sticky top-0 z-30 w-full">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  3
                </span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex flex-col items-center ${
                      isActive("/akun") ? "text-black" : "text-gray-500"
                    } hover:text-black`}
                  >
                    <Avatar className="h-6 w-6 mb-1">
                      <AvatarImage
                        src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&w=1770&q=80"
                        alt="User"
                      />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 pb-20 sm:pb-6 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Bottom Navigation - Fixed untuk Mobile */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <div className="pb-safe">
              <BottomNav />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}