import { useState } from "react"
import {
  MessageSquarePlus,
  Trash2,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Check,
  X,
} from "lucide-react"
import type { ChatSessionSummary } from "@/features/chat/services/chatSessionService"
import { FileUploadPanel } from "@/features/analytics/components/fileUploadPanel"

interface SessionSidebarProps {
  sessions: ChatSessionSummary[]
  activeSessionId: string | null
  ttlHours: number
  onNewChat: () => void
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onRenameSession: (sessionId: string, title: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  ttlHours,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  collapsed,
  onToggleCollapse,
}: SessionSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const handleStartRename = (session: ChatSessionSummary) => {
    setEditingId(session._id)
    setEditTitle(session.title)
  }

  const handleConfirmRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle("")
  }

  const handleCancelRename = () => {
    setEditingId(null)
    setEditTitle("")
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-r bg-sidebar py-3 px-1.5">
        <button
          onClick={onToggleCollapse}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="size-4" />
        </button>
        <button
          onClick={onNewChat}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title="New chat"
        >
          <MessageSquarePlus className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-64 flex-col border-r bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <h2 className="text-sm font-semibold">Chat History</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewChat}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="New chat"
          >
            <MessageSquarePlus className="size-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {sessions.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            No recent chats
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session._id}
              className={`group relative mx-1.5 mb-0.5 rounded-md transition-colors ${
                activeSessionId === session._id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
            >
              {editingId === session._id ? (
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmRename()
                      if (e.key === "Escape") handleCancelRename()
                    }}
                    className="flex-1 bg-transparent text-xs outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleConfirmRename}
                    className="flex size-5 items-center justify-center rounded text-green-500 hover:bg-green-500/10"
                  >
                    <Check className="size-3" />
                  </button>
                  <button
                    onClick={handleCancelRename}
                    className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onSelectSession(session._id)}
                  className="flex w-full items-start gap-2 px-2 py-1.5 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium">
                      {session.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(session.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartRename(session)
                      }}
                      className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Rename"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSession(session._id)
                      }}
                      className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Data files panel */}
      <FileUploadPanel />

      {/* TTL notice */}
      <div className="border-t px-3 py-2">
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="size-3" />
          Sessions retained for {ttlHours}h
        </p>
      </div>
    </div>
  )
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(dateStr).toLocaleDateString()
}
