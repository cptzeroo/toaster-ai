import { User, Copy, Check } from "lucide-react"
import { useState } from "react"
import type { UIMessage } from "ai"
import { MarkdownContent } from "@/features/chat/components/markdownContent"

interface ChatBubbleProps {
  message: UIMessage
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)

  // Extract text content from message parts
  const textContent = message.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("")

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`group flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden">
          <img src="/assets/icons/toaster.png" alt="Toaster AI" className="size-8" />
        </div>
      )}
      <div
        className={`relative max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{textContent}</p>
        ) : (
          <MarkdownContent content={textContent} />
        )}

        {/* Copy button for assistant messages */}
        {!isUser && textContent && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-8 left-0 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="size-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>
      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <User className="size-4 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
