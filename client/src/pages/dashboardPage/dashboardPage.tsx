import { useState, useEffect } from "react"
import { Activity, Server, Users, Bell } from "lucide-react"

interface HealthStatus {
  status: string
  timestamp: string
}

export function DashboardPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("/api/health")
        if (response.ok) {
          const data = await response.json()
          setHealth(data)
          setError(null)
        } else {
          setError("Server returned an error")
        }
      } catch {
        setError("Unable to connect to server")
      }
    }

    checkHealth()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to Toaster. Here's an overview of your application.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Server className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Server Status
            </h3>
          </div>
          <div className="mt-3">
            {error ? (
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-destructive" />
                <span className="text-sm font-medium text-destructive">
                  {error}
                </span>
              </div>
            ) : health ? (
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {health.status}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                Checking...
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Users
            </h3>
          </div>
          <p className="mt-3 text-2xl font-bold">--</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Activity
            </h3>
          </div>
          <p className="mt-3 text-2xl font-bold">--</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Notifications
            </h3>
          </div>
          <p className="mt-3 text-2xl font-bold">--</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="font-semibold mb-3">Getting Started</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            Client runs on <code className="text-foreground">http://localhost:5173</code>
          </li>
          <li>
            Server runs on <code className="text-foreground">http://localhost:3000</code>
          </li>
          <li>
            API docs at <code className="text-foreground">http://localhost:3000/api/docs</code>
          </li>
        </ul>
      </div>
    </div>
  )
}
