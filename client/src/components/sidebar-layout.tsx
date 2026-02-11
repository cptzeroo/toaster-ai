import { Outlet, useLocation } from "react-router-dom"
import { Moon, Sun } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useTheme } from "@/features/settings/context/ThemeContext"
import { useAuth } from "@/features/auth/context/AuthContext"

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/activity": "Activity",
  "/chat": "AI Chat",
  "/users": "Users",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/health": "Health",
}

export function SidebarLayout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || "Dashboard"
  const { theme, toggleTheme } = useTheme()
  const { updateSettings } = useAuth()

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    toggleTheme()
    updateSettings({ theme: newTheme }).catch(() => {})
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <button
              onClick={handleToggleTheme}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
