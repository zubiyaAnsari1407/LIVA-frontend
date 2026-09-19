import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Clock3,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from 'lucide-react'

import {
  workflowRequest,
  workflowError,
} from '../services/workflowApi'
import {
  useAuth,
} from '../auth/AuthContext'
import '../styles/actions.css'

const STATUSES = [
  'Open',
  'In progress',
  'Blocked',
  'Completed',
] as const

const PRIORITIES = ['High', 'Medium', 'Low'] as const

type Status = (typeof STATUSES)[number]
type Priority = (typeof PRIORITIES)[number]

type Project = {
  id: string
  name: string
}

type Task = {
  id: string
  title: string
  projectId: string
  project: string
  parcelId: string | null
  officer: string
  priority: Priority
  status: Status
  dueDate: string | null
  notes: string
  isDemo: boolean
  sourceName: string | null
  sourceUrl: string | null
}

type Draft = {
  title: string
  projectId: string
  parcelId: string
  officer: string
  priority: Priority
  status: Status
  dueDate: string
  notes: string
  isDemo: boolean
  sourceName: string
  sourceUrl: string
}

const emptyDraft: Draft = {
  title: '',
  projectId: '',
  parcelId: '',
  officer: '',
  priority: 'Medium',
  status: 'Open',
  dueDate: '',
  notes: '',
  isDemo: true,
  sourceName: '',
  sourceUrl: '',
}

function localDate() {
  const now = new Date()

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatDate(value: string | null) {
  if (!value) return 'No due date'

  const date = new Date(`${value}T00:00:00`)

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
}

function toDraft(task: Task): Draft {
  return {
    title: task.title,
    projectId: task.projectId,
    parcelId: task.parcelId ?? '',
    officer: task.officer ?? '',
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ?? '',
    notes: task.notes ?? '',
    isDemo: task.isDemo,
    sourceName: task.sourceName ?? '',
    sourceUrl: task.sourceUrl ?? '',
  }
}

function toPayload(draft: Draft) {
  return {
    title: draft.title.trim(),
    projectId: draft.projectId,
    parcelId: draft.parcelId || null,
    officer: draft.officer.trim(),
    priority: draft.priority,
    status: draft.status,
    dueDate: draft.dueDate || null,
    notes: draft.notes.trim(),
    isDemo: draft.isDemo,
    sourceName: draft.sourceName.trim() || null,
    sourceUrl: draft.sourceUrl.trim() || null,
  }
}

export default function ActionPage() {
  const {
    can,
  } = useAuth()

  const canManageActions =
    can('actions.manage')

  const [tasks, setTasks] =
    useState<Task[]>([])

  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)

  const [loading, setLoading] = useState(true)
  const [projectLoading, setProjectLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [projectError, setProjectError] = useState('')
  const [formError, setFormError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [notice, setNotice] = useState('')
  const [reload, setReload] = useState(0)

  const [tab, setTab] = useState<'tasks' | 'alerts'>('tasks')
  const [view, setView] = useState<'list' | 'board'>('list')
  const [query, setQuery] = useState('')
  const [project, setProject] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')

  const [selected, setSelected] = useState<Task | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>({ ...emptyDraft })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [today, setToday] = useState(localDate)

  const createDialog = useRef<HTMLDialogElement>(null)
  const detailsDialog = useRef<HTMLDialogElement>(null)
  const saveLock = useRef(false)
  const statusLock = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    setLoadError('')

    const projectQuery = project
      ? `&projectId=${encodeURIComponent(project)}`
      : ''

    workflowRequest<{ items: Task[]; total: number }>(
      `/api/actions?skip=${skip}&limit=100${projectQuery}`,
      { signal: controller.signal },
    )
      .then((data) => {
        if (controller.signal.aborted) return

        setTasks(data.items)
        setTotal(data.total)
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setLoadError(workflowError(error))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [reload, skip, project])

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
    const refresh = () => setToday(localDate())
    const timer = window.setInterval(refresh, 60_000)

    window.addEventListener('focus', refresh)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const isOverdue = (task: Task) =>
    task.status !== 'Completed' &&
    Boolean(task.dueDate) &&
    task.dueDate! < today

  const overdueTasks = tasks.filter(isOverdue)
  const search = query.trim().toLowerCase()

  const filteredTasks = tasks.filter(
    (task) =>
      (!search ||
        `${task.title} ${task.project} ${task.officer}`
          .toLowerCase()
          .includes(search)) &&
      (!priority || task.priority === priority) &&
      (!status || task.status === status),
  )

  const visibleAlerts = filteredTasks.filter(isOverdue)
  const hasFilters = Boolean(query || project || priority || status)
  const busy = saving || updatingId !== null
  const summaryAvailable = !loading && !loadError

  function clearFilters() {
    setQuery('')
    setProject('')
    setPriority('')
    setStatus('')
    setSkip(0)
  }

  function changeDraft<K extends keyof Draft>(
    key: K,
    value: Draft[K],
  ) {
    setDirty(true)
    setFormError('')

    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key === 'projectId' ? { parcelId: '' } : {}),
    }))
  }

  function closeForm() {
    if (saveLock.current) return

    if (dirty && !window.confirm('Discard unsaved changes?')) {
      return
    }

    createDialog.current?.close()
    setDirty(false)
  }

