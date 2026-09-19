import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { Plus, ArrowRight, RefreshCw, X, ExternalLink, PencilLine } from 'lucide-react'

import {
  workflowRequest,
  workflowError,
} from '../services/workflowApi'

import '../styles/workflow.css'
import { useAuth } from '../auth/AuthContext'

export type Field = {
  key: string
  label: string
  type?: 'text' | 'date' | 'number' | 'textarea' | 'select'
  options?: string[]
  required?: boolean
  max?: number
  minLength?: number
}

export type WorkspaceConfig = {
  endpoint: string
  title: string
  description: string
  image?: string
  fields: Field[]
  columns: { key: string; label: string }[]
}

type Row = {
  id: string
  projectId: string
  project?: string
  parcelId?: string | null
  isDemo: boolean
  [key: string]: unknown
}

type Project = {
  id: string
  name: string
}

type Parcel = {
  id: string
  surveyNumber: string
  village: string
}

type Draft = Record<string, string>

function defaults(config: WorkspaceConfig): Draft {
  return Object.fromEntries([
    ['projectId', ''],
    ['parcelId', ''],
    ['isDemo', 'true'],
    ['sourceName', ''],
    ['sourceUrl', ''],
    ['notes', ''],
    ...config.fields.map((field) => [
      field.key,
      field.options?.[0] ?? '',
    ]),
  ])
}

function shown(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return 'Not recorded'
  }

  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN')
  }

  return String(value)
}

