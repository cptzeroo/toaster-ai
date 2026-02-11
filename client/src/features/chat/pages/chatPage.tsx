import { useRef, useEffect, useState, useMemo, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Send, Square } from "lucide-react"
import { useAuth } from "@/features/auth/context/AuthContext"
import { toast } from "sonner"
import { ERROR_MESSAGES } from "@/features/auth/constants/error-messages"
import { API_ENDPOINTS } from "@/constants/api"
import { createApiClient } from "@/lib/api"
import { ChatBubble } from "@/features/chat/components/chatBubble"
import { ModelSelector } from "@/features/chat/components/modelSelector"
import { SessionSidebar } from "@/features/chat/components/sessionSidebar"
import { DEFAULT_MODEL_ID } from "@/features/chat/constants/models"
import {
  createChatSessionService,
  type ChatSessionSummary,
} from "@/features/chat/services/chatSessionService"

const SUGGESTIONS = [
  "What can you help me with?",
  "Explain how React hooks work",
  "Write a TypeScript utility function",
  "Summarize the latest trends in AI",
]

export function ChatPage() {
  const { token, logout, settings } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Use default model from settings if available
  const [selectedModel, setSelectedModel] = useState(
    settings?.defaultModel || DEFAULT_MODEL_ID,
  )

  // Session state
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [ttlHours, setTtlHours] = useState(8)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Keep refs for closures
  const modelRef = useRef(selectedModel)
  modelRef.current = selectedModel
  const sessionIdRef = useRef(activeSessionId)
  sessionIdRef.current = activeSessionId
  const tokenRef = useRef(token)
  tokenRef.current = token

  // Create session service
  const sessionService = useMemo(() => {
    const api = createApiClient(() => tokenRef.current)
    return createChatSessionService(api)
  }, [])

  // Load sessions and TTL on mount
  useEffect(() => {
    const load = async () => {
      const [loadedSessions, loadedTtl] = await Promise.all([
        sessionService.getSessions(),
        sessionService.getTtl(),
      ])
      setSessions(loadedSessions)
      setTtlHours(loadedTtl)
    }
    load()
  }, [sessionService])

  // Refresh sessions list
  const refreshSessions = useCallback(async () => {
    const loaded = await sessionService.getSessions()
    setSessions(loaded)
  }, [sessionService])

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: API_ENDPOINTS.CHAT.SEND,
        headers: () => ({
          Authorization: `Bearer ${token}`,
        }),
        body: () => ({
          model: modelRef.current,
          sessionId: sessionIdRef.current || undefined,
        }),
      }),
    [token],
  )

  const {
    messages,
    setMessages,
    status,
    error,
    sendMessage,
    stop,
  } = useChat({
    transport,
    onError: (err) => {
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        toast.error(ERROR_MESSAGES.SESSION_EXPIRED)
        logout({ serverLogout: false })
        return
      }
      toast.error(ERROR_MESSAGES.CHAT_FAILED)
    },
    onFinish: () => {
      // Refresh session list after each message exchange to update timestamps
      refreshSessions()

      // Title generation happens server-side after the stream ends.
      // Re-fetch after a short delay to pick up the auto-generated title.
      if (!activeSessionId || messages.length <= 1) {
        setTimeout(() => refreshSessions(), 3000)
      }
    },
  })

  const isLoading = status === "submitted" || status === "streaming"

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea
  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    target.style.height = "auto"
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`
  }

  // Create session on first message if none active
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (activeSessionId) return activeSessionId

    const session = await sessionService.createSession(
      "New conversation",
      modelRef.current,
    )
    if (session) {
      setActiveSessionId(session._id)
      sessionIdRef.current = session._id
      await refreshSessions()
      return session._id
    }
    return null
  }, [activeSessionId, sessionService, refreshSessions])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const textarea = textareaRef.current
    if (!textarea) return

    const text = textarea.value.trim()
    if (!text || isLoading) return

    // Ensure we have a session before sending
    await ensureSession()

    sendMessage({ text })
    textarea.value = ""
    textarea.style.height = "auto"
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.closest("form")
      form?.requestSubmit()
    }
  }

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return
    await ensureSession()
    sendMessage({ text: suggestion })
  }

  // Session management handlers
  const handleNewChat = useCallback(() => {
    setActiveSessionId(null)
    sessionIdRef.current = null
    setMessages([])
  }, [setMessages])

  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      const session = await sessionService.getSession(sessionId)
      if (session) {
        setActiveSessionId(session._id)
        sessionIdRef.current = session._id
        setSelectedModel(session.model || DEFAULT_MODEL_ID)
        // Convert stored messages to the format useChat expects
        const uiMessages = session.messages.map(
          (msg: any, index: number) => ({
            id: `${session._id}-${index}`,
            role: msg.role as "user" | "assistant",
            content: "",
            parts: msg.parts || [],
            createdAt: new Date(),
          }),
        )
        setMessages(uiMessages)
      }
    },
    [sessionService, setMessages],
  )

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      const deleted = await sessionService.deleteSession(sessionId)
      if (deleted) {
        if (activeSessionId === sessionId) {
          handleNewChat()
        }
        await refreshSessions()
      }
    },
    [sessionService, activeSessionId, handleNewChat, refreshSessions],
  )

  const handleRenameSession = useCallback(
    async (sessionId: string, title: string) => {
      await sessionService.updateSessionTitle(sessionId, title)
      await refreshSessions()
    },
    [sessionService, refreshSessions],
  )

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-2rem)]">
      {/* Session sidebar */}
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        ttlHours={ttlHours}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Messages area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="max-w-3xl mx-auto py-4 space-y-4">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {status === "submitted" && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 text-center">
            {ERROR_MESSAGES.CHAT_FAILED}
          </div>
        )}

        {/* Input area */}
        <div className="border-t bg-background p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="relative flex items-end gap-2 rounded-xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                <textarea
                  ref={textareaRef}
                  onInput={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                />
                {isLoading ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
                  >
                    <Square className="size-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="size-4" />
                  </button>
                )}
              </div>
            </form>
            <div className="mt-2 flex items-center justify-between">
              <ModelSelector
                value={selectedModel}
                onChange={setSelectedModel}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                AI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl overflow-hidden">
          <img src="/assets/icons/toaster.png" alt="Toaster AI" className="size-16" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Toaster AI</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ask me anything. I can help you query data, search the web, manage
            emails, and more.
          </p>
        </div>
        <div className="grid gap-2 text-sm">
          {SUGGESTIONS.map((text) => (
            <button
              key={text}
              onClick={() => onSuggestionClick(text)}
              className="rounded-lg border bg-card px-4 py-2.5 text-left text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden">
        <img src="/assets/icons/toaster.png" alt="Toaster AI" className="size-8" />
      </div>
      <div className="rounded-xl bg-muted px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
          <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
          <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
