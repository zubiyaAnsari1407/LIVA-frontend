import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Database,
  Map,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

import ProjectCurrentState from './ProjectCurrentState'
import AcquisitionWorkflow from "./AcquisitionWorkflow";
import LandParcelStatus from './LandParcelStatus'
import LegalOperationalStatus from './LegalOperationalStatus'
import CurrentWorkflowSignal from './CurrentWorkflowSignal'
import ProjectContextBanner from '../project/ProjectContextBanner'
import RecentChanges from './RecentChanges'

import {
  getProject,
  getProjects,
  getProjectSummary,
} from '../../services/digitalTwinApi'

import type {
  DigitalTwinProject,
  DigitalTwinSummary,
} from '../../types/digitalTwin'

type Props = {
  initialProjectId?: string | null
}

function normalizeId(value: string | null | undefined) {
  return value?.trim() || ''
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://127.0.0.1:8000'

export default function DigitalTwinOverview({
  initialProjectId,
}: Props) {
  const [projects, setProjects] = useState<
    DigitalTwinProject[]
  >([])

  const [project, setProject] =
    useState<DigitalTwinProject | null>(null)

  const [summary, setSummary] =
    useState<DigitalTwinSummary | null>(null)

  const [selectedProjectId, setSelectedProjectId] =
    useState(
      normalizeId(initialProjectId),
    )

  const [loadingProjects, setLoadingProjects] =
    useState(true)

  const [loadingData, setLoadingData] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [lastRefresh, setLastRefresh] =
    useState<Date | null>(null)

  async function loadProjects() {
    setLoadingProjects(true)
    setError(null)

    try {
      const data = await getProjects()

      // Digital Twin's project service does not reliably expose
      // the visual image field, so merge it from the main
      // project endpoint used by the Projects workspace.
      let imageByProjectId: Record<string, string> = {}

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/projects`,
        )

        if (response.ok) {
          const payload: unknown = await response.json()

          const items =
            payload &&
            typeof payload === 'object' &&
            'items' in payload &&
            Array.isArray(
              (payload as { items?: unknown }).items,
            )
              ? (payload as { items: unknown[] }).items
              : []

          imageByProjectId = Object.fromEntries(
            items
              .filter(
                (item): item is Record<string, unknown> =>
                  Boolean(item) &&
                  typeof item === 'object' &&
                  typeof (item as Record<string, unknown>).id === 'string',
              )
              .map((item) => {
                const id = String(item.id)
                const image =
                  typeof item.image === 'string'
                    ? item.image.trim()
                    : ''

                return [id, image]
              })
              .filter(([, image]) => Boolean(image)),
          )
        }
      } catch {
        // Keep the Digital Twin functional even if the visual
        // image endpoint is temporarily unavailable.
      }

      const enrichedProjects = data.map((item) => {
        const record = item as DigitalTwinProject & {
          image?: string | null
        }

        return {
          ...item,
          image:
            imageByProjectId[item.id] ??
            record.image ??
            null,
        }
      }) as DigitalTwinProject[]

      setProjects(enrichedProjects)

      const requestedId =
        normalizeId(initialProjectId)

      const matching =
        enrichedProjects.find(
          (item) => item.id === requestedId,
        ) || enrichedProjects[0]

      if (matching) {
        setSelectedProjectId(matching.id)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load projects.',
      )
    } finally {
      setLoadingProjects(false)
    }
  }

  async function loadProjectData(
    projectId: string,
  ) {
    if (!projectId) {
      return
    }

    setLoadingData(true)
    setError(null)

    try {
      const [projectData, summaryData] =
        await Promise.all([
          getProject(projectId),
          getProjectSummary(projectId),
        ])

      setProject(projectData)
      setSummary(summaryData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load Digital Twin data.',
      )
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    void loadProjects()
  }, [])

  useEffect(() => {
    if (!selectedProjectId) {
      return
    }

    void loadProjectData(selectedProjectId)
  }, [selectedProjectId])

  const selectedProject =
    useMemo(
      () =>
        projects.find(
          (item) =>
            item.id === selectedProjectId,
        ) || null,
      [projects, selectedProjectId],
    )

  async function handleProjectChange(
    projectId: string,
  ) {
    setSelectedProjectId(projectId)
  }

  async function refresh() {
    if (!selectedProjectId) {
      await loadProjects()
      return
    }

    await loadProjectData(selectedProjectId)
  }

  if (loadingProjects && !projects.length) {
    return (
      <div className="dt-page-shell">
        <div className="dt-loading-card">
          <div className="dt-loading-spinner">
            <RefreshCw size={20} />
          </div>

          <h2>Loading Digital Twin</h2>

          <p>
            Connecting the project and workflow records.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dt-page-shell">
      {selectedProject && (
        <div className="dt-project-context">
          <ProjectContextBanner
            project={{
              id: selectedProject.id,
              name: selectedProject.name,
              district: selectedProject.district,
              state: selectedProject.state,
              sector: selectedProject.sector,
              lineMinistry:
  (selectedProject as DigitalTwinProject & {
    image?: string | null;
  }).lineMinistry ?? null,
              image:
                (selectedProject as DigitalTwinProject & {
                  image?: string | null
                }).image ?? null,
            }}
            projects={projects.map((item) => {
              const record = item as DigitalTwinProject & {
                image?: string | null
                lineMinistry?: string | null
                line_ministry?: string | null
              }

              return {
                id: item.id,
                name: item.name,
                district: item.district,
                state: item.state,
                sector: item.sector,
                lineMinistry:
                  record.lineMinistry ??
                  record.line_ministry ??
                  null,
                image: record.image ?? null,
              }
            })}
            onProjectChange={(projectId) => {
              void handleProjectChange(projectId)
            }}
            label="ACTIVE PROJECT"
          />

          <div className="dt-context-actions">
            <button
              type="button"
              className="dt-refresh-button"
              onClick={() => void refresh()}
              disabled={loadingData}
              title="Refresh Digital Twin"
            >
              <RefreshCw
                size={17}
                className={
                  loadingData
                    ? 'dt-spin'
                    : ''
                }
              />
              Refresh
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="dt-error-banner">
          <AlertTriangle size={18} />

          <div>
            <strong>
              Digital Twin data could not be loaded
            </strong>

            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
          >
            Retry
          </button>
        </div>
      )}

      {loadingData && (
        <div className="dt-loading-bar">
          <span />
        </div>
      )}

      {project && summary ? (
        <>
          <ProjectCurrentState
            project={project}
            summary={summary}
          />

          <div className="dt-two-column">
            <LandParcelStatus
              summary={summary}
            />

            <LegalOperationalStatus
              summary={summary}
            />
          </div>

      <AcquisitionWorkflow
        project={project}
        summary={summary}
        />

          <CurrentWorkflowSignal
            summary={summary}
          />

          <div className="dt-two-column">
            <RecentChanges
              project={project}
              summary={summary}
            />

            <section className="dt-card dt-map-card">
              <div className="dt-section-heading">
                <div>
                  <span className="dt-eyebrow">
                    PROJECT LOCATION
                  </span>

                  <h2>Where the project is located</h2>

                  <p>
                    Location information currently stored
                    against the selected project.
                  </p>
                </div>

                <Map size={19} />
              </div>

              {project.latitude !== null &&
              project.latitude !== undefined &&
              project.longitude !== null &&
              project.longitude !== undefined ? (
                <>
                  <div className="dt-location-map">
                    <iframe
                      title={`GIS location of ${project.name}`}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
                        `${project.longitude - 0.05},${project.latitude - 0.05},${project.longitude + 0.05},${project.latitude + 0.05}`,
                      )}&layer=mapnik&marker=${encodeURIComponent(
                        `${project.latitude},${project.longitude}`,
                      )}`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <div className="dt-location-panel">
                    <Map size={30} />

                    <div>
                      <strong>
                        {project.locationDisplayName ||
                          [
                            project.district,
                            project.state,
                          ]
                            .filter(Boolean)
                            .join(', ') ||
                          'Location available'}
                      </strong>

                      <span>
                        {project.latitude.toFixed(6)},{" "}
                        {project.longitude.toFixed(6)}
                      </span>
                    </div>
                  </div>

                  <div className="dt-location-note">
                    <ShieldCheck size={15} />

                    <span>
                      Map position is based on the stored
                      latitude and longitude of the selected
                      project.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="dt-location-panel">
                    <Map size={30} />

                    <div>
                      <strong>
                        {project.locationDisplayName ||
                          [
                            project.district,
                            project.state,
                          ]
                            .filter(Boolean)
                            .join(', ') ||
                          'Location not available'}
                      </strong>

                      <span>
                        Coordinates not available for this
                        project.
                      </span>
                    </div>
                  </div>

                  <div className="dt-location-note">
                    <ShieldCheck size={15} />

                    <span>
                      GIS map will appear when coordinates
                      are available for the selected project.
                    </span>
                  </div>
                </>
              )}
            </section>
          </div>

          <section className="dt-card dt-data-status">
            <div className="dt-data-status-main">
              <div className="dt-data-status-icon">
                <Database size={20} />
              </div>

              <div>
                <span className="dt-eyebrow">
                  DATA STATUS
                </span>

                <h2>Digital Twin is based on current records</h2>

                <p>
                  This view reflects the project and
                  workflow information currently available
                  to LIVA. It does not create missing records
                  or treat unavailable information as completed.
                </p>
              </div>
            </div>

            <div className="dt-data-status-meta">
              <span>
                Last refreshed
              </span>

              <strong>
                {lastRefresh
                  ? lastRefresh.toLocaleTimeString(
                      'en-IN',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )
                  : '—'}
              </strong>

              <span>
                Source
              </span>

              <strong>
                {project.source ||
                  'LIVA project records'}
              </strong>
            </div>
          </section>

          <section className="dt-card dt-compensation-card">
            <div className="dt-section-heading">
              <div>
                <span className="dt-eyebrow">
                  COMPENSATION POSITION
                </span>

                <h2>Financial workflow snapshot</h2>

                <p>
                  Amounts are shown only when corresponding
                  compensation summary values are available.
                </p>
              </div>
            </div>

            <div className="dt-financial-grid">
              <FinancialMetric
                label="Approved"
                paise={
                  summary.metrics.approvedPaise
                }
              />

              <FinancialMetric
                label="Disbursed"
                paise={
                  summary.metrics.disbursedPaise
                }
              />

              <FinancialMetric
                label="Balance"
                paise={
                  summary.metrics.balancePaise
                }
              />

              <div className="dt-financial-metric">
                <span>Open compensation records</span>
                <strong>
                  {summary.metrics.compensationPending}
                </strong>
              </div>
            </div>
          </section>

                    {selectedProject && (
            <div className="dt-selected-project-footnote">
              Showing Digital Twin for{' '}
              <strong>
                {selectedProject.name}
              </strong>
            </div>
          )}
        </>
      ) : (
        <div className="dt-empty-card">
          <Database size={28} />

          <h2>
            Select a project to open its Digital Twin
          </h2>

          <p>
            Select a project from the project banner above.
            LIVA will then load its current project and
            workflow records.
          </p>
        </div>
      )}
    </div>
  )
}

function FinancialMetric({
  label,
  paise,
}: {
  label: string
  paise: number
}) {
  const rupees =
    paise > 0
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(paise / 100)
      : 'Not available'

  return (
    <div className="dt-financial-metric">
      <span>{label}</span>
      <strong>{rupees}</strong>
    </div>
  )
}