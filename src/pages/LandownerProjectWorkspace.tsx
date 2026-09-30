import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  MapPin,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router'
import DigitalTwinPanel from '../components/simulation/DigitalTwinPanel'

import {
  livaDocumentUrl,
} from '../services/livaDocuments'
import { getLivaProjectRisk } from '../services/riskApi'
import type { RiskPrediction } from '../types/risk'
import type { LandownerGrievance } from './OfficerDashboard'
import '../styles/landowner-project.css'

type Project = {
  projectId: string
  projectName: string
  surveyNumber: string
  village: string
  taluka?: string
  district: string
  state: string
  pincode: string
  owner: string
  area: string
  status?: string
  progress?: number | null
}

type Props = {
  viewerRole?: 'landowner' | 'officer'
  initialProjectId: string
  projects: Project[]
  projectsLoaded: boolean
  grievances: LandownerGrievance[]
  loadError: string
  activeTab: WorkspaceTab
  onBackToSearch: () => void
  onTabChange: (tab: WorkspaceTab, projectId: string) => void
  onProjectChange: (projectId: string) => void
  onOpenGrievanceForm: (projectId: string) => void
}

export type WorkspaceTab = 'Overview' | 'Delay Intelligence' | 'Summary' | 'Digital Twin' | 'Simulator' | 'Grievances'

