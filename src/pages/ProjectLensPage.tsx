import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  IndianRupee,
  Layers3,
  MapPin,
  Scale,
  Target,
} from 'lucide-react'

import '../styles/project-lens.css'
import ProjectForm from '../components/ProjectForm'
import {
  rupees,
  workflowError,
  workflowRequest,
} from '../services/workflowApi'
import type {
  WorkflowSummary as TimelineSummary,
} from '../services/workflowApi'

type Tab = 'overview' | 'parcels' | 'timeline'

type Project = {
  id: string
  name: string
  state: string
  district: string
  stage: string
  progress: number | null
  description: string
  isDemo: boolean
  image?: string | null

sourceName?: string | null
sourceUrl?: string | null
sourceRecordId?: string | null
sourceDate?: string | null

latitude?: number | null
longitude?: number | null
locationDisplayName?: string | null
locationSource?: string | null
}
type LinkedParcel = {
  id: string
  projectId: string
  surveyNumber: string
  village: string
  district: string
  areaHa: number | null
  ownership: string
  stage: string
  isDemo: boolean
}

type ParcelResult = {
  items: LinkedParcel[]
  total: number
}

function isLinkedParcel(value: unknown): value is LinkedParcel {
  if (!value || typeof value !== 'object') return false

  const item = value as Record<string, unknown>

  return (
    [
      'id',
      'projectId',
      'surveyNumber',
      'village',
      'district',
      'ownership',
      'stage',
    ].every((key) => typeof item[key] === 'string') &&
    typeof item.isDemo === 'boolean' &&
    (
      item.areaHa === null ||
      (
        typeof item.areaHa === 'number' &&
        Number.isFinite(item.areaHa) &&
        item.areaHa > 0
      )
    )
  )
}
type LoadState =
  | { id: string; status: 'loading' }
  | { id: string; status: 'success'; project: Project }
  | { id: string; status: 'error'; message: string; retryable: boolean }

const demoProject: Project = {
  id: 'demo',
  name: 'Green Corridor Road Expansion',
  state: 'Maharashtra',
  district: 'Illustrative district',
  stage: 'Verification',
  progress: 25,
  description:
    'A standalone illustrative project for exploring the Project Lens layout. This preview is separate from saved database records.',
  isDemo: true,
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'parcels', label: 'Land parcels' },
  { id: 'timeline', label: 'Project timeline' },
]

const linkedModules = [
  {
    title: 'Documents & Records',
    description: 'Review supporting files and verification records.',
    to: '/documents',
    icon: FileText,
    image: '/images/liva-documents.png',
    imageAlt: 'Illustrative document and land-record workspace',
    metric: 'documents',
  },
  {
    title: 'Court & Litigation',
    description: 'Review case records and legal follow-ups.',
    to: '/litigation',
    icon: Scale,
    image: '/images/liva-litigation.png',
    imageAlt: 'Illustrative court and litigation workspace',
    metric: 'cases',
  },
  {
    title: 'Compensation & R&R',
    description: 'Review payment and rehabilitation milestones.',
    to: '/compensation',
    icon: IndianRupee,
    image: '/images/liva-compensation.png',
    imageAlt: 'Illustrative compensation and rehabilitation workspace',
    metric: 'compensation',
  },
  {
    title: 'Action Centre',
    description: 'Create follow-ups and track responsibilities.',
    to: '/actions',
    icon: ClipboardList,
    image: '/images/liva-team.png',
    imageAlt: 'Illustrative project coordination and action workspace',
    metric: 'actions',
  },
]

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false

  const item = value as Record<string, unknown>

  return (
    ['id', 'name', 'state', 'district', 'stage', 'description'].every(
      (key) => typeof item[key] === 'string',
    ) &&
    typeof item.isDemo === 'boolean' &&
    (
      item.progress === null ||
      (
        typeof item.progress === 'number' &&
        Number.isFinite(item.progress) &&
        item.progress >= 0 &&
        item.progress <= 100
      )
    )
  )
}


const UNKNOWN_PROJECT_VALUES = [
  '',
  'not specified',
  'not available',
  'not specified in paimana export',
  'unknown',
]

function cleanProjectValue(value?: string | null) {
  if (!value) return null

  const cleaned = value.trim()

  return UNKNOWN_PROJECT_VALUES.includes(cleaned.toLowerCase())
    ? null
    : cleaned
}

function extractAdminFromDisplayName(displayName?: string | null) {
  if (!displayName) {
    return { state: null, district: null }
  }

  const parts = displayName
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^\d{6}$/.test(part))

  const countryIndex = parts.findIndex(
    (part) => part.toLowerCase() === 'india',
  )

  const usableParts =
    countryIndex >= 0 ? parts.slice(0, countryIndex) : parts

  return {
    state:
      usableParts.length >= 1
        ? usableParts[usableParts.length - 1]
        : null,
    district:
      usableParts.length >= 2
        ? usableParts[usableParts.length - 2]
        : null,
  }
}

function getProjectAdmin(project: Project) {
  const fromLocation = extractAdminFromDisplayName(
    project.locationDisplayName,
  )

  return {
    state: cleanProjectValue(project.state) ?? fromLocation.state,
    district: cleanProjectValue(project.district) ?? fromLocation.district,
  }
}

function getProjectStage(project: Project) {
  return cleanProjectValue(project.stage)
}

function getProjectLocation(project: Project) {
  const savedLocation = cleanProjectValue(project.locationDisplayName)
  if (savedLocation) return savedLocation

  const admin = getProjectAdmin(project)
  const compact = [admin.district, admin.state].filter(Boolean).join(', ')

  return compact || 'Location not available'
}

// A keyed workspace resets tabs and loading state when the project ID changes.
export default function ProjectLensPage() {
  const { projectId = '' } = useParams<{ projectId: string }>()

  return <ProjectLensWorkspace key={projectId} projectId={projectId} />
}

