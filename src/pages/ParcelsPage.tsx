import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ArrowRight,
  CheckCircle2,
  Plus,
  ChevronDown,
  FileText,
  Layers,
  List,
  Map as MapIcon,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react'

import GisWorkspace from '../components/dashboard/GisWorkspace'
import { useFlash } from '../context/FlashContext'
import '../styles/dashboard.css'
import '../styles/parcels.css'

type Parcel = {
  id: string
  projectId: string
  project: string
  surveyNumber: string
  village: string
  district: string
  areaHa: number | null
  ownership: string
  stage: string
  isDemo: boolean
  compensationStatus: string | null
  linkedCases: number | null
  documentCount: number | null
  sourceName: string | null
  sourceUrl: string | null
  sourceRecordId: string | null
  sourceDate: string | null
}

const acquisitionStages = [
  'Survey',
  'Verification',
  'Award',
  'Compensation',
  'Possession',
]

const ownershipStatuses = [
  'Pending verification',
  'Verified',
  'Disputed',
]

function showValue(value: string | number | null | undefined) {
  return value == null || value === '' ? 'Not available' : String(value)
}

function isParcel(value: unknown): value is Parcel {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>

  const textFields = [
    'id', 'projectId', 'project', 'surveyNumber',
    'village', 'district', 'ownership', 'stage',
  ]

  const nullableTextFields = [
    'compensationStatus', 'sourceName', 'sourceUrl',
    'sourceRecordId', 'sourceDate',
  ]

  return (
    textFields.every((key) => typeof item[key] === 'string') &&
    nullableTextFields.every(
      (key) => item[key] === null || typeof item[key] === 'string',
    ) &&
    typeof item.isDemo === 'boolean' &&
    (
      item.areaHa === null ||
      (
        typeof item.areaHa === 'number' &&
        Number.isFinite(item.areaHa) &&
        item.areaHa > 0
      )
    ) &&
    ['linkedCases', 'documentCount'].every(
      (key) =>
        item[key] === null ||
        (
          typeof item[key] === 'number' &&
          Number.isInteger(item[key]) &&
          Number(item[key]) >= 0
        ),
    )
  )
}

function safeSourceUrl(value: string | null | undefined) {
  if (!value) return null

  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}


type ProjectOption = {
  id: string
  name: string
  district?: string | null
  isDemo?: boolean
}

type ParcelDraft = {
  projectId: string
  surveyNumber: string
  village: string
  district: string
  areaHa: string
  ownership: string
  stage: string
  isDemo: boolean
  sourceName: string
  sourceUrl: string
  sourceRecordId: string
  sourceDate: string
}

function makeParcelDraft(): ParcelDraft {
  return {
    projectId: '',
    surveyNumber: '',
    village: '',
    district: '',
    areaHa: '',
    ownership: 'Pending verification',
    stage: 'Survey',
    isDemo: true,
    sourceName: '',
    sourceUrl: '',
    sourceRecordId: '',
    sourceDate: '',
  }
}

