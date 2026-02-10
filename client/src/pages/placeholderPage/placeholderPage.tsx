interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed bg-muted/25">
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </div>
  )
}
