import React, { useState, useEffect } from 'react'
import { 
  Home, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  ChevronDown,
  Bell,
  User,
  LogOut,
  Shield,
  Calendar,
  UserX,
  Plus,
  ChevronLeft,
  ChevronRight
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
import {  Link } from 'react-router-dom'

export default function ShadcnSidebar({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openMenus, setOpenMenus] = useState({
    teams: false,
    account: false
  })
  
   const handleLogout = async () => {
  try {
    await logout()
    window.location.href = "/"
  } catch (error) {
    console.error("Logout failed:", error)
  }
}

const [user, setUser] = useState(null)

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
    { title: "Dashboard", icon: Home, href: "/dashboard", active: true, badge: null },
    { title: "Data Produk", icon: Package, href: "/produk", active: false, badge: "12" },
    { title: "Kasir", icon: BarChart3, href: "/kasir", active: false, badge: null },
  ]

  const teamItems = [
    { title: "Laporan Harian", icon: Users, href: "/laporanharian" },
    { title: "Laporan Bulanan", icon: UserX, href: "/laporanbulanan" },
    { title: "Calendar", icon: Calendar, href: "/calendar" }
  ]

  const accountItems = [
    { title: "Profile", icon: User, href: "/profile" },
    { title: "Security", icon: Shield, href: "/security" },
    { title: "Settings", icon: Settings, href: "/settings" }
  ]

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">

        <div className={`${isCollapsed ? 'w-16' : 'w-72'} transition-all duration-300 border-r bg-background flex flex-col`}>
          {/* HEADER */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
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
          {/* NAVIGATION */}
          <nav className="flex-1 p-4 space-y-2">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Tooltip key={item.title} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={item.active ? "secondary" : "ghost"}
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
              ))}
            </div>

            {/* Separator */}
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
                        <Users className="h-4 w-4" />
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
                      <p>Teams</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                {!isCollapsed && (
                  <CollapsibleContent className="space-y-1 ml-6 mt-2">
                    {teamItems.map((item) => (
                      <Button
                        key={item.title}
                        variant="ghost"
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

            {/* Account Section */}
            <div className="space-y-1">
              <Collapsible
                open={openMenus.account && !isCollapsed}
                onOpenChange={() => !isCollapsed && toggleMenu('account')}
              >
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-3'} h-10`}
                      >
                        <Settings className="h-4 w-4" />
                        {!isCollapsed && (
                          <>
                            <span className="ml-3">Account</span>
                            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${openMenus.account ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p>Account</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                {!isCollapsed && (
                  <CollapsibleContent className="space-y-1 ml-6 mt-2">
                    {accountItems.map((item) => (
                      <Button
                        key={item.title}
                        variant="ghost"
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

            {/* Quick Actions */}
            {!isCollapsed && (
              <div className="pt-4">
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">
                    Quick Actions
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-3">New Project</span>
                </Button>
              </div>
            )}
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
                        alt="Eric Frusciante" 
                      />
                      <AvatarFallback>EF</AvatarFallback>
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
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" onClick={handleLogout} />
                  <span onClick={handleLogout}>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </TooltipProvider>
  )
}
