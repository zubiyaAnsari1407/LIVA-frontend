import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  Coins,
  FileText,
  Gavel,
  House,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'

import '../styles/project-details.css'

const tabs = [
  'Overview',
  'Parcels',
  'Documents',
  'Compensation',
  'Litigation',
  'Activity',
] as const

type Tab = (typeof tabs)[number]

const stages = [
  {
    title: 'Survey',
    icon: ClipboardList,
    description:
      'Review parcel measurements, field evidence and outstanding survey checks.',
  },
  {
    title: 'Verification',
    icon: Search,
    description:
      'Review ownership records, supporting documents and unresolved discrepancies.',
  },
  {
    title: 'Award',
    icon: Gavel,
    description:
      'Track award documentation, approved amounts and pending review.',
  },
  {
    title: 'Compensation',
    icon: Coins,
    description:
      'Follow payment verification, disbursement milestones and pending actions.',
  },
  {
    title: 'Possession',
    icon: House,
    description:
      'Review handover records, possession evidence and remaining requirements.',
  },
]

const tabContent: Record<
  Exclude<Tab, 'Overview'>,
  { title: string; description: string }
> = {
  Parcels: {
    title: 'Land parcels, connected to the project.',
    description:
      'Verified parcel IDs, area, ownership and acquisition status will appear here.',
  },
  Documents: {
    title: 'Supporting evidence in one place.',
    description:
      'Project documents, required checklists and review status will appear here.',
  },
  Compensation: {
    title: 'Follow every compensation milestone.',
    description:
      'Verified approved, disbursed and pending amounts will appear here.',
  },
  Litigation: {
    title: 'Keep legal matters in context.',
    description:
      'Linked cases, hearing information and reviewed court orders will appear here.',
  },
  Activity: {
    title: 'A clear history of project updates.',
    description:
      'Officer actions and verified record changes will appear here.',
  },
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [activeStage, setActiveStage] = useState(0)
  const [actionOpen, setActionOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [officer, setOfficer] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [draftReady, setDraftReady] = useState(false)

  const selectedStage = stages[activeStage]

  return (
    <div className="project-detail-page">
      <header className="pd-header">
        <Link to="/" className="pd-brand">Liva<span>.</span></Link>

        <nav aria-label="Workspace navigation">
          <Link to="/dashboard">Overview</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/dashboard#dashboard-map">GIS Workspace</Link>
        </nav>

        <Link to="/projects" className="pd-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Portfolio
        </Link>
      </header>

      <main className="pd-main">
        <div className="pd-breadcrumb">
          <Link to="/projects">Projects</Link>
          <ChevronRight size={13} aria-hidden="true" />
          <span>Project details</span>
        </div>

        <section className="pd-hero" aria-labelledby="pd-title">
          <img src="/images/liva-gis.png" alt="" />
          <div className="pd-hero-shade" />

          <div className="pd-hero-copy">
            <p className="pd-eyebrow">PROJECT WORKSPACE</p>
            <h1 id="pd-title">Project details</h1>
            <p>
              Land, milestones and decisions.
              <br />
              One connected project view.
            </p>

            <span className="pd-hero-label">
              <Building2 size={15} aria-hidden="true" />
              {projectId
                ? `Requested project: ${projectId}`
                : 'Workspace preview'}
            </span>
          </div>
        </section>

        <div className="pd-context">
          <p>
            <ShieldCheck size={17} aria-hidden="true" />
            Project records are not connected yet.
          </p>

          <button
            type="button"
            className="pd-primary"
            aria-expanded={actionOpen}
            aria-controls="pd-action-form"
            onClick={() => setActionOpen((open) => !open)}
          >
            {actionOpen ? <X size={16} /> : <Plus size={16} />}
            {actionOpen ? 'Close action form' : 'Preview action form'}
          </button>
        </div>

        <div
          className={`pd-action-wrapper ${actionOpen ? 'is-open' : ''}`}
          inert={!actionOpen}
        >
          <div className="pd-action-inner">
            <section className="pd-action-panel" id="pd-action-form">
              <div className="pd-section-heading">
                <div>
                  <p className="pd-eyebrow">COORDINATE THE NEXT STEP</p>
                  <h2>Prepare an action</h2>
                </div>
                <span className="pd-preview-label">Local preview</span>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  setDraftReady(true)
                }}
                onChange={() => setDraftReady(false)}
              >
                <label>
                  Action title
                  <input
                    required
                    maxLength={160}
                    placeholder="e.g. Review pending survey documents"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                  />
                </label>

                <label>
                  Responsible officer
                  <input
                    required
                    maxLength={100}
                    placeholder="Enter officer name"
                    value={officer}
                    onChange={(event) => setOfficer(event.target.value)}
                  />
                </label>

                <label>
                  Due date
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </label>

                <button type="submit" className="pd-primary">
                  Preview action <ArrowRight size={15} aria-hidden="true" />
                </button>
              </form>

              {draftReady && (
                <div className="pd-draft-result" role="status">
                  <Check size={18} aria-hidden="true" />
                  <p>
                    <strong>{taskTitle}</strong>
                    <span>{officer} · Due {dueDate}</span>
                    <small>
                      Preview only. Nothing has been saved or assigned.
                    </small>
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="pd-tabs" role="tablist" aria-label="Project sections">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              id={`pd-tab-${tab}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls="pd-tab-panel"
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => setActiveTab(tab)}
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
                setActiveTab(tabs[next])
                document.getElementById(`pd-tab-${tabs[next]}`)?.focus()
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <section
          id="pd-tab-panel"
          role="tabpanel"
          aria-labelledby={`pd-tab-${activeTab}`}
          tabIndex={0}
        >
          <div key={activeTab} className="pd-tab-content">
            {activeTab === 'Overview' ? (
              <>
                <section className="pd-facts" aria-label="Project summary">
                  {[
                    'Land required',
                    'Land acquired',
                    'Total parcels',
                    'Responsible officer',
                  ].map((label) => (
                    <article key={label}>
                      <p>{label}</p>
                      <strong aria-label="Not available">—</strong>
                      <span>Awaiting verified records</span>
                    </article>
                  ))}
                </section>

                <div className="pd-overview-grid">
                  <section className="pd-panel">
                    <div className="pd-section-heading">
                      <h2>Acquisition journey</h2>
                      <span className="pd-preview-label">Explore stages</span>
                    </div>

                    <ol className="pd-stages">
                      {stages.map((stage, index) => {
                        const Icon = stage.icon

                        return (
                          <li key={stage.title}>
                            <button
                              type="button"
                              aria-pressed={activeStage === index}
                              aria-controls="pd-stage-description"
                              onClick={() => setActiveStage(index)}
                            >
                              <span className="pd-stage-icon">
                                <Icon size={23} strokeWidth={1.5} />
                              </span>
                              <strong>{stage.title}</strong>
                            </button>
                          </li>
                        )
                      })}
                    </ol>

                    <div
                      key={activeStage}
                      id="pd-stage-description"
                      className="pd-stage-description"
                      aria-live="polite"
                    >
                      <h3>{selectedStage.title}</h3>
                      <p>{selectedStage.description}</p>
                      <span>Project stage status: unavailable</span>
                    </div>
                  </section>

                  <section className="pd-panel">
                    <div className="pd-section-heading">
                      <h2>Timeline & location</h2>
                      <MapPin size={18} aria-hidden="true" />
                    </div>

                    <dl className="pd-timeline">
                      <div><dt>State / District</dt><dd>Not available</dd></div>
                      <div><dt>Planned start</dt><dd>Not available</dd></div>
                      <div><dt>Target completion</dt><dd>Not available</dd></div>
                      <div><dt>Latest update</dt><dd>Not available</dd></div>
                    </dl>

                    <Link
                      to="/dashboard#dashboard-map"
                      className="pd-map-link"
                    >
                      Open GIS workspace
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>

                    <p className="pd-map-note">
                      Project-specific geometry will appear after verification.
                    </p>
                  </section>
                </div>
              </>
            ) : (
              <div className="pd-tab-empty">
                <span className="pd-empty-icon">
                  <FileText size={31} strokeWidth={1.4} aria-hidden="true" />
                </span>
                <p className="pd-eyebrow">{activeTab.toUpperCase()}</p>
                <h2>{tabContent[activeTab].title}</h2>
                <p>{tabContent[activeTab].description}</p>
                <span className="pd-preview-label">Awaiting project data</span>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="pd-footer">
        <strong>Liva</strong>
        <span>Better land decisions. Stronger communities.</span>
      </footer>
    </div>
  )
}