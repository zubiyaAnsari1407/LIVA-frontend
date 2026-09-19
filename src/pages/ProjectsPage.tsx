import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  Database,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MapPin,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import ProjectForm from '../components/ProjectForm'
import '../styles/projects.css'

type Project = {
  id: string
  name: string
  state: string
  district: string
  stage: string
  progress: number | null
  image?: string | null
  description?: string
  sector?: string | null
  line_ministry?: string | null
  original_cost_cr?: number | null
  expenditure_cr?: number | null
  physical_progress_pct?: number | null
  original_completion_year?: number | null
  sanction_year?: number | null
  latitude?: number | null
  longitude?: number | null
  isDemo?: boolean
  locationDisplayName?: string | null
  sourceName?: string | null
  sourceUrl?: string | null
  sourceRecordId?: string | null
  sourceDate?: string | null
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

const UNKNOWN_VALUES = new Set([
  '',
  'not specified',
  'not available',
  'not specified in paimana export',
  'unknown',
])

function cleanValue(value: string | null | undefined) {
  if (!value) return null
  const cleaned = value.trim()
  return UNKNOWN_VALUES.has(cleaned.toLowerCase()) ? null : cleaned
}

function deriveAdminFromLocation(location?: string | null) {
  if (!location) return { state: null, district: null }

  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^\d{6}$/.test(part))
    .filter((part) => part.toLowerCase() !== 'india')

  return {
    state: parts.length >= 1 ? parts[parts.length - 1] : null,
    district: parts.length >= 2 ? parts[parts.length - 2] : null,
  }
}

function getProjectState(project: Project) {
  return (
    cleanValue(project.state) ??
    deriveAdminFromLocation(project.locationDisplayName).state ??
    ''
  )
}

function getProjectDistrict(project: Project) {
  return (
    cleanValue(project.district) ??
    deriveAdminFromLocation(project.locationDisplayName).district ??
    ''
  )
}

function getLocation(project: Project) {
  const district = getProjectDistrict(project)
  const state = getProjectState(project)
  const structured = [district, state].filter(Boolean).join(', ')
  return structured || cleanValue(project.locationDisplayName)
}

function getStage(project: Project) {
  return cleanValue(project.stage)
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false

  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.state === 'string' &&
    typeof item.district === 'string' &&
    typeof item.stage === 'string' &&
    (item.progress === null ||
      (typeof item.progress === 'number' &&
        Number.isFinite(item.progress) &&
        item.progress >= 0 &&
        item.progress <= 100))
  )
}

function progressValue(project: Project) {
  return project.progress ?? project.physical_progress_pct ?? null
}