export default function ParcelsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { success: flashSuccess, error: flashError } = useFlash()

  const [parcels, setParcels] = useState<Parcel[]>([])
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editingParcel, setEditingParcel] = useState<Parcel | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [parcelDraft, setParcelDraft] = useState<ParcelDraft>(makeParcelDraft)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [query, setQuery] = useState('')
  const [project, setProject] = useState(() => searchParams.get('projectId') ?? '')
  const [district, setDistrict] = useState('')
  const [ownership, setOwnership] = useState('')
  const [stage, setStage] = useState('')
  const [view, setView] = useState<'table' | 'map'>('table')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const panelRef = useRef<HTMLElement>(null)
  const returnFocus = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadParcels() {
      setLoading(true)
      setError('')

      try {
        const baseUrl = (
          import.meta.env.VITE_API_BASE_URL ||
          'http://127.0.0.1:8000'
        ).replace(/\/+$/, '')

        const response = await fetch(`${baseUrl}/api/parcels?limit=100`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Unable to load parcels (${response.status}).`)
        }

        const data: unknown = await response.json()

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid parcel response.')
        }

        const result = data as Record<string, unknown>

        if (
          !Array.isArray(result.items) ||
          !result.items.every(isParcel) ||
          typeof result.total !== 'number' ||
          !Number.isInteger(result.total) ||
          result.total < result.items.length
        ) {
          throw new Error('The API returned invalid parcel records.')
        }

        if (!controller.signal.aborted) {
          setParcels(result.items)
          setTotal(result.total)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setParcels([])
          setTotal(0)
          setError(
            err instanceof TypeError
              ? 'Unable to reach the API. Check the backend and CORS settings.'
              : err instanceof Error
                ? err.message
                : 'Unable to load parcels.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadParcels()
    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    const controller = new AbortController()

    async function loadProjects() {
      try {
        const baseUrl = (
          import.meta.env.VITE_API_BASE_URL ||
          'http://127.0.0.1:8000'
        ).replace(/\/+$/, '')

        const [portfolioResponse, livaResponse] = await Promise.all([
          fetch(`${baseUrl}/api/projects`, { signal: controller.signal }),
          fetch(`${baseUrl}/api/liva/projects`, { signal: controller.signal }),
        ])
        const portfolioPayload: unknown = portfolioResponse.ok ? await portfolioResponse.json() : { items: [] }
        const livaPayload: unknown = livaResponse.ok ? await livaResponse.json() : []
        const items = portfolioPayload && typeof portfolioPayload === 'object'
          ? (portfolioPayload as { items?: unknown }).items
          : null
        if (!Array.isArray(items) && !Array.isArray(livaPayload)) return

        const options = (Array.isArray(items) ? items : [])
          .filter(
            (item): item is Record<string, unknown> =>
              Boolean(item) &&
              typeof item === 'object' &&
              typeof item.id === 'string' &&
              typeof item.name === 'string',
          )
          .map((item) => ({
            id: String(item.id),
            name: String(item.name),
            district:
              typeof item.district === 'string' ? item.district : null,
            isDemo: item.isDemo === true,
          }))
        const livaOptions = (Array.isArray(livaPayload) ? livaPayload : [])
          .flatMap((item) => {
            if (!item || typeof item !== 'object') return []
            const record = item as Record<string, unknown>
            return typeof record.projectId === 'string' && typeof record.projectName === 'string'
              ? [{ id: record.projectId, name: record.projectName, district: typeof record.district === 'string' ? record.district : null, isDemo: record.isDemo === true }]
              : []
          })
        const allOptions = [...options, ...livaOptions]
          .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
          .sort((a, b) => a.name.localeCompare(b.name))

        if (!controller.signal.aborted) {
          setProjectOptions(allOptions)
        }
      } catch {
        // Parcel creation remains available; project loading errors are shown
        // when the user opens the form and submits without a project.
      }
    }

    void loadProjects()
    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    if (panelOpen) panelRef.current?.focus({ preventScroll: true })
  }, [panelOpen, selectedParcel?.id])

  const districts = useMemo(
    () =>
      [...new Set(
        parcels
          .filter((parcel) => !project || parcel.projectId === project)
          .map((parcel) => parcel.district),
      )].sort(),
    [parcels, project],
  )

  const filteredParcels = useMemo(() => {
    const term = query.trim().toLowerCase()

    return parcels.filter((parcel) => {
      const text =
        `${parcel.id} ${parcel.surveyNumber} ${parcel.village} ${parcel.project}`
          .toLowerCase()

      return (
        (!term || text.includes(term)) &&
        (!project || parcel.projectId === project) &&
        (!district || parcel.district === district) &&
        (!ownership || parcel.ownership === ownership) &&
        (!stage || parcel.stage === stage)
      )
    })
  }, [parcels, query, project, district, ownership, stage])

  const knownAreas = parcels
    .map((parcel) => parcel.areaHa)
    .filter((area): area is number => area !== null)

  const areaTotal = knownAreas.reduce((sum, area) => sum + area, 0)
  const verifiedCount = parcels.filter(
    (parcel) => parcel.ownership === 'Verified',
  ).length

  const ready = !loading && !error
  const filterCount = [project, district, ownership, stage].filter(Boolean).length
  const hasFilters = Boolean(query || filterCount)
  const sourceUrl = safeSourceUrl(selectedParcel?.sourceUrl)

  function openCreateParcel() {
    setCreateError('')
    setEditingParcel(null)
    const projectId = project || searchParams.get('projectId') || ''
    const selectedProject = projectOptions.find((item) => item.id === projectId)
    setParcelDraft({
      ...makeParcelDraft(),
      projectId,
      isDemo: selectedProject?.isDemo ?? !projectId.startsWith('LIVA-PRJ-'),
    })
    setCreateOpen(true)
  }

  function openEditParcel(parcel: Parcel) {
    setCreateError('')
    setEditingParcel(parcel)
    setParcelDraft({
      projectId: parcel.projectId,
      surveyNumber: parcel.surveyNumber,
      village: parcel.village,
      district: parcel.district,
      areaHa: parcel.areaHa == null ? '' : String(parcel.areaHa),
      ownership: parcel.ownership,
      stage: parcel.stage,
      isDemo: parcel.isDemo,
      sourceName: parcel.sourceName ?? '',
      sourceUrl: parcel.sourceUrl ?? '',
      sourceRecordId: parcel.sourceRecordId ?? '',
      sourceDate: parcel.sourceDate ?? '',
    })
    setCreateOpen(true)
  }

  function closeCreateParcel() {
    if (creating) return
    setCreateOpen(false)
    setEditingParcel(null)
    setCreateError('')
  }

  function updateParcelDraft<K extends keyof ParcelDraft>(
    field: K,
    value: ParcelDraft[K],
  ) {
    setParcelDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function createParcel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (creating) return

    const draft = parcelDraft
    const area = Number(draft.areaHa)
    const isEditing = Boolean(editingParcel)

    if (!draft.projectId) {
      const message = 'Select a project before saving the parcel.'
      setCreateError(message)
      flashError(message)
      return
    }

    if (!draft.surveyNumber.trim()) {
      const message = 'Enter a survey number.'
      setCreateError(message)
      flashError(message)
      return
    }

    if (!draft.village.trim() || !draft.district.trim()) {
      const message = 'Enter village and district.'
      setCreateError(message)
      flashError(message)
      return
    }

    if (!Number.isFinite(area) || area <= 0) {
      const message = 'Enter a valid land area greater than 0.'
      setCreateError(message)
      flashError(message)
      return
    }

    setCreating(true)
    setCreateError('')

    try {
      const baseUrl = (
        import.meta.env.VITE_API_BASE_URL ||
        'http://127.0.0.1:8000'
      ).replace(/\/+$/, '')

     const endpoint =
  isEditing && editingParcel
    ? `${baseUrl}/api/parcels/${encodeURIComponent(editingParcel.id)}`
    : `${baseUrl}/api/parcels`

      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: draft.projectId,
          surveyNumber: draft.surveyNumber.trim(),
          village: draft.village.trim(),
          district: draft.district.trim(),
          areaHa: area,
          ownership: draft.ownership,
          stage: draft.stage,
          isDemo: draft.isDemo,
          sourceName: draft.sourceName.trim() || null,
          sourceUrl: draft.sourceUrl.trim() || null,
          sourceRecordId: draft.sourceRecordId.trim() || null,
          sourceDate: draft.sourceDate || null,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        const detail =
          payload &&
          typeof payload === 'object' &&
          'detail' in payload
            ? (payload as { detail?: unknown }).detail
            : null

        const message =
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
              ? detail
                  .map((item) =>
                    item &&
                    typeof item === 'object' &&
                    'msg' in item
                      ? String((item as { msg?: unknown }).msg)
                      : String(item),
                  )
                  .join(' ')
              : `Unable to ${isEditing ? 'update' : 'register'} parcel (${response.status}).`

        throw new Error(message)
      }

      setCreateOpen(false)
      setEditingParcel(null)
      setParcelDraft(makeParcelDraft())

      flashSuccess(
        isEditing
          ? 'Parcel updated successfully.'
          : 'Parcel registered successfully.',
      )

      setReloadKey((value) => value + 1)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Unable to ${isEditing ? 'update' : 'register'} parcel.`
      setCreateError(message)
      flashError(message)
    } finally {
      setCreating(false)
    }
  }


  function clearFilters() {
    setQuery('')
    setProject('')
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('projectId')
      return next
    })
    setDistrict('')
    setOwnership('')
    setStage('')
  }

  function openParcel(parcel: Parcel, button: HTMLButtonElement) {
    returnFocus.current = button
    setSelectedParcel(parcel)
    setPanelOpen(true)
  }

  function closePanel() {
    setPanelOpen(false)
    requestAnimationFrame(() => {
      const button = returnFocus.current
      if (button?.isConnected) button.focus()
      else document.getElementById('parcel-panel-toggle')?.focus()
    })
  }

  function retry() {
    setLoading(true)
    setError('')
    setSelectedParcel(null)
    setPanelOpen(false)
    setReloadKey((value) => value + 1)
  }

  return (
    <div className="parcel-page">
      <a className="parcel-skip" href="#parcel-main">Skip to parcel registry</a>

    

      <main id="parcel-main" className="parcel-main">
        <div className="parcel-breadcrumb">
          <Link to="/dashboard">Workspace</Link>
          <span>/</span>
          <span>Land parcels</span>
        </div>

       <section className="parcel-page-heading">
  <div>
    <p className="parcel-eyebrow">LAND PARCEL REGISTRY</p>

    <h1>Every parcel. Connected context.</h1>

    <p className="parcel-description">
      Review land records, ownership checks and acquisition stages
      in one workspace.
    </p>
  </div>

  <div
    className="parcel-heading-actions"
    style={{
      display: 'flex',
      gap: '12px',
      marginRight: '12px',
    }}
  >
    <button
      type="button"
      className="parcel-primary"
      onClick={openCreateParcel}
    >
      <Plus size={16} aria-hidden="true" />
      Register parcel
    </button>

    <Link to="/projects" className="parcel-outline-button">
      Project portfolio <ArrowRight size={16} aria-hidden="true" />
    </Link>
  </div>
</section>

        <section className="parcel-stats" aria-label="Loaded parcel summary">
          {[
            {
              label: 'Parcels loaded',
              value: String(parcels.length),
            
              icon: Layers,
              tone: 'green',
            },
            {
              label: 'Recorded land area',
              value: knownAreas.length ? `${areaTotal.toFixed(2)} ha` : '—',
              note: `From ${knownAreas.length} records with known area`,
              icon: MapPin,
              tone: 'blue',
            },
            {
              label: 'Ownership marked verified',
              value: String(verifiedCount),
              icon: ShieldCheck,
              tone: 'gold',
            },
          ].map(({ label, value, note, icon: Icon, tone }) => (
            <article className={`parcel-stat parcel-stat-${tone}`} key={label}>
              <span className="parcel-stat-icon">
                <Icon size={25} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <h2>{label}</h2>
                <strong>{ready ? value : '—'}</strong>
                <p>{note}</p>
              </div>
            </article>
          ))}
        </section>

        {ready && parcels.some((parcel) => parcel.isDemo) && (
          <p className="parcel-map-note">
            Includes illustrative demo records. Summary counts include demos.
          </p>
        )}

        <section className="parcel-workspace" aria-labelledby="parcel-list-title">
          <div className="parcel-toolbar">
            <div>
              <h2 id="parcel-list-title">Parcel workspace</h2>
              <p>Search records or explore the geographic context.</p>
            </div>

            <div className="parcel-toolbar-actions">
              <button
                className="parcel-outline-button"
                type="button"
                aria-expanded={filtersOpen}
                aria-controls="parcel-filter-panel"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filters {filterCount > 0 && `(${filterCount})`}
                <ChevronDown
                  size={14}
                  className={filtersOpen ? 'parcel-chevron-open' : ''}
                  aria-hidden="true"
                />
              </button>

              <div className="parcel-view-toggle" role="group" aria-label="Workspace view">
                <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>
                  <List size={16} aria-hidden="true" /> Table
                </button>
                <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>
                  <MapIcon size={16} aria-hidden="true" /> Map
                </button>
              </div>
            </div>
          </div>

          <div
            id="parcel-filter-panel"
            className={`parcel-filter-wrapper ${filtersOpen ? 'is-open' : ''}`}
            inert={!filtersOpen}
          >
            <div className="parcel-filter-inner">
              <div className="parcel-filters">
                <label className="parcel-search">
                  <Search size={18} aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Search parcels"
                    placeholder="Search parcel ID, survey number or village…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>

                <label className="parcel-select">
                  <span>Project</span>
                  <select value={project} onChange={(event) => {
                    const projectId = event.target.value
                    setProject(projectId)
                    setDistrict('')
                    setSearchParams((current) => {
                      const next = new URLSearchParams(current)
                      if (projectId) next.set('projectId', projectId)
                      else next.delete('projectId')
                      return next
                    })
                  }}>
                    <option value="">All projects</option>
                    {projectOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>

                <label className="parcel-select">
                  <span>District</span>
                  <select value={district} onChange={(event) => setDistrict(event.target.value)}>
                    <option value="">All districts</option>
                    {districts.map((name) => <option key={name}>{name}</option>)}
                  </select>
                </label>

                <label className="parcel-select">
                  <span>Ownership</span>
                  <select value={ownership} onChange={(event) => setOwnership(event.target.value)}>
                    <option value="">All statuses</option>
                    {ownershipStatuses.map((name) => <option key={name}>{name}</option>)}
                  </select>
                </label>

                <label className="parcel-select">
                  <span>Acquisition stage</span>
                  <select value={stage} onChange={(event) => setStage(event.target.value)}>
                    <option value="">All stages</option>
                    {acquisitionStages.map((name) => <option key={name}>{name}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="parcel-result-bar">
            <p role="status">
              {loading
                ? 'Loading parcels…'
                : error
                  ? 'Unable to load parcels'
                  : `${filteredParcels.length} shown · ${parcels.length} loaded · ${total} saved`}
            </p>

            <div>
              {hasFilters && (
                <button className="parcel-text-button" type="button" onClick={clearFilters}>
                  <X size={14} aria-hidden="true" /> Clear filters
                </button>
              )}

              <button
                id="parcel-panel-toggle"
                type="button"
                className="parcel-text-button"
                aria-expanded={panelOpen}
                aria-controls="parcel-details-panel"
                onClick={(event) => {
                  if (panelOpen) closePanel()
                  else {
                    returnFocus.current = event.currentTarget
                    setPanelOpen(true)
                  }
                }}
              >
                <FileText size={15} aria-hidden="true" />
                {panelOpen ? 'Hide details' : 'Details panel'}
              </button>
            </div>
          </div>

          {ready && total > parcels.length && (
            <p className="parcel-map-note">
              Showing the latest 100 records. Filters and summaries apply
              only to loaded records.
            </p>
          )}

          <div className={`parcel-content-grid ${panelOpen ? 'panel-open' : ''}`}>
            <div className="parcel-content-main">
              {loading && (
                <div className="parcel-empty">
                  <h3>Loading land records…</h3>
                </div>
              )}

              {!loading && error && (
                <div className="parcel-empty">
                  <h3>Could not load parcels.</h3>
                  <p role="alert">{error}</p>
                  <button type="button" className="parcel-primary" onClick={retry}>
                    Try again
                  </button>
                </div>
              )}

              {ready && view === 'table' && (
                <div className="parcel-table-view">
                  <div className="parcel-table-scroll">
                    <table className="parcel-table">
                      <caption className="parcel-sr-only">Land parcel registry</caption>
                      <thead>
                        <tr>
                          <th scope="col">Parcel / Survey no.</th>
                          <th scope="col">Project & location</th>
                          <th scope="col">Area</th>
                          <th scope="col">Ownership</th>
                          <th scope="col">Stage</th>
                          <th scope="col">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredParcels.map((parcel) => (
                          <tr
                            key={parcel.id}
                            className={
                              selectedParcel?.id === parcel.id && panelOpen
                                ? 'parcel-row-selected'
                                : ''
                            }
                          >
                            <td>
                              <strong>{parcel.surveyNumber}</strong>
                              <span>{parcel.id}</span>
                              {parcel.isDemo && <span>Demo record</span>}
                            </td>
                            <td>
                              <strong>{parcel.project}</strong>
                              <span>{parcel.village}, {parcel.district}</span>
                            </td>
                            <td>{parcel.areaHa === null ? '—' : `${parcel.areaHa} ha`}</td>
                            <td>{parcel.ownership}</td>
                            <td><span className="parcel-stage-pill">{parcel.stage}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
                                <button
                                  className="parcel-row-button"
                                  type="button"
                                  aria-label={`View parcel ${parcel.surveyNumber}`}
                                  onClick={(event) => openParcel(parcel, event.currentTarget)}
                                >
                                  View <ArrowRight size={14} aria-hidden="true" />
                                </button>
                                <button
                                  className="parcel-row-button"
                                  type="button"
                                  aria-label={`Edit parcel ${parcel.surveyNumber}`}
                                  onClick={() => openEditParcel(parcel)}
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredParcels.length === 0 && (
                    <div className="parcel-empty">
                      <span className="parcel-empty-icon">
                        <Layers size={34} strokeWidth={1.4} aria-hidden="true" />
                      </span>
                      <h3>{parcels.length ? 'No matching parcels.' : 'No parcels saved yet.'}</h3>
                      <p>
                        {parcels.length
                          ? 'Try another search or clear the filters.'
                          : 'Saved parcels will appear here with their linked project.'}
                      </p>
                      {hasFilters && (
                        <button className="parcel-primary" type="button" onClick={clearFilters}>
                          Clear filters <X size={15} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {ready && view === 'map' && (
                <div className="parcel-map-view">
                  <p className="parcel-map-note">
                    <MapPin size={16} aria-hidden="true" />
                    Geographic basemap only. Parcel boundaries and registry
                    filters are not yet connected to this map.
                  </p>
                  <div className="enterprise-dashboard parcel-map-host">
                    <GisWorkspace />
                  </div>
                </div>
              )}
            </div>

            <div className="parcel-details-shell" inert={!panelOpen}>
              <aside
                ref={panelRef}
                id="parcel-details-panel"
                className="parcel-details-panel"
                aria-labelledby="parcel-details-heading"
                tabIndex={-1}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') closePanel()
                }}
              >
                <div className="parcel-details-heading">
                  <h2 id="parcel-details-heading">Parcel details</h2>
                  <button type="button" aria-label="Close parcel details" onClick={closePanel}>
                    <X size={18} />
                  </button>
                </div>

                <div className="parcel-details-body">
                  <span className="parcel-detail-symbol">
                    <MapIcon size={29} strokeWidth={1.4} aria-hidden="true" />
                  </span>
                  <h3>{selectedParcel?.surveyNumber ?? 'Select a parcel'}</h3>
                  <p>
                    {selectedParcel
                      ? `${selectedParcel.village}, ${selectedParcel.district}`
                      : 'Choose a record to review its details.'}
                  </p>

                  <dl>
                    {[
                      ['Project', selectedParcel?.project],
                      ['Survey number', selectedParcel?.surveyNumber],
                      ['Area', selectedParcel?.areaHa == null ? null : `${selectedParcel.areaHa} ha`],
                      ['Ownership', selectedParcel?.ownership],
                      ['Stage', selectedParcel?.stage],
                      ['Compensation', selectedParcel?.compensationStatus],
                      ['Linked court cases', selectedParcel?.linkedCases],
                      ['Documents', selectedParcel?.documentCount],
                      ['Source name', selectedParcel?.sourceName],
                      ['Source record ID', selectedParcel?.sourceRecordId],
                      ['Source date', selectedParcel?.sourceDate],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <dt>{label}</dt>
                        <dd>{showValue(value)}</dd>
                      </div>
                    ))}
                  </dl>

                  {sourceUrl && (
                    <p>
                      <a
                        className="parcel-text-button"
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open source <ArrowRight size={15} aria-hidden="true" />
                      </a>
                    </p>
                  )}

                  {selectedParcel && (
                    <>
                      <p className="parcel-detail-note">
                        <FileText size={15} aria-hidden="true" />
                        {selectedParcel.isDemo
                          ? 'Illustrative demo record.'
                          : 'Source-linked record. Source details do not establish independent verification.'}
                      </p>
                      <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="parcel-outline-button"
                          onClick={() => openEditParcel(selectedParcel)}
                        >
                          Edit parcel
                        </button>
                        <Link
                          className="parcel-primary"
                          to={`/projects/${encodeURIComponent(selectedParcel.projectId)}`}
                        >
                          Open project
                          <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>


      {createOpen && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreateParcel()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'rgba(15, 38, 31, 0.48)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-parcel-title"
            style={{
              width: 'min(760px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              border: '1px solid #d7e1db',
              borderRadius: '16px',
              boxShadow: '0 24px 70px rgba(20, 43, 35, 0.22)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: '#5d766c',
                  }}
                >
                  LAND PARCEL REGISTRY
                </p>
                <h2
                  id="register-parcel-title"
                  style={{
                    margin: '5px 0 6px',
                    fontSize: '24px',
                    color: '#173f34',
                  }}
                >
                  {editingParcel ? 'Edit parcel' : 'Register new parcel'}
                </h2>
                <p style={{ margin: 0, color: '#61736c', fontSize: '14px' }}>
                  {editingParcel
                    ? 'Update the saved parcel record and keep its project link.'
                    : 'Add a parcel and connect it to the project workflow.'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close register parcel"
                onClick={closeCreateParcel}
                disabled={creating}
                style={{
                  width: '36px',
                  height: '36px',
                  border: '1px solid #d7e1db',
                  borderRadius: '9px',
                  background: '#fff',
                  cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div
                role="alert"
                style={{
                  marginBottom: '16px',
                  padding: '11px 13px',
                  borderRadius: '9px',
                  border: '1px solid #efcaca',
                  background: '#fff5f5',
                  color: '#a23a3a',
                  fontSize: '13px',
                }}
              >
                {createError}
              </div>
            )}

            <form onSubmit={createParcel}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '16px',
                }}
              >
                {[
                  ['Survey number', 'surveyNumber', '121/1 Part'],
                  ['Village', 'village', 'Majiwade'],
                  ['District', 'district', 'Thane'],
                  ['Area (ha)', 'areaHa', '0.0021'],
                ].map(([label, field, placeholder]) => (
                  <label key={field} style={{ display: 'grid', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 650, color: '#29483f' }}>
                      {label}
                    </span>
                    <input
                      required
                      type={field === 'areaHa' ? 'number' : 'text'}
                      step={field === 'areaHa' ? '0.0001' : undefined}
                      min={field === 'areaHa' ? '0.0001' : undefined}
                      value={parcelDraft[field as keyof ParcelDraft] as string}
                      placeholder={placeholder}
                      onChange={(event) =>
                        updateParcelDraft(
                          field as keyof ParcelDraft,
                          event.target.value as never,
                        )
                      }
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 11px',
                        border: '1px solid #ccd9d3',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#173f34',
                        outline: 'none',
                      }}
                    />
                  </label>
                ))}

                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#29483f' }}>
                    Project
                  </span>
                  <select
                    required
                    value={parcelDraft.projectId}
                    onChange={(event) => {
                      const selectedProject = projectOptions.find(
                        (item) => item.id === event.target.value,
                      )
                      setParcelDraft((current) => ({
                        ...current,
                        projectId: event.target.value,
                        district:
                          current.district ||
                          selectedProject?.district ||
                          '',
                      }))
                    }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 11px',
                      border: '1px solid #ccd9d3',
                      borderRadius: '8px',
                      background: '#fff',
                      fontSize: '14px',
                      color: '#173f34',
                    }}
                  >
                    <option value="">Select project</option>
                    {projectOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#29483f' }}>
                    Ownership
                  </span>
                  <select
                    value={parcelDraft.ownership}
                    onChange={(event) =>
                      updateParcelDraft('ownership', event.target.value)
                    }
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 11px',
                      border: '1px solid #ccd9d3',
                      borderRadius: '8px',
                      background: '#fff',
                      fontSize: '14px',
                      color: '#173f34',
                    }}
                  >
                    {ownershipStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#29483f' }}>
                    Acquisition stage
                  </span>
                  <select
                    value={parcelDraft.stage}
                    onChange={(event) =>
                      updateParcelDraft('stage', event.target.value)
                    }
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 11px',
                      border: '1px solid #ccd9d3',
                      borderRadius: '8px',
                      background: '#fff',
                      fontSize: '14px',
                      color: '#173f34',
                    }}
                  >
                    {acquisitionStages.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#29483f' }}>
                    Source date
                  </span>
                  <input
                    type="date"
                    value={parcelDraft.sourceDate}
                    onChange={(event) =>
                      updateParcelDraft('sourceDate', event.target.value)
                    }
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 11px',
                      border: '1px solid #ccd9d3',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#173f34',
                    }}
                  />
                </label>

                {[
                  ['Source name', 'sourceName', 'LIVA Demonstration Dataset'],
                  ['Source record ID', 'sourceRecordId', 'LIVA-DEMO-PARCEL-001'],
                  ['Source URL', 'sourceUrl', 'https://www.data.gov.in/'],
                ].map(([label, field, placeholder]) => (
                  <label
                    key={field}
                    style={{
                      display: 'grid',
                      gap: '6px',
                      gridColumn: field === 'sourceUrl' ? '1 / -1' : undefined,
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 650, color: '#29483f' }}>
                      {label}
                    </span>
                    <input
                      type="text"
                      value={parcelDraft[field as keyof ParcelDraft] as string}
                      placeholder={placeholder}
                      onChange={(event) =>
                        updateParcelDraft(
                          field as keyof ParcelDraft,
                          event.target.value as never,
                        )
                      }
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 11px',
                        border: '1px solid #ccd9d3',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#173f34',
                      }}
                    />
                  </label>
                ))}
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  marginTop: '16px',
                  fontSize: '13px',
                  color: '#29483f',
                }}
              >
                <input
                  type="checkbox"
                  checked={parcelDraft.isDemo}
                  onChange={(event) =>
                    updateParcelDraft('isDemo', event.target.checked)
                  }
                />
                Illustrative demo record
              </label>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop: '1px solid #e5ece8',
                }}
              >
                <button
                  type="button"
                  className="parcel-outline-button"
                  onClick={closeCreateParcel}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="parcel-primary"
                  disabled={creating}
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  {creating
                    ? editingParcel
                      ? 'Saving…'
                      : 'Registering…'
                    : editingParcel
                      ? 'Save changes'
                      : 'Register parcel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="parcel-footer">
        <strong>Liva</strong>
        <span>Better land decisions. Stronger communities.</span>
      </footer>
    </div>
  )
}