export default function WorkflowWorkspace({
  config,
}: {
  config: WorkspaceConfig
}) {
  const { can } = useAuth()
  const canManageWorkflow = can('workflow.manage')

  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [parcels, setParcels] = useState<Parcel[]>([])

  const [projectError, setProjectError] = useState('')
  const [parcelError, setParcelError] = useState('')
  const [error, setError] = useState('')

  const [loading, setLoading] = useState(true)
  const [projectLoading, setProjectLoading] = useState(true)
  const [parcelLoading, setParcelLoading] = useState(false)

  const [reload, setReload] = useState(0)
  const [retryParcels, setRetryParcels] = useState(0)
  const [query, setQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState('')

  const [selected, setSelected] = useState<Row | null>(null)
  const [draft, setDraft] = useState<Draft>(() => defaults(config))
  const [editing, setEditing] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')

  const lock = useRef(false)
  const formRef = useRef<HTMLElement>(null)
  const detailsCloseRef = useRef<HTMLButtonElement>(null)
  const detailsReturnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    setError('')

    const projectQuery = projectFilter
      ? `&projectId=${encodeURIComponent(projectFilter)}`
      : ''

    workflowRequest<{ items: Row[]; total: number }>(
      `${config.endpoint}?skip=${skip}&limit=25${projectQuery}`,
      { signal: controller.signal },
    )
      .then((data) => {
        if (controller.signal.aborted) return
        setRows(data.items)
        setTotal(data.total)
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setError(workflowError(error))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [config.endpoint, skip, projectFilter, reload])

  useEffect(() => {
    const controller = new AbortController()

    setProjectLoading(true)
    setProjectError('')

    workflowRequest<{ items: Project[] }>('/api/projects', {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setProjects(data.items)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setProjectError(workflowError(error))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setProjectLoading(false)
      })

    return () => controller.abort()
  }, [reload])

  useEffect(() => {
    const controller = new AbortController()

    setParcels([])
    setParcelError('')

    if (!open || !draft.projectId) {
      setParcelLoading(false)
      return () => controller.abort()
    }

    setParcelLoading(true)

    workflowRequest<{ items: Parcel[] }>(
      `/api/parcels?projectId=${encodeURIComponent(draft.projectId)}&limit=100`,
      { signal: controller.signal },
    )
      .then((data) => {
        if (!controller.signal.aborted) setParcels(data.items)
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setParcelError(workflowError(error))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setParcelLoading(false)
      })

    return () => controller.abort()
  }, [draft.projectId, open, retryParcels])

  useEffect(() => {
    if (open) formRef.current?.focus()
  }, [open, editing])

  useEffect(() => {
    if (!selected) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    requestAnimationFrame(() => {
      detailsCloseRef.current?.focus({ preventScroll: true })
    })

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDetails()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [selected?.id])

  function openDetails(row: Row, trigger?: HTMLElement) {
    detailsReturnFocusRef.current = trigger ?? null
    setSelected(row)
  }

  function closeDetails() {
    setSelected(null)

    requestAnimationFrame(() => {
      const target = detailsReturnFocusRef.current

      if (target?.isConnected) {
        target.focus({ preventScroll: true })
      }

      detailsReturnFocusRef.current = null
    })
  }

  function start(row?: Row) {
    if (!canManageWorkflow) return
    if (dirty && !window.confirm('Discard unsaved changes?')) return

    const fresh = defaults(config)

    if (row) {
      for (const key of Object.keys(fresh)) {
        fresh[key] = row[key] == null ? '' : String(row[key])
      }
    } else {
      fresh.projectId = projectFilter || projects[0]?.id || ''
    }

    setDraft(fresh)
    setEditing(row?.id ?? null)
    setOpen(true)
    setDirty(false)
    setSaveError('')
    setSuccess('')
  }

  function change(key: string, value: string) {
    setDirty(true)
    setSaveError('')

    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key === 'projectId' ? { parcelId: '' } : {}),
    }))
  }

  function cancel() {
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    setOpen(false)
    setDirty(false)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canManageWorkflow || lock.current) return

    lock.current = true
    setSaving(true)
    setSaveError('')
    setSuccess('')

    const payload: Record<string, unknown> = {
      ...draft,
      isDemo: draft.isDemo === 'true',
    }

    for (const key of ['parcelId', 'sourceName', 'sourceUrl']) {
      payload[key] = draft[key].trim() || null
    }

    for (const field of config.fields) {
      payload[field.key] =
        field.type === 'date'
          ? draft[field.key] || null
          : draft[field.key].trim()
    }

    try {
      const result = await workflowRequest<Row>(
        editing ? `${config.endpoint}/${editing}` : config.endpoint,
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      setSelected(result)
      setOpen(false)
      setDirty(false)
      setSuccess(
        editing ? 'Changes saved.' : 'Record created and saved.',
      )
      setReload((value) => value + 1)
    } catch (error) {
      setSaveError(workflowError(error))
    } finally {
      lock.current = false
      setSaving(false)
    }
  }

  const filtered = rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    ),
  )

  function numberValue(value: unknown) {
    const numeric =
      typeof value === 'number'
        ? value
        : typeof value === 'string' && value.trim() !== ''
          ? Number(value)
          : Number.NaN

    return Number.isFinite(numeric) ? numeric : null
  }

  function derivedValue(row: Row, key: string) {
    if (config.endpoint !== '/api/compensation') {
      return row[key]
    }

    if (key === 'balance') {
      const approved = numberValue(row.approved)
      const disbursed = numberValue(row.disbursed)

      if (approved !== null && disbursed !== null) {
        return Math.max(0, approved - disbursed)
      }
    }

    if (key === 'paymentStatus') {
      const approved = numberValue(row.approved)
      const disbursed = numberValue(row.disbursed)

      if (approved !== null && disbursed !== null) {
        if (approved === 0) return 'No amount approved'
        if (disbursed <= 0) return 'Not paid'
        if (disbursed >= approved) return 'Paid'
        return 'Partially paid'
      }
    }

    return row[key]
  }

  function displayValue(row: Row, key: string) {
    const value = derivedValue(row, key)

    if (
      config.endpoint === '/api/compensation' &&
      ['approved', 'disbursed', 'balance'].includes(key)
    ) {
      const numeric = numberValue(value)

      if (numeric !== null) {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(numeric)
      }
    }

    return shown(value)
  }

  const detailFields = [
    { key: 'id', label: 'Record ID' },
    { key: 'project', label: 'Project' },
    { key: 'parcelId', label: 'Parcel ID' },
    ...config.fields,
    ...(config.endpoint === '/api/compensation'
      ? [
          { key: 'balance', label: 'Balance (INR)' },
          { key: 'paymentStatus', label: 'Recorded payment status' },
        ]
      : []),
    { key: 'sourceName', label: 'Source' },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <div className="wf-page">
      <style>{`
        .wf-page .wf-detail-backdrop {
          position: fixed;
          inset: 0;
          z-index: 110;
          display: flex;
          justify-content: flex-end;
          background: rgba(15, 34, 28, 0.42);
          backdrop-filter: blur(2px);
          animation: wf-detail-fade .18s ease-out;
        }

        .wf-page .wf-detail-drawer {
          display: flex;
          width: min(540px, 94vw);
          height: 100dvh;
          flex-direction: column;
          overflow: hidden;
          border-left: 1px solid #d5dfd2;
          background: #fbfcf9;
          box-shadow: -24px 0 60px rgba(21, 53, 44, 0.18);
          animation: wf-detail-slide .24s cubic-bezier(.22,1,.36,1);
        }

        .wf-page .wf-detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 24px 24px 20px;
          background:
            linear-gradient(135deg, #173f35 0%, #28584a 100%);
          color: #fff;
        }

        .wf-page .wf-detail-eyebrow {
          margin: 0 0 7px;
          color: #d7c58e;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .14em;
          text-transform: uppercase;
        }

        .wf-page .wf-detail-header h2 {
          margin: 0;
          color: #fff;
          font-size: 22px;
          line-height: 1.2;
        }

        .wf-page .wf-detail-header p:last-child {
          margin: 7px 0 0;
          color: rgba(255,255,255,.76);
          font-size: 11px;
          line-height: 1.5;
        }

        .wf-page .wf-detail-close {
          display: grid;
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          place-items: center;
          border: 1px solid rgba(255,255,255,.24);
          border-radius: 10px;
          background: rgba(255,255,255,.08);
          color: #fff;
          cursor: pointer;
        }

        .wf-page .wf-detail-close:hover {
          background: rgba(255,255,255,.14);
        }

        .wf-page .wf-detail-body {
          flex: 1;
          overflow-y: auto;
          padding: 22px 24px 26px;
        }

        .wf-page .wf-detail-statusbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }

        .wf-page .wf-detail-chip {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 6px 9px;
          border: 1px solid #dbe4d7;
          border-radius: 999px;
          background: #f0f5ed;
          color: #466257;
          font-size: 10px;
          font-weight: 700;
        }

        .wf-page .wf-detail-chip.demo {
          border-color: #eadbb8;
          background: #fbf4e5;
          color: #85672d;
        }

        .wf-page .wf-detail-facts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin: 0;
        }

        .wf-page .wf-detail-facts > div {
          min-width: 0;
          border: 1px solid #dfe7dc;
          border-radius: 11px;
          background: #fff;
          padding: 12px 13px;
        }

        .wf-page .wf-detail-facts > div.wide {
          grid-column: 1 / -1;
        }

        .wf-page .wf-detail-facts dt {
          margin-bottom: 5px;
          color: #78877f;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .wf-page .wf-detail-facts dd {
          margin: 0;
          overflow-wrap: anywhere;
          color: #173f35;
          font-size: 12px;
          font-weight: 650;
          line-height: 1.5;
        }

        .wf-page .wf-detail-source {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 16px;
          color: #173f35;
          font-size: 11px;
          font-weight: 750;
        }

        .wf-page .wf-detail-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          border-top: 1px solid #dfe7dc;
          background: #fff;
          padding: 16px 24px calc(16px + env(safe-area-inset-bottom));
        }

        .wf-page .wf-detail-footer button,
        .wf-page .wf-detail-footer .wf-link {
          min-height: 39px;
        }

        .wf-page .wf-view-active {
          border-color: #b88d38 !important;
          box-shadow: 0 0 0 3px rgba(184, 141, 56, .10);
        }

        @keyframes wf-detail-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes wf-detail-slide {
          from { transform: translateX(28px); opacity: .6; }
          to { transform: translateX(0); opacity: 1; }
        }

        @media (max-width: 620px) {
          .wf-page .wf-detail-drawer {
            width: 100%;
          }

          .wf-page .wf-detail-facts {
            grid-template-columns: 1fr;
          }

          .wf-page .wf-detail-facts > div.wide {
            grid-column: auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .wf-page .wf-detail-backdrop,
          .wf-page .wf-detail-drawer {
            animation: none;
          }
        }
      `}</style>

      <header className="wf-nav">
        <Link to="/projects" className="wf-brand">Liva.</Link>

        <nav aria-label="Workspace">
          <Link to="/dashboard">Overview</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/compensation">Compensation</Link>
          <Link to="/rehabilitation">R&R</Link>
          <Link to="/actions">Actions</Link>
          <Link to="/reports">Reports</Link>
        </nav>
      </header>

      <main className="wf-main">
        <section
          className="wf-hero"
          style={
            config.image
              ? {
                  backgroundImage:
                    `linear-gradient(90deg,rgba(25,63,54,.98),rgba(25,63,54,.65)), url('${config.image}')`,
                }
              : undefined
          }
        >
          <p>LIVA WORKSPACE</p>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </section>

        <p className="wf-note">
          Saved records include demos. Adding a source does not
          independently verify a record.
        </p>

        <section className="wf-box">
          <div className="wf-buttons">
            {canManageWorkflow && (
              <button
                disabled={
                  saving ||
                  projectLoading ||
                  !!projectError ||
                  !projects.length
                }
                onClick={() => start()}
              >
                <Plus size={16} /> Add record
              </button>
            )}

            <button
              disabled={loading || saving}
              onClick={() => setReload((value) => value + 1)}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {projectLoading && <p role="status">Loading projects…</p>}

          {projectError && (
            <p className="wf-error" role="alert">
              Projects: {projectError} Use Refresh to retry.
            </p>
          )}

          {!projectLoading && !projectError && !projects.length && (
            <p>Create a project before adding records.</p>
          )}

          {success && (
            <p className="wf-success" role="status">{success}</p>
          )}
        </section>

        {open && (
          <section
            ref={formRef}
            tabIndex={-1}
            className="wf-box"
            aria-labelledby="wf-form-heading"
          >
            <h2 id="wf-form-heading">
              {editing ? 'Edit record' : 'Create record'}
            </h2>

            <form onSubmit={save}>
              <fieldset disabled={saving}>
                <div className="wf-grid">
                  <label>
                    Project *
                    <select
                      required
                      value={draft.projectId}
                      onChange={(event) =>
                        change('projectId', event.target.value)
                      }
                    >
                      <option value="">Select project</option>

                      {draft.projectId &&
                        !projects.some((p) => p.id === draft.projectId) && (
                          <option value={draft.projectId}>
                            Current linked project
                          </option>
                        )}

                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Parcel — optional
                    <select
                      value={draft.parcelId}
                      disabled={parcelLoading || !!parcelError}
                      onChange={(event) =>
                        change('parcelId', event.target.value)
                      }
                    >
                      <option value="">Project-level record</option>

                      {draft.parcelId &&
                        !parcels.some((p) => p.id === draft.parcelId) && (
                          <option value={draft.parcelId}>
                            Current parcel: {draft.parcelId}
                          </option>
                        )}

                      {parcels.map((parcel) => (
                        <option key={parcel.id} value={parcel.id}>
                          {parcel.surveyNumber} — {parcel.village}
                        </option>
                      ))}
                    </select>
                  </label>

                  {config.fields.map((field) => (
                    <label
                      key={field.key}
                      className={
                        field.type === 'textarea' ? 'wf-wide' : ''
                      }
                    >
                      {field.label}{field.required ? ' *' : ''}

                      {field.type === 'select' ? (
                        <select
                          value={draft[field.key]}
                          required={field.required}
                          onChange={(event) =>
                            change(field.key, event.target.value)
                          }
                        >
                          {field.options?.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={draft[field.key]}
                          maxLength={field.max || 5000}
                          rows={4}
                          onChange={(event) =>
                            change(field.key, event.target.value)
                          }
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={draft[field.key]}
                          required={field.required}
                          minLength={field.minLength}
                          maxLength={field.max}
                          min={field.type === 'number' ? '0' : undefined}
                          step={
                            field.type === 'number' ? '.01' : undefined
                          }
                          onChange={(event) =>
                            change(field.key, event.target.value)
                          }
                        />
                      )}
                    </label>
                  ))}

                  <label>
                    Record type
                    <select
                      value={draft.isDemo}
                      onChange={(event) =>
                        change('isDemo', event.target.value)
                      }
                    >
                      <option value="true">Demo — illustrative</option>
                      <option value="false">Source-backed record</option>
                    </select>
                  </label>

                  <label>
                    Source name{draft.isDemo === 'false' ? ' *' : ''}
                    <input
                      value={draft.sourceName}
                      maxLength={200}
                      required={draft.isDemo === 'false'}
                      onChange={(event) =>
                        change('sourceName', event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Source URL{draft.isDemo === 'false' ? ' *' : ''}
                    <input
                      type="url"
                      value={draft.sourceUrl}
                      required={draft.isDemo === 'false'}
                      placeholder="https://..."
                      onChange={(event) =>
                        change('sourceUrl', event.target.value)
                      }
                    />
                  </label>

                  <label className="wf-wide">
                    Notes / evidence references
                    <textarea
                      rows={4}
                      maxLength={5000}
                      value={draft.notes}
                      onChange={(event) =>
                        change('notes', event.target.value)
                      }
                    />
                  </label>
                </div>

                <p className="wf-note">
                  Selectors show the latest 100 projects and latest
                  100 parcels for the selected project. Existing
                  links outside that list are preserved.
                </p>

                {parcelLoading && (
                  <p role="status">Loading parcels…</p>
                )}

                {parcelError && (
                  <div className="wf-error" role="alert">
                    <p>{parcelError}</p>
                    <button
                      type="button"
                      onClick={() => setRetryParcels((value) => value + 1)}
                    >
                      Retry parcels
                    </button>
                  </div>
                )}

                {saveError && (
                  <p className="wf-error" role="alert">{saveError}</p>
                )}

                <div className="wf-buttons">
                  <button type="submit">
                    {saving ? 'Saving…' : 'Save record'}
                  </button>
                  <button
                    type="button"
                    className="wf-secondary"
                    onClick={cancel}
                  >
                    Cancel
                  </button>
                </div>
              </fieldset>
            </form>
          </section>
        )}

        <section className="wf-box">
          <div className="wf-grid">
            <label>
              Search this page
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Reference, project, officer…"
              />
            </label>

            <label>
              Project filter
              <select
                value={projectFilter}
                onChange={(event) => {
                  setProjectFilter(event.target.value)
                  setSkip(0)
                }}
              >
                <option value="">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <p role="status">Loading records…</p>
          ) : error ? (
            <p className="wf-error" role="alert">
              {error} Use Refresh to retry.
            </p>
          ) : (
            <>
              <p>
                {filtered.length} shown on this page · {total} saved
                records matching the project filter
              </p>

              <div className="wf-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Project / record type</th>
                      {config.columns.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                      <th>Details</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {row.project}
                          <small>
                            {row.isDemo ? 'Demo' : 'Source-backed'}
                          </small>
                        </td>

                        {config.columns.map((column) => (
                          <td key={column.key}>
                            {displayValue(row, column.key)}
                          </td>
                        ))}

                        <td>
                          <button
                            className={`wf-secondary ${
                              selected?.id === row.id ? 'wf-view-active' : ''
                            }`}
                            aria-expanded={selected?.id === row.id}
                            onClick={(event) =>
                              openDetails(row, event.currentTarget)
                            }
                          >
                            View <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!filtered.length && (
                <p>No matching records on this page.</p>
              )}

              <div className="wf-buttons">
                <button
                  disabled={skip === 0}
                  onClick={() => setSkip((value) => Math.max(0, value - 25))}
                >
                  Previous
                </button>
                <button
                  disabled={skip + 25 >= total}
                  onClick={() => setSkip((value) => value + 25)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>

        {selected && (
          <div
            className="wf-detail-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeDetails()
              }
            }}
          >
            <aside
              className="wf-detail-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="wf-detail-title"
            >
              <header className="wf-detail-header">
                <div>
                  <p className="wf-detail-eyebrow">
                    {config.endpoint === '/api/compensation'
                      ? 'COMPENSATION RECORD'
                      : config.endpoint === '/api/rehabilitation'
                        ? 'R&R RECORD'
                        : 'WORKFLOW RECORD'}
                  </p>

                  <h2 id="wf-detail-title">
                    {typeof selected.reference === 'string' &&
                    selected.reference
                      ? selected.reference
                      : typeof selected.familyReference === 'string' &&
                          selected.familyReference
                        ? selected.familyReference
                        : 'Record details'}
                  </h2>

                  <p>
                    {selected.project || 'Linked LIVA project'}
                  </p>
                </div>

                <button
                  ref={detailsCloseRef}
                  type="button"
                  className="wf-detail-close"
                  aria-label="Close record details"
                  onClick={closeDetails}
                >
                  <X size={19} aria-hidden="true" />
                </button>
              </header>

              <div className="wf-detail-body">
                <div className="wf-detail-statusbar">
                  <span
                    className={`wf-detail-chip ${
                      selected.isDemo ? 'demo' : ''
                    }`}
                  >
                    {selected.isDemo
                      ? 'Illustrative demo'
                      : 'Source-backed'}
                  </span>

                  {config.endpoint === '/api/compensation' && (
                    <span className="wf-detail-chip">
                      {displayValue(selected, 'paymentStatus')}
                    </span>
                  )}

                  {typeof selected.status === 'string' &&
                    selected.status && (
                      <span className="wf-detail-chip">
                        {selected.status}
                      </span>
                    )}
                </div>

                <dl className="wf-detail-facts">
                  {detailFields.map((field) => {
                    const wide =
                      field.key === 'notes' ||
                      field.key === 'id' ||
                      field.key === 'project'

                    return (
                      <div
                        key={field.key}
                        className={wide ? 'wide' : undefined}
                      >
                        <dt>{field.label}</dt>
                        <dd>{displayValue(selected, field.key)}</dd>
                      </div>
                    )
                  })}
                </dl>

                {typeof selected.sourceUrl === 'string' &&
                  /^https?:\/\//i.test(selected.sourceUrl) && (
                    <a
                      className="wf-detail-source"
                      href={selected.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open source
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  )}
              </div>

              <footer className="wf-detail-footer">
                {canManageWorkflow && (
                  <button
                    disabled={saving}
                    onClick={() => {
                      closeDetails()
                      start(selected)
                    }}
                  >
                    <PencilLine size={15} aria-hidden="true" />
                    Edit record
                  </button>
                )}

                <Link
                  className="wf-link"
                  to={`/projects/${selected.projectId}`}
                >
                  Open project
                </Link>

                <button
                  type="button"
                  className="wf-secondary"
                  onClick={closeDetails}
                >
                  Close
                </button>
              </footer>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}