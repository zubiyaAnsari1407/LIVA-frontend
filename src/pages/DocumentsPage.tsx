import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  Archive,
  ArrowLeft,
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
}

type ProjectOption = {
  id: string
  name: string
}

const categories = [
  'Land record',
  'Ownership document',
  'Survey drawing',
  'Acquisition notice',
  'Compensation record',
  'Court order',
  'Other',
]

const checklist = [
  'Land / parcel records',
  'Ownership references',
  'Survey documents',
  'Acquisition notices',
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

function fileUrl(item: SavedDocument, download = false) {
  return `${API}/api/documents/${encodeURIComponent(item.id)}/file?download=${download}`
}

async function responseError(response: Response) {
  const body = await response.json().catch(() => null)
  return typeof body?.detail === 'string'
    ? body.detail
    : `Request failed (${response.status}).`
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<SavedDocument[]>([])
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [project, setProject] = useState('')
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
        const results = await Promise.allSettled([
          fetch(`${API}/api/documents`, { signal: controller.signal }),
          fetch(`${API}/api/projects`, { signal: controller.signal }),
        ])

        if (controller.signal.aborted) return

        const [documentResponse, projectResponse] = results
        if (
          documentResponse.status === 'rejected' ||
          projectResponse.status === 'rejected'
        ) {
          throw new Error('Unable to reach the API. Check the backend connection.')
        }

        if (!documentResponse.value.ok) {
          throw new Error(await responseError(documentResponse.value))
        }
        if (!projectResponse.value.ok) {
          throw new Error(await responseError(projectResponse.value))
        }

        const [documentData, projectData] = await Promise.all([
          documentResponse.value.json(),
          projectResponse.value.json(),
        ])

        if (
          !Array.isArray(documentData?.items) ||
          !documentData.items.every(isDocument) ||
          !Number.isInteger(documentData.total) ||
          documentData.total < documentData.items.length ||
          !Array.isArray(projectData?.items) ||
          !projectData.items.every(isProjectOption)
        ) {
          throw new Error('Invalid document or project response.')
        }

        if (!controller.signal.aborted) {
          setDocuments(documentData.items)
          setTotal(documentData.total)
          setProjectOptions(projectData.items)
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
  }, [reloadKey])

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
  const filtered = documents.filter((item) => {
    const term = query.trim().toLowerCase()
    return (
      (!term || `${item.name} ${item.project}`.toLowerCase().includes(term)) &&
      (!categoryFilter || item.category === categoryFilter) &&
      (!projectFilter || item.projectId === projectFilter)
    )
  })

  const hasFilters = Boolean(query || categoryFilter || projectFilter)
  const totalSize = documents.reduce((sum, item) => sum + item.size, 0)

  const filterProjects = [...new Map(
    documents.map((item) => [item.projectId, item.project]),
  )].sort((a, b) => a[1].localeCompare(b[1]))

  function refresh() {
    setLoading(true)
    setReloadKey((value) => value + 1)
  }

  function clearFilters() {
    setQuery('')
    setCategoryFilter('')
    setProjectFilter('')
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
        body,
      })

      if (!response.ok) throw new Error(await responseError(response))

      const result: unknown = await response.json()
      if (!isDocument(result)) {
        throw new Error('Unexpected upload response. Refresh the list before retrying.')
      }

      setPendingFile(null)
      clearFilters()
      setUploadOpen(false)
      setNotice('Document uploaded and saved.')
      addButtonRef.current?.focus()
      refresh()
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Connection interrupted. Refresh the list before retrying to avoid duplicate uploads.'
          : err instanceof Error ? err.message : 'Upload failed.',
      )
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
        { method: 'DELETE' },
      )

      if (!response.ok) throw new Error(await responseError(response))

      archiveRef.current?.close()
      setArchiveTarget(null)
      setNotice('Document archived. Its stored file is preserved.')
      refresh()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Archive failed.')
      archiveRef.current?.close()
    } finally {
      archivingRef.current = false
      setArchiving(false)
    }
  }

  return (
    <div className="docs-page">
      <a className="docs-skip" href="#docs-main">Skip to documents</a>

      <header className="docs-header">
        <Link to="/" className="docs-brand">Liva<span>.</span></Link>
        <nav aria-label="Workspace navigation">
          <Link to="/dashboard">Overview</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/parcels">Land Parcels</Link>
          <Link to="/documents" aria-current="page">Documents</Link>
        </nav>
        <Link to="/dashboard" className="docs-back">
          <ArrowLeft size={16} aria-hidden="true" /> Dashboard
        </Link>
      </header>

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
          <button
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
          </button>
        </section>

        <div className="docs-session-note">
          <ShieldCheck size={17} aria-hidden="true" />
          <p>Uploaded files are saved. Uploading does not verify their contents.</p>
        </div>

        <section className="docs-stats" aria-label="Loaded document summary">
          {[
            { title: 'Documents loaded', value: String(documents.length), note: 'Latest 100 active documents' },
            { title: 'Linked projects', value: String(filterProjects.length), note: 'Across loaded documents' },
            { title: 'Loaded file size', value: formatSize(totalSize), note: 'Combined size of loaded records' },
          ].map((item) => (
            <article key={item.title}>
              <p>{item.title}</p>
              <strong>{ready ? item.value : '—'}</strong>
              <span>{item.note}</span>
            </article>
          ))}
        </section>

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
                      onChange={(event) => setProject(event.target.value)}
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
                  <select aria-label="Project filter" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
                    <option value="">All projects</option>
                    {filterProjects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </select>
                  <select aria-label="Category filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                    <option value="">All categories</option>
                    {categories.map((name) => <option key={name}>{name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="docs-result-bar">
              <p role="status">
                {loading ? 'Loading…' : loadError ? 'Unable to load records'
                  : `${filtered.length} shown · ${documents.length} loaded · ${total} active`}
              </p>
              {hasFilters && <button type="button" onClick={clearFilters}>Clear filters</button>}
              <button type="button" disabled={loading || saving} onClick={refresh}>Refresh</button>
            </div>

            <div className="docs-results" key={view}>
              {loadError && <p className="docs-error" role="alert">{loadError}</p>}

              {ready && (filtered.length === 0 ? (
                <div className="docs-empty">
                  <span className="docs-empty-icon"><FolderOpen size={35} /></span>
                  <h3>{documents.length ? 'No matching documents.' : 'No documents uploaded yet.'}</h3>
                  <p>Upload a file and link it to a saved project.</p>
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
                        {item.contentType.startsWith('image/') ? (
                          <img src={fileUrl(item)} alt="" loading="lazy" />
                        ) : (
                          <span className="docs-pdf-symbol">
                            <FileText size={35} strokeWidth={1.4} />
                            <strong>PDF</strong>
                          </span>
                        )}
                      </button>

                      <div className="docs-item-copy">
                        <span className="docs-category">{item.category}</span>
                        <h3 title={item.name}>{item.name}</h3>
                        <p>{item.project}</p>
                        <small>
                          {formatSize(item.size)} · {item.isDemo ? 'Demo project' : 'Unverified upload'}
                        </small>
                      </div>

                      <div className="docs-item-actions">
                        <button type="button" onClick={() => previewDocument(item)}>
                          <Eye size={15} aria-hidden="true" /> Preview
                        </button>
                        <a href={fileUrl(item, true)}>
                          <Download size={15} aria-hidden="true" /> Download
                        </a>
                        <button
                          type="button"
                          aria-label={`Archive ${item.name}`}
                          onClick={() => {
                            setArchiveTarget(item)
                            archiveRef.current?.showModal()
                          }}
                        >
                          <Archive size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <aside className="docs-checklist">
            <div className="docs-checklist-heading">
              <FileText size={19} aria-hidden="true" />
              <h2>Document checklist</h2>
            </div>
            <div className="docs-checklist-body">
              <p className="docs-eyebrow">PROJECT REQUIREMENTS</p>
              <h3>Know what is needed.</h3>
              <p>Required documents depend on the project and acquisition stage.</p>
              <ul>
                {checklist.map((item, index) => (
                  <li key={item}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><strong>{item}</strong><small>Requirement not assessed</small></div>
                  </li>
                ))}
              </ul>
              <div className="docs-checklist-note">
                <ShieldCheck size={18} aria-hidden="true" />
                <p>Uploading a file does not verify it or complete a requirement.</p>
              </div>
            </div>
          </aside>
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
          <h2 id="docs-archive-title">Archive document?</h2>
        </div>
        <div style={{ padding: 24 }}>
          <p>{archiveTarget?.name}</p>
          <p>The file will leave the active list. Its stored copy is preserved.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="docs-secondary" type="button" disabled={archiving} onClick={() => archiveRef.current?.close()}>
              Cancel
            </button>
            <button className="docs-primary" type="button" disabled={archiving} onClick={() => void archiveDocument()}>
              {archiving ? 'Archiving…' : 'Archive'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}