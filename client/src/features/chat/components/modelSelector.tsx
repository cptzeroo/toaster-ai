import { ChevronDown, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AI_MODELS,
  PROVIDER_LABELS,
  getModelById,
  type AIProvider,
} from "@/features/chat/constants/models"

interface ModelSelectorProps {
  value: string
  onChange: (modelId: string) => void
  disabled?: boolean
}

const PROVIDER_ORDER: AIProvider[] = ["google", "openai", "anthropic"]

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const selectedModel = getModelById(value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="max-w-[120px] truncate">
          {selectedModel?.name || "Select model"}
        </span>
        <ChevronDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {PROVIDER_ORDER.map((provider, index) => {
          const models = AI_MODELS.filter((m) => m.provider === provider)
          if (models.length === 0) return null

          return (
            <div key={provider}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {PROVIDER_LABELS[provider]}
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {models.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => onChange(model.id)}
                    className="flex items-center justify-between"
                  >
                    <span>{model.name}</span>
                    {value === model.id && (
                      <Check className="size-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