const TABS: WorkspaceTab[] = ['Overview', 'Delay Intelligence', 'Summary', 'Digital Twin', 'Simulator', 'Grievances']
const GRIEVANCE_REQUIRED_TABS: WorkspaceTab[] = ['Delay Intelligence', 'Digital Twin', 'Simulator']
function statusLabel(status?: string) {
  if (!status) return 'Not recorded'
  return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function dateLabel(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LandownerProjectWorkspace({
  viewerRole = 'landowner',
  initialProjectId,
  projects,
  projectsLoaded,
  grievances,
  loadError,
  activeTab,
  onBackToSearch,
  onTabChange,
  onProjectChange,
  onOpenGrievanceForm,
}: Props) {
  const tab = activeTab
  const [riskResult, setRiskResult] = useState<{
    projectId: string
    status: 'ready' | 'missing'
    risk?: RiskPrediction
    error?: string
  } | null>(null)

  const activeProjectId = initialProjectId
  const project = projects.find((item) => item.projectId === activeProjectId)
  const projectGrievances = useMemo(
    () => grievances.filter((item) => item.projectId === activeProjectId),
    [grievances, activeProjectId],
  )
  const latestGrievance = projectGrievances[0]
  const hasOfficerReport = projectGrievances.some((item) => item.status === 'verified' && item.officerReport)
  const officerReportedGrievances = projectGrievances.filter((item) => item.status === 'verified' && item.officerReport)
  const pendingGrievances = projectGrievances.filter((item) => item.status !== 'verified')
  const documentCount = projectGrievances.reduce((count, item) => count + item.supportingDocuments.length, 0)

  useEffect(() => {
    let active = true
    if (tab !== 'Delay Intelligence' || !activeProjectId) return
    getLivaProjectRisk(activeProjectId)
      .then((result) => {
        if (active) setRiskResult({ projectId: activeProjectId, status: 'ready', risk: result })
      })
      .catch((error: unknown) => {
        if (active) {
          setRiskResult({
            projectId: activeProjectId,
            status: 'missing',
            error: error instanceof Error ? error.message : 'Unable to load assessment.',
          })
        }
      })
    return () => { active = false }
  }, [tab, activeProjectId])

  const currentRiskResult = riskResult?.projectId === activeProjectId ? riskResult : null
  const risk = currentRiskResult?.status === 'ready' ? currentRiskResult.risk ?? null : null
  const riskLoading = tab === 'Delay Intelligence' && !currentRiskResult

  if (!project) {
    return (
      <main className="landowner-workspace">
        <section className="landowner-workspace__empty">
          <MapPin size={24} />
          <h1>{!projectsLoaded ? 'Loading project' : loadError?.includes('Project records') ? 'Project could not be loaded' : 'Project not found'}</h1>
          <p>{!projectsLoaded ? 'Loading the selected LIVA project…' : loadError?.includes('Project records') ? loadError : `No LIVA project matches ${initialProjectId}.`}</p>
          <Link to={viewerRole === 'officer' ? '/officer/projects' : '/landowner/projects'} className="landowner-workspace__back">Back to Projects</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="landowner-workspace">
      <div className="landowner-workspace__content">
      <div className="landowner-workspace__controls">
        <button type="button" className="landowner-workspace__back" onClick={onBackToSearch}>{viewerRole === 'officer' ? 'Back to Project Management' : 'Back to My Land / Search'}</button>
        {projects.length > 1 && (
          <label className="landowner-workspace__project-picker">
            <span>{viewerRole === 'officer' ? 'Project' : 'My Project'}</span>
            <select value={activeProjectId} onChange={(event) => onProjectChange(event.target.value)}>
              {projects.map((item) => <option key={item.projectId} value={item.projectId}>{item.projectId} · {item.village}</option>)}
            </select>
          </label>
        )}
      </div>
        <section className="landowner-project-hero">
          <div className="landowner-project-hero__icon"><MapPin size={22} /></div>
          <div className="landowner-project-hero__title">
            <span>{viewerRole === 'officer' ? 'PROJECT' : 'MY PROJECT'} <b>{project.projectId}</b></span>
            <h1>{project.village} <i>•</i> Survey {project.surveyNumber}</h1>
            <p>{project.projectName}</p>
          </div>
          <span className="landowner-project-hero__status"><span />{statusLabel(project.status)}</span>
        </section>

        <nav className="landowner-project-tabs" aria-label="Project sections">
          {TABS.map((item) => {
            const locked = !hasOfficerReport && GRIEVANCE_REQUIRED_TABS.includes(item)
            return <button key={item} type="button" disabled={locked} title={locked ? 'Wait for an Officer-verified field report' : undefined} aria-current={tab === item ? 'page' : undefined} className={`${tab === item ? 'is-active' : ''}${locked ? ' is-locked' : ''}`} onClick={() => onTabChange(item, activeProjectId)}>{item}{locked ? <span className="landowner-project-tabs__lock">Locked</span> : null}</button>
          })}
        </nav>
        {!hasOfficerReport && <p className="landowner-project-tabs__hint">Delay Intelligence, Digital Twin, and Simulation unlock after an Officer records and verifies a field report.</p>}

        {loadError && <div className="landowner-inline-alert"><AlertCircle size={17} />{loadError}</div>}
        {!hasOfficerReport && GRIEVANCE_REQUIRED_TABS.includes(tab) && (
          <section className="landowner-panel landowner-feature-locked">
            <div className="landowner-panel__heading"><div><span>AVAILABLE AFTER GRIEVANCE</span><h2>{tab}</h2></div><ShieldCheck size={21} /></div>
            <p>This section becomes available after the Officer reviews a grievance and saves a verified field report.</p>
            <button type="button" className="landowner-primary-button" onClick={() => onTabChange('Grievances', activeProjectId)}>Go to Grievances</button>
          </section>
        )}
        {tab === 'Overview' && (
          <section className="landowner-panel">
            <div className="landowner-panel__heading"><div><span>PROJECT OVERVIEW</span><h2>Land and project details</h2></div><ShieldCheck size={21} /></div>
            <div className="landowner-overview-grid">
              <OverviewField label="Project ID" value={project.projectId} />
              <OverviewField label="Project name" value={project.projectName} />
              <OverviewField label="Survey number" value={project.surveyNumber} />
              <OverviewField label="Village" value={project.village} />
              <OverviewField label="District" value={project.district} />
              <OverviewField label="Project status" value={statusLabel(project.status)} />
              <OverviewField label="Progress" value={`${project.progress ?? 0}%`} />
              <OverviewField label="Grievance status" value={latestGrievance ? statusLabel(latestGrievance.status) : 'No grievance submitted'} />
            </div>
          </section>
        )}

        {tab === 'Delay Intelligence' && hasOfficerReport && (
          <section className="landowner-panel">
            <div className="landowner-panel__heading"><div><span>DELAY INTELLIGENCE</span><h2>Project risk assessment</h2></div><Gauge size={21} /></div>
            {riskLoading ? <p className="landowner-muted">Loading the saved assessment…</p> : risk ? (
              <>
                <div className="landowner-data-badge">Persisted risk assessment · {statusLabel(risk.prediction_source)}</div>
                <div className="landowner-risk-summary"><div><span>RISK LEVEL</span><strong>{risk.risk_level}</strong></div><div><span>RISK SCORE</span><strong>{risk.risk_score} / 100</strong></div><div><span>ASSESSMENT STATUS</span><strong>Saved</strong></div></div>
                <h3>Factors considered</h3>
                {risk.factors.length ? <div className="landowner-factor-list">{risk.factors.map((factor) => <article key={factor.code}><strong>{factor.label}</strong><span>{factor.observed_value == null ? 'Not recorded' : String(factor.observed_value)}</span><p>{factor.reason}</p></article>)}</div> : <p className="landowner-muted">No risk factors were recorded for this assessment.</p>}
                <h3>Why this project may be delayed</h3>
                {risk.factors.some((factor) => factor.reason) ? <ul className="landowner-insight-list">{risk.factors.filter((factor) => factor.reason).slice(0, 3).map((factor) => <li key={factor.code}>{factor.reason}</li>)}</ul> : <p className="landowner-muted">No explanation was recorded for this assessment.</p>}
                <h3>Recommended actions</h3>
                {risk.recommendations.length ? <div className="landowner-factor-list">{risk.recommendations.slice(0, 3).map((action) => <article key={action.code}><strong>{action.title}</strong><p>{action.description}</p></article>)}</div> : <p className="landowner-muted">No recommendations are attached to this assessment.</p>}
              </>
            ) : (
              <div className="landowner-empty-state"><Activity size={21} /><p>{currentRiskResult ? 'The saved risk assessment could not be loaded right now. Please try again later.' : 'Risk assessment will appear after your verified grievance is assessed.'}</p></div>
            )}
          </section>
        )}

        {tab === 'Summary' && (
          <section className="landowner-summary-grid">
            <SummaryCard icon={<Gauge />} title="Project Progress" value={`${project.progress ?? 0}%`} detail={project.progress == null ? 'No progress recorded yet' : 'Recorded project progress'} />
            <SummaryCard icon={<MapPin />} title="Land Information" value={`${project.area || 'Not recorded'}`} detail={`${project.surveyNumber} · ${project.village}, ${project.district}`} />
            <SummaryCard icon={<FileText />} title="Documents" value={`${documentCount} attached`} detail="Supporting files on linked grievances" />
            <SummaryCard icon={<FileText />} title="Compensation" value="Not started" detail="No compensation record linked to this project" />
            <SummaryCard icon={<MapPin />} title="R&R" value="Not started" detail="No rehabilitation record linked to this project" />
            <SummaryCard icon={<ClipboardList />} title="Grievances" value={`${projectGrievances.length}`} detail={`${pendingGrievances.length} awaiting resolution or verification`} />
            <SummaryCard icon={<CheckCircle2 />} title="Pending Actions" value="0" detail="No action records linked to this project" />
          </section>
        )}

        {tab === 'Digital Twin' && hasOfficerReport && (
          <section className="landowner-panel">
            <div className="landowner-panel__heading"><div><span>DIGITAL TWIN</span><h2>Officer-confirmed project state</h2></div><Activity size={21} /></div>
            <div className="landowner-twin-grid">
              <OverviewField label="Current status" value={statusLabel(project.status)} />
              <OverviewField label="Recorded progress" value={`${project.progress ?? 0}%`} />
              <OverviewField label="Verified land issues" value={String(officerReportedGrievances.length)} />
              <OverviewField label="Open actions" value={String(officerReportedGrievances.filter((item) => item.officerReport?.workStatus !== 'RESOLVED').length)} />
              <OverviewField label="Compensation status" value={officerReportedGrievances.some((item) => item.officerReport?.compensationPending === true) ? 'Pending (Officer confirmed)' : 'Not reported as pending'} />
              <OverviewField label="Survey status" value={officerReportedGrievances.some((item) => item.officerReport?.surveyPending === true) ? 'Pending (Officer confirmed)' : 'Not reported as pending'} />
            </div>
            <section className="landowner-officer-reports">
              <h3>Officer-confirmed issues and response</h3>
              {officerReportedGrievances.map((item) => <article key={item.id}>
                <span>{item.id} · {statusLabel(item.type)}</span>
                <strong>{item.officerReport?.findings}</strong>
                {item.officerReport?.rootCause && <p>Cause: {item.officerReport.rootCause}</p>}
                <p>Action / solution: {item.officerReport?.actionPlan}</p>
                <small>Work status: {statusLabel(item.officerReport?.workStatus)}{item.officerReport?.overdueDays != null ? ` · ${item.officerReport.overdueDays} overdue days` : ''}</small>
              </article>)}
            </section>
            <div className="landowner-simulation-result"><strong>What-if simulation</strong><p>Use the saved Officer-verified project features to compare a selected intervention. Simulation scenarios do not change your project record.</p><button type="button" onClick={() => onTabChange('Simulator', activeProjectId)}>Open Simulator</button></div>
          </section>
        )}
        {tab === 'Simulator' && hasOfficerReport && (
          <section className="landowner-panel">
            <div className="landowner-panel__heading"><div><span>PROJECT SIMULATOR</span><h2>Project intervention simulator</h2></div><Activity size={21} /></div>
            <DigitalTwinPanel key={activeProjectId} projectId={activeProjectId} />
          </section>
        )}

        {tab === 'Grievances' && (
          <section className="landowner-panel">
            <div className="landowner-panel__heading"><div><span>PROJECT GRIEVANCES</span><h2>Grievances and verification</h2></div>{viewerRole === 'landowner' && <button type="button" className="landowner-primary-button" onClick={() => onOpenGrievanceForm(activeProjectId)}><Upload size={16} />Submit grievance</button>}</div>
            {projectGrievances.length ? <div className="landowner-grievance-list">{projectGrievances.map((item) => <article key={item.id} className="landowner-grievance-row">
              <div className="landowner-grievance-row__top"><strong>{item.id}</strong><span className={`landowner-status landowner-status--${item.status}`}>{statusLabel(item.status)}</span></div>
              <div className="landowner-grievance-row__details"><span><small>Type</small>{statusLabel(item.type)}</span><span><small>Submitted</small>{dateLabel(item.submittedAt)}</span><span><small>Verification</small>{item.status === 'verified' ? 'Verified by officer' : item.status === 'returned' ? 'Returned for follow-up' : 'Awaiting officer review'}</span></div>
              <p>{item.description}</p>
              {item.officerReport && <div className="landowner-grievance-officer-response"><strong>Officer response</strong><p><b>Finding:</b> {item.officerReport.findings}</p>{item.officerReport.rootCause && <p><b>Cause:</b> {item.officerReport.rootCause}</p>}<p><b>Action / solution:</b> {item.officerReport.actionPlan}</p><p><b>Work status:</b> {statusLabel(item.officerReport.workStatus)}</p>{item.officerRemark && <p><b>Officer remark:</b> {item.officerRemark}</p>}</div>}
              <div className="landowner-grievance-docs"><strong>Supporting documents</strong>{item.supportingDocuments.length ? item.supportingDocuments.map((document, index) => {
                const reference = typeof document === 'string' ? null : document
                return reference ? <a key={reference.fileId} href={livaDocumentUrl(reference.fileId)} target="_blank" rel="noreferrer">{reference.filename || `Document ${index + 1}`}</a> : <span key={index}>Document {index + 1}</span>
              }) : <span>None attached</span>}</div>
            </article>)}</div> : <div className="landowner-empty-state"><ClipboardList size={20} /><p>No grievances are linked to this project yet.</p></div>}
          </section>
        )}
      </div>
    </main>
  )
}

function OverviewField({ label, value }: { label: string; value: string }) {
  return <div className="landowner-overview-field"><span>{label}</span><strong>{value || 'Not recorded'}</strong></div>
}

function SummaryCard({ icon, title, value, detail }: { icon: ReactNode; title: string; value: string; detail: string }) {
  return <article className="landowner-summary-card"><div className="landowner-summary-card__icon">{icon}</div><span>{title}</span><strong>{value}</strong><p>{detail}</p></article>
}
