import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useFlash } from '../context/FlashContext'
import { useAuth } from '../auth/AuthContext'
import {
  Trash2,
  Check,
  ChevronDown,
  Download,
  Eye,
  FileText,
  FolderOpen,
  LayoutGrid,
  List,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  X,
} from 'lucide-react'

import '../styles/documents.css'

type SavedDocument = {
  id: string
  name: string
  projectId: string
  project: string
  category: string
  size: number
  contentType: string
  isDemo: boolean
  uploadedAt: string
  isWorkflow?: boolean
  sourceLabel?: string
}

type ProjectOption = {
  id: string
  name: string
}

const categories = [
  'Land record',
  'Ownership document',
  'Identity document',
  'Survey drawing',
  'Grievance supporting document',
  'Acquisition notice',
  'Compensation record',
  'Court order',
  'Other',
]

const MAX_SIZE = 15 * 1024 * 1024
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]

const API = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`
}

function isDocument(value: unknown): value is SavedDocument {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>

  return (
    [
      'id', 'name', 'projectId', 'project',
      'category', 'contentType', 'uploadedAt',
    ].every((key) => typeof item[key] === 'string') &&
    typeof item.size === 'number' &&
    Number.isFinite(item.size) &&
    item.size >= 0 &&
    typeof item.isDemo === 'boolean' &&
    allowedTypes.includes(String(item.contentType))
  )
}

function isProjectOption(value: unknown): value is ProjectOption {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && typeof item.name === 'string'
}

function normalizeLivaProject(value: unknown): ProjectOption | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  return typeof item.projectId === 'string' && typeof item.projectName === 'string'
    ? { id: item.projectId, name: item.projectName }
    : null
}

function fileUrl(item: SavedDocument, download = false) {
  if (item.isWorkflow) return `${API}/api/liva/documents/${encodeURIComponent(item.id)}`
  return `${API}/api/documents/${encodeURIComponent(item.id)}/file?download=${download}`
}

async function responseError(response: Response) {
  const body = await response.json().catch(() => null)
  return typeof body?.detail === 'string'
    ? body.detail
    : `Request failed (${response.status}).`
}

export default function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { success: flashSuccess, error: flashError } = useFlash()
  const { role } = useAuth()
  const isStaff = role === 'officer' || role === 'admin'

  const [documents, setDocuments] = useState<SavedDocument[]>([])
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState(() => searchParams.get('projectId') ?? '')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [project, setProject] = useState(() => searchParams.get('projectId') ?? '')
  const [category, setCategory] = useState(categories[0])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<SavedDocument | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<SavedDocument | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDialogElement>(null)
  const archiveRef = useRef<HTMLDialogElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const savingRef = useRef(false)
  const archivingRef = useRef(false)
  const previewObjectUrlRef = useRef<string | null>(null)
  const previewAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setLoadError('')

      try {
        const requests: Promise<Response>[] = [
          fetch(`${API}/api/documents`, { signal: controller.signal, headers: { 'X-Liva-Role': role ?? 'landowner' } }),
          fetch(`${API}/api/projects`, { signal: controller.signal }),
          fetch(`${API}/api/liva/projects`, { signal: controller.signal }),
        ]
        if (projectFilter && (role === 'officer' || role === 'admin')) {
          requests.push(fetch(`${API}/api/documents/workflow?projectId=${encodeURIComponent(projectFilter)}`, {
            signal: controller.signal,
            headers: { 'X-Liva-Role': role },
          }))
        }
        const results = await Promise.allSettled(requests)

        if (controller.signal.aborted) return

        const [documentResponse, projectResponse, livaProjectResponse] = results
        const hasPortfolioProjects = projectResponse.status === 'fulfilled' && projectResponse.value.ok
        const hasLivaProjects = livaProjectResponse.status === 'fulfilled' && livaProjectResponse.value.ok
        const [projectData, livaProjectData] = await Promise.all([
          hasPortfolioProjects ? projectResponse.value.json() : Promise.resolve({ items: [] }),
          hasLivaProjects ? livaProjectResponse.value.json() : Promise.resolve([]),
        ])

        const portfolioOptions = Array.isArray(projectData?.items)
          ? projectData.items.filter(isProjectOption)
          : []
        const livaOptions = Array.isArray(livaProjectData)
          ? livaProjectData.map(normalizeLivaProject).filter((item): item is ProjectOption => item !== null)
          : []
        const allProjects = [...portfolioOptions, ...livaOptions]
          .filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index)
        if (!controller.signal.aborted) setProjectOptions(allProjects)

        if (documentResponse.status === 'rejected') {
          throw new Error('Unable to reach the documents API. Check the backend connection.')
        }
        if (!documentResponse.value.ok) throw new Error(await responseError(documentResponse.value))
        const documentData = await documentResponse.value.json()
        if (
          !Array.isArray(documentData?.items) ||
          !documentData.items.every(isDocument) ||
          !Number.isInteger(documentData.total) ||
          documentData.total < documentData.items.length
        ) throw new Error('Invalid document response.')

        if (!controller.signal.aborted) {
          const workflowResponse = results[3]
          let workflowItems: SavedDocument[] = []
          if (workflowResponse?.status === 'fulfilled' && workflowResponse.value.ok) {
            const workflowData = await workflowResponse.value.json()
            if (Array.isArray(workflowData?.items)) {
              workflowItems = workflowData.items.filter(isDocument)
            }
          }
          setDocuments([...documentData.items, ...workflowItems])
          setTotal(documentData.total + workflowItems.length)
          if (!allProjects.length) setLoadError('Unable to load project options. Check the backend connection.')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoadError(err instanceof Error ? err.message : 'Unable to load records.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [reloadKey, role, projectFilter])

  useEffect(() => {
    return () => {
      previewAbortRef.current?.abort()

      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
        previewObjectUrlRef.current = null
      }
    }
  }, [])

  const ready = !loading && !loadError
  const filtered = projectFilter
    ? documents.filter((item) => {
        const term = query.trim().toLowerCase()
        return (
          item.projectId === projectFilter &&
          (!term || `${item.name} ${item.project}`.toLowerCase().includes(term)) &&
          (!categoryFilter || item.category === categoryFilter)
        )
      })
    : []

  const hasFilters = Boolean(query || categoryFilter || projectFilter)
  // Show every saved project in the project filter, including projects
  // that currently have zero documents. This lets the officer select a
  // project first and then see its document state.
  const filterProjects = projectOptions
    .map((item) => [item.id, item.name] as [string, string])
    .sort((a, b) => a[1].localeCompare(b[1]))

  function refresh() {
    setLoading(true)
    setReloadKey((value) => value + 1)
  }

  function clearFilters() {
    setQuery('')
    setCategoryFilter('')
    setProjectFilter('')
    setProject('')
    const next = new URLSearchParams(searchParams)
    next.delete('projectId')
    setSearchParams(next, { replace: true })
  }

  function chooseFile(file?: File) {
    if (savingRef.current) return
    setError('')
    setPendingFile(null)

    if (!file) return
    if (!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)) {
      setError('Choose a PDF, JPG, PNG or WebP file.')
      return
    }
    if (!file.size || file.size > MAX_SIZE) {
      setError('Choose a non-empty file up to 15 MB.')
      return
    }

    setPendingFile(file)
  }

  async function addDocument() {
    if (savingRef.current) return
    if (!pendingFile || !project) {
      setError('Choose a file and a saved project.')
      return
    }

    savingRef.current = true
    setSaving(true)
    setError('')

    const body = new FormData()
    body.append('projectId', project)
    body.append('category', category)
    body.append('file', pendingFile)

    try {
      const response = await fetch(`${API}/api/documents`, {
        method: 'POST',
        headers: { 'X-Liva-Role': role ?? 'landowner' },
        body,
      })

      if (!response.ok) throw new Error(await responseError(response))

      const result: unknown = await response.json()
      if (!isDocument(result)) {
        throw new Error('Unexpected upload response. Refresh the list before retrying.')
      }

      setPendingFile(null)
      setQuery('')
      setCategoryFilter('')
      // Keep the uploaded document's project selected so the workspace
      // immediately shows documents for that project.
      setProjectFilter(project)
      setProject(project)
      setUploadOpen(false)
      const successMessage = 'Document uploaded and saved.'
      setNotice(successMessage)
      flashSuccess(successMessage)
      addButtonRef.current?.focus()
      refresh()
    } catch (err) {
      const errorMessage =
        err instanceof TypeError
          ? 'Connection interrupted. Refresh the list before retrying to avoid duplicate uploads.'
          : err instanceof Error ? err.message : 'Upload failed.'
      setError(errorMessage)
      flashError(errorMessage)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  async function previewDocument(item: SavedDocument) {
    previewAbortRef.current?.abort()

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }

    const controller = new AbortController()
    previewAbortRef.current = controller

    setSelected(item)
    setPreviewUrl('')
    setPreviewError('')
    setPreviewLoading(true)

    if (!previewRef.current?.open) {
      previewRef.current?.showModal()
    }

    try {
      /*
       * Fetch the inline version ourselves and create a browser blob URL.
       * This avoids Content-Disposition / browser download behaviour and
       * restores the old in-app preview experience.
       */
      const response = await fetch(fileUrl(item, false), {
        signal: controller.signal,
        headers: { 'X-Liva-Role': role ?? 'landowner' },
      })

      if (!response.ok) {
        throw new Error(await responseError(response))
      }

      const blob = await response.blob()

      if (controller.signal.aborted) return

      const objectUrl = URL.createObjectURL(blob)
      previewObjectUrlRef.current = objectUrl
      setPreviewUrl(objectUrl)
    } catch (err) {
      if (!controller.signal.aborted) {
        setPreviewError(
          err instanceof Error
            ? err.message
            : 'Document preview could not be loaded.',
        )
      }
    } finally {
      if (!controller.signal.aborted) {
        setPreviewLoading(false)
      }
    }
  }

  function closePreview() {
    previewRef.current?.close()
  }

  async function downloadDocument(item: SavedDocument) {
    try {
      const response = await fetch(fileUrl(item, true), { headers: { 'X-Liva-Role': role ?? 'landowner' } })
      if (!response.ok) throw new Error(await responseError(response))
      const url = URL.createObjectURL(await response.blob())
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = item.name
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed.'
      setNotice(message)
      flashError(message)
    }
  }

  function clearPreview() {
    previewAbortRef.current?.abort()
    previewAbortRef.current = null

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }

    setPreviewUrl('')
    setPreviewLoading(false)
    setPreviewError('')
    setSelected(null)
  }

  async function archiveDocument() {
    if (!archiveTarget || archivingRef.current) return
    archivingRef.current = true
    setArchiving(true)

    try {
      const response = await fetch(
        `${API}/api/documents/${encodeURIComponent(archiveTarget.id)}`,
        { method: 'DELETE', headers: { 'X-Liva-Role': role ?? 'landowner' } },
      )

      if (!response.ok) throw new Error(await responseError(response))

      archiveRef.current?.close()
      setArchiveTarget(null)
      const successMessage = 'Document deleted from the active list.'
      setNotice(successMessage)
      flashSuccess(successMessage)
      refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Document delete failed.'
      setNotice(errorMessage)
      flashError(errorMessage)
      archiveRef.current?.close()
    } finally {
      archivingRef.current = false
      setArchiving(false)
    }
  }

  return (
    <div className="docs-page">
      <a className="docs-skip" href="#docs-main">Skip to documents</a>

    
      <main id="docs-main" className="docs-main">
        <div className="docs-breadcrumb">
          <Link to="/dashboard">Workspace</Link><span>/</span>
          <span>Documents & Records</span>
        </div>

        <section className="docs-heading docs-heading-banner">
          <div>
            <img
              className="docs-heading-bg"
              src="/images/liva-documents-banner.png.png"
              alt=""
              fetchPriority="high"
            />
            <p className="docs-eyebrow">DOCUMENTS & RECORDS</p>
            <h1>The evidence behind every step.</h1>
            <p className="docs-description">
              Organize project paperwork and review documents in one clear workspace.
            </p>
          </div>
        </section>

        <div className="docs-session-note">
          <ShieldCheck size={17} aria-hidden="true" />
          <p>Uploaded files are saved. Uploading does not verify their contents.</p>
        </div>

        {isStaff && (
        <div
          id="docs-upload"
          className={`docs-upload-wrapper ${uploadOpen ? 'is-open' : ''}`}
          inert={!uploadOpen}
        >
          <div className="docs-upload-inner">
            <section className="docs-upload-panel">
              <div className="docs-section-heading">
                <div>
                  <p className="docs-eyebrow">LINK TO A PROJECT</p>
                  <h2>Upload a document</h2>
                </div>
                <span className="docs-badge">PDF · JPG · PNG · WebP</span>
              </div>

              <form onSubmit={(event) => {
                event.preventDefault()
                void addDocument()
              }}>
                <div
                  className={`docs-dropzone ${dragging ? 'is-dragging' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    if (!saving) setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDragging(false)
                    if (saving) return
                    if (event.dataTransfer.files.length !== 1) {
                      setError('Choose one file at a time.')
                      return
                    }
                    chooseFile(event.dataTransfer.files[0])
                  }}
                >
                  <Upload size={29} strokeWidth={1.5} aria-hidden="true" />
                  <strong>{pendingFile?.name || 'Drag a file here'}</strong>
                  <span>{pendingFile ? formatSize(pendingFile.size) : 'Maximum 15 MB'}</span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="docs-file-input"
                    aria-label="Choose document"
                    disabled={saving}
                    onChange={(event) => {
                      chooseFile(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    className="docs-secondary"
                    disabled={saving}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse files
                  </button>
                </div>

                <div className="docs-upload-fields">
                  <label>
                    Saved project
                    <select
                      required
                      disabled={!ready || saving}
                      value={project}
                      onChange={(event) => {
                        const projectId = event.target.value
                        setProject(projectId)
                        const next = new URLSearchParams(searchParams)
                        if (projectId) next.set('projectId', projectId)
                        else next.delete('projectId')
                        setSearchParams(next, { replace: true })
                      }}
                    >
                      <option value="">Select a project</option>
                      {projectOptions.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Category
                    <select
                      disabled={saving}
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                    >
                      {categories.map((name) => <option key={name}>{name}</option>)}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="docs-primary"
                    disabled={!ready || saving || !pendingFile || !project}
                  >
                    <Upload size={16} aria-hidden="true" />
                    {saving ? 'Uploading…' : 'Upload & save'}
                  </button>
                </div>

                {ready && !projectOptions.length && (
                  <p className="docs-error">
                    Create a project first from the Projects page.
                  </p>
                )}
                {error && <p className="docs-error" role="alert">{error}</p>}
              </form>
            </section>
          </div>
        </div>
        )}

        {notice && (
          <div className="docs-notice" role="status">
            <Check size={17} aria-hidden="true" /><span>{notice}</span>
            <button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="docs-layout">
          <section className="docs-library" aria-labelledby="docs-library-title">
            <div className="docs-library-header">
              <div>
                <h2 id="docs-library-title">Document workspace</h2>
                <p>Find, preview and download saved files.</p>
              </div>
              <div className="docs-toolbar-actions">
                {isStaff && <button
                  ref={addButtonRef}
                  type="button"
                  className="docs-primary"
                  disabled={saving}
                  aria-expanded={uploadOpen}
                  aria-controls="docs-upload"
                  onClick={() => setUploadOpen((open) => !open)}
                >
                  {uploadOpen ? <X size={17} /> : <Plus size={17} />}
                  {uploadOpen ? 'Close panel' : 'Upload document'}
                </button>}
                <button
                  type="button"
                  className="docs-filter-button"
                  aria-expanded={filtersOpen}
                  aria-controls="docs-filters"
                  onClick={() => setFiltersOpen((open) => !open)}
                >
                  <SlidersHorizontal size={15} aria-hidden="true" />
                  Filters
                  <ChevronDown size={14} className={filtersOpen ? 'docs-rotated' : ''} />
                </button>
                <div className="docs-view-toggle" role="group" aria-label="Document view">
                  <button type="button" aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
                    <LayoutGrid size={17} />
                  </button>
                  <button type="button" aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}>
                    <List size={19} />
                  </button>
                </div>
              </div>
            </div>

            <div
              id="docs-filters"
              className={`docs-filter-wrapper ${filtersOpen ? 'is-open' : ''}`}
              inert={!filtersOpen}
            >
              <div className="docs-filter-inner">
                <div className="docs-filters">
                  <label className="docs-search">
                    <Search size={17} aria-hidden="true" />
                    <input
                      type="search"
                      aria-label="Search documents"
                      placeholder="Search file or project…"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Project filter"
                    value={projectFilter}
                    onChange={(event) => {
                      const value = event.target.value
                      setProjectFilter(value)
                      setProject(value)
                      const next = new URLSearchParams(searchParams)
                      if (value) next.set('projectId', value)
                      else next.delete('projectId')
                      setSearchParams(next, { replace: true })
                    }}
                  >
                    <option value="">Select a project</option>
                    {filterProjects.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Category filter"
                    value={categoryFilter}
                    disabled={!projectFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                  >
                    <option value="">All categories</option>
                    {categories.map((name) => <option key={name}>{name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="docs-result-bar">
              <p role="status">
                {loading ? 'Loading…' : loadError ? 'Unable to load records'
                  : !projectFilter
                    ? 'Select a project to view its documents'
                    : `${filtered.length} shown · ${documents.length} loaded · ${total} active`}
              </p>
              {hasFilters && <button type="button" onClick={clearFilters}>Clear filters</button>}
              <button type="button" disabled={loading || saving} onClick={refresh}>Refresh</button>
            </div>

            <div className="docs-results" key={view}>
              {loadError && <p className="docs-error" role="alert">{loadError}</p>}

              {ready && (!projectFilter || filtered.length === 0 ? (
                <div className="docs-empty">
                  <span className="docs-empty-icon"><FolderOpen size={35} /></span>
                  {!projectFilter ? (
                    <>
                      <h3>Select a project to view documents.</h3>
                      <p>Select a project from the filter above to view and upload its documents.</p>
                    </>
                  ) : (
                    <>
                      <h3>No documents available.</h3>
                      <p>{isStaff ? <>No documents have been uploaded for this project yet. Use <strong>Upload document</strong> to add the first record.</> : 'No documents are currently available for this project.'}</p>
                    </>
                  )}
                </div>
              ) : (
                <div className={`docs-items ${view === 'list' ? 'docs-items-list' : ''}`}>
                  {filtered.map((item) => (
                    <article className="docs-item" key={item.id}>
                      <button
                        type="button"
                        className="docs-item-preview"
                        onClick={() => previewDocument(item)}
                        aria-label={`Preview ${item.name}`}
                      >
                        <span className="docs-pdf-symbol">
                          <FileText size={35} strokeWidth={1.4} />
                          <strong>{item.contentType.startsWith('image/') ? 'IMAGE' : 'PDF'}</strong>
                        </span>
                      </button>

                      <div className="docs-item-copy">
                        <span className="docs-category">{item.category}</span>
                        <h3 title={item.name}>{item.name}</h3>
                        <p>{item.project}</p>
                        <small>
                          {formatSize(item.size)} · {item.sourceLabel ?? (item.isDemo ? 'Demo project' : 'Unverified upload')}
                        </small>
                      </div>

                      <div className="docs-item-actions">
                        <button type="button" onClick={() => previewDocument(item)}>
                          <Eye size={15} aria-hidden="true" /> Preview
                        </button>
                        <button type="button" onClick={() => void downloadDocument(item)}>
                          <Download size={15} aria-hidden="true" /> Download
                        </button>
                        {isStaff && <button
                          type="button"
                          aria-label={`Delete ${item.name}`}
                          title="Delete document"
                          onClick={() => {
                            setArchiveTarget(item)
                            archiveRef.current?.showModal()
                          }}
                        >
                          <Trash2 size={15} />
                        </button>}
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      <footer className="docs-footer">
        <strong>Liva</strong>
        <span>Better land decisions. Stronger communities.</span>
      </footer>

      <dialog
        ref={previewRef}
        className="docs-preview-dialog"
        aria-labelledby="docs-preview-title"
        onClose={clearPreview}
      >
        <div className="docs-preview-heading">
          <div>
            <p>DOCUMENT PREVIEW</p>
            <h2 id="docs-preview-title">{selected?.name ?? 'Document'}</h2>
          </div>

          <button
            type="button"
            aria-label="Close preview"
            onClick={closePreview}
          >
            <X size={21} />
          </button>
        </div>

        {selected && (
          <>
            <div className="docs-preview-meta">
              {selected.category} · {formatSize(selected.size)} ·{' '}
              {selected.isDemo ? 'Illustrative demo document' : 'Unverified upload'}
            </div>

            <div className="docs-preview-content">
              {previewLoading ? (
                <div
                  role="status"
                  style={{
                    minHeight: 520,
                    display: 'grid',
                    placeItems: 'center',
                    padding: 24,
                    color: '#5f7168',
                  }}
                >
                  Loading document preview…
                </div>
              ) : previewError ? (
                <div
                  role="alert"
                  style={{
                    minHeight: 320,
                    display: 'grid',
                    placeItems: 'center',
                    gap: 14,
                    padding: 24,
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <strong>Preview could not be loaded.</strong>
                    <p style={{ marginTop: 8 }}>{previewError}</p>
                  </div>

                  <button
                    type="button"
                    className="docs-secondary"
                    onClick={() => void previewDocument(selected)}
                  >
                    Try preview again
                  </button>
                </div>
              ) : previewUrl && selected.contentType === 'application/pdf' ? (
                <iframe
                  src={`${previewUrl}#toolbar=1&navpanes=0&view=FitH`}
                  title={`Preview of ${selected.name}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '72vh',
                    minHeight: 560,
                    border: 0,
                    background: '#eef1ed',
                  }}
                />
              ) : previewUrl && selected.contentType.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={`Preview of ${selected.name}`}
                />
              ) : null}
            </div>
          </>
        )}
      </dialog>

      <dialog
        ref={archiveRef}
        className="docs-preview-dialog"
        aria-labelledby="docs-archive-title"
        onCancel={(event) => {
          if (archivingRef.current) event.preventDefault()
        }}
      >
        <div className="docs-preview-heading">
          <h2 id="docs-archive-title">Delete document?</h2>
        </div>
        <div style={{ padding: 24 }}>
          <p>{archiveTarget?.name}</p>
          <p>{archiveTarget?.isWorkflow
            ? 'The document will be removed from the active list. Its attachment will no longer open from the original request or grievance.'
            : 'The document will be removed from the active list.'}</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="docs-secondary" type="button" disabled={archiving} onClick={() => archiveRef.current?.close()}>
              Cancel
            </button>
            <button className="docs-primary" type="button" disabled={archiving} onClick={() => void archiveDocument()}>
              {archiving ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
