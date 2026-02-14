import { useRef, useState, useCallback, useEffect, useMemo } from "react"
import {
  Upload,
  File as FileIcon,
  Trash2,
  Loader2,
  Table,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/features/auth/context/AuthContext"
import { createApiClient } from "@/lib/api"
import {
  createDatasetService,
  type FileMetadata,
} from "@/features/dataset/services/datasetService"

const ACCEPTED_TYPES = ".csv,.xlsx,.xls"

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function FileUploadPanel() {
  const { token } = useAuth()
  const tokenRef = useRef(token)
  tokenRef.current = token

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [expandedFile, setExpandedFile] = useState<string | null>(null)

  const datasetService = useMemo(() => {
    const api = createApiClient(() => tokenRef.current)
    return createDatasetService(api)
  }, [])

  const loadFiles = useCallback(async () => {
    const loaded = await datasetService.getFiles()
    setFiles(loaded)
  }, [datasetService])

  // Reload files on mount and when token changes (after re-login)
  useEffect(() => {
    if (token) loadFiles()
  }, [loadFiles, token])

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        const result = await datasetService.uploadFile(file)
        if (result) {
          toast.success(`Uploaded "${file.name}" successfully`)
          await loadFiles()
        } else {
          toast.error("Failed to upload file")
        }
      } catch {
        toast.error("Failed to upload file")
      } finally {
        setUploading(false)
        // Reset the input so the same file can be re-uploaded
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    },
    [datasetService, loadFiles],
  )

  const handleDelete = useCallback(
    async (fileId: string, fileName: string) => {
      const deleted = await datasetService.deleteFile(fileId)
      if (deleted) {
        toast.success(`Deleted "${fileName}"`)
        await loadFiles()
      } else {
        toast.error("Failed to delete file")
      }
    },
    [datasetService, loadFiles],
  )

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      const updated = await datasetService.reloadFiles()
      setFiles(updated)
      toast.success("Files synced")
    } catch {
      toast.error("Failed to reload files")
    } finally {
      setSyncing(false)
    }
  }, [datasetService])

  return (
    <div className="border-t border-border">
      {/* Toggle header */}
      <div className="flex items-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
          <Table className="size-3.5" />
          Data Files
          {files.length > 0 && (
            <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {files.length}
            </span>
          )}
        </button>
        {expanded && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="shrink-0 mr-3 p-1 rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Sync files"
          >
            <RefreshCw
              className={`size-3.5 ${syncing ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                Upload CSV / Excel
              </>
            )}
          </button>

          {/* File list */}
          {files.length === 0 && !uploading && (
            <p className="text-[10px] text-muted-foreground text-center py-1">
              No files uploaded yet
            </p>
          )}

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {files.map((file) => (
              <div key={file._id} className="group">
                <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent transition-colors">
                  <button
                    onClick={() =>
                      setExpandedFile(
                        expandedFile === file._id ? null : file._id,
                      )
                    }
                    className="flex flex-1 items-center gap-2 min-w-0 text-left"
                  >
                    <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file.originalName}</span>
                  </button>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatFileSize(file.sizeBytes)}
                  </span>
                  <button
                    onClick={() => handleDelete(file._id, file.originalName)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    title="Delete file"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>

                {/* Expanded details */}
                {expandedFile === file._id && (
                  <div className="ml-6 mb-1 rounded-md bg-muted/50 px-2 py-1.5 text-[10px] text-muted-foreground space-y-0.5">
                    <div>
                      Table: <code>{file.tableName}</code>
                    </div>
                    <div>
                      {file.rowCount.toLocaleString()} rows,{" "}
                      {file.columns.length} columns
                    </div>
                    {file.columns.length > 0 && (
                      <div className="mt-1">
                        Columns:{" "}
                        <span className="text-foreground/70">
                          {file.columns.join(", ")}
                        </span>
                      </div>
                    )}
                    <div
                      className={`mt-0.5 ${file.isLoaded ? "text-green-500" : "text-yellow-500"}`}
                    >
                      {file.isLoaded ? "Loaded in DuckDB" : "Processing..."}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
