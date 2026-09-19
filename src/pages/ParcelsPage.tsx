import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
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

export default function ParcelsPage() {
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [query, setQuery] = useState('')
  const [project, setProject] = useState('')
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
    if (panelOpen) panelRef.current?.focus({ preventScroll: true })
  }, [panelOpen, selectedParcel?.id])

  const projects = useMemo(
    () =>
      [...new Map(
        parcels.map((parcel) => [parcel.projectId, parcel.project]),
      )].sort((a, b) => a[1].localeCompare(b[1])),
    [parcels],
  )

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

  function clearFilters() {
    setQuery('')
    setProject('')
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

      <header className="parcel-header">
        <Link to="/" className="parcel-brand" aria-label="Liva home">
          Liva<span>.</span>
        </Link>

        <nav aria-label="Workspace navigation">
          <Link to="/dashboard">Overview</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/parcels" aria-current="page">Land Parcels</Link>
          <Link to="/ownership-survey">Ownership & Survey</Link>
          <Link to="/dashboard#dashboard-map">GIS Workspace</Link>
        </nav>

        <Link to="/dashboard" className="parcel-back">
          <ArrowLeft size={16} aria-hidden="true" /> Dashboard
        </Link>
      </header>

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
          <Link to="/projects" className="parcel-outline-button">
            Project portfolio <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <section className="parcel-stats" aria-label="Loaded parcel summary">
          {[
            {
              label: 'Parcels loaded',
              value: String(parcels.length),
              note: 'Up to 100 records in this view',
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
              note: 'Recorded status, not independently verified',
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
                    setProject(event.target.value)
                    setDistrict('')
                  }}>
                    <option value="">All projects</option>
                    {projects.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
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
                              <button
                                className="parcel-row-button"
                                type="button"
                                aria-label={`View parcel ${parcel.surveyNumber}`}
                                onClick={(event) => openParcel(parcel, event.currentTarget)}
                              >
                                View <ArrowRight size={14} aria-hidden="true" />
                              </button>
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
                      <Link
                        className="parcel-primary"
                        to={`/projects/${encodeURIComponent(selectedParcel.projectId)}`}
                      >
                        Open project
                        <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <footer className="parcel-footer">
        <strong>Liva</strong>
        <span>Better land decisions. Stronger communities.</span>
      </footer>
    </div>
  )
}