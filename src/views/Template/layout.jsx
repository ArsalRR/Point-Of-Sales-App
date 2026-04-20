import React, { useState, useEffect, useRef } from 'react'
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
  X,
  Menu,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TooltipProvider } from '@/components/ui/tooltip'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [screenType, setScreenType] = useState('desktop')
  const menuRef = useRef(null)

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      if (w < 600) setScreenType('phone')
      else if (w < 1024) setScreenType('tablet')
      else setScreenType('desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileMenuOpen])

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

  const allMenuItems = [...navigationItems, ...teamItems]

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">

        {screenType === 'desktop' && (
          <header className="flex h-16 border-b bg-background items-center justify-between px-6 sticky top-0 z-30 w-full shadow-sm">
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
                  <Button
                    key={item.title}
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
                )
              })}
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
        )}

        {screenType === 'tablet' && (
          <header className="flex h-14 border-b bg-background items-center justify-between px-4 sticky top-0 z-30 w-full shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <Package className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-sm leading-tight">Toko IFA</h1>
                <p className="text-xs text-muted-foreground leading-tight">Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&w=1770&q=80"
                  alt="User"
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </header>
        )}

        {screenType === 'phone' && (
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
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
        )}

        {mobileMenuOpen && screenType === 'tablet' && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
            <div
              ref={menuRef}
              className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-xl px-5 pt-4 pb-8"
            >
              <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
              <div className="flex items-center justify-between mb-5">
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
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {allMenuItems.map((item) => {
                  const active = location.pathname === item.href
                  return (
                    <Link
                      key={item.title}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl transition-colors text-center ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-foreground hover:bg-muted'
                      }`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-xs font-medium leading-tight">{item.title}</span>
                      {item.badge ? (
                        <Badge
                          variant={active ? 'outline' : 'secondary'}
                          className="text-xs px-1.5"
                        >
                          {item.badge}
                        </Badge>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
              <div className="border-t pt-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl px-4 py-3 h-auto"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6 overflow-y-auto w-full">
          {children}
        </main>

        {screenType === 'phone' && (
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
              visible ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="px-4 pb-3 pt-2">
              <BottomNav />
            </div>
          </div>
        )}

      </div>
    </TooltipProvider>
  )
}