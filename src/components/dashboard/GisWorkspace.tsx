import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { FormEvent, ReactNode } from 'react'

import { useSearchParams } from 'react-router'

import * as maplibregl from 'maplibre-gl'

import {
  Check,
  Flame,
  Layers,
  LocateFixed,
  MapPin,
  RefreshCcw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'

import 'maplibre-gl/dist/maplibre-gl.css'

import { getProjectRisk } from '../../services/riskApi'
import type { RiskLevel, RiskPrediction } from '../../types/risk'
import { useAuth } from '../../auth/AuthContext'


type Place = {
  id: string
  name: string
  display_name: string
  lat: number
  lon: number
  type?: string | null
  category?: string | null
  source: string
  boundingbox?: [number, number, number, number] | null
}

type SearchResponse = {
  query: string
  items: Place[]
  count: number
  cached: boolean
}

type Project = {
  id: string
  name: string
  state: string
  district: string
  stage: string
  progress: number | null
  latitude: number | null
  longitude: number | null
  locationDisplayName?: string | null
  locationSource?: string | null
  sector?: string | null
  line_ministry?: string | null
  sourceName?: string | null
  sourceRecordId?: string | null
  isDemo?: boolean
}

type ProjectResponse = {
  items: Project[]
  count: number
}

type ProjectRiskMap = Record<string, RiskPrediction>
type Basemap = 'satellite' | 'road'
type CandidateSource = 'AUTO' | 'MANUAL'
type RiskFilter = 'ALL' | RiskLevel | 'UNAVAILABLE'
type LocationFilter = 'ALL' | 'LOCATED' | 'UNLOCATED'

type GeoFeature = {
  type: 'Feature'
  id?: string
  geometry: {
    type: string
    coordinates: unknown
  }
  properties: Record<string, unknown>
}

type GeoFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

const EMPTY_GEOJSON: GeoFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

const INITIAL_CENTER: [number, number] = [72.8777, 19.076]
const INITIAL_ZOOM = 11

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: '#2f7d63',
  MEDIUM: '#b8892d',
  HIGH: '#d46b2e',
  CRITICAL: '#b94343',
}

const UNKNOWN_RISK_COLOR = '#718078'
const CANDIDATE_COLOR = '#b68a37'

const UNKNOWN_TEXT = new Set([
  '',
  'not specified',
  'not available',
  'not specified in paimana export',
  'unknown',
])

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function cleanText(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const cleaned = value.trim()
  if (UNKNOWN_TEXT.has(cleaned.toLowerCase())) {
    return null
  }

  return cleaned
}
function extractAdminFromDisplayName(
  displayName: string,
) {
  const parts =
    displayName
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .filter(
        (part) =>
          !/^\d{6}$/.test(part),
      )

  const countryIndex =
    parts.findIndex(
      (part) =>
        part.toLowerCase() === 'india',
    )

  const usableParts =
    countryIndex >= 0
      ? parts.slice(0, countryIndex)
      : parts

  return {
    state:
      usableParts.length >= 1
        ? usableParts[
            usableParts.length - 1
          ]
        : '',

    district:
      usableParts.length >= 2
        ? usableParts[
            usableParts.length - 2
          ]
        : '',
  }
}
function hasCoordinates(project: Project) {
  return (
    typeof project.latitude === 'number' &&
    Number.isFinite(project.latitude) &&
    typeof project.longitude === 'number' &&
    Number.isFinite(project.longitude)
  )
}

function projectSearchQuery(project: Project) {
  const name = project.name.trim()

  const locationHints: Record<string, string> = {
    'C/o NITB Imphal Airport': 'Imphal, Manipur',
    'Construction of Terminal Building & Associated works at Leh Airport, Ladakh':
      'Leh, Ladakh',
    'Construction of Permanent Campus for IIM Jammu Phase-1 at Jagti, Nagrota, Jammu, J&K':
      'Jagti, Nagrota, Jammu, Jammu and Kashmir',
    'Raghunathpur Thermal Power Station Phase II [2X660 MW] at Raghunathpur, Purulia, West Bengal':
      'Raghunathpur, Purulia, West Bengal',
    'Construction of Basement + Ground Floor+ 10 Storeyed building for State of the Art Director General, GSI Building at plot No.GN-40, Sector-V, Salt Lake, Kolkata':
      'Sector V, Salt Lake, Kolkata',
  }

  const knownLocation = locationHints[name]
  if (knownLocation) {
    return knownLocation
  }

  const district = cleanText(project.district)
  const state = cleanText(project.state)
  if (district || state) {
    return [district, state].filter(Boolean).join(', ')
  }

  const atIndex = name.toLowerCase().lastIndexOf(' at ')
  if (atIndex !== -1) {
    return name.slice(atIndex + 4).trim()
  }

  return name
}

function topRiskFactor(risk: RiskPrediction | undefined) {
  if (!risk || !Array.isArray(risk.factors) || risk.factors.length === 0) {
    return null
  }

  return [...risk.factors].sort(
    (a, b) => b.impact_score - a.impact_score,
  )[0]
}

