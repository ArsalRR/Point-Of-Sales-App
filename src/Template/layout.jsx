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
  Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { logout, getProfile } from '@/api/Userapi'
import { Link, useLocation } from 'react-router-dom'

export default function ShadcnSidebar({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
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
      console.error("Logout failed:", error)
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

  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }))
  }

  const navigationItems = [
    { title: "Dashboard", icon: Home, href: "/dashboard", badge: null },
    { title: "Data Produk", icon: Package, href: "/produk", badge: "12" },
    { title: "Kasir", icon: ScanLine, href: "/kasir", badge: null },
  ]

  const teamItems = [
    { title: "Laporan Harian", icon: Album , href: "/laporanharian" },
    { title: "Laporan Bulanan", icon: BookOpenCheck , href: "/laporanbulanan" },
  ]

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <div 
          className={`
            ${isCollapsed ? 'w-16' : 'w-72'} 
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
            transition-all duration-300 border-r bg-background flex flex-col fixed sm:static z-50 h-full
          `}
        >
          {/* HEADER */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              {!isCollapsed && (
                <div>
                  <h1 className="font-semibold text-lg">Dashboard</h1>
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle collapse (desktop only) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 hidden sm:flex"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              {/* Close button (mobile) */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:hidden"
                onClick={() => setIsMobileOpen(false)}
              >
                ✕
              </Button>
            </div>
          </div>

          {/* NAVIGATION */}
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

            {/* Teams Section */}
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
                        <NotebookText  className="h-4 w-4" />
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

          {/* Footer - User Profile */}
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full ${isCollapsed ? 'px-2' : 'px-3'} h-12 justify-start`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?auto=format&fit=crop&w=1770&q=80" 
                        alt="User" 
                      />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email || 'email@example.com'}</p>
                      </div>
                    )}
                  </div>
                  {!isCollapsed && <ChevronDown className="h-4 w-4 ml-auto" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 sm:ml-0">
          {/* Mobile Toggle */}
          <div className="sm:hidden mb-4">
            <Button variant="outline" size="icon" onClick={() => setIsMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          {children}
        </main>
      </div>
    </TooltipProvider>
  )
}
