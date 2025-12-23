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
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [totalProduk, setTotalProduk] = useState(0)
  const [openMenus, setOpenMenus] = useState({
    teams: false,
    account: false
  })
  const [user, setUser] = useState(null)
  const location = useLocation()
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Handle scroll untuk bottom nav
  useEffect(() => {
    let scrollTimeout

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setVisible(false)
      } 
      else if (currentScrollY < lastScrollY) {
        setVisible(true)
      }
      
      setLastScrollY(currentScrollY)
      clearTimeout(scrollTimeout)

      scrollTimeout = setTimeout(() => {
        setVisible(true)
      }, 200) 
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [lastScrollY])

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
        {/* Desktop Sidebar - Hidden di Tablet */}
        <div 
          className={`
            ${isCollapsed ? 'w-16' : 'w-72'} 
            hidden lg:block
            transition-all duration-300 border-r bg-background flex-col fixed lg:static z-40 h-full
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

        <div className="flex-1 flex flex-col min-h-screen w-full">
          {/* Tablet Navbar - Tampil di md, Hidden di lg */}
          <header className="h-16 md:h-20 border-b bg-background flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 w-full lg:hidden shadow-sm">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Package className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-base md:text-xl">Toko IFA</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Admin Panel</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* Navigation Icons for Tablet */}
              <nav className="hidden md:flex items-center gap-3">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Tooltip key={item.title} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          size="icon"
                          className="h-11 w-11 rounded-xl"
                          asChild
                        >
                          <Link to={item.href}>
                            <item.icon className="h-5 w-5" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-sm font-medium">
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}

                <DropdownMenu>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl">
                          <NotebookText className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-sm font-medium">
                      <p>Laporan</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-base">Laporan Penjualan</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {teamItems.map((item) => (
                      <DropdownMenuItem key={item.title} asChild className="py-2.5">
                        <Link to={item.href} className="flex items-center">
                          <item.icon className="mr-3 h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>

              <div className="h-8 md:h-10 w-px bg-border hidden md:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 md:h-11 md:w-11 rounded-full">
                    <Avatar className="h-7 w-7 md:h-8 md:w-8">
                      <AvatarImage
                        src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&w=1770&q=80"
                        alt="User"
                      />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-base">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="py-2.5">
                    <User className="mr-3 h-4 w-4" />
                    <span className="text-sm">Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2.5">
                    <Settings className="mr-3 h-4 w-4" />
                    <span className="text-sm">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2.5">
                    <Bell className="mr-3 h-4 w-4" />
                    <span className="text-sm">Notifications</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive py-2.5"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="text-sm">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Desktop Header - Hanya tampil di lg */}
          <header className="h-16 border-b bg-background hidden lg:flex items-center justify-end px-6 sticky top-0 z-30 w-full">
            <div className="flex items-center gap-4">  
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
          <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-72 bg-background z-50 md:hidden border-r overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-lg">Toko IFA</h1>
                    <p className="text-xs text-muted-foreground">Admin Panel</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <nav className="flex-1 p-4 space-y-2">
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <Button
                        key={item.title}
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start px-3 h-10"
                        asChild
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span className="ml-3">{item.title}</span>
                          {item.badge && (
                            <Badge 
                              variant={item.badge === "Pro" ? "default" : "secondary"}
                              className="ml-auto text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </Button>
                    )
                  })}
                </div>

                <div className="my-4 h-px bg-border" />
                
                <div className="space-y-1">
                  <Collapsible
                    open={openMenus.teams}
                    onOpenChange={() => toggleMenu('teams')}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-3 h-10"
                      >
                        <NotebookText className="h-4 w-4" />
                        <span className="ml-3">Laporan Penjualan</span>
                        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${openMenus.teams ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-1 ml-6 mt-2">
                      {teamItems.map((item) => (
                        <Button
                          key={item.title}
                          variant={location.pathname === item.href ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start h-8"
                          asChild
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link to={item.href}>
                            <item.icon className="h-3 w-3" />
                            <span className="ml-3 text-sm">{item.title}</span>
                          </Link>
                        </Button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </nav>
            </div>
          </>
        )}

        {/* Bottom Navigation - Mobile Only */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
            visible ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="px-4 pb-3 pt-2">
            <BottomNav />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}