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
  BadgeDollarSign,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
  const location = useLocation()
  const [totalProduk, setTotalProduk] = useState(0)
  const [user, setUser] = useState(null)
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Handle scroll untuk bottom nav mobile
  useEffect(() => {
    let scrollTimeout
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setVisible(false)
      } else if (currentScrollY < lastScrollY) {
        setVisible(true)
      }
      setLastScrollY(currentScrollY)
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => setVisible(true), 200)
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
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const profile = await getProfile()
        setUser(profile.data ?? profile)
      } catch (error) {
        console.error('Error fetching user:', error)
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
        console.error('Gagal ambil total produk', error)
      }
    }
    fetchCount()
  }, [])

  const navigationItems = [
    { title: 'Dashboard', icon: Home, href: '/dashboard', badge: null },
    { title: 'Data Produk', icon: Package, href: '/produk', badge: totalProduk },
    { title: 'Kasir', icon: ScanLine, href: '/kasir', badge: null },
    { title: 'Potongan Harga', icon: BadgeDollarSign, href: '/hargapromo', badge: null },
  ]

  const teamItems = [
    { title: 'Laporan Harian', icon: Album, href: '/laporanharian' },
    { title: 'Laporan Bulanan', icon: BookOpenCheck, href: '/laporanbulanan' },
  ]

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <header className="hidden md:flex h-16 border-b bg-background items-center justify-between px-6 sticky top-0 z-30 w-full shadow-sm">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight">Toko IFA</h1>
              <p className="text-xs text-muted-foreground leading-tight">Admin Panel</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navigationItems.map((item) => {
              const active = location.pathname === item.href
              return (
                <Tooltip key={item.title} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={active ? 'secondary' : 'ghost'}
                      className="h-10 px-4 gap-2 rounded-lg"
                      asChild
                    >
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.title}</span>
                        {item.badge ? (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {item.badge}
                          </Badge>
                        ) : null}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                </Tooltip>
              )
            })}

            {/* Laporan dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={
                    teamItems.some((i) => location.pathname === i.href)
                      ? 'secondary'
                      : 'ghost'
                  }
                  className="h-10 px-4 gap-2 rounded-lg"
                >
                  <NotebookText className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Laporan</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel>Laporan Penjualan</DropdownMenuLabel>
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

          {/* User menu — kanan */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="h-8 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&w=1770&q=80"
                      alt="User"
                    />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" /> Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── MOBILE TOP BAR — avatar + logout, hidden di md ke atas ── */}
        <div className="md:hidden flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&w=1770&q=80"
                alt="User"
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold leading-tight">
                {user?.nama ?? user?.name ?? 'Admin'}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">Toko IFA</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg px-3"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Logout</span>
          </Button>
        </div>

        {/* ── MAIN CONTENT ── 
            Desktop/tablet: penuh 100% lebar di bawah navbar
            Mobile: di bawah mobile top bar
        ── */}
        <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6 overflow-y-auto w-full">
          {children}
        </main>

        {/* ── BOTTOM NAV — mobile only ── */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
            visible ? 'translate-y-0' : 'translate-y-full'
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