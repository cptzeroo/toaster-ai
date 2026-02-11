import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  ChevronRight,
  Home,
  Settings,
  Users,
  LogOut,
  Moon,
  Sun,
} from "lucide-react"

import { useAuth } from "@/features/auth/context/AuthContext"
import { useTheme } from "@/features/settings/context/ThemeContext"
import { SearchForm } from "@/components/search-form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Overview",
      icon: Home,
      items: [
        {
          title: "Dashboard",
          url: "/",
        },
        {
          title: "Activity",
          url: "/activity",
        },
        {
          title: "AI Chat",
          url: "/chat",
        },
      ],
    },
    {
      title: "Management",
      icon: Users,
      items: [
        {
          title: "Users",
          url: "/users",
        },
        {
          title: "Notifications",
          url: "/notifications",
        },
      ],
    },
    {
      title: "System",
      icon: Settings,
      items: [
        {
          title: "Settings",
          url: "/settings",
        },
        {
          title: "Health",
          url: "/health",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, updateSettings } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleToggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    toggleTheme();
    // Persist to server in background
    updateSettings({ theme: newTheme }).catch(() => {});
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => navigate("/")}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                <img
                  src="/assets/icons/toaster.png"
                  alt="Toaster"
                  className="size-8"
                />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Toaster</span>
                <span className="text-xs text-muted-foreground">
                  {user?.name || user?.username || "Dashboard"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {data.navMain.map((section) => (
          <Collapsible
            key={section.title}
            title={section.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <CollapsibleTrigger>
                  <section.icon className="mr-2 size-4" />
                  {section.title}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === item.url}
                        >
                          <a
                            href={item.url}
                            onClick={(e) => {
                              e.preventDefault()
                              navigate(item.url)
                            }}
                          >
                            {item.title}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleToggleTheme}>
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
