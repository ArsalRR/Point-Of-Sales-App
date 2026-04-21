import React, { useState, useEffect, useRef } from 'react'
import {
  Home,
  Album,
  BookOpenCheck,
  Package,
  ChevronDown,
  Bell,
  User,
  LogOut,
  ScanLine,
  BadgeDollarSign,
  X,
  Menu,
  Settings,
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

const isAndroid = () => /Android/i.test(navigator.userAgent)

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
      const android = isAndroid()
      if (android) {
        const dpr = window.devicePixelRatio || 1
        const sw = window.screen.width / dpr
        const sh = window.screen.height / dpr
        const inch = Math.sqrt(sw * sw + sh * sh) / 96
        if ((inch >= 10 && inch <= 13) || w >= 768) {
          setScreenType('android-tablet')
        } else {
          setScreenType('phone')
        }
      } else {
        if (w < 600) setScreenType('phone')
        else if (w < 1024) setScreenType('tablet')
        else setScreenType('desktop')
      }
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    let scrollTimeout
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const distanceFromBottom = documentHeight - (currentScrollY + windowHeight)
      const isNearBottom = distanceFromBottom < 50

      if (isNearBottom) {
        setVisible(false)
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
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
      <div className={`flex min-h-screen ${screenType === 'desktop' ? 'flex-row' : 'flex-col'}`}>

        {screenType === 'desktop' && (
          <aside className="w-60 flex-shrink-0 border-r bg-background sticky top-0 h-screen flex flex-col z-30 shadow-sm">
            <div className="flex items-center gap-3 px-5 py-5 border-b">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-base leading-tight">Toko IFA</h1>
                <p className="text-xs text-muted-foreground leading-tight">Admin Panel</p>
              </div>
            </div>

            <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
              {navigationItems.map((item) => {
                const active = location.pathname === item.href
                return (
                  <Button
                    key={item.title}
                    variant={active ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-10 px-3 gap-3 rounded-lg"
                    asChild
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium flex-1 text-left">{item.title}</span>
                      {item.badge ? (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </Link>
                  </Button>
                )
              })}

              <div className="mt-3 mb-1 px-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Laporan
                </p>
              </div>

              {teamItems.map((item) => {
                const active = location.pathname === item.href
                return (
                  <Button
                    key={item.title}
                    variant={active ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-10 px-3 gap-3 rounded-lg"
                    asChild
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </Button>
                )
              })}
            </nav>

            <div className="border-t px-3 py-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&w=1770&q=80"
                        alt="User"
                      />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {user?.nama ?? user?.name ?? 'Admin'}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">Toko IFA</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-52 mb-1">
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
          </aside>
        )}

        {(screenType === 'tablet' || screenType === 'android-tablet') && (
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

        {mobileMenuOpen && (screenType === 'tablet' || screenType === 'android-tablet') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-5">
            <div
              ref={menuRef}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-700"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-zinc-200 dark:border-zinc-700">
                    <AvatarImage
                      src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&w=1770&q=80"
                      alt="User"
                    />
                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                      {user?.nama ?? user?.name ?? 'Admin'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">Toko IFA</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <X className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>

              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3 px-1">
                  Menu
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {allMenuItems.map((item) => {
                    const active = location.pathname === item.href
                    return (
                      <Link
                        key={item.title}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`relative flex flex-col items-center gap-2 px-2 py-4 rounded-xl transition-all text-center group ${
                          active
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-xs font-medium leading-tight">{item.title}</span>
                        {item.badge ? (
                          <span
                            className={`absolute top-2 right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                              active
                                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white'
                                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-3 md:p-6 pb-6 overflow-y-auto w-full">
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