function projectPopupLocation(project: Project) {
  const district = cleanText(project.district)
  const state = cleanText(project.state)
  const structuredLocation = [district, state].filter(Boolean).join(', ')

  return (
    structuredLocation ||
    cleanText(project.locationDisplayName) ||
    'Approximate project location'
  )
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Request failed: ${path}`)
  }
  return response.json() as Promise<T>
}

export default function GisWorkspace() {
  const { can } = useAuth()
  const canManageGis = can('gis.manage')

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const candidateMarkerRef = useRef<maplibregl.Marker | null>(null)
  const projectMarkersRef = useRef<maplibregl.Marker[]>([])
  const projectPopupMapRef = useRef(new Map<string, maplibregl.Popup>())
  const geocodeAbortRef = useRef<AbortController | null>(null)
  const searchCacheRef = useRef(new Map<string, Place[]>())

  const [ready, setReady] = useState(false)
  const [basemap, setBasemap] = useState<Basemap>('satellite')
  const [projects, setProjects] = useState<Project[]>([])
  const [projectRisks, setProjectRisks] = useState<ProjectRiskMap>({})
  const [parcels, setParcels] = useState<GeoFeatureCollection>(EMPTY_GEOJSON)
  const [boundaries, setBoundaries] = useState<GeoFeatureCollection>(EMPTY_GEOJSON)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [searchParams] = useSearchParams()

  const deepLinkProjectId =
    searchParams.get('gisProject')?.trim() ?? ''

  // Deep-linked GIS cards should land on the map immediately, before the
  // browser paints the top of the dashboard. Keeping this separate from
  // project loading prevents the visible top -> map jump seen in the video.
  useLayoutEffect(() => {
    if (!deepLinkProjectId) {
      return
    }

    const section = document.getElementById('dashboard-map')
    if (!section) {
      return
    }

    const jumpToMap = () => {
      const header = document.querySelector<HTMLElement>('.enterprise-header')
      const headerHeight = header?.getBoundingClientRect().height ?? 0
      const top =
        section.getBoundingClientRect().top +
        window.scrollY -
        headerHeight -
        8

      window.scrollTo(0, Math.max(0, top))
    }

    jumpToMap()
    const frame = window.requestAnimationFrame(jumpToMap)

    return () => window.cancelAnimationFrame(frame)
  }, [deepLinkProjectId])

  // Track the exact project id already opened. This lets a later GIS link
  // for another project work without reloading the whole app.
  const deepLinkHandledRef = useRef('')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [candidateSource, setCandidateSource] =
    useState<CandidateSource | null>(null)
  const [saving, setSaving] = useState(false)
  const [autoLocating, setAutoLocating] = useState(false)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)

  const [projectSearch, setProjectSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('ALL')
  const [districtFilter, setDistrictFilter] = useState('ALL')
  const [stageFilter, setStageFilter] = useState('ALL')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL')
  const [locationFilter, setLocationFilter] =
    useState<LocationFilter>('ALL')

  const [showProjectMarkers, setShowProjectMarkers] = useState(true)
  const [showParcels, setShowParcels] = useState(true)
  const [showBoundaries, setShowBoundaries] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(true)

  const stateOptions = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((project) => cleanText(project.state))
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [projects],
  )

  const districtOptions = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .filter((project) => {
              const projectState = cleanText(project.state)
              return stateFilter === 'ALL' || projectState === stateFilter
            })
            .map((project) => cleanText(project.district))
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [projects, stateFilter],
  )

  const stageOptions = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((project) => cleanText(project.stage))
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [projects],
  )

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const search = projectSearch.trim().toLowerCase()
        const projectState = cleanText(project.state)
        const projectDistrict = cleanText(project.district)
        const projectStage = cleanText(project.stage)

        if (
          search &&
          ![
            project.name,
            projectState,
            projectDistrict,
            projectStage,
            project.sector,
            project.line_ministry,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search)
        ) {
          return false
        }

        if (stateFilter !== 'ALL' && projectState !== stateFilter) {
          return false
        }

        if (districtFilter !== 'ALL' && projectDistrict !== districtFilter) {
          return false
        }

        if (stageFilter !== 'ALL' && projectStage !== stageFilter) {
          return false
        }

        const located = hasCoordinates(project)
        if (locationFilter === 'LOCATED' && !located) {
          return false
        }
        if (locationFilter === 'UNLOCATED' && located) {
          return false
        }

        if (riskFilter !== 'ALL') {
          const risk = projectRisks[project.id]
          if (riskFilter === 'UNAVAILABLE') {
            return !risk
          }
          return Boolean(risk && risk.risk_level === riskFilter)
        }

        return true
      }),
    [
      projects,
      projectSearch,
      stateFilter,
      districtFilter,
      stageFilter,
      riskFilter,
      locationFilter,
      projectRisks,
    ],
  )

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  )

  const filteredLocated = filteredProjects.filter(hasCoordinates)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 2,
      maxZoom: 20,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
          labels: {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
          road: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [
          { id: 'satellite', type: 'raster', source: 'satellite' },
          { id: 'labels', type: 'raster', source: 'labels' },
          {
            id: 'road',
            type: 'raster',
            source: 'road',
            layout: { visibility: 'none' },
          },
        ],
      },
    })

    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl(), 'top-left')
    map.addControl(new maplibregl.FullscreenControl(), 'top-right')
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 130, unit: 'metric' }),
      'bottom-left',
    )

    map.on('load', () => {
      map.addSource('liva-parcels', {
        type: 'geojson',
        data: EMPTY_GEOJSON as never,
      })

      map.addSource('liva-boundaries', {
        type: 'geojson',
        data: EMPTY_GEOJSON as never,
      })

      map.addSource('liva-risk-heat', {
        type: 'geojson',
        data: EMPTY_GEOJSON as never,
      })

     map.addLayer({
  id: 'risk-heatmap',
  type: 'heatmap',
  source: 'liva-risk-heat',

  paint: {
    'heatmap-weight': [
      'interpolate',
      ['linear'],
      ['get', 'riskScore'],

      0,
      0.35,

      25,
      0.5,

      50,
      0.7,

      75,
      0.9,

      100,
      1,
    ],

    'heatmap-intensity': [
      'interpolate',
      ['linear'],
      ['zoom'],

      2,
      1.2,

      10,
      2.2,

      15,
      3.5,

      18,
      4.2,
    ],

    'heatmap-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],

      2,
      22,

      8,
      36,

      12,
      55,

      16,
      85,

      19,
      110,
    ],

    'heatmap-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],

      2,
      0.65,

      14,
      0.78,

      18,
      0.86,
    ],

    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],

      0,
      'rgba(244, 195, 66, 0)',

      0.08,
      'rgba(244, 195, 66, 0.30)',

      0.22,
      'rgba(238, 179, 48, 0.48)',

      0.42,
      'rgba(230, 145, 38, 0.62)',

      0.62,
      'rgba(214, 105, 38, 0.74)',

      0.82,
      'rgba(197, 72, 45, 0.84)',

      1,
      'rgba(170, 43, 43, 0.95)',
    ],
  },
} as never)
      map.addLayer({
        id: 'project-boundary-fill',
        type: 'fill',
        source: 'liva-boundaries',
        paint: {
          'fill-color': '#315f53',
          'fill-opacity': 0.08,
        },
      } as never)

      map.addLayer({
        id: 'project-boundary-line',
        type: 'line',
        source: 'liva-boundaries',
        paint: {
          'line-color': '#315f53',
          'line-width': 3,
          'line-dasharray': [2, 1.5],
        },
      } as never)

      map.addLayer({
        id: 'parcel-pending',
        type: 'fill',
        source: 'liva-parcels',
        filter: [
          'all',
          ['!=', ['get', 'stage'], 'Possession'],
          ['!=', ['get', 'ownership'], 'Disputed'],
        ],
        paint: {
          'fill-color': '#c29845',
          'fill-opacity': 0.34,
        },
      } as never)

      map.addLayer({
        id: 'parcel-acquired',
        type: 'fill',
        source: 'liva-parcels',
        filter: ['==', ['get', 'stage'], 'Possession'],
        paint: {
          'fill-color': '#2f7d63',
          'fill-opacity': 0.38,
        },
      } as never)

      map.addLayer({
        id: 'parcel-disputed',
        type: 'fill',
        source: 'liva-parcels',
        filter: ['==', ['get', 'ownership'], 'Disputed'],
        paint: {
          'fill-color': '#b94343',
          'fill-opacity': 0.42,
        },
      } as never)

      map.addLayer({
        id: 'parcel-outline',
        type: 'line',
        source: 'liva-parcels',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.4,
          'line-opacity': 0.9,
        },
      } as never)

      const parcelClick = (event: maplibregl.MapLayerMouseEvent) => {
        const feature = event.features?.[0]
        if (!feature) {
          return
        }

        const properties = feature.properties ?? {}

        new maplibregl.Popup()
          .setLngLat(event.lngLat)
          .setHTML(`
            <div style="width:220px;font-family:inherit">
              <strong style="color:#173f35">
                ${escapeHtml(String(properties.projectName || 'Land parcel'))}
              </strong>
              <div style="margin-top:7px;font-size:11px;line-height:1.55;color:#66766f">
                Survey: ${escapeHtml(String(properties.surveyNumber || '—'))}<br/>
                Village: ${escapeHtml(String(properties.village || '—'))}<br/>
                Area: ${escapeHtml(String(properties.areaHa ?? '—'))} ha<br/>
                Ownership: ${escapeHtml(String(properties.ownership || '—'))}<br/>
                Stage: ${escapeHtml(String(properties.stage || '—'))}
              </div>
            </div>
          `)
          .addTo(map)
      }

      for (const layerId of [
        'parcel-pending',
        'parcel-acquired',
        'parcel-disputed',
      ]) {
        map.on('click', layerId, parcelClick)
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = ''
        })
      }

      setReady(true)
    })

    map.on('error', () => {
      setMessage('Some map resources could not load. Try switching basemap.')
    })

    const observer = new ResizeObserver(() => map.resize())
    observer.observe(containerRef.current)

    return () => {
      geocodeAbortRef.current?.abort()
      observer.disconnect()
      candidateMarkerRef.current?.remove()
      projectMarkersRef.current.forEach((marker) => marker.remove())
      projectMarkersRef.current = []
      projectPopupMapRef.current.clear()
      mapRef.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSpatialData() {
      try {
        const [projectPayload, parcelPayload, boundaryPayload] =
          await Promise.all([
            getJson<ProjectResponse>('/api/projects'),
            getJson<GeoFeatureCollection>('/api/gis/parcels'),
            getJson<GeoFeatureCollection>('/api/gis/boundaries'),
          ])

        if (cancelled) {
          return
        }

        setProjects(projectPayload.items ?? [])
        setParcels(parcelPayload)
        setBoundaries(boundaryPayload)
      } catch {
        if (!cancelled) {
          setMessage('Some GIS data could not be loaded.')
        }
      }
    }

    void loadSpatialData()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const located = projects.filter(hasCoordinates)
    let cancelled = false

    async function loadRisks() {
      const responses = await Promise.allSettled(
        located.map(async (project) => ({
          id: project.id,
          risk: await getProjectRisk(project.id),
        })),
      )

      if (cancelled) {
        return
      }

      const next: ProjectRiskMap = {}
      responses.forEach((response) => {
        if (response.status === 'fulfilled') {
          next[response.value.id] = response.value.risk
        }
      })

      setProjectRisks(next)
    }

    void loadRisks()

    return () => {
      cancelled = true
    }
  }, [projects])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) {
      return
    }

    const visibleIds = new Set(filteredProjects.map((project) => project.id))

    const parcelSource = map.getSource('liva-parcels') as
      | maplibregl.GeoJSONSource
      | undefined

    parcelSource?.setData({
      type: 'FeatureCollection',
      features: parcels.features.filter((feature) =>
        visibleIds.has(String(feature.properties.projectId ?? '')),
      ),
    } as never)

    const boundarySource = map.getSource('liva-boundaries') as
      | maplibregl.GeoJSONSource
      | undefined

    boundarySource?.setData({
      type: 'FeatureCollection',
      features: boundaries.features.filter((feature) =>
        visibleIds.has(String(feature.properties.projectId ?? '')),
      ),
    } as never)

    const heatSource = map.getSource('liva-risk-heat') as
      | maplibregl.GeoJSONSource
      | undefined

    heatSource?.setData({
      type: 'FeatureCollection',
      features: filteredProjects.filter(hasCoordinates).map((project) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [project.longitude, project.latitude],
        },
        properties: {
          projectId: project.id,
          riskScore: projectRisks[project.id]?.risk_score ?? 0,
        },
      })),
    } as never)
  }, [ready, filteredProjects, parcels, boundaries, projectRisks])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) {
      return
    }

    const visibility = (visible: boolean) => (visible ? 'visible' : 'none')

    for (const id of [
      'parcel-pending',
      'parcel-acquired',
      'parcel-disputed',
      'parcel-outline',
    ]) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visibility(showParcels))
      }
    }

    for (const id of ['project-boundary-fill', 'project-boundary-line']) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visibility(showBoundaries))
      }
    }

    if (map.getLayer('risk-heatmap')) {
      map.setLayoutProperty(
        'risk-heatmap',
        'visibility',
        visibility(showHeatmap),
      )
    }
  }, [ready, showParcels, showBoundaries, showHeatmap])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) {
      return
    }

    projectMarkersRef.current.forEach((marker) => marker.remove())
    projectMarkersRef.current = []
    projectPopupMapRef.current.clear()

    if (!showProjectMarkers) {
      return
    }

    filteredProjects
      .filter(hasCoordinates)
      .forEach((project) => {
        const longitude = project.longitude as number
        const latitude = project.latitude as number
        const risk = projectRisks[project.id]
        const markerColor = risk
          ? RISK_COLORS[risk.risk_level]
          : UNKNOWN_RISK_COLOR
        const factor = topRiskFactor(risk)
        const cleanStage = cleanText(project.stage)
        const displayLocation = projectPopupLocation(project)

        const markerButton = document.createElement('button')
        markerButton.type = 'button'
        markerButton.title = project.name
        markerButton.setAttribute('aria-label', project.name)

        Object.assign(markerButton.style, {
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          cursor: 'pointer',
        })

        const dot = document.createElement('span')
        Object.assign(dot.style, {
          display: 'block',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: '3px solid #ffffff',
          boxSizing: 'border-box',
          background: markerColor,
          boxShadow: `0 0 0 3px ${markerColor}33, 0 4px 14px rgba(0,0,0,.35)`,
          transition: 'transform .18s ease, box-shadow .18s ease',
          pointerEvents: 'none',
        })

        markerButton.appendChild(dot)

        const popup = new maplibregl.Popup({
          offset: 20,
          maxWidth: '320px',
          closeButton: true,
          closeOnClick: false,
        }).setHTML(`
          <div style="width:260px;font-family:inherit;padding:2px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
              <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:#9a7227">
                LIVA PROJECT
              </span>
              <span style="padding:4px 8px;border-radius:999px;background:${markerColor}16;color:${markerColor};font-size:9px;font-weight:800">
                ${escapeHtml(risk?.risk_level ?? 'UNAVAILABLE')}
              </span>
            </div>

            <div style="margin-top:8px;font-size:14px;line-height:1.35;font-weight:800;color:#173f35">
              ${escapeHtml(project.name)}
            </div>

            <div style="margin-top:9px;display:grid;gap:6px;font-size:10px;line-height:1.4;color:#677870">
              <div>
                <span style="color:#8a9992">Location</span><br/>
                <strong style="color:#405d54;font-weight:700">
                  ${escapeHtml(displayLocation)}
                </strong>
              </div>

              ${
                cleanStage
                  ? `<div><span style="color:#8a9992">Stage</span><strong style="margin-left:6px;color:#405d54">${escapeHtml(cleanStage)}</strong></div>`
                  : ''
              }

              <div>
                <span style="color:#8a9992">Progress</span>
                <strong style="margin-left:6px;color:#405d54">
                  ${
                    project.progress == null
                      ? 'Not reported'
                      : `${project.progress}%`
                  }
                </strong>
              </div>
            </div>

            <div style="margin-top:11px;padding:9px 10px;border:1px solid #e4ebe7;border-radius:9px;background:#f5f7f4">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:10px">
                <span style="color:#718078">Delay risk</span>
                <strong style="color:${markerColor};font-size:12px">
                  ${
                    risk
                      ? `${risk.risk_score.toFixed(1)}/100`
                      : 'Unavailable'
                  }
                </strong>
              </div>
              <div style="margin-top:7px;font-size:9px;color:#87958f">Top factor</div>
              <div style="margin-top:2px;font-size:10px;line-height:1.35;font-weight:700;color:#405d54">
                ${escapeHtml(factor?.label ?? 'No major factor')}
              </div>
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:11px;padding-top:9px;border-top:1px solid #e5ebe7;font-size:10px;font-weight:700">
              <a href="/projects/${encodeURIComponent(project.id)}" style="color:#315f53;text-decoration:none">Project →</a>
              <a href="/intelligence?project=${encodeURIComponent(project.id)}" style="color:#315f53;text-decoration:none">Intelligence →</a>
              <a href="/simulator?projectId=${encodeURIComponent(project.id)}" style="color:#9a7227;text-decoration:none">Simulator →</a>
            </div>
          </div>
        `)

        const marker = new maplibregl.Marker({ element: markerButton })
          .setLngLat([longitude, latitude])
          .addTo(map)

        markerButton.addEventListener('mouseenter', () => {
          dot.style.transform = 'scale(1.2)'
          dot.style.boxShadow = `0 0 0 5px ${markerColor}35, 0 5px 16px rgba(0,0,0,.4)`
          if (!popup.isOpen()) {
            popup.setLngLat([longitude, latitude]).addTo(map)
          }
        })

        markerButton.addEventListener('mouseleave', () => {
          dot.style.transform = 'scale(1)'
          dot.style.boxShadow = `0 0 0 3px ${markerColor}33, 0 4px 14px rgba(0,0,0,.35)`
        })

        markerButton.addEventListener('click', (event) => {
          event.stopPropagation()
          if (!popup.isOpen()) {
            popup.setLngLat([longitude, latitude]).addTo(map)
          }
        })

        projectMarkersRef.current.push(marker)
        projectPopupMapRef.current.set(project.id, popup)
      })
  }, [ready, filteredProjects, projectRisks, showProjectMarkers])

  useEffect(() => {
    if (
      !ready ||
      !deepLinkProjectId ||
      projects.length === 0 ||
      deepLinkHandledRef.current === deepLinkProjectId
    ) {
      return
    }

    const project = projects.find(
      (item) => item.id === deepLinkProjectId,
    )

    if (!project) {
      deepLinkHandledRef.current = deepLinkProjectId
      setMessage('The linked project could not be found in the GIS workspace.')
      return
    }

    // Reset filters so the linked project can never be hidden.
    setProjectSearch('')
    setStateFilter('ALL')
    setDistrictFilter('ALL')
    setStageFilter('ALL')
    setRiskFilter('ALL')
    setLocationFilter('ALL')
    setShowProjectMarkers(true)

    deepLinkHandledRef.current = deepLinkProjectId

    // The page position is handled immediately in useLayoutEffect above.
    // Once GIS data is ready, only update MapLibre itself; do not scroll the
    // document again. This avoids the visible dashboard-top flash/glitch.
    requestAnimationFrame(() => {
      mapRef.current?.resize()
      void selectProject(project.id)

      // Project markers are rendered in a separate effect. Give that effect
      // one paint cycle, then open the project's popup automatically.
      window.setTimeout(() => {
        const map = mapRef.current
        const popup = projectPopupMapRef.current.get(project.id)

        if (map && popup && hasCoordinates(project)) {
          popup
            .setLngLat([
              project.longitude as number,
              project.latitude as number,
            ])
            .addTo(map)
        }
      }, 180)
    })
  }, [deepLinkProjectId, projects, ready])

  async function fetchPlaces(text: string): Promise<Place[]> {
    const term = text.trim()
    if (term.length < 3) {
      return []
    }

    const key = term.toLowerCase()
    const cached = searchCacheRef.current.get(key)
    if (cached) {
      return cached
    }

    geocodeAbortRef.current?.abort()
    const controller = new AbortController()
    geocodeAbortRef.current = controller

    const params = new URLSearchParams({ q: term })
    const response = await fetch(
      `${API_BASE_URL}/api/geocode/search?${params.toString()}`,
      { signal: controller.signal },
    )

    if (!response.ok) {
      throw new Error('Location search failed.')
    }

    const data = (await response.json()) as SearchResponse
    const items = Array.isArray(data.items) ? data.items : []
    searchCacheRef.current.set(key, items)
    return items
  }

  function displayCandidate(place: Place, source: CandidateSource) {
    const map = mapRef.current
    if (!map) {
      return
    }

    const longitude = Number(place.lon)
    const latitude = Number(place.lat)
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return
    }

    candidateMarkerRef.current?.remove()

    const popup = new maplibregl.Popup({ offset: 22, maxWidth: '290px' })
      .setHTML(`
        <div style="max-width:245px;font-family:inherit">
          <div style="font-size:9px;font-weight:800;letter-spacing:.07em;color:#9a7227;text-transform:uppercase">
            ${source === 'AUTO' ? 'Auto location candidate' : 'Manual location candidate'}
          </div>
          <strong style="display:block;margin-top:5px;color:#173f35;font-size:13px">
            ${escapeHtml(place.name)}
          </strong>
          <div style="margin-top:4px;color:#64766d;font-size:11px;line-height:1.4">
            ${escapeHtml(place.display_name)}
          </div>
        </div>
      `)

    candidateMarkerRef.current = new maplibregl.Marker({
      color: CANDIDATE_COLOR,
    })
      .setLngLat([longitude, latitude])
      .setPopup(popup)
      .addTo(map)

    setSelectedPlace(place)
    setCandidateSource(source)

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (place.boundingbox && place.boundingbox.length === 4) {
      const [south, north, west, east] = place.boundingbox
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        {
          padding: 70,
          maxZoom: 17,
          duration: reducedMotion ? 0 : 800,
        },
      )
    } else {
      map.easeTo({
        center: [longitude, latitude],
        zoom: 17,
        duration: reducedMotion ? 0 : 800,
      })
    }

    popup.addTo(map)
  }

  async function autoLocate(project: Project) {
    if (autoLocating) {
      return
    }

    setAutoLocating(true)
    setResults([])
    setSelectedPlace(null)
    setCandidateSource(null)

    const text = projectSearchQuery(project)
    setQuery(text)
    setMessage('Auto locating project…')

    try {
      const places = await fetchPlaces(text)
      if (!places.length) {
        setMessage('Auto location not found. Search manually.')
        return
      }

      displayCandidate(places[0], 'AUTO')
      setMessage('Auto location found. Verify it, then Confirm & Save.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      setMessage('Auto location could not be found. Use manual search.')
    } finally {
      setAutoLocating(false)
    }
  }

  async function selectProject(id: string) {
    setSelectedProjectId(id)
    setResults([])
    setSelectedPlace(null)
    setCandidateSource(null)
    candidateMarkerRef.current?.remove()
    candidateMarkerRef.current = null

    if (!id) {
      setQuery('')
      setMessage('')
      return
    }

    const project = projects.find((item) => item.id === id)
    if (!project) {
      return
    }

    if (hasCoordinates(project)) {
      setQuery(project.locationDisplayName || projectSearchQuery(project))

      mapRef.current?.easeTo({
        center: [project.longitude as number, project.latitude as number],
        zoom: 16,
        duration: 800,
      })

      const popup = projectPopupMapRef.current.get(id)
      if (popup && mapRef.current) {
        popup
          .setLngLat([
            project.longitude as number,
            project.latitude as number,
          ])
          .addTo(mapRef.current)
      }

      setMessage('Saved project location loaded.')
      return
    }

    await autoLocate(project)
  }

  async function searchLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = query.trim()
    if (term.length < 3 || searching) {
      return
    }

    setSearching(true)
    setResults([])
    setSelectedPlace(null)
    setCandidateSource(null)
    setMessage('Searching worldwide…')

    try {
      const places = await fetchPlaces(term)
      setResults(places)
      setMessage(
        places.length
          ? 'Select the correct location from the results.'
          : 'No mapped location found. Try a more specific locality or landmark.',
      )
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      setMessage('Location search is temporarily unavailable.')
    } finally {
      setSearching(false)
    }
  }

  function choosePlace(place: Place) {
    displayCandidate(place, 'MANUAL')
    setResults([])
    setQuery(place.name)
    setMessage('Manual location selected. Verify it, then Confirm & Save.')
  }

  async function saveLocation() {
    if (!canManageGis || !selectedProjectId || !selectedPlace || saving) {
      return
    }

    setSaving(true)

    try {
      const admin =
  extractAdminFromDisplayName(
    selectedPlace.display_name,
  )
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${selectedProjectId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
         body:
  JSON.stringify({
    latitude:
      selectedPlace.lat,

    longitude:
      selectedPlace.lon,

    locationDisplayName:
      selectedPlace.display_name,

    locationSource:
      selectedPlace.source,

    state:
      admin.state,

    district:
      admin.district,
  }),
        },
      )

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.detail || 'Location save failed.')
      }

      const updated = (await response.json()) as Project
      setProjects((current) =>
        current.map((project) =>
          project.id === updated.id ? updated : project,
        ),
      )

      candidateMarkerRef.current?.remove()
      candidateMarkerRef.current = null
      setSelectedPlace(null)
      setCandidateSource(null)
      setQuery(updated.locationDisplayName || projectSearchQuery(updated))
      setMessage(`${updated.name} location saved.`)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Project location could not be saved.',
      )
    } finally {
      setSaving(false)
    }
  }

  function clearFilters() {
    setProjectSearch('')
    setStateFilter('ALL')
    setDistrictFilter('ALL')
    setStageFilter('ALL')
    setRiskFilter('ALL')
    setLocationFilter('ALL')
  }

  function changeBasemap(next: Basemap) {
    const map = mapRef.current
    if (!map || !ready) {
      return
    }

    const satellite = next === 'satellite'
    map.setLayoutProperty(
      'satellite',
      'visibility',
      satellite ? 'visible' : 'none',
    )
    map.setLayoutProperty(
      'labels',
      'visibility',
      satellite ? 'visible' : 'none',
    )
    map.setLayoutProperty(
      'road',
      'visibility',
      satellite ? 'none' : 'visible',
    )

    setBasemap(next)
  }

  function resetView() {
    candidateMarkerRef.current?.remove()
    candidateMarkerRef.current = null
    setSelectedProjectId('')
    setSelectedPlace(null)
    setCandidateSource(null)
    setResults([])
    setQuery('')
    setMessage('')
    clearFilters()

    mapRef.current?.easeTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      bearing: 0,
      pitch: 0,
      duration: 700,
    })
  }

  function openFilters() {
    setLayersOpen(false)
    setFiltersOpen((value) => !value)
  }

  function openLayers() {
    setFiltersOpen(false)
    setLayersOpen((value) => !value)
  }

  const selectStyle = {
    width: '100%',
    minHeight: '34px',
    padding: '0 9px',
    border: '1px solid #dbe4df',
    borderRadius: '8px',
    background: '#fff',
    color: '#31584d',
    fontSize: '10px',
    outline: 'none',
  } as const

  return (
    <section
      className="gis-workspace gis-workspace-rich"
      aria-labelledby="gis-heading"
    >
      <div className="gis-toolbar">
        <h2 id="gis-heading">
          <MapPin size={19} aria-hidden="true" />
          GIS Workspace
        </h2>

        <button
          type="button"
          className="gis-reset-button"
          onClick={resetView}
          disabled={!ready}
        >
          <RotateCcw size={15} aria-hidden="true" />
          Reset view
        </button>
      </div>

      <div className="gis-map-wrapper">
        <div
          ref={containerRef}
          className="gis-map-container"
          aria-label="Interactive GIS map"
        />

        <div
          className="gis-floating-controls"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 8,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              width: 'min(350px, calc(100% - 28px))',
              display: 'grid',
              gap: '8px',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                padding: '10px',
                borderRadius: '13px',
                border: '1px solid rgba(42,83,72,.15)',
                background: 'rgba(255,255,255,.97)',
                backdropFilter: 'blur(14px)',
                boxShadow: '0 10px 28px rgba(18,55,46,.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '7px',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '9px',
                    fontWeight: 800,
                    color: '#315f53',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                  }}
                >
                  <LocateFixed size={13} />
                  Project
                </span>

                {selectedProject && (
                  <button
                    type="button"
                    disabled={autoLocating}
                    onClick={() => void autoLocate(selectedProject)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      border: 'none',
                      background: 'transparent',
                      color: '#8d7135',
                      fontSize: '9px',
                      fontWeight: 700,
                      cursor: autoLocating ? 'default' : 'pointer',
                      opacity: autoLocating ? 0.6 : 1,
                    }}
                  >
                    <RefreshCcw size={11} />
                    {autoLocating ? 'Locating…' : 'Auto locate'}
                  </button>
                )}
              </div>

              <select
                value={selectedProjectId}
                onChange={(event) => void selectProject(event.target.value)}
                style={{ ...selectStyle, minHeight: '38px', fontSize: '11px' }}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                padding: '9px 10px',
                borderRadius: '13px',
                border: '1px solid rgba(42,83,72,.15)',
                background: 'rgba(255,255,255,.97)',
                backdropFilter: 'blur(14px)',
                boxShadow: '0 10px 28px rgba(18,55,46,.13)',
              }}
            >
              <form
                onSubmit={searchLocation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <Search size={16} color="#466b60" />

                <input
                  value={query}
                  placeholder="Search locality, building or address…"
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setResults([])
                    setSelectedPlace(null)
                    setCandidateSource(null)
                  }}
                  style={{
                    minWidth: 0,
                    flex: 1,
                    height: '34px',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: '#264b42',
                    fontSize: '10px',
                  }}
                />

                <button
                  type="submit"
                  disabled={searching || !ready}
                  aria-label="Search location"
                  style={{
                    width: '34px',
                    height: '34px',
                    display: 'grid',
                    placeItems: 'center',
                    border: '1px solid #d9e3de',
                    borderRadius: '8px',
                    background: '#edf3ef',
                    color: '#315f53',
                    cursor: 'pointer',
                  }}
                >
                  {searching ? '…' : <Search size={14} />}
                </button>
              </form>

              {results.length > 0 && (
                <div
                  style={{
                    maxHeight: '170px',
                    overflowY: 'auto',
                    marginTop: '8px',
                    paddingTop: '7px',
                    borderTop: '1px solid #edf1ee',
                  }}
                >
                  {results.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => choosePlace(place)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '7px',
                        padding: '8px',
                        border: 'none',
                        borderRadius: '7px',
                        background: 'transparent',
                        color: '#49655d',
                        textAlign: 'left',
                        fontSize: '10px',
                        lineHeight: 1.4,
                        cursor: 'pointer',
                      }}
                    >
                      <MapPin
                        size={13}
                        style={{ flexShrink: 0, marginTop: '1px' }}
                      />
                      <span>{place.display_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedPlace && (
                <div
                  style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #edf1ee',
                  }}
                >
                  <div
                    style={{
                      marginBottom: '7px',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#8d7135',
                      textTransform: 'uppercase',
                      letterSpacing: '.05em',
                    }}
                  >
                    {candidateSource === 'AUTO'
                      ? 'Auto location candidate'
                      : 'Manual location candidate'}
                  </div>

                  {canManageGis ? (
                    <button
                      type="button"
                      disabled={!selectedProjectId || saving}
                      onClick={saveLocation}
                      style={{
                        width: '100%',
                        height: '34px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#315f53',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 800,
                        cursor: saving ? 'default' : 'pointer',
                        opacity: saving ? 0.65 : 1,
                      }}
                    >
                      <Check size={13} />
                      {saving ? 'Saving…' : 'Confirm & Save location'}
                    </button>
                  ) : (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #e4e9e5',
                        background: '#f7f9f7',
                        color: '#718078',
                        fontSize: '9px',
                        lineHeight: 1.45,
                      }}
                    >
                      Read-only access. Location changes are available to
                      administrators, judges and project officers.
                    </div>
                  )}
                </div>
              )}
            </div>

            {message && (
              <div
                role="status"
                style={{
                  padding: '8px 10px',
                  borderRadius: '9px',
                  background: 'rgba(255,255,255,.96)',
                  boxShadow: '0 6px 18px rgba(18,55,46,.12)',
                  color: '#587067',
                  fontSize: '10px',
                  lineHeight: 1.4,
                }}
              >
                {message}
              </div>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: '3px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,.96)',
                boxShadow: '0 6px 20px rgba(18,55,46,.15)',
              }}
            >
              <button
                type="button"
                onClick={() => changeBasemap('road')}
                style={{
                  padding: '8px 11px',
                  border: 'none',
                  borderRadius: '7px',
                  background: basemap === 'road' ? '#315f53' : 'transparent',
                  color: basemap === 'road' ? '#fff' : '#315f53',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Map
              </button>

              <button
                type="button"
                onClick={() => changeBasemap('satellite')}
                style={{
                  padding: '8px 11px',
                  border: 'none',
                  borderRadius: '7px',
                  background:
                    basemap === 'satellite' ? '#315f53' : 'transparent',
                  color: basemap === 'satellite' ? '#fff' : '#315f53',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Satellite
              </button>
            </div>

            <button
              type="button"
              onClick={openFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '9px 11px',
                border: '1px solid #dce4df',
                borderRadius: '10px',
                background: 'rgba(255,255,255,.96)',
                color: '#315f53',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(18,55,46,.15)',
              }}
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>

            <button
              type="button"
              onClick={openLayers}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '9px 11px',
                border: '1px solid #dce4df',
                borderRadius: '10px',
                background: 'rgba(255,255,255,.96)',
                color: '#315f53',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(18,55,46,.15)',
              }}
            >
              <Layers size={14} />
              Layers
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div
            style={{
              position: 'absolute',
              top: '66px',
              right: '14px',
              zIndex: 12,
              width: '245px',
              padding: '12px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,.98)',
              border: '1px solid #dde6e1',
              boxShadow: '0 14px 35px rgba(23,63,53,.18)',
              display: 'grid',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <strong style={{ fontSize: '11px', color: '#315f53' }}>
                GIS Filters
              </strong>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                style={{
                  width: '27px',
                  height: '27px',
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid #e0e7e3',
                  borderRadius: '8px',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            </div>

            <input
              value={projectSearch}
              placeholder="Search project…"
              onChange={(event) => setProjectSearch(event.target.value)}
              style={{ ...selectStyle, minHeight: '34px' }}
            />

            <select
              value={stateFilter}
              onChange={(event) => {
                setStateFilter(event.target.value)
                setDistrictFilter('ALL')
              }}
              style={selectStyle}
            >
              <option value="ALL">All states</option>
              {stateOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={districtFilter}
              onChange={(event) => setDistrictFilter(event.target.value)}
              style={selectStyle}
            >
              <option value="ALL">All districts</option>
              {districtOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              style={selectStyle}
            >
              <option value="ALL">All stages</option>
              {stageOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(event.target.value as RiskFilter)
              }
              style={selectStyle}
            >
              <option value="ALL">All risks</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
              <option value="UNAVAILABLE">Risk unavailable</option>
            </select>

            <select
              value={locationFilter}
              onChange={(event) =>
                setLocationFilter(event.target.value as LocationFilter)
              }
              style={selectStyle}
            >
              <option value="ALL">All locations</option>
              <option value="LOCATED">Located</option>
              <option value="UNLOCATED">Not located</option>
            </select>

            <small style={{ color: '#718078', fontSize: '9px' }}>
              Showing {filteredProjects.length} of {projects.length} projects
              <br />
              {filteredLocated.length} visible map markers
            </small>

            <button
              type="button"
              onClick={clearFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                minHeight: '32px',
                border: '1px solid #dbe4df',
                borderRadius: '8px',
                background: '#f6f8f6',
                color: '#315f53',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={12} />
              Clear filters
            </button>
          </div>
        )}

        {layersOpen && (
          <div
            className="gis-layer-panel"
            style={{
              position: 'absolute',
              top: '66px',
              right: '14px',
              zIndex: 12,
              width: '250px',
              maxHeight: 'calc(100% - 90px)',
              overflowY: 'auto',
              padding: '14px',
              borderRadius: '14px',
              border: '1px solid rgba(33,82,69,.16)',
              background: 'rgba(252,253,250,.97)',
              backdropFilter: 'blur(18px)',
              boxShadow: '0 16px 40px rgba(20,50,42,.18)',
              color: '#244a40',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  <Layers size={15} />
                  Spatial Intelligence
                </div>
                <div
                  style={{
                    marginTop: '3px',
                    fontSize: '9px',
                    color: '#798b84',
                  }}
                >
                  Map visualization layers
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLayersOpen(false)}
                aria-label="Close layers"
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'grid',
                  placeItems: 'center',
                  border: '1px solid #dfe6e2',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#526c63',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            </div>

            <LayerToggle
              icon={<MapPin size={14} />}
              label="Project markers"
              checked={showProjectMarkers}
              onChange={setShowProjectMarkers}
            />

            <LayerToggle
              icon={<Flame size={14} />}
              label="Delay-risk heatmap"
              checked={showHeatmap}
              onChange={setShowHeatmap}
            />

            {parcels.features.length > 0 ? (
  <div>
    <LayerToggle
      icon={<Layers size={14} />}
      label="Acquisition parcels"
      checked={showParcels}
      onChange={setShowParcels}
    />

    <div
      style={{
        marginTop: '5px',
        paddingLeft: '10px',
        fontSize: '9px',
        color: '#718078',
      }}
    >
      {parcels.features.length}{' '}
      verified parcel geometries loaded
    </div>
  </div>
) : (
  <div
    style={{
      padding: '11px',
      borderRadius: '10px',
      border: '1px solid #e2e9e5',
      background: '#f8faf8',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#315f53',
      }}
    >
      <Layers size={14} />
      Acquisition parcels
    </div>

    <div
      style={{
        marginTop: '6px',
        fontSize: '9px',
        fontWeight: 700,
        color: '#8b6d2e',
      }}
    >
      0 verified geometries
    </div>

    <div
      style={{
        marginTop: '3px',
        fontSize: '9px',
        lineHeight: 1.4,
        color: '#718078',
      }}
    >
      No verified parcel geometry available for the
      current project records.
    </div>
  </div>
)}


{boundaries.features.length > 0 ? (
  <div>
    <LayerToggle
      icon={<LocateFixed size={14} />}
      label="Project boundaries"
      checked={showBoundaries}
      onChange={setShowBoundaries}
    />

    <div
      style={{
        marginTop: '5px',
        paddingLeft: '10px',
        fontSize: '9px',
        color: '#718078',
      }}
    >
      {boundaries.features.length}{' '}
      verified project boundaries loaded
    </div>
  </div>
) : (
  <div
    style={{
      padding: '11px',
      borderRadius: '10px',
      border: '1px solid #e2e9e5',
      background: '#f8faf8',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#315f53',
      }}
    >
      <LocateFixed size={14} />
      Project boundaries
    </div>

    <div
      style={{
        marginTop: '6px',
        fontSize: '9px',
        fontWeight: 700,
        color: '#8b6d2e',
      }}
    >
      0 verified boundaries
    </div>

    <div
      style={{
        marginTop: '3px',
        fontSize: '9px',
        lineHeight: 1.4,
        color: '#718078',
      }}
    >
      No verified project boundary geometry available.
    </div>
  </div>
)}

            <div
              style={{
                marginTop: '13px',
                paddingTop: '11px',
                borderTop: '1px solid #e5ebe7',
              }}
            >
              <div
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                  color: '#7c8d86',
                  marginBottom: '7px',
                }}
              >
                Delay Risk
              </div>

              <div
                style={{
                  height: '7px',
                  borderRadius: '999px',
                  background:
                    'linear-gradient(90deg,#2f7d63 0%,#b8892d 42%,#d46b2e 70%,#b94343 100%)',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  fontSize: '8px',
                  color: '#7b8d85',
                }}
              >
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Critical</span>
              </div>
            </div>

            <div
              style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid #e5ebe7',
                display: 'grid',
                gap: '6px',
                fontSize: '9px',
                color: '#5e746b',
              }}
            >
              <LegendItem color="#2f7d63" label="Acquired / Possession" />
              <LegendItem color="#c29845" label="Pending acquisition" />
              <LegendItem color="#b94343" label="Ownership disputed" />
            </div>

            <div
              style={{
                marginTop: '11px',
                padding: '8px 9px',
                borderRadius: '8px',
                background: '#f3f6f3',
                fontSize: '9px',
                lineHeight: 1.55,
                color: '#718078',
              }}
            >
              <strong style={{ color: '#405d54' }}>
                {filteredLocated.length}
              </strong>{' '}
              project markers
              <br />
              <strong style={{ color: '#405d54' }}>
                {parcels.features.length}
              </strong>{' '}
              parcel geometries
              <br />
              <strong style={{ color: '#405d54' }}>
                {boundaries.features.length}
              </strong>{' '}
              project boundaries
            </div>
          </div>
        )}

        <div className="gis-search-credit">
          Map/Search © OpenStreetMap · Imagery © Esri
        </div>
      </div>
    </section>
  )
}

type LayerToggleProps = {
  icon: ReactNode
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}

function LayerToggle({
  icon,
  label,
  checked,
  onChange,
}: LayerToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '9px 10px',
        border: '1px solid #e3e9e5',
        borderRadius: '9px',
        background: '#fff',
        color: '#31584d',
        cursor: 'pointer',
        marginBottom: '7px',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '10px',
          fontWeight: 700,
        }}
      >
        {icon}
        {label}
      </span>

      <span
        aria-hidden="true"
        style={{
          width: '28px',
          height: '16px',
          padding: '2px',
          borderRadius: '999px',
          background: checked ? '#315f53' : '#ced8d3',
          transition: '.2s ease',
        }}
      >
        <span
          style={{
            display: 'block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#fff',
            transform: checked ? 'translateX(12px)' : 'translateX(0)',
            transition: '.2s ease',
          }}
        />
      </span>
    </button>
  )
}

type LegendItemProps = {
  color: string
  label: string
}

function LegendItem({ color, label }: LegendItemProps) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
      }}
    >
      <i
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '2px',
          background: color,
        }}
      />
      {label}
    </span>
  )
}