function ProjectVisual({ project }: { project: Project }) {
  const [broken, setBroken] = useState(false)
  const image = project.image?.trim()
  const label = project.sector || 'Infrastructure project'

  return (
    <div
      className="portfolio-project-image"
      style={{
        position: 'relative',
        minHeight: 162,
        overflow: 'hidden',
        background:
          'linear-gradient(145deg, #e8efe6 0%, #dfe9dd 55%, #f2eee1 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          padding: 22,
          textAlign: 'center',
          color: '#315f53',
        }}
      >
        <div>
          <span
            style={{
              width: 54,
              height: 54,
              margin: '0 auto 10px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 16,
              background: 'rgba(255,255,255,.7)',
              boxShadow: '0 8px 24px rgba(31,75,63,.08)',
            }}
          >
            <Building2 size={25} strokeWidth={1.6} />
          </span>
          <strong style={{ display: 'block', fontSize: 11 }}>{label}</strong>
          <span style={{ display: 'block', marginTop: 3, fontSize: 9, opacity: 0.7 }}>
            Project visual
          </span>
        </div>
      </div>

      {image && !broken && (
        <img
          src={image}
          alt={`${project.name} project`}
          loading="lazy"
          onError={() => setBroken(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      <span
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 8px',
          borderRadius: 999,
          background: 'rgba(255,255,255,.88)',
          color: '#315f53',
          fontSize: 9,
          fontWeight: 800,
          backdropFilter: 'blur(8px)',
        }}
      >
        <ImageIcon size={11} />
        {image && !broken ? 'Project image' : 'Visual fallback'}
      </span>
    </div>
  )
}

export default function ProjectsPage() {
  const { can } = useAuth()
  const canDeleteProjects = can('projects.delete')

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [query, setQuery] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [stage, setStage] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [sort, setSort] = useState('name')

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProjects() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(
            `Unable to load projects. Server returned ${response.status}.`,
          )
        }

        const data: unknown = await response.json()
        if (!data || typeof data !== 'object') {
          throw new Error('The server returned an invalid project response.')
        }

        const items = (data as Record<string, unknown>).items
        if (!Array.isArray(items) || !items.every(isProject)) {
          throw new Error('The server returned invalid project records.')
        }

        if (!controller.signal.aborted) setProjects(items)
      } catch (err) {
        if (!controller.signal.aborted) {
          setProjects([])
          setError(
            err instanceof TypeError
              ? 'Unable to reach the API. Check the backend connection and CORS settings.'
              : err instanceof Error
                ? err.message
                : 'Unable to load projects. Please try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadProjects()
    return () => controller.abort()
  }, [reloadKey])

  const states = useMemo(
    () =>
      [...new Set(projects.map(getProjectState).filter(Boolean))].sort(),
    [projects],
  )

  const districts = useMemo(
    () =>
      [
        ...new Set(
          projects
            .filter((project) => !state || getProjectState(project) === state)
            .map(getProjectDistrict)
            .filter(Boolean),
        ),
      ].sort(),
    [projects, state],
  )

  const stages = useMemo(
    () =>
      [
        ...new Set(
          projects
            .map(getStage)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    [projects],
  )

  const filteredProjects = useMemo(() => {
    const search = query.trim().toLowerCase()

    return projects
      .filter((project) => {
        const projectState = getProjectState(project)
        const projectDistrict = getProjectDistrict(project)
        const text = [
          project.name,
          project.id,
          projectState,
          projectDistrict,
          project.sector,
          project.line_ministry,
          project.sourceName,
          project.sourceRecordId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return (
          (!search || text.includes(search)) &&
          (!state || projectState === state) &&
          (!district || projectDistrict === district) &&
          (!stage || project.stage === stage)
        )
      })
      .sort((a, b) => {
        // Keep the end-to-end demo project pinned above source-backed
        // projects so reviewers can open the complete LIVA workflow first.
        if (a.isDemo !== b.isDemo) {
          return a.isDemo ? -1 : 1
        }

        if (sort === 'progress') {
          return (progressValue(b) ?? -1) - (progressValue(a) ?? -1)
        }

        if (sort === 'state') {
          return (
            getProjectState(a).localeCompare(getProjectState(b)) ||
            a.name.localeCompare(b.name)
          )
        }

        return a.name.localeCompare(b.name)
      })
  }, [projects, query, state, district, stage, sort])

  const progressSummary = useMemo(() => {
    const values = projects
      .map(progressValue)
      .filter((value): value is number => value !== null)

    return {
      count: values.length,
      average:
        values.length > 0
          ? values.reduce((total, value) => total + value, 0) / values.length
          : null,
    }
  }, [projects])

  const officialCount = projects.filter((project) => project.isDemo === false).length
  const demoCount = projects.filter((project) => project.isDemo === true).length
  const mappedCount = projects.filter(
    (project) =>
      typeof project.latitude === 'number' &&
      Number.isFinite(project.latitude) &&
      typeof project.longitude === 'number' &&
      Number.isFinite(project.longitude),
  ).length

  const activeFilters = [state, district, stage].filter(Boolean).length
  const hasFilters = Boolean(query || activeFilters)
  const ready = !loading && !error

  const summaryCards = [
    {
      label: 'Official projects',
      icon: Database,
      value: String(officialCount),
      note: 'Source-backed project records',
    },
    {
      label: 'Demo projects',
      icon: FolderOpen,
      value: String(demoCount),
      note: 'Illustrative end-to-end records',
    },
    {
      label: 'Mapped projects',
      icon: MapPin,
      value: String(mappedCount),
      note: 'Projects with saved GIS coordinates',
    },
    {
      label: 'Average progress',
      icon: Building2,
      value:
        progressSummary.average === null
          ? '—'
          : `${progressSummary.average.toFixed(1)}%`,
      note:
        progressSummary.count > 0
          ? `${progressSummary.count} projects with reported progress`
          : 'No progress values available',
    },
  ]

  function clearFilters() {
    setQuery('')
    setState('')
    setDistrict('')
    setStage('')
  }

  function retryLoading() {
    setError('')
    setLoading(true)
    setReloadKey((previous) => previous + 1)
  }

  function askDelete(project: Project) {
    if (!canDeleteProjects) return
    setDeleteError('')
    setDeleteTarget(project)
  }

  async function deleteProject() {
    if (!canDeleteProjects || !deleteTarget || deleting) return

    setDeleting(true)
    setDeleteError('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${encodeURIComponent(
          deleteTarget.id,
        )}?cascade=true`,
        { method: 'DELETE' },
      )

      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(
          typeof body?.detail === 'string'
            ? body.detail
            : `Unable to delete project (${response.status}).`,
        )
      }

      setProjects((current) =>
        current.filter((project) => project.id !== deleteTarget.id),
      )
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Unable to delete this project.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="portfolio-page">
      <a className="portfolio-skip" href="#portfolio-main">
        Skip to projects
      </a>

      <header className="portfolio-header">
        <div className="portfolio-nav">
          <Link className="portfolio-brand" to="/" aria-label="Liva home">
            Liva<span>.</span>
          </Link>

          <nav aria-label="Workspace navigation">
            <Link to="/dashboard">Overview</Link>
            <Link to="/projects" aria-current="page">
              Projects
            </Link>
            <Link to="/dashboard#dashboard-map">GIS Workspace</Link>
          </nav>

          <Link className="portfolio-back" to="/dashboard">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      <main id="portfolio-main" className="portfolio-main">
        <div className="portfolio-breadcrumb">
          <Link to="/dashboard">Workspace</Link>
          <span aria-hidden="true">/</span>
          <span>Projects</span>
        </div>

        <section className="portfolio-heading portfolio-visual-heading">
          <img
            className="portfolio-heading-image"
            src="/images/liva-pp.png"
            alt=""
            fetchPriority="high"
          />
          <div className="portfolio-heading-overlay" />

          <div className="portfolio-heading-copy">
            <p className="portfolio-eyebrow">CONNECTED PROJECT INTELLIGENCE</p>
            <h1>
              See the bigger picture.
              <br />
              Follow every project.
            </h1>
            <p className="portfolio-description">
              Explore sourced infrastructure records, demo workflows, GIS context
              and connected delay intelligence from one portfolio.
            </p>
            <a className="portfolio-banner-button" href="#projects-title">
              Explore portfolio
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>

          <div className="portfolio-banner-caption">
            <span />
            Traceable records.
            <br />
            Connected workflows.
          </div>
        </section>

        <section
          className="portfolio-summary"
          aria-label="Loaded project summary"
          aria-busy={loading}
        >
          {summaryCards.map(({ label, icon: Icon, value, note }) => (
            <article className="portfolio-stat" key={label}>
              <span className="portfolio-stat-icon">
                <Icon size={23} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <div>
                <h2>{label}</h2>
                <strong>{ready ? value : '—'}</strong>
                <p>{note}</p>
              </div>
            </article>
          ))}
        </section>

        {ready && officialCount > 0 && (
          <p className="portfolio-welcome-footnote">
            Official and demo records are clearly labelled. Source-backed values
            reflect their loaded source snapshot; demo records are illustrative.
          </p>
        )}

        <section className="portfolio-workspace" aria-labelledby="projects-title">
          <div className="portfolio-toolbar">
            <div>
              <h2 id="projects-title">Project portfolio</h2>
              <p>
                Open a project, its intelligence, simulator or GIS-linked workflow.
              </p>
            </div>

            <div className="portfolio-toolbar-actions">
              <ProjectForm />

              <button
                type="button"
                className="portfolio-filter-toggle"
                aria-expanded={filtersOpen}
                aria-controls="portfolio-filters"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filters
                {activeFilters > 0 && <span>{activeFilters}</span>}
                <ChevronDown
                  size={14}
                  className={filtersOpen ? 'portfolio-chevron-open' : ''}
                  aria-hidden="true"
                />
              </button>

              <div className="portfolio-view-toggle" role="group" aria-label="Project view">
                <button
                  type="button"
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                >
                  <LayoutGrid size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Table view"
                  aria-pressed={view === 'table'}
                  onClick={() => setView('table')}
                >
                  <List size={19} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div
            id="portfolio-filters"
            className={`portfolio-filter-wrapper ${filtersOpen ? 'is-open' : ''}`}
            inert={!filtersOpen}
          >
            <div className="portfolio-filter-inner">
              <div className="portfolio-filters">
                <label className="portfolio-search">
                  <Search size={18} aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Search projects"
                    placeholder="Search project, sector, ministry or source ID…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>

                <label className="portfolio-select">
                  <span>State</span>
                  <select
                    value={state}
                    disabled={states.length === 0}
                    onChange={(event) => {
                      setState(event.target.value)
                      setDistrict('')
                    }}
                  >
                    <option value="">All available states</option>
                    {states.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="portfolio-select">
                  <span>District</span>
                  <select
                    value={district}
                    disabled={districts.length === 0}
                    onChange={(event) => setDistrict(event.target.value)}
                  >
                    <option value="">All available districts</option>
                    {districts.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="portfolio-select">
                  <span>Stage</span>
                  <select
                    value={stage}
                    disabled={stages.length === 0}
                    onChange={(event) => setStage(event.target.value)}
                  >
                    <option value="">All available stages</option>
                    {stages.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="portfolio-results-toolbar">
            <p role="status">
              {loading
                ? 'Loading projects…'
                : error
                  ? 'Projects could not be loaded'
                  : `${filteredProjects.length} of ${projects.length} projects shown`}
            </p>

            <div>
              {hasFilters && (
                <button type="button" className="portfolio-clear" onClick={clearFilters}>
                  <X size={14} aria-hidden="true" />
                  Clear filters
                </button>
              )}

              <select
                aria-label="Sort projects"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="name">Project name A–Z</option>
                <option value="state">State A–Z</option>
                <option value="progress">Highest progress</option>
              </select>
            </div>
          </div>

          <div key={view} className="portfolio-results" aria-busy={loading}>
            {loading && (
              <div className="portfolio-welcome-copy">
                <span className="portfolio-welcome-icon">
                  <FolderOpen size={25} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <h3>Loading projects…</h3>
                <p className="portfolio-welcome-description">
                  Fetching project records.
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="portfolio-welcome-copy">
                <h3>Unable to load projects.</h3>
                <p className="portfolio-welcome-description" role="alert">
                  {error}
                </p>
                <button type="button" className="portfolio-primary" onClick={retryLoading}>
                  Try again
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            )}

            {ready && view === 'table' && (
              <div className="portfolio-table-scroll">
                <table className="portfolio-table">
                  <caption className="portfolio-sr-only">Project portfolio</caption>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Sector</th>
                      <th>Location</th>
                      <th>Progress</th>
                      <th>Source</th>
                      {canDeleteProjects && <th>Admin</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => {
                      const location = getLocation(project)
                      const progress = progressValue(project)

                      return (
                        <tr key={project.id}>
                          <td>
                            <strong>
                              <a href={`/projects/${encodeURIComponent(project.id)}`}>
                                {project.name}
                              </a>
                            </strong>
                            <span>{project.sourceRecordId ?? project.id}</span>
                          </td>
                          <td>{project.sector || 'Not reported'}</td>
                          <td>{location || 'Location not supplied'}</td>
                          <td>{progress == null ? 'Not available' : `${progress}%`}</td>
                          <td>{project.sourceName || (project.isDemo ? 'Demo record' : 'Source unavailable')}</td>
                          {canDeleteProjects && (
                            <td>
                              <button
                                type="button"
                                onClick={() => askDelete(project)}
                                aria-label={`Delete ${project.name}`}
                                style={{
                                  border: '1px solid #ead7d2',
                                  borderRadius: 8,
                                  background: '#fff8f6',
                                  color: '#9d4d43',
                                  padding: '7px 9px',
                                  cursor: 'pointer',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {ready && view === 'grid' && filteredProjects.length > 0 && (
              <div className="portfolio-project-grid">
                {filteredProjects.map((project) => {
                  const location = getLocation(project)
                  const projectStage = getStage(project)
                  const progress = progressValue(project)

                  return (
                    <article
                      className="portfolio-project-card"
                      key={project.id}
                      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                    >
                      <ProjectVisual project={project} />

                      <div
                        className="portfolio-project-copy"
                        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              width: 'fit-content',
                              padding: '4px 7px',
                              borderRadius: 999,
                              background:
                                project.isDemo === false ? '#edf5ee' : '#fff7e6',
                              color:
                                project.isDemo === false ? '#315f53' : '#8a6828',
                              fontSize: 9,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '.05em',
                            }}
                          >
                            <Database size={11} />
                            {project.isDemo === false ? 'Official source' : 'Demo record'}
                          </span>

                          {projectStage && (
                            <span className="portfolio-stage">{projectStage}</span>
                          )}
                        </div>

                        <h3
                          style={{
                            minHeight: 58,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          <a href={`/projects/${encodeURIComponent(project.id)}`}>
                            {project.name}
                          </a>
                        </h3>

                        <div style={{ minHeight: 63 }}>
                          <p
                            style={{
                              marginTop: 7,
                              marginBottom: 0,
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#527065',
                            }}
                          >
                            {project.sector || 'Infrastructure project'}
                          </p>

                          <p
                            style={{
                              marginTop: 3,
                              marginBottom: 0,
                              fontSize: 10,
                              lineHeight: 1.4,
                              color: '#7b8882',
                            }}
                          >
                            {project.line_ministry || 'Responsible ministry not reported'}
                          </p>

                          <p style={{ marginTop: 7 }}>
                            <MapPin size={14} aria-hidden="true" />
                            {location || 'Location not supplied'}
                          </p>
                        </div>

                        <div style={{ marginTop: 12, display: 'grid', gap: 5 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 10,
                              color: '#718078',
                            }}
                          >
                            <span>Physical progress</span>
                            <strong style={{ color: '#315f53' }}>
                              {progress == null ? '—' : `${progress}%`}
                            </strong>
                          </div>

                          <div
                            style={{
                              height: 5,
                              overflow: 'hidden',
                              borderRadius: 999,
                              background: '#e8eee9',
                            }}
                          >
                            <span
                              style={{
                                display: 'block',
                                height: '100%',
                                width: `${Math.min(Math.max(progress ?? 0, 0), 100)}%`,
                                borderRadius: 'inherit',
                                background: '#3d7162',
                              }}
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: '1px solid #e5ebe7',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 9,
                              textTransform: 'uppercase',
                              letterSpacing: '.06em',
                              color: '#9a7b43',
                              fontWeight: 800,
                            }}
                          >
                            Source
                          </div>
                          <div
                            style={{
                              marginTop: 3,
                              fontSize: 10,
                              lineHeight: 1.4,
                              color: '#66766f',
                            }}
                          >
                            {project.sourceName ||
                              (project.isDemo
                                ? 'Illustrative LIVA demo record'
                                : 'Source information unavailable')}
                          </div>
                          {project.sourceRecordId && (
                            <small style={{ display: 'block', marginTop: 3 }}>
                              Record ID: {project.sourceRecordId}
                            </small>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 12,
                            marginTop: 'auto',
                            paddingTop: 15,
                          }}
                        >
                          <a
                            className="portfolio-preview-link"
                            href={`/projects/${encodeURIComponent(project.id)}`}
                            aria-label={`View details for ${project.name}`}
                          >
                            View details
                            <ArrowRight size={15} aria-hidden="true" />
                          </a>

                          <Link
                            className="portfolio-preview-link"
                            to={`/intelligence?project=${encodeURIComponent(project.id)}`}
                          >
                            Intelligence
                          </Link>

                          <Link
                            className="portfolio-preview-link"
                            to={`/simulator?projectId=${encodeURIComponent(project.id)}`}
                          >
                            Simulator
                          </Link>

                          <Link
                            className="portfolio-preview-link"
                            to={`/dashboard?gisProject=${encodeURIComponent(project.id)}#dashboard-map`}
                            aria-label={`Open ${project.name} in GIS`}
                          >
                            <MapPin size={12} aria-hidden="true" />
                            GIS
                          </Link>

                          {project.sourceUrl && (
                            <a
                              className="portfolio-preview-link"
                              href={project.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Source
                              <ExternalLink size={12} aria-hidden="true" />
                            </a>
                          )}

                          {canDeleteProjects && (
                            <button
                              type="button"
                              onClick={() => askDelete(project)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: 0,
                                border: 'none',
                                background: 'transparent',
                                color: '#9d4d43',
                                font: 'inherit',
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {ready && filteredProjects.length === 0 && (
              <div className="portfolio-welcome">
                <div className="portfolio-welcome-visual">
                  <img
                    src="/images/liva-land.png"
                    alt="Illustrative view of an infrastructure landscape"
                    loading="lazy"
                  />
                  <div className="portfolio-welcome-shade" />
                  <div className="portfolio-welcome-caption">
                    <MapPin size={22} strokeWidth={1.5} aria-hidden="true" />
                    <div>
                      <strong>Land in context.</strong>
                      <span>Explore project geography and intelligence.</span>
                    </div>
                  </div>
                </div>

                <div className="portfolio-welcome-copy">
                  <span className="portfolio-welcome-icon">
                    <Search size={25} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <p className="portfolio-eyebrow">REFINE YOUR SEARCH</p>
                  <h3>No matching projects.</h3>
                  <p className="portfolio-welcome-description">
                    Try another project name, sector, ministry or location.
                  </p>
                  <div className="portfolio-welcome-actions">
                    {hasFilters && (
                      <button type="button" className="portfolio-primary" onClick={clearFilters}>
                        Clear filters
                        <X size={15} aria-hidden="true" />
                      </button>
                    )}
                    <Link className="portfolio-preview-link" to="/dashboard#dashboard-map">
                      Explore GIS workspace
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="portfolio-footer">
        <strong>Liva</strong>
        <span>Better land decisions. Stronger communities.</span>
      </footer>

      {deleteTarget && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !deleting) {
              setDeleteTarget(null)
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
            background: 'rgba(11,35,29,.55)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            style={{
              width: 'min(520px, 100%)',
              borderRadius: 22,
              background: '#fff',
              boxShadow: '0 24px 80px rgba(10,36,29,.28)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '22px 24px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                borderBottom: '1px solid #edf0ed',
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 9,
                    fontWeight: 800,
                    color: '#a05b50',
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Destructive action
                </p>
                <h2
                  id="delete-project-title"
                  style={{ margin: '6px 0 0', color: '#173f35', fontSize: 21 }}
                >
                  Delete project?
                </h2>
              </div>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                aria-label="Close delete dialog"
                style={{
                  width: 34,
                  height: 34,
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid #e1e7e3',
                  borderRadius: 10,
                  background: '#fff',
                  cursor: deleting ? 'default' : 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <p style={{ margin: 0, color: '#51685f', lineHeight: 1.65, fontSize: 13 }}>
                <strong style={{ color: '#173f35' }}>{deleteTarget.name}</strong>{' '}
                will be removed from LIVA. Linked records that use this project ID
                will also be removed so the database does not keep orphan records.
              </p>

              <div
                style={{
                  marginTop: 16,
                  padding: '11px 13px',
                  borderRadius: 12,
                  background: '#fff7f4',
                  border: '1px solid #f0d8d1',
                  color: '#8b5148',
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
              >
                Use this only when you intentionally want to remove the project and
                its linked LIVA records.
              </div>

              {deleteError && (
                <p style={{ margin: '14px 0 0', color: '#a0493f', fontSize: 12 }} role="alert">
                  {deleteError}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                padding: '16px 24px 22px',
                borderTop: '1px solid #edf0ed',
              }}
            >
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                style={{
                  minHeight: 40,
                  padding: '0 16px',
                  border: '1px solid #dce4df',
                  borderRadius: 10,
                  background: '#fff',
                  color: '#315f53',
                  fontWeight: 700,
                  cursor: deleting ? 'default' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void deleteProject()}
                style={{
                  minHeight: 40,
                  padding: '0 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  border: 'none',
                  borderRadius: 10,
                  background: '#9b4d43',
                  color: '#fff',
                  fontWeight: 800,
                  cursor: deleting ? 'default' : 'pointer',
                  opacity: deleting ? 0.65 : 1,
                }}
              >
                <Trash2 size={15} />
                {deleting ? 'Deleting…' : 'Delete project'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
