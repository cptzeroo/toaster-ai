import { useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Bot, Send, Square } from "lucide-react"
import { useAuth } from "@/features/auth/context/AuthContext"
import { toast } from "sonner"
import { ERROR_MESSAGES } from "@/features/auth/constants/error-messages"
import { API_ENDPOINTS } from "@/constants/api"
import { ChatBubble } from "@/features/chat/components/chatBubble"

const SUGGESTIONS = [
  "What can you help me with?",
  "Explain how React hooks work",
  "Write a TypeScript utility function",
  "Summarize the latest trends in AI",
]

export function ChatPage() {
  const { token, logout } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    status,
    error,
    sendMessage,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: API_ENDPOINTS.CHAT,
      headers: () => ({
        Authorization: `Bearer ${token}`,
      }),
    }),
    onError: (err) => {
      // Handle auth errors -- session expired or token invalidated
      // Don't call server logout here -- the token is already invalid
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        toast.error(ERROR_MESSAGES.SESSION_EXPIRED)
        logout({ serverLogout: false })
        return
      }

      toast.error(ERROR_MESSAGES.CHAT_FAILED)
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const textarea = textareaRef.current
    if (!textarea) return

    const text = textarea.value.trim()
    if (!text || isLoading) return

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

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return
    sendMessage({ text: suggestion })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-2rem)]">
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
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI can make mistakes. Verify important information.
          </p>
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
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Bot className="size-8 text-primary" />
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
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Bot className="size-4 text-primary" />
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