function openCreate() {
  if (!canManageActions) {
    return
  }

  setEditingId(null)

  setDraft({
    ...emptyDraft,
    projectId:
      project ||
      projects[0]?.id ||
      '',
  })

  setDirty(false)
  setFormError('')
  setNotice('')

  createDialog.current
    ?.showModal()
}
  function openDetails(task: Task) {
    setSelected(task)
    setStatusError('')
    detailsDialog.current?.showModal()
  }

function openEdit(
  task: Task,
) {
  if (!canManageActions) {
    return
  }

  detailsDialog.current
    ?.close()

  setEditingId(
    task.id,
  )

  setDraft(
    toDraft(task),
  )

  setDirty(false)
  setFormError('')
  setNotice('')

  createDialog.current
    ?.showModal()
}

  function applySavedTask(saved: Task) {
    setTasks((current) =>
      current.map((task) => task.id === saved.id ? saved : task),
    )

    setSelected((current) =>
      current?.id === saved.id ? saved : current,
    )
  }
async function saveTask(
  event:
    FormEvent<HTMLFormElement>,
) {
  event.preventDefault()

  if (!canManageActions) {
    return
  }

  if (
    saveLock.current ||
    statusLock.current
  ) {
    return
  }
    saveLock.current = true
    setSaving(true)
    setFormError('')
    setNotice('')

    try {
      const saved = await workflowRequest<Task>(
        editingId ? `/api/actions/${editingId}` : '/api/actions',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toPayload(draft)),
        },
      )

      if (editingId) applySavedTask(saved)

      setNotice(
        editingId
          ? 'Task changes saved to the database.'
          : 'Task created and saved to the database.',
      )

      setDirty(false)
      setTab('tasks')
      clearFilters()
      createDialog.current?.close()
      setReload((value) => value + 1)
    } catch (error) {
      setFormError(workflowError(error))
    } finally {
      saveLock.current = false
      setSaving(false)
    }
  }

 async function updateStatus(
  task: Task,
  nextStatus: Status,
) {
  if (!canManageActions) {
    return
  }

  if (
    statusLock.current ||
    saveLock.current ||
    task.status === nextStatus
  ) {
    return
  }

    statusLock.current = true
    setUpdatingId(task.id)
    setStatusError('')
    setNotice('')

    try {
      // Preserve the latest saved fields when changing just status.
      const latest = await workflowRequest<Task>(
        `/api/actions/${task.id}`,
      )

      const payload = toPayload({
        ...toDraft(latest),
        status: nextStatus,
      })

      const saved = await workflowRequest<Task>(
        `/api/actions/${task.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      applySavedTask(saved)
      setNotice('Task status saved to the database.')
    } catch (error) {
      setStatusError(workflowError(error))
    } finally {
      statusLock.current = false
      setUpdatingId(null)
    }
  }

  function renderTask(task: Task) {
    return (
      <article className="ac-task" key={task.id}>
        <div className="ac-task-top">
          <span
            className={`ac-priority ac-priority-${task.priority.toLowerCase()}`}
          >
            {task.priority} priority
          </span>

          {isOverdue(task) && (
            <span className="ac-overdue">Overdue</span>
          )}
        </div>

        <button
          type="button"
          className="ac-task-title"
          onClick={() => openDetails(task)}
        >
          {task.title}
        </button>

        <p className="ac-project">{task.project}</p>

        <p className="ac-preview">
          {task.isDemo ? 'Demo record' : 'Source-backed record'}
        </p>

        <div className="ac-task-meta">
          <span>
            <UserRound size={14} aria-hidden="true" />
            {task.officer || 'Unassigned'}
          </span>
          <span>
            <CalendarDays size={14} aria-hidden="true" />
            {formatDate(task.dueDate)}
          </span>
        </div>

        <div className="ac-task-bottom">
          <select
  aria-label={`Status for ${task.title}`}
  value={task.status}
  disabled={
    busy ||
    !canManageActions
  }
          >
            {STATUSES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <button
            type="button"
            className="ac-text-button"
            onClick={() => openDetails(task)}
          >
            Details <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </article>
    )
  }

  return (
    <div className="ac-page">
      <style>{`
        .ac-page .ac-primary {
          background: #193f36;
          color: #fff !important;
        }

        .ac-page .ac-dialog-header {
          background: #193f36;
        }

        .ac-page .ac-dialog-header h2 {
          color: #fff !important;
        }

        .ac-page .ac-dialog-header .ac-eyebrow {
          color: #e1c782;
        }

        .ac-page .ac-api-success {
          padding: 12px 16px;
          background: #edf4e5;
          border: 1px solid #ccdcbc;
          border-radius: 6px;
          color: #193f36;
          margin: 14px 0;
        }

        .ac-page .ac-api-fieldset {
          border: 0;
          padding: 0;
          margin: 0;
          min-width: 0;
          display: grid;
          gap: 18px;
        }

        .ac-page .ac-api-pagination {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 18px;
        }

        .ac-page .ac-api-note {
          font-size: 12px;
          line-height: 1.6;
          color: #52634f;
        }

        .ac-page .ac-board {
          grid-template-columns: repeat(4, minmax(240px, 1fr));
          overflow-x: auto;
        }

        .ac-page .ac-description {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .ac-page button:disabled {
          cursor: default;
          opacity: .6;
        }
      `}</style>

      <a href="#ac-main" className="ac-skip">
        Skip to Action Centre
      </a>

      <header className="ac-header">
        <Link to="/" className="ac-brand">
          Liva<span>.</span>
        </Link>

        <nav aria-label="Workspace navigation">
          <Link to="/dashboard">Overview</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/compensation">Compensation</Link>
          <Link to="/rehabilitation">R&R</Link>
          <Link to="/actions" aria-current="page">
            Action Centre
          </Link>
        </nav>

        <Link to="/dashboard" className="ac-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Dashboard
        </Link>
      </header>

      <main id="ac-main" className="ac-main">
        <div className="ac-breadcrumb">
          <Link to="/dashboard">Workspace</Link>
          <span>/</span>
          <span>Action Centre & Alerts</span>
        </div>

        <section className="ac-intro">
          <div>
            <p className="ac-eyebrow">
              TURN FOLLOW-UPS INTO PROGRESS
            </p>

            <h1>Every action. A clear next step.</h1>

            <p>
              Organise project tasks, track responsibilities and
              keep pending work moving.
            </p>
          </div>

          <button
            type="button"
            className="ac-primary"
            disabled={
              busy ||
              projectLoading ||
              !!projectError ||
              !projects.length
            }
            onClick={openCreate}
          >
            <Plus size={18} aria-hidden="true" />
            Create task
          </button>
        </section>

        <p className="ac-preview">
          Database-backed tasks · Includes demo records ·
          Officer assignments do not send notifications
        </p>

        <button
          type="button"
          className="ac-secondary"
          disabled={loading || busy}
          onClick={() => setReload((value) => value + 1)}
        >
          <RefreshCw size={15} aria-hidden="true" />
          Refresh
        </button>

        {projectLoading && (
          <p role="status">Loading project choices…</p>
        )}

        {projectError && (
          <p className="ac-warning" role="alert">
            Projects: {projectError} Use Refresh to retry.
          </p>
        )}

        {!projectLoading && !projectError && !projects.length && (
          <p className="ac-warning">
            Create a project before adding a task.
          </p>
        )}

        {statusError && (
          <p className="ac-warning" role="alert">{statusError}</p>
        )}

        {notice && (
          <p className="ac-api-success" role="status">{notice}</p>
        )}

        <p className="ac-api-note">
          Counts and overdue alerts below cover the currently loaded
          page of up to 100 tasks. Dashboard summary counts all saved tasks.
        </p>

        <section className="ac-stats" aria-label="Loaded task summary">
          {[
            {
              label: 'Open tasks',
              count: tasks.filter(
                (task) => task.status !== 'Completed',
              ).length,
              icon: ClipboardList,
              note: 'Not completed on this page',
            },
            {
              label: 'In progress',
              count: tasks.filter(
                (task) => task.status === 'In progress',
              ).length,
              icon: Clock3,
              note: 'Currently being worked on',
            },
            {
              label: 'Overdue',
              count: overdueTasks.length,
              icon: Bell,
              note: 'Past the recorded due date',
            },
            {
              label: 'Completed',
              count: tasks.filter(
                (task) => task.status === 'Completed',
              ).length,
              icon: CheckCheck,
              note: 'Recorded as completed',
            },
          ].map(({ label, count, icon: Icon, note }) => (
            <article key={label}>
              <span className="ac-stat-icon">
                <Icon
                  size={23}
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
              </span>

              <div>
                <h2>{label}</h2>
                <strong>{summaryAvailable ? count : '—'}</strong>
                <p>{note}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="ac-workspace" aria-label="Tasks and alerts">
          <div className="ac-toolbar">
            <div
              className="ac-tabs"
              role="group"
              aria-label="Workspace section"
            >
              <button
                type="button"
                aria-pressed={tab === 'tasks'}
                onClick={() => setTab('tasks')}
              >
                <ClipboardList size={17} aria-hidden="true" />
                Tasks
                <span>{summaryAvailable ? tasks.length : '—'}</span>
              </button>

              <button
                type="button"
                aria-pressed={tab === 'alerts'}
                onClick={() => setTab('alerts')}
              >
                <Bell size={17} aria-hidden="true" />
                Alerts
                <span>{summaryAvailable ? overdueTasks.length : '—'}</span>
              </button>
            </div>

            {tab === 'tasks' && (
              <div
                className="ac-view-switch"
                role="group"
                aria-label="Task view"
              >
                <button
                  type="button"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                >
                  <List size={16} aria-hidden="true" />
                  List
                </button>

                <button
                  type="button"
                  aria-pressed={view === 'board'}
                  onClick={() => setView('board')}
                >
                  <LayoutGrid size={16} aria-hidden="true" />
                  Board
                </button>
              </div>
            )}
          </div>

          <div className="ac-filters">
            <label className="ac-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search loaded tasks"
                placeholder="Search this page: task, project or officer…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <select
              aria-label="Filter by project"
              value={project}
              disabled={busy}
              onChange={(event) => {
                setProject(event.target.value)
                setSkip(0)
              }}
            >
              <option value="">All projects</option>
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {STATUSES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="ac-results">
            <p role="status">
              {loading
                ? 'Loading saved tasks…'
                : loadError
                  ? 'Tasks could not be loaded.'
                  : tab === 'tasks'
                    ? `${filteredTasks.length} shown · ${total} saved for the project filter`
                    : `${visibleAlerts.length} overdue alerts on this page`}
            </p>

            {hasFilters && (
              <button
                type="button"
                className="ac-text-button"
                onClick={clearFilters}
              >
                <X size={14} aria-hidden="true" />
                Clear filters
              </button>
            )}
          </div>

          {loadError ? (
            <p className="ac-warning" role="alert">
              {loadError} Use Refresh to retry.
            </p>
          ) : loading ? (
            <div className="ac-empty">
              <p>Loading tasks from the database…</p>
            </div>
          ) : tab === 'tasks' ? (
            filteredTasks.length === 0 ? (
              <div className="ac-empty">
                <ClipboardList
                  size={40}
                  strokeWidth={1.3}
                  aria-hidden="true"
                />

                <h2>
                  {hasFilters || total
                    ? 'No matching tasks on this page.'
                    : 'Give the next step a place.'}
                </h2>

                <p>
                  Create a saved task with a project, responsible
                  officer, priority and due date.
                </p>

                {hasFilters ? (
  <button
    type="button"
    className="ac-primary"
    onClick={
      clearFilters
    }
  >
    Clear filters

    <ArrowRight
      size={16}
      aria-hidden="true"
    />
  </button>
) : canManageActions ? (
  <button
    type="button"
    className="ac-primary"
    disabled={
      busy ||
      projectLoading ||
      !!projectError ||
      !projects.length
    }
    onClick={
      openCreate
    }
  >
    Create your first task

    <ArrowRight
      size={16}
      aria-hidden="true"
    />
  </button>
) : (
  <p className="ac-api-note">
    Read-only access.
    Task creation is available
    to project officers and
    administrators.
  </p>
)}
              </div>
            ) : view === 'list' ? (
              <div className="ac-task-list">
                {filteredTasks.map(renderTask)}
              </div>
            ) : (
              <div className="ac-board">
                {STATUSES.map((column) => {
                  const items = filteredTasks.filter(
                    (task) => task.status === column,
                  )

                  return (
                    <section className="ac-column" key={column}>
                      <h2>{column}<span>{items.length}</span></h2>

                      <div className="ac-column-items">
                        {items.length ? (
                          items.map(renderTask)
                        ) : (
                          <p className="ac-column-empty">
                            No tasks in this stage.
                          </p>
                        )}
                      </div>
                    </section>
                  )
                })}
              </div>
            )
          ) : (
            <div className="ac-alerts">
              <p className="ac-alert-note">
                Alerts are calculated from due dates on loaded tasks.
                They are not AI predictions or sent notifications.
              </p>

              {visibleAlerts.length ? (
                visibleAlerts.map((task) => (
                  <article className="ac-alert" key={task.id}>
                    <span className="ac-alert-icon">
                      <Bell size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <span className="ac-overdue">Task overdue</span>
                      <h3>{task.title}</h3>
                      <p>
                        {task.project} · Due {formatDate(task.dueDate)}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="ac-text-button"
                      onClick={() => openDetails(task)}
                    >
                      Review task
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  </article>
                ))
              ) : (
                <div className="ac-empty">
                  <CheckCheck
                    size={40}
                    strokeWidth={1.3}
                    aria-hidden="true"
                  />
                  <h2>No matching overdue tasks on this page.</h2>
                  <p>
                    Incomplete tasks with a past due date appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && !loadError && (
            <div className="ac-api-pagination">
              <button
                className="ac-secondary"
                disabled={skip === 0 || busy}
                onClick={() => setSkip((value) => Math.max(0, value - 100))}
              >
                Previous
              </button>

              <span>Page {Math.floor(skip / 100) + 1}</span>

              <button
                className="ac-secondary"
                disabled={skip + 100 >= total || busy}
                onClick={() => setSkip((value) => value + 100)}
              >
                Next
              </button>
            </div>
          )}
        </section>

        <section className="ac-guide">
          <div>
            <p className="ac-eyebrow">A SIMPLE WORKFLOW</p>
            <h2>Plan it. Progress it. Close the loop.</h2>
          </div>
          <p>
            Create the next action, record who is responsible and
            update its status as work progresses. Use Edit task
            to update the description and follow-up notes.
          </p>
        </section>
      </main>

      <footer className="ac-footer">
        <strong>Liva</strong>
        <span>Better land decisions. Stronger communities.</span>
      </footer>

      <dialog
        ref={createDialog}
        className="ac-dialog"
        aria-labelledby="ac-create-title"
        onCancel={(event) => {
          event.preventDefault()
          closeForm()
        }}
      >
        <div className="ac-dialog-header">
          <div>
            <p className="ac-eyebrow">PLAN THE NEXT STEP</p>
            <h2 id="ac-create-title">
              {editingId ? 'Edit task' : 'Create task'}
            </h2>
          </div>

          <button
            type="button"
            className="ac-icon-button"
            aria-label="Close task form"
            disabled={saving}
            onClick={closeForm}
          >
            <X size={20} />
          </button>
        </div>

        <form className="ac-form" onSubmit={saveTask}>
          <fieldset disabled={saving} className="ac-api-fieldset">
            <label>
              Task title *
              <input
                autoFocus
                required
                minLength={3}
                maxLength={200}
                value={draft.title}
                placeholder="Review pending compensation documents"
                onChange={(event) =>
                  changeDraft('title', event.target.value)
                }
              />
            </label>

            <div className="ac-form-grid">
              <label>
                Project *
                <select
                  required
                  value={draft.projectId}
                  onChange={(event) =>
                    changeDraft('projectId', event.target.value)
                  }
                >
                  <option value="">Select project</option>

                  {draft.projectId &&
                    !projects.some((item) => item.id === draft.projectId) && (
                      <option value={draft.projectId}>
                        Current linked project
                      </option>
                    )}

                  {projects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Responsible officer *
                <input
                  required
                  minLength={2}
                  maxLength={150}
                  value={draft.officer}
                  placeholder="Demo Officer"
                  onChange={(event) =>
                    changeDraft('officer', event.target.value)
                  }
                />
              </label>

              <label>
                Priority
                <select
                  value={draft.priority}
                  onChange={(event) =>
                    changeDraft('priority', event.target.value as Priority)
                  }
                >
                  {PRIORITIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select
                  value={draft.status}
                  onChange={(event) =>
                    changeDraft('status', event.target.value as Status)
                  }
                >
                  {STATUSES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Due date
                <input
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) =>
                    changeDraft('dueDate', event.target.value)
                  }
                />
              </label>

              <label>
                Record type
                <select
                  value={draft.isDemo ? 'demo' : 'source'}
                  onChange={(event) =>
                    changeDraft('isDemo', event.target.value === 'demo')
                  }
                >
                  <option value="demo">Demo — illustrative</option>
                  <option value="source">Source-backed record</option>
                </select>
              </label>

              <label>
                Source name {!draft.isDemo && '*'}
                <input
                  required={!draft.isDemo}
                  maxLength={200}
                  value={draft.sourceName}
                  onChange={(event) =>
                    changeDraft('sourceName', event.target.value)
                  }
                />
              </label>

              <label>
                Source URL {!draft.isDemo && '*'}
                <input
                  type="url"
                  required={!draft.isDemo}
                  value={draft.sourceUrl}
                  placeholder="https://..."
                  onChange={(event) =>
                    changeDraft('sourceUrl', event.target.value)
                  }
                />
              </label>
            </div>

            {draft.parcelId && (
              <p className="ac-api-note">
                Linked parcel: {draft.parcelId}.
                Changing the project clears this parcel link.
              </p>
            )}

            <label>
              Description / follow-up notes
              <textarea
                rows={4}
                maxLength={5000}
                value={draft.notes}
                placeholder="What needs to happen next?"
                onChange={(event) =>
                  changeDraft('notes', event.target.value)
                }
              />
            </label>

            <p className="ac-api-note">
              Project selector shows the latest 100 projects.
              New tasks created here are project-level tasks.
              Adding a source does not independently verify a task.
            </p>

            {formError && (
              <p className="ac-warning" role="alert">{formError}</p>
            )}

            <div className="ac-form-actions">
              <button
                type="button"
                className="ac-secondary"
                onClick={closeForm}
              >
                Cancel
              </button>

              {/* <button
                type="submit"
                className="ac-primary"
                disabled={
                  saving ||
                  draft.title.trim().length < 3 ||
                  !draft.projectId ||
                  draft.officer.trim().length < 2
                }
              >
                <Plus size={17} aria-hidden="true" />
                {saving
                  ? 'Saving…'
                  : editingId
                    ? 'Save changes'
                    : 'Create task'}
              </button> */}



              {canManageActions && (
  <button
    type="button"
    className="ac-primary"
    disabled={
      busy ||
      projectLoading ||
      !!projectError ||
      !projects.length
    }
    onClick={openCreate}
  >
    <Plus
      size={18}
      aria-hidden="true"
    />

    Create task
  </button>
)}
            </div>
          </fieldset>
        </form>
      </dialog>

      <dialog
        ref={detailsDialog}
        className="ac-dialog"
        aria-labelledby="ac-details-title"
      >
        <div className="ac-dialog-header">
          <div>
            <p className="ac-eyebrow">TASK WORKSPACE</p>
            <h2 id="ac-details-title">Task details</h2>
          </div>

          <button
            type="button"
            className="ac-icon-button"
            aria-label="Close task details"
            onClick={() => detailsDialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>

        {selected && (
          <div className="ac-detail-content">
            <span
              className={`ac-priority ac-priority-${selected.priority.toLowerCase()}`}
            >
              {selected.priority} priority
            </span>

            <h3>{selected.title}</h3>

            <p className="ac-description">
              {selected.notes || 'No description added.'}
            </p>

            <dl className="ac-detail-meta">
              <div>
                <dt>Project</dt>
                <dd>{selected.project}</dd>
              </div>
              <div>
                <dt>Officer</dt>
                <dd>{selected.officer || 'Unassigned'}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{formatDate(selected.dueDate)}</dd>
              </div>
              <div>
                <dt>Record type</dt>
                <dd>{selected.isDemo ? 'Demo' : 'Source-backed'}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{selected.sourceName || 'Not recorded'}</dd>
              </div>
            </dl>

            {selected.sourceUrl &&
              /^https?:\/\//i.test(selected.sourceUrl) && (
                <p>
                  <a
                    href={selected.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open source
                  </a>
                </p>
              )}

            <label className="ac-status-field">
              Status
              <select
                value={selected.status}
                disabled={
  busy ||
  !canManageActions
}
                onChange={(event) =>
                  updateStatus(selected, event.target.value as Status)
                }
              >
                {STATUSES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            {statusError && (
              <p className="ac-warning" role="alert">{statusError}</p>
            )}

            {updatingId === selected.id && (
              <p role="status">Saving status…</p>
            )}

          {canManageActions && (
  <div className="ac-form-actions">
    <button
      type="button"
      className="ac-primary"
      disabled={busy}
      onClick={() =>
        openEdit(selected)
      }
    >
      Edit task
    </button>
  </div>
)}
          </div>
        )}
      </dialog>
    </div>
  )
}