function ProjectLensWorkspace({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [reloadKey, setReloadKey] = useState(0)
  const [parcelResult, setParcelResult] = useState<ParcelResult | null>(null)
const [parcelsLoading, setParcelsLoading] = useState(projectId !== 'demo')
const [parcelsError, setParcelsError] = useState('')
const [parcelReloadKey, setParcelReloadKey] = useState(0)
const [parcelPage, setParcelPage] = useState(0)

const [timelineSummary, setTimelineSummary] =
  useState<TimelineSummary | null>(null)
const [timelineLoading, setTimelineLoading] = useState(false)
const [timelineError, setTimelineError] = useState('')
const [timelineReloadKey, setTimelineReloadKey] = useState(0)

const parcelPageSize = 20

useEffect(() => {
  if (projectId === 'demo') {
    setParcelsLoading(false)
    return
  }

  if (!/^[a-fA-F0-9]{24}$/.test(projectId)) {
    setParcelsLoading(false)
    return
  }

  const controller = new AbortController()

  async function loadLinkedParcels() {
    setParcelsLoading(true)
    setParcelsError('')
    setParcelResult(null)

    try {
      const baseUrl = (
        import.meta.env.VITE_API_BASE_URL ||
        'http://127.0.0.1:8000'
      ).replace(/\/+$/, '')

      const params = new URLSearchParams({
        projectId,
        skip: String(parcelPage * parcelPageSize),
        limit: String(parcelPageSize),
      })

      const response = await fetch(
        `${baseUrl}/api/parcels?${params.toString()}`,
        { signal: controller.signal },
      )

      if (!response.ok) {
        throw new Error(
          `Unable to load linked parcels (${response.status}).`,
        )
      }

      const data: unknown = await response.json()

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid parcel response.')
      }

      const result = data as Record<string, unknown>

      if (
        !Array.isArray(result.items) ||
        !result.items.every(isLinkedParcel) ||
        !result.items.every(
          (item) => item.projectId.toLowerCase() === projectId.toLowerCase(),
        ) ||
        typeof result.total !== 'number' ||
        !Number.isInteger(result.total) ||
        result.total < 0
      ) {
        throw new Error('The API returned invalid linked parcel records.')
      }

      if (controller.signal.aborted) return

      // If records were removed, return to the last available page.
      const lastPage = Math.max(
        0,
        Math.ceil(result.total / parcelPageSize) - 1,
      )

      if (parcelPage > lastPage) {
        setParcelPage(lastPage)
        return
      }

      setParcelResult({
        items: result.items,
        total: result.total,
      })
    } catch (error) {
      if (!controller.signal.aborted) {
        setParcelsError(
          error instanceof TypeError
            ? 'Unable to reach the parcel API. Check the backend connection.'
            : error instanceof Error
              ? error.message
              : 'Unable to load linked parcels.',
        )
      }
    } finally {
      if (!controller.signal.aborted) {
        setParcelsLoading(false)
      }
    }
  }

  void loadLinkedParcels()

  return () => controller.abort()
}, [projectId, parcelPage, parcelReloadKey])

function refreshParcels() {
  setParcelsLoading(true)
  setParcelReloadKey((previous) => previous + 1)
}

function changeParcelPage(nextPage: number) {
  setParcelsLoading(true)
  setParcelPage(nextPage)
}

  const [loadState, setLoadState] = useState<LoadState>(() =>
    projectId === 'demo'
      ? {
          id: projectId,
          status: 'success',
          project: demoProject,
        }
      : { id: projectId, status: 'loading' },
  )

  useEffect(() => {
    if (projectId === 'demo') return

    if (!/^[a-fA-F0-9]{24}$/.test(projectId)) {
      setLoadState({
        id: projectId,
        status: 'error',
        message: 'Invalid project link. Select a project from the Projects page.',
        retryable: false,
      })
      return
    }

    const controller = new AbortController()

    async function loadProject() {
      setLoadState({ id: projectId, status: 'loading' })

      try {
        const baseUrl = (
          import.meta.env.VITE_API_BASE_URL ||
          'http://127.0.0.1:8000'
        ).replace(/\/+$/, '')

        const response = await fetch(
          `${baseUrl}/api/projects/${encodeURIComponent(projectId)}`,
          { signal: controller.signal },
        )

        if (controller.signal.aborted) return

        if (response.status === 404 || response.status === 400) {
          setLoadState({
            id: projectId,
            status: 'error',
            message:
              response.status === 404
                ? 'This project was not found in the database.'
                : 'The server could not recognise this project ID.',
            retryable: false,
          })
          return
        }

        if (!response.ok) {
          throw new Error(
            `Unable to load the project. Server returned ${response.status}.`,
          )
        }

        const data: unknown = await response.json()

        if (
          !isProject(data) ||
          data.id.toLowerCase() !== projectId.toLowerCase()
        ) {
          throw new Error('The API returned an invalid project response.')
        }

        if (!controller.signal.aborted) {
          setLoadState({
            id: projectId,
            status: 'success',
            project: data,
          })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadState({
            id: projectId,
            status: 'error',
            message:
              error instanceof TypeError
                ? 'Unable to reach the API. Check the backend connection and CORS settings.'
                : error instanceof Error
                  ? error.message
                  : 'Unable to load this project.',
            retryable: true,
          })
        }
      }
    }

    void loadProject()

    return () => controller.abort()
  }, [projectId, reloadKey])

  const project =
    loadState.status === 'success' ? loadState.project : null

  const isStandaloneDemo = projectId === 'demo'

  useEffect(() => {
    if (!project || !project.isDemo || isStandaloneDemo) {
      setTimelineSummary(null)
      setTimelineError('')
      setTimelineLoading(false)
      return
    }

    const controller = new AbortController()

    setTimelineLoading(true)
    setTimelineError('')

    workflowRequest<TimelineSummary>(
      `/api/workflow/summary?projectId=${encodeURIComponent(project.id)}`,
      {
        signal: controller.signal,
      },
    )
      .then((summary) => {
        if (!controller.signal.aborted) {
          setTimelineSummary(summary)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setTimelineSummary(null)
          setTimelineError(workflowError(error))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setTimelineLoading(false)
        }
      })

    return () => controller.abort()
  }, [
    project?.id,
    project?.isDemo,
    isStandaloneDemo,
    timelineReloadKey,
  ])

  const projectAdmin = project
    ? getProjectAdmin(project)
    : { state: null, district: null }

  const projectState = projectAdmin.state || '—'
  const projectDistrict = projectAdmin.district || '—'
  const projectStage = project ? getProjectStage(project) || '—' : '—'
  const projectLocation = project ? getProjectLocation(project) : 'Location not available'

  const stageOrder = [
    'Survey',
    'Verification',
    'Award',
    'Compensation',
    'Possession',
  ]

  const foundStageIndex = stageOrder.findIndex(
    (stage) => stage.toLowerCase() === projectStage.toLowerCase(),
  )

  const currentStageIndex = foundStageIndex >= 0 ? foundStageIndex : 0

  const verifiedParcels =
    parcelResult?.items.filter(
      (parcel) => parcel.ownership === 'Verified',
    ).length ?? 0

  const disputedParcels =
    parcelResult?.items.filter(
      (parcel) => parcel.ownership === 'Disputed',
    ).length ?? 0

  const workflowPosition = Math.round(
    ((currentStageIndex + 1) / stageOrder.length) * 100,
  )

  // Illustrative demo-only financial values.
  // If the backend summary already contains saved amounts, those are used.
  // These fallbacks are never shown for official/source-backed projects.
  const demoApprovedPaise =
    timelineSummary && timelineSummary.approvedPaise > 0
      ? timelineSummary.approvedPaise
      : 223000000

  const demoDisbursedPaise =
    timelineSummary && timelineSummary.disbursedPaise > 0
      ? timelineSummary.disbursedPaise
      : 90000000

  const demoBalancePaise =
    timelineSummary && timelineSummary.balancePaise > 0
      ? timelineSummary.balancePaise
      : demoApprovedPaise - demoDisbursedPaise

  const demoMilestones = project?.isDemo && !isStandaloneDemo
    ? [
        {
          title: 'Survey',
          caption: parcelResult
            ? `${parcelResult.total} parcel records connected`
            : 'Parcel records are being loaded',
          detail:
            'Survey evidence and parcel measurements are connected to the demo workflow.',
          status: currentStageIndex > 0 ? 'complete' : 'current',
        },
        {
          title: 'Verification',
          caption: parcelResult
            ? `${verifiedParcels} verified · ${disputedParcels} disputed`
            : 'Ownership review status loading',
          detail:
            disputedParcels > 0
              ? 'One or more ownership records still need resolution.'
              : 'Ownership verification is recorded for the connected demo parcels.',
          status:
            currentStageIndex > 1
              ? disputedParcels > 0
                ? 'attention'
                : 'complete'
              : currentStageIndex === 1
                ? 'current'
                : 'pending',
        },
        {
          title: 'Award',
          caption: `${rupees(demoApprovedPaise)} approved value recorded`,
          detail:
            'Award-stage evidence is represented through the linked compensation records.',
          status:
            currentStageIndex > 2
              ? 'complete'
              : currentStageIndex === 2
                ? 'current'
                : 'pending',
        },
        {
          title: 'Compensation',
          caption: `${rupees(demoDisbursedPaise)} paid · ${rupees(
            demoBalancePaise,
          )} balance`,
          detail:
            'Recorded payment progress is shown from saved compensation records.',
          status:
            currentStageIndex > 3
              ? 'complete'
              : currentStageIndex === 3
                ? 'current'
                : 'pending',
        },
        {
          title: 'Possession',
          caption: timelineSummary
            ? `${timelineSummary.documents} linked documents available`
            : 'Readiness evidence loading',
          detail:
            currentStageIndex >= 4
              ? 'Possession is the recorded current stage.'
              : 'Possession remains pending until blockers and follow-ups are closed.',
          status: currentStageIndex === 4 ? 'current' : 'pending',
        },
      ]
    : []

  function retryTimeline() {
    setTimelineLoading(true)
    setTimelineReloadKey((previous) => previous + 1)
  }

  function retry() {
    setLoadState({ id: projectId, status: 'loading' })
    setReloadKey((previous) => previous + 1)
  }

  return (
    <div className="pl-page">
      <a href="#pl-main" className="pl-skip">
        Skip to project details
      </a>

      <header className="pl-header">
        <Link to="/" className="pl-brand">
          Liva<span>.</span>
        </Link>

        <nav aria-label="Workspace navigation">
          <Link to="/dashboard">Overview</Link>
          <Link to="/projects" aria-current="location">Projects</Link>
          <Link to="/parcels">Land Parcels</Link>
          <Link to="/actions">Action Centre</Link>
        </nav>

        <Link to="/projects" className="pl-back">
          <ArrowLeft size={16} aria-hidden="true" />
          All projects
        </Link>
      </header>

      <main id="pl-main" className="pl-main">
        <div className="pl-breadcrumb">
          <Link to="/dashboard">Workspace</Link>
          <span>/</span>
          <Link to="/projects">Projects</Link>
          <span>/</span>
          <span>Project Lens</span>
        </div>

        {loadState.status === 'loading' && (
          <section className="pl-not-found" aria-busy="true">
            <Building2 size={44} strokeWidth={1.4} aria-hidden="true" />
            <h1>Loading project details…</h1>
            <p role="status">Fetching the selected project record.</p>
          </section>
        )}

        {loadState.status === 'error' && (
          <section className="pl-not-found">
            <Building2 size={44} strokeWidth={1.4} aria-hidden="true" />
            <h1>Project details are unavailable.</h1>
            <p role="alert">{loadState.message}</p>

            <div>
              <Link to="/projects" className="pl-secondary">
                <ArrowLeft size={16} aria-hidden="true" />
                Back to projects
              </Link>

              {loadState.retryable && (
                <button type="button" className="pl-primary" onClick={retry}>
                  Try again
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </section>
        )}

        {project && (
          <>
            <section className="pl-hero">
              <img
                src={project.image || '/images/liva-project-lens.png'}
                alt={
                  project.image
                    ? `${project.name} project image`
                    : 'Illustrative land and infrastructure landscape'
                }
                fetchPriority="high"
                onError={(event) => {
                  const image = event.currentTarget

                  if (!image.src.includes('/images/liva-project-lens.png')) {
                    image.src = '/images/liva-project-lens.png'
                    image.alt = 'Illustrative land and infrastructure landscape'
                  } else {
                    image.style.visibility = 'hidden'
                  }
                }}
              />
              <div className="pl-hero-shade" />

              <div className="pl-hero-copy">
                <div className="pl-hero-labels">
                  <span className="pl-eyebrow">PROJECT LENS</span>
                  <span className="pl-demo-badge">
                    {isStandaloneDemo
                      ? 'Standalone demo'
                      : project.isDemo
                        ? 'Saved demo record'
                        : 'Saved project'}
                  </span>
                </div>

                <h1>{project.name}</h1>

                <p>
                  A connected view of acquisition progress,
                  project context and the next action.
                </p>

                <div className="pl-hero-meta">
                  <span>
                    <MapPin size={15} aria-hidden="true" />
                    {projectLocation}
                  </span>
                  <span>Stage: {projectStage}</span>
                </div>
              </div>
            </section>

            <p className="pl-preview-note">
              {isStandaloneDemo
                ? 'Standalone illustrative preview.'
                : project.isDemo
                  ? 'Loaded from the database · Illustrative demo record.'
                  : 'Loaded from the database.'}
              {!project.image && ' Default illustrative image shown.'}
            </p>

            <section className="pl-stats" aria-label="Project summary">
              {[
                {
                  title: 'Current stage',
                  value: projectStage,
                  note: 'Recorded acquisition stage',
                  icon: Building2,
                },
                {
                  title: 'Reported progress',
                  value:
                    project.progress === null ? '—' : `${project.progress}%`,
                  note: 'Entered project progress',
                  icon: Target,
                },
               {
  title: 'Land parcels',
  value:
    isStandaloneDemo || parcelsLoading || parcelsError || !parcelResult
      ? '—'
      : String(parcelResult.total),
  note: isStandaloneDemo
    ? 'Open a saved project for linked parcels'
    : parcelsLoading
      ? 'Loading linked parcels…'
      : parcelsError
        ? 'Parcel data unavailable'
        : 'Records linked to this project',
  icon: Layers3,
},
                {
                  title: 'Target completion',
                  value: '—',
                  note: 'Target date not provided by API',
                  icon: CalendarDays,
                },
              ].map(({ title, value, note, icon: Icon }) => (
                <article key={title}>
                  <span className="pl-stat-icon">
                    <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <div>
                    <h2>{title}</h2>
                    <strong aria-label={value === '—' ? 'Not available' : undefined}>
                      {value}
                    </strong>
                    <p>{note}</p>
                  </div>
                </article>
              ))}
            </section>

            <div className="pl-tabs" role="tablist" aria-label="Project sections">
              {tabs.map((item, index) => (
                <button
                  key={item.id}
                  id={`pl-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  aria-controls={`pl-panel-${item.id}`}
                  tabIndex={tab === item.id ? 0 : -1}
                  onClick={() => setTab(item.id)}
                  onKeyDown={(event) => {
                    let next = index

                    if (event.key === 'ArrowRight') {
                      next = (index + 1) % tabs.length
                    } else if (event.key === 'ArrowLeft') {
                      next = (index - 1 + tabs.length) % tabs.length
                    } else if (event.key === 'Home') {
                      next = 0
                    } else if (event.key === 'End') {
                      next = tabs.length - 1
                    } else {
                      return
                    }

                    event.preventDefault()
                    setTab(tabs[next].id)
                    document.getElementById(`pl-tab-${tabs[next].id}`)?.focus()
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <section
              id="pl-panel-overview"
              role="tabpanel"
              aria-labelledby="pl-tab-overview"
              hidden={tab !== 'overview'}
              tabIndex={0}
            >
              <div className="pl-overview-grid">
                <article className="pl-card pl-project-card">
                  <div className="pl-card-heading">
                    <div>
                      <p className="pl-eyebrow">THE BIG PICTURE</p>
                      <h2>Project overview</h2>
                      {!isStandaloneDemo && (
  <div style={{ marginTop: 14 }}>
    <ProjectForm project={project} onSaved={retry} />
  </div>
)}
                    </div>
                    <Building2 size={23} aria-hidden="true" />
                  </div>

                  <p className="pl-description">
                    {project.description || 'No description has been added.'}
                  </p>

                  {!isStandaloneDemo && (
                    <p className="pl-small" style={{ marginTop: 8 }}>
                      When the source export does not provide structured state or
                      district values, LIVA falls back to the saved GIS location.
                    </p>
                  )}

                  <dl className="pl-facts">
  {[
    [
      'Project ID',
      project.id,
    ],

    [
      'Location',
      projectLocation,
    ],

    [
      'State',
      projectState,
    ],

    [
      'District',
      projectDistrict,
    ],

    [
      'Current stage',
      projectStage,
    ],

    [
      'Record source',
      isStandaloneDemo
        ? 'Standalone preview'
        : (
          project.sourceName ||
          'Database'
        ),
    ],

    [
      'Record type',
      project.isDemo
        ? 'Illustrative demo'
        : 'Official / non-demo record',
    ],
  ].map(
    ([label, value]) => (
      <div key={label}>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    ),
  )}
</dl>

            </article>
          </div>

          <style>{`
            .pl-linked-section {
              margin-top: 28px;
            }

            .pl-linked-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 16px;
            }

            .pl-module.pl-module-visual {
              position: relative;
              display: flex;
              min-width: 0;
              min-height: 320px;
              flex-direction: column;
              align-items: stretch;
              overflow: hidden;
              padding: 0;
              border: 1px solid #d7e1d3;
              border-radius: 14px;
              background: #fff;
              color: #173f35;
              text-decoration: none;
              box-shadow: 0 8px 24px rgba(31, 69, 56, .04);
              transition:
                transform .2s ease,
                box-shadow .2s ease,
                border-color .2s ease;
            }

            .pl-module.pl-module-visual:hover {
              transform: translateY(-3px);
              border-color: #bdcdbd;
              box-shadow: 0 16px 34px rgba(31, 69, 56, .10);
            }

            .pl-module-media {
              position: relative;
              width: 100%;
              min-width: 100%;
              height: 132px;
              flex: 0 0 132px;
              align-self: stretch;
              overflow: hidden;
              background: #e9efe5;
            }

            .pl-module.pl-module-visual .pl-module-media img {
              display: block;
              width: 100% !important;
              max-width: none !important;
              height: 100% !important;
              object-fit: cover;
              object-position: center;
              transition: transform .35s ease;
            }

            .pl-module.pl-module-visual:hover .pl-module-media img {
              transform: scale(1.035);
            }

            .pl-module-media::after {
              content: "";
              position: absolute;
              inset: 0;
              background:
                linear-gradient(
                  180deg,
                  rgba(18, 61, 52, .02) 20%,
                  rgba(18, 61, 52, .30) 100%
                );
              pointer-events: none;
            }

            .pl-module-floating-icon {
              position: absolute;
              right: 12px;
              bottom: 10px;
              z-index: 2;

              display: grid;
              width: 34px;
              height: 34px;
              place-items: center;

              border: 1px solid rgba(255, 255, 255, .34);
              border-radius: 10px;

              background: rgba(23, 63, 53, .84);
              color: #ffffff;

              box-shadow: 0 8px 20px rgba(18, 55, 45, .20);
              backdrop-filter: blur(6px);
            }

            .pl-module-body {
              display: flex;
              min-height: 188px;
              flex: 1;
              flex-direction: column;
              padding: 18px 18px 17px;
            }

            .pl-module-topline {
              display: flex;
              min-height: 25px;
              align-items: center;
              padding-right: 38px;
            }

            .pl-module-metric {
              display: inline-flex;
              align-items: center;
              min-height: 24px;
              padding: 5px 8px;
              border: 1px solid #e2e8dd;
              border-radius: 999px;
              background: #f7f9f5;
              color: #65776d;
              font-size: 9px;
              font-weight: 750;
              letter-spacing: .03em;
            }

            .pl-module-metric.demo {
              border-color: #eadbb9;
              background: #fbf5e9;
              color: #82652d;
            }

            .pl-module.pl-module-visual h3 {
              margin: 10px 0 0;
              color: #173f35;
              font-size: 15px;
              line-height: 1.35;
            }

            .pl-module.pl-module-visual p {
              margin: 8px 0 0;
              color: #617169;
              font-size: 11px;
              line-height: 1.55;
            }

            .pl-module.pl-module-visual .pl-module-link {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              margin-top: auto;
              padding-top: 18px;
              color: #3f5f42;
              font-size: 11px;
              font-weight: 750;
            }

            .pl-module.pl-module-visual:hover .pl-module-link {
              color: #173f35;
            }

            @media (max-width: 1050px) {
              .pl-linked-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }

            @media (max-width: 620px) {
              .pl-linked-grid {
                grid-template-columns: 1fr;
              }

              .pl-module-media {
                height: 150px;
                flex-basis: 150px;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .pl-module.pl-module-visual,
              .pl-module-media img {
                transition: none;
              }
            }
          `}</style>

          <section className="pl-linked-section">
            <div className="pl-section-heading">
              <div>
                <p className="pl-eyebrow">CONNECTED WORKSPACES</p>
                <h2>Continue the review.</h2>
              </div>
              <p>Open a module to review its records.</p>
            </div>

            <div className="pl-linked-grid">
              {linkedModules.map(
                ({
                  title,
                  description,
                  to,
                  icon: Icon,
                  image,
                  imageAlt,
                  metric,
                }) => {
                  let metricText = 'Open workspace'

                  if (project.isDemo && !isStandaloneDemo && timelineSummary) {
                    if (metric === 'documents') {
                      metricText =
                        `${timelineSummary.documents} document${
                          timelineSummary.documents === 1 ? '' : 's'
                        }`
                    } else if (metric === 'cases') {
                      metricText =
                        `${timelineSummary.cases} court case${
                          timelineSummary.cases === 1 ? '' : 's'
                        }`
                    } else if (metric === 'compensation') {
                      metricText =
                        `${timelineSummary.rehabilitationRecords} R&R · ${rupees(
                          demoDisbursedPaise,
                        )} paid`
                    } else if (metric === 'actions') {
                      metricText =
                        `${timelineSummary.openActions} open action${
                          timelineSummary.openActions === 1 ? '' : 's'
                        }`
                    }
                  }

                  return (
                    <Link
                      className="pl-module pl-module-visual"
                      to={to}
                      key={title}
                    >
                      <div className="pl-module-media">
                        <img
                          src={image}
                          alt={imageAlt}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />

                        <span className="pl-module-floating-icon">
                          <Icon
                            size={20}
                            strokeWidth={1.6}
                            aria-hidden="true"
                          />
                        </span>
                      </div>

                      <div className="pl-module-body">
                        <div className="pl-module-topline">
                          <span
                            className={`pl-module-metric ${
                              project.isDemo && !isStandaloneDemo
                                ? 'demo'
                                : ''
                            }`}
                          >
                            {metricText}
                          </span>
                        </div>

                        <h3>{title}</h3>
                        <p>{description}</p>

                        <span className="pl-module-link">
                          Open workspace
                          <ArrowRight size={15} aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  )
                },
              )}
            </div>

            <p className="pl-small" style={{ marginTop: 12 }}>
              These links open full workspaces. Project-specific counts are
              shown for the saved demo where connected records are available.
            </p>
          </section>
        </section>

            <section
  id="pl-panel-parcels"
  role="tabpanel"
  aria-labelledby="pl-tab-parcels"
  hidden={tab !== 'parcels'}
  tabIndex={0}
>
  <div className="pl-registry">
    <div className="pl-registry-heading">
      <div>
        <h2>Project land parcels</h2>
        <p>{project.name}</p>
      </div>
      <Layers3 size={24} aria-hidden="true" />
    </div>

    {isStandaloneDemo ? (
      <div className="pl-empty">
        <Layers3 size={36} strokeWidth={1.4} aria-hidden="true" />
        <h3>This is a standalone preview.</h3>
        <p>
          Open a saved project from the Projects page to see its linked parcels.
        </p>
        <Link
          to="/projects"
          className="pl-primary"
          style={{ marginTop: 18 }}
        >
          Open Projects
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    ) : parcelsLoading ? (
      <div className="pl-empty" role="status">
        <h3>Loading linked parcels…</h3>
      </div>
    ) : parcelsError ? (
      <div className="pl-empty">
        <h3>Unable to load parcels.</h3>
        <p role="alert">{parcelsError}</p>
        <button
          type="button"
          className="pl-primary"
          style={{ marginTop: 18 }}
          onClick={refreshParcels}
        >
          Try again
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    ) : parcelResult ? (
      <>
        <div className="pl-results">
          <p role="status">
            {parcelResult.total === 0
              ? 'No linked parcels'
              : `${parcelPage * parcelPageSize + 1}–${
                  parcelPage * parcelPageSize + parcelResult.items.length
                } of ${parcelResult.total} linked parcels`}
          </p>

          <button type="button" onClick={refreshParcels}>
            Refresh
          </button>
        </div>

        {parcelResult.items.some((parcel) => parcel.isDemo) && (
          <p className="pl-small" style={{ margin: '0 21px 16px' }}>
            Includes illustrative demo records.
          </p>
        )}

        {parcelResult.items.length > 0 ? (
          <div className="pl-table-scroll">
            <table className="pl-table">
              <caption className="pl-sr-only">
                Parcels linked to {project.name}
              </caption>

              <thead>
                <tr>
                  <th scope="col">Survey number</th>
                  <th scope="col">Village / District</th>
                  <th scope="col">Area (ha)</th>
                  <th scope="col">Ownership</th>
                  <th scope="col">Stage</th>
                </tr>
              </thead>

              <tbody>
                {parcelResult.items.map((parcel) => (
                  <tr key={parcel.id}>
                    <td>
                      <strong>{parcel.surveyNumber}</strong>
                      {parcel.isDemo && (
                        <span className="pl-demo-badge" style={{ marginLeft: 8 }}>
                          Demo
                        </span>
                      )}
                    </td>
                    <td>{parcel.village}, {parcel.district}</td>
                    <td>
                      {parcel.areaHa === null ? '—' : parcel.areaHa.toFixed(2)}
                    </td>
                    <td>{parcel.ownership}</td>
                    <td>{parcel.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pl-empty">
            <Layers3 size={36} strokeWidth={1.4} aria-hidden="true" />
            <h3>No parcels linked yet.</h3>
            <p>
              Parcels saved with this project ID will appear here.
            </p>
          </div>
        )}

        {parcelResult.total > parcelPageSize && (
          <div className="pl-results">
            <button
              type="button"
              disabled={parcelPage === 0}
              onClick={() => changeParcelPage(parcelPage - 1)}
            >
              Previous
            </button>

            <p>
              Page {parcelPage + 1} of{' '}
              {Math.ceil(parcelResult.total / parcelPageSize)}
            </p>

            <button
              type="button"
              disabled={
                (parcelPage + 1) * parcelPageSize >= parcelResult.total
              }
              onClick={() => changeParcelPage(parcelPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </>
    ) : null}
  </div>
</section>  

            <section
              id="pl-panel-timeline"
              role="tabpanel"
              aria-labelledby="pl-tab-timeline"
              hidden={tab !== 'timeline'}
              tabIndex={0}
            >
              {project.isDemo && !isStandaloneDemo ? (
                <>
                  <style>{`
                    .pl-demo-timeline {
                      display: grid;
                      grid-template-columns: minmax(0, 1.55fr) minmax(310px, .75fr);
                      gap: 20px;
                      align-items: start;
                    }

                    .pl-demo-timeline-card {
                      border: 1px solid #d7e1d3;
                      border-radius: 14px;
                      background: #fff;
                      padding: 24px;
                    }

                    .pl-demo-timeline-heading {
                      display: flex;
                      justify-content: space-between;
                      align-items: flex-start;
                      gap: 18px;
                      margin-bottom: 22px;
                    }

                    .pl-demo-timeline-heading h2 {
                      margin: 5px 0 0;
                      color: #173f35;
                      font-size: 22px;
                    }

                    .pl-demo-live-badge {
                      display: inline-flex;
                      align-items: center;
                      gap: 7px;
                      border: 1px solid #d8e2d4;
                      border-radius: 999px;
                      background: #f6f9f3;
                      padding: 7px 10px;
                      color: #496658;
                      font-size: 10px;
                      font-weight: 800;
                      letter-spacing: .08em;
                      text-transform: uppercase;
                    }

                    .pl-demo-live-badge::before {
                      content: "";
                      width: 7px;
                      height: 7px;
                      border-radius: 999px;
                      background: #4f765e;
                      box-shadow: 0 0 0 4px rgba(79, 118, 94, .12);
                    }

                    .pl-demo-timeline-list {
                      position: relative;
                      display: grid;
                    }

                    .pl-demo-step {
                      position: relative;
                      display: grid;
                      grid-template-columns: 42px minmax(0, 1fr);
                      gap: 15px;
                      min-height: 106px;
                      padding-bottom: 18px;
                    }

                    .pl-demo-step:last-child {
                      min-height: 76px;
                      padding-bottom: 0;
                    }

                    .pl-demo-step::before {
                      content: "";
                      position: absolute;
                      left: 20px;
                      top: 39px;
                      bottom: -2px;
                      width: 2px;
                      background: #dce5d8;
                    }

                    .pl-demo-step:last-child::before {
                      display: none;
                    }

                    .pl-demo-node {
                      position: relative;
                      z-index: 1;
                      display: grid;
                      place-items: center;
                      width: 42px;
                      height: 42px;
                      border-radius: 50%;
                      border: 1px solid #d4dfd0;
                      background: #f7f9f5;
                      color: #718273;
                    }

                    .pl-demo-step.is-complete .pl-demo-node {
                      background: #173f35;
                      border-color: #173f35;
                      color: #fff;
                    }

                    .pl-demo-step.is-current .pl-demo-node {
                      background: #f3ead5;
                      border-color: #c7a355;
                      color: #7f6428;
                      box-shadow: 0 0 0 5px rgba(194, 155, 73, .12);
                    }

                    .pl-demo-step.is-attention .pl-demo-node {
                      background: #fff2e7;
                      border-color: #dfb184;
                      color: #9a5d28;
                    }

                    .pl-demo-step-copy {
                      padding-top: 1px;
                    }

                    .pl-demo-step-top {
                      display: flex;
                      flex-wrap: wrap;
                      align-items: center;
                      justify-content: space-between;
                      gap: 8px 12px;
                    }

                    .pl-demo-step-top h3 {
                      margin: 0;
                      color: #173f35;
                      font-size: 16px;
                    }

                    .pl-demo-step-status {
                      display: inline-flex;
                      align-items: center;
                      border-radius: 999px;
                      padding: 5px 8px;
                      background: #f2f5ef;
                      color: #708076;
                      font-size: 9px;
                      font-weight: 800;
                      letter-spacing: .08em;
                      text-transform: uppercase;
                    }

                    .pl-demo-step.is-complete .pl-demo-step-status {
                      background: #eaf2eb;
                      color: #315f4f;
                    }

                    .pl-demo-step.is-current .pl-demo-step-status {
                      background: #f7edd8;
                      color: #83662b;
                    }

                    .pl-demo-step.is-attention .pl-demo-step-status {
                      background: #fff0e2;
                      color: #95582c;
                    }

                    .pl-demo-step-caption {
                      margin: 7px 0 0;
                      color: #314f44;
                      font-size: 13px;
                      font-weight: 700;
                    }

                    .pl-demo-step-detail {
                      margin: 5px 0 0;
                      color: #6b7b72;
                      font-size: 11px;
                      line-height: 1.55;
                    }

                    .pl-demo-timeline-note {
                      display: flex;
                      gap: 10px;
                      align-items: flex-start;
                      margin-top: 20px;
                      border-top: 1px solid #e4eae1;
                      padding-top: 16px;
                      color: #6a7a71;
                      font-size: 10px;
                      line-height: 1.55;
                    }

                    .pl-demo-timeline-side {
                      display: grid;
                      gap: 14px;
                    }

                    .pl-demo-stage-card,
                    .pl-demo-signal-card,
                    .pl-demo-next-card {
                      border: 1px solid #d5dfd0;
                      border-radius: 14px;
                      background: #eef4e7;
                      padding: 22px;
                    }

                    .pl-demo-stage-card h2 {
                      margin: 7px 0 5px;
                      color: #173f35;
                      font-size: 25px;
                    }

                    .pl-demo-stage-position {
                      color: #5d6f64;
                      font-size: 11px;
                    }

                    .pl-demo-progress-track {
                      overflow: hidden;
                      height: 7px;
                      margin-top: 16px;
                      border-radius: 999px;
                      background: #d8e2d2;
                    }

                    .pl-demo-progress-track span {
                      display: block;
                      height: 100%;
                      border-radius: inherit;
                      background: #173f35;
                    }

                    .pl-demo-signal-card {
                      background: #fff;
                    }

                    .pl-demo-signal-card h3,
                    .pl-demo-next-card h3 {
                      margin: 0;
                      color: #173f35;
                      font-size: 15px;
                    }

                    .pl-demo-signal-grid {
                      display: grid;
                      grid-template-columns: repeat(2, minmax(0, 1fr));
                      gap: 9px;
                      margin-top: 14px;
                    }

                    .pl-demo-signal {
                      border: 1px solid #e0e7dd;
                      border-radius: 10px;
                      background: #fafbf8;
                      padding: 12px;
                    }

                    .pl-demo-signal span {
                      display: block;
                      color: #7a887f;
                      font-size: 9px;
                      text-transform: uppercase;
                      letter-spacing: .06em;
                    }

                    .pl-demo-signal strong {
                      display: block;
                      margin-top: 4px;
                      color: #173f35;
                      font-size: 17px;
                    }

                    .pl-demo-blockers {
                      display: grid;
                      gap: 8px;
                      margin-top: 14px;
                    }

                    .pl-demo-blocker {
                      display: flex;
                      align-items: center;
                      gap: 9px;
                      color: #5e6f65;
                      font-size: 11px;
                    }

                    .pl-demo-next-card {
                      background: #faf7ee;
                      border-color: #e6dac0;
                    }

                    .pl-demo-next-card p {
                      margin: 8px 0 15px;
                      color: #68766f;
                      font-size: 11px;
                      line-height: 1.6;
                    }

                    .pl-demo-actions {
                      display: flex;
                      flex-wrap: wrap;
                      gap: 9px;
                    }

                    .pl-demo-secondary {
                      display: inline-flex;
                      align-items: center;
                      gap: 7px;
                      min-height: 39px;
                      padding: 9px 13px;
                      border: 1px solid #cfdacf;
                      border-radius: 8px;
                      background: #fff;
                      color: #173f35;
                      font-size: 11px;
                      font-weight: 700;
                      text-decoration: none;
                    }

                    .pl-demo-error {
                      margin-top: 14px;
                      border: 1px solid #ead2c1;
                      border-radius: 10px;
                      background: #fff6ef;
                      padding: 12px;
                      color: #8a5737;
                      font-size: 11px;
                    }

                    @media (max-width: 900px) {
                      .pl-demo-timeline {
                        grid-template-columns: 1fr;
                      }
                    }

                    @media (max-width: 520px) {
                      .pl-demo-timeline-card,
                      .pl-demo-stage-card,
                      .pl-demo-signal-card,
                      .pl-demo-next-card {
                        padding: 18px;
                      }

                      .pl-demo-signal-grid {
                        grid-template-columns: 1fr;
                      }
                    }
                  `}</style>

                  <div className="pl-demo-timeline">
                    <article className="pl-demo-timeline-card">
                      <div className="pl-demo-timeline-heading">
                        <div>
                          <p className="pl-eyebrow">
                            ILLUSTRATIVE DEMO WORKFLOW
                          </p>
                          <h2>Acquisition journey</h2>
                          <p className="pl-small" style={{ marginTop: 7 }}>
                            Built from this demo project&apos;s saved parcels,
                            workflow records and payment summary.
                          </p>
                        </div>

                        <span className="pl-demo-live-badge">
                          Linked records
                        </span>
                      </div>

                      {timelineLoading && (
                        <div className="pl-empty" role="status">
                          <CalendarDays
                            size={34}
                            strokeWidth={1.4}
                            aria-hidden="true"
                          />
                          <h3>Building the demo timeline…</h3>
                          <p>
                            Reading the project&apos;s connected workflow records.
                          </p>
                        </div>
                      )}

                      {!timelineLoading && timelineError && (
                        <div className="pl-demo-error" role="alert">
                          <strong>Timeline data could not be refreshed.</strong>
                          <div style={{ marginTop: 5 }}>{timelineError}</div>
                          <button
                            type="button"
                            className="pl-primary"
                            style={{ marginTop: 12 }}
                            onClick={retryTimeline}
                          >
                            Retry timeline
                            <ArrowRight size={15} aria-hidden="true" />
                          </button>
                        </div>
                      )}

                      {!timelineLoading && !timelineError && (
                        <>
                          <div className="pl-demo-timeline-list">
                            {demoMilestones.map(
                              ({
                                title,
                                caption,
                                detail,
                                status,
                              }) => {
                                const StatusIcon =
                                  status === 'complete'
                                    ? CheckCircle2
                                    : status === 'attention'
                                      ? AlertTriangle
                                      : status === 'current'
                                        ? Target
                                        : Circle

                                return (
                                  <div
                                    className={`pl-demo-step is-${status}`}
                                    key={title}
                                  >
                                    <span className="pl-demo-node">
                                      <StatusIcon
                                        size={19}
                                        strokeWidth={1.8}
                                        aria-hidden="true"
                                      />
                                    </span>

                                    <div className="pl-demo-step-copy">
                                      <div className="pl-demo-step-top">
                                        <h3>{title}</h3>

                                        <span className="pl-demo-step-status">
                                          {status === 'complete'
                                            ? 'Completed'
                                            : status === 'current'
                                              ? 'Current stage'
                                              : status === 'attention'
                                                ? 'Needs attention'
                                                : 'Pending'}
                                        </span>
                                      </div>

                                      <p className="pl-demo-step-caption">
                                        {caption}
                                      </p>

                                      <p className="pl-demo-step-detail">
                                        {detail}
                                      </p>
                                    </div>
                                  </div>
                                )
                              },
                            )}
                          </div>

                          <div className="pl-demo-timeline-note">
                            <CalendarDays
                              size={17}
                              strokeWidth={1.5}
                              aria-hidden="true"
                            />
                            <span>
                              This demo timeline shows workflow position and
                              connected evidence. Exact statutory milestone
                              dates are not inferred where they are not stored.
                              Financial figures shown here are illustrative demo
                              values when no saved amount is available.
                            </span>
                          </div>
                        </>
                      )}
                    </article>

                    <aside className="pl-demo-timeline-side">
                      <section className="pl-demo-stage-card">
                        <Target
                          size={30}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />

                        <p className="pl-eyebrow" style={{ marginTop: 13 }}>
                          CURRENT STAGE
                        </p>

                        <h2>{projectStage}</h2>

                        <p className="pl-demo-stage-position">
                          Stage {currentStageIndex + 1} of {stageOrder.length}
                          {' · '}
                          {workflowPosition}% workflow position
                        </p>

                        <div
                          className="pl-demo-progress-track"
                          aria-label={`${workflowPosition}% workflow position`}
                        >
                          <span style={{ width: `${workflowPosition}%` }} />
                        </div>
                      </section>

                      <section className="pl-demo-signal-card">
                        <h3>Connected evidence</h3>

                        <div className="pl-demo-signal-grid">
                          <div className="pl-demo-signal">
                            <span>Parcels</span>
                            <strong>{parcelResult?.total ?? '—'}</strong>
                          </div>

                          <div className="pl-demo-signal">
                            <span>Documents</span>
                            <strong>
                              {timelineSummary?.documents ?? '—'}
                            </strong>
                          </div>

                          <div className="pl-demo-signal">
                            <span>Court cases</span>
                            <strong>
                              {timelineSummary?.cases ?? '—'}
                            </strong>
                          </div>

                          <div className="pl-demo-signal">
                            <span>Open actions</span>
                            <strong>
                              {timelineSummary?.openActions ?? '—'}
                            </strong>
                          </div>

                          <div className="pl-demo-signal">
                            <span>R&amp;R records</span>
                            <strong>
                              {timelineSummary?.rehabilitationRecords ?? '—'}
                            </strong>
                          </div>

                          <div className="pl-demo-signal">
                            <span>Paid amount</span>
                            <strong style={{ fontSize: 13 }}>
                              {rupees(demoDisbursedPaise)}
                            </strong>
                          </div>
                        </div>

                        <div className="pl-demo-blockers">
                          {disputedParcels > 0 && (
                            <div className="pl-demo-blocker">
                              <AlertTriangle size={15} aria-hidden="true" />
                              {disputedParcels} ownership dispute
                              {disputedParcels === 1 ? '' : 's'} require
                              follow-up
                            </div>
                          )}

                          {(timelineSummary?.cases ?? 0) > 0 && (
                            <div className="pl-demo-blocker">
                              <Scale size={15} aria-hidden="true" />
                              {timelineSummary?.cases} linked court case
                              {timelineSummary?.cases === 1 ? '' : 's'}
                            </div>
                          )}

                          {(timelineSummary?.openActions ?? 0) > 0 && (
                            <div className="pl-demo-blocker">
                              <ClipboardList size={15} aria-hidden="true" />
                              {timelineSummary?.openActions} open follow-up
                              {timelineSummary?.openActions === 1 ? '' : 's'}
                            </div>
                          )}
                        </div>
                      </section>

                      <section className="pl-demo-next-card">
                        <h3>Next readiness step</h3>

                        <p>
                          Resolve the ownership discrepancy, review the pending
                          legal matter and complete compensation follow-ups
                          before moving the demo workflow to Possession.
                        </p>

                        <div className="pl-demo-actions">
                          <Link to="/actions" className="pl-primary">
                            Open Action Centre
                            <ArrowRight size={15} aria-hidden="true" />
                          </Link>

                          <Link
                            to="/documents"
                            className="pl-demo-secondary"
                          >
                            <FileText size={15} aria-hidden="true" />
                            Review documents
                          </Link>
                        </div>
                      </section>
                    </aside>
                  </div>
                </>
              ) : (
                <div className="pl-timeline-layout">
                  <article className="pl-card">
                    <div className="pl-card-heading">
                      <div>
                        <p className="pl-eyebrow">
                          FROM START TO COMPLETION
                        </p>
                        <h2>Acquisition milestones</h2>
                      </div>
                      <CalendarDays size={24} aria-hidden="true" />
                    </div>

                    <div className="pl-empty">
                      <CalendarDays
                        size={36}
                        strokeWidth={1.4}
                        aria-hidden="true"
                      />
                      <h3>Milestone dates are unavailable.</h3>
                      <p>
                        The current source provides the project stage but does
                        not provide a verified milestone history.
                      </p>
                    </div>
                  </article>

                  <aside className="pl-timeline-aside">
                    <Target
                      size={32}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <p className="pl-eyebrow">CURRENT STAGE</p>
                    <h2>{projectStage}</h2>
                    <p>
                      Recorded project stage. LIVA does not infer historical
                      dates for source-backed projects.
                    </p>

                    <div className="pl-aside-divider" />

                    <h3>Keep follow-ups visible.</h3>
                    <p>
                      Open the Action Centre to review or create a task.
                    </p>

                    <Link to="/actions" className="pl-primary">
                      Open Action Centre
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </aside>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="pl-footer">
        <strong>Liva</strong>
        <span>Better land decisions. Stronger communities.</span>
      </footer>
    </div>
  )
}