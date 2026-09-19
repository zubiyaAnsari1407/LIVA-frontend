import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowRight,
  Bell,
  Building2,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Coins,
  FileText,
  FolderOpen,
  Gavel,
  House,
  Layers,
  Map,
  Menu,
  Network,
  PanelRightClose,
  PanelRightOpen,
  Search,
  UserRound,
  Users,
  X,
} from 'lucide-react'

import GisWorkspace from '../components/dashboard/GisWorkspace'
import WorkflowSummary from '../components/WorkflowSummary'
import '../styles/dashboard.css'




const navigation = [
 {
  label: 'Projects',
  items: ['Project Portfolio'],
},
  {
    label: 'Land Parcels',
    items: ['Parcel Registry', 'Ownership & Survey'],
  },
  {
    label: 'Intelligence',
    items: ['Delay Intelligence', 'Digital Twin & Simulator'],
  },
  {
    label: 'Operations',
    items: [
      'Documents & Records',
      'Court & Litigation',
      'Compensation',
      'Rehabilitation & Resettlement',
      'Action Centre',
    ],
  },
]

const moduleRoutes: Record<string, string> = {
  'Project Portfolio': '/projects',
  'Project Details': '/projects',
  'Project Lens': '/projects',

  'Parcel Registry': '/parcels',
  'Land Parcels': '/parcels',
  'Land Records': '/parcels',
  'Ownership & Survey': '/ownership-survey',

  'Documents & Records': '/documents',
  Documents: '/documents',

  'Court & Litigation': '/litigation',

  Compensation: '/compensation',
  'Compensation & R&R': '/compensation',
  'Rehabilitation & Resettlement': '/rehabilitation',

  'Action Centre': '/actions',
  'Action Centre & Alerts': '/actions',
  'Actions & Alerts': '/actions',

 Simulator: '/simulator',
'Digital Twin & Simulator': '/simulator',
'Delay Intelligence': '/intelligence',

  Reports: '/reports',

  'Survey records': '/ownership-survey',
  'Verification records': '/ownership-survey',
  'Award records': '/compensation',
  'Compensation records': '/compensation',
  'Possession records': '/documents',
}

const journey = [
  { title: 'Survey', icon: ClipboardList },
  { title: 'Verification', icon: Search },
  { title: 'Award', icon: Gavel },
  { title: 'Compensation', icon: Coins },
  { title: 'Possession', icon: House },
]

const quickLinks = [
  { title: 'Land Records', icon: FileText },
  { title: 'Documents', icon: FolderOpen },
  { title: 'GIS Map', icon: Map },
  { title: 'Compensation', icon: Coins },
  { title: 'Simulator', icon: Network },
  { title: 'Action Centre', icon: ClipboardList },
]

const services = [
  {
    title: 'Documents & Records',
    description: 'Land records, supporting documents and review.',
    image: '/images/liva-documents.png',
  },
  {
    title: 'Land Parcels',
    description: 'Parcel information, ownership and surveys.',
    image: '/images/liva-land-parcels.png',
  },
  {
    title: 'Court & Litigation',
    description: 'Case information and acquisition blockers.',
    image: '/images/liva-litigation.png',
  },
  {
    title: 'Compensation & R&R',
    description: 'Payments, rehabilitation and resettlement.',
    image: '/images/liva-compensation.png',
  },
]

const stageDescriptions: Record<string, string> = {
  Survey:
    'Review parcel measurements, survey evidence and outstanding field checks.',
  Verification:
    'Review ownership claims, supporting records and unresolved discrepancies.',
  Award:
    'Track award references, recorded approved amounts and supporting documentation.',
  Compensation:
    'Review recorded payments, disbursement milestones and pending follow-ups.',
  Possession:
    'Review available handover documents and possession evidence.',
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [lensOpen, setLensOpen] = useState(true)
  const [moduleName, setModuleName] = useState('')
  const [activeStage, setActiveStage] = useState<string | null>(null)

  const dialogRef = useRef<HTMLDialogElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const lensToggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const preference = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )

    if (
      preference.matches ||
      !pageRef.current ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return
    }

    const animations: Animation[] = []

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return

          animations.push(
            entry.target.animate(
              [
                {
                  opacity: 0,
                  transform: 'translateY(14px)',
                },
                {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              ],
              {
                duration: 460,
                delay: Math.min(index * 55, 180),
                easing: 'cubic-bezier(.22,1,.36,1)',
                fill: 'backwards',
              },
            ),
          )

          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.08 },
    )

    pageRef.current
      .querySelectorAll(
        [
          '.enterprise-banner-content',
          '.enterprise-lower-grid > section',
          '.enterprise-service-card',
        ].join(', '),
      )
      .forEach((element) => observer.observe(element))

    const stopMotion = () => {
      if (preference.matches) {
        observer.disconnect()
        animations.forEach((animation) => animation.cancel())
      }
    }

    preference.addEventListener('change', stopMotion)

    return () => {
      observer.disconnect()
      animations.forEach((animation) => animation.cancel())
      preference.removeEventListener('change', stopMotion)
    }
  }, [])

  function closeNavigation() {
    setMobileOpen(false)

    document
      .querySelectorAll<HTMLDetailsElement>('.enterprise-nav details')
      .forEach((details) => {
        details.open = false
      })
  }

  function closeDialog() {
    const dialog = dialogRef.current
    if (!dialog || !dialog.open) return

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      dialog.close()
      return
    }

    dialog.animate(
      [
        {
          opacity: 1,
          transform: 'translateY(0)',
        },
        {
          opacity: 0,
          transform: 'translateY(8px)',
        },
      ],
      {
        duration: 140,
        easing: 'ease-in',
      },
    ).onfinish = () => dialog.close()
  }

  function closeLens() {
    lensToggleRef.current?.focus()
    setLensOpen(false)
  }

  function openModule(name: string) {
    closeNavigation()

    const route = moduleRoutes[name]

    if (route) {
      navigate(route)
      return
    }

    setModuleName(name)
    dialogRef.current?.showModal()
  }

  function openMap() {
    closeNavigation()

    document.getElementById('dashboard-map')?.scrollIntoView({
      behavior: window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
        ? 'auto'
        : 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="enterprise-dashboard" ref={pageRef}>
      <a className="dashboard-skip" href="#dashboard-main">
        Skip to dashboard
      </a>

      <header className="enterprise-header">
        <div className="enterprise-header-inner">
          <Link
            to="/"
            className="enterprise-brand"
            aria-label="Liva home"
          >
            <span className="enterprise-logo-window">
              <img src="/images/liva-logo.png" alt="Liva" />
            </span>
          </Link>

          <nav
            className="enterprise-nav"
            aria-label="Dashboard navigation"
          >
            <a
              className="enterprise-nav-active"
              href="#dashboard-main"
            >
              Overview
            </a>

            {navigation.map((group) => (
              <details key={group.label}>
                <summary>
                  {group.label}
                  <ChevronDown size={13} aria-hidden="true" />
                </summary>

                <div className="enterprise-dropdown">
                  {group.items.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => openModule(item)}
                    >
                      {item}
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </details>
            ))}

            <button type="button" onClick={openMap}>
              GIS Map
            </button>

            <button
              type="button"
              onClick={() => openModule('Reports')}
            >
              Reports
            </button>
          </nav>

          <div className="enterprise-header-actions">
            <button
              type="button"
              className="enterprise-search"
              onClick={() => openModule('Global Search')}
            >
              <Search size={16} aria-hidden="true" />
              <span>Search projects, land, records…</span>
            </button>

            <button
              type="button"
              className="enterprise-icon-button"
              aria-label="Notifications"
              onClick={() => openModule('Notifications')}
            >
              <Bell size={20} />
            </button>

            <button
              type="button"
              className="enterprise-profile"
              aria-label="Officer account"
              onClick={() => openModule('Officer Account')}
            >
              <UserRound size={20} />
            </button>

            <button
              type="button"
              className="enterprise-mobile-toggle"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="dashboard-mobile-menu"
              onClick={() => setMobileOpen((value) => !value)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <nav
          id="dashboard-mobile-menu"
          className="enterprise-mobile-menu"
          aria-label="Mobile dashboard navigation"
          hidden={!mobileOpen}
        >
          <a
            href="#dashboard-main"
            onClick={() => setMobileOpen(false)}
          >
            Overview
          </a>

          <button type="button" onClick={openMap}>
            GIS Map
          </button>

          {navigation.map((group) => (
            <div className="mobile-nav-group" key={group.label}>
              <span>{group.label}</span>

              {group.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => openModule(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}

          <button
            type="button"
            onClick={() => openModule('Reports')}
          >
            Reports
          </button>
        </nav>
      </header>

      <main id="dashboard-main">
        <section
          className="enterprise-banner"
          aria-labelledby="dashboard-title"
        >
          <img
            src="/images/liva-gis.png"
            alt=""
            className="enterprise-banner-image"
            fetchPriority="high"
          />

          <div className="enterprise-banner-shade" />

          <div className="enterprise-banner-content">
            <p className="enterprise-eyebrow">
              Land acquisition intelligence
            </p>

            <h1 id="dashboard-title">
              Building a Better Tomorrow
            </h1>

            <p className="enterprise-banner-description">
              A connected view of land, acquisition progress
              <br />
              and the actions that move projects forward.
            </p>

            <button
              type="button"
              className="enterprise-button enterprise-button-green"
              onClick={() => openModule('Project Portfolio')}
            >
              Explore Projects
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="enterprise-banner-quote" aria-hidden="true">
            Land for
            <br />
            progress.
            <br />
            Progress for
            <br />
            people.
          </div>
        </section>

        <div className="enterprise-content">
          {/* Database-backed counts and recorded payment totals */}
          <WorkflowSummary />

          <div
            className={`enterprise-workspace-grid ${
              lensOpen ? '' : 'lens-is-collapsed'
            }`}
          >
            <section
              id="dashboard-map"
              className="enterprise-map-column"
              aria-label="GIS map workspace"
            >
              <GisWorkspace />

              <button
                type="button"
                className="enterprise-lens-toggle"
                ref={lensToggleRef}
                aria-expanded={lensOpen}
                aria-controls="project-lens"
                onClick={() => setLensOpen((value) => !value)}
              >
                {lensOpen ? (
                  <PanelRightClose size={16} aria-hidden="true" />
                ) : (
                  <PanelRightOpen size={16} aria-hidden="true" />
                )}

                {lensOpen
                  ? 'Hide Project Lens'
                  : 'Show Project Lens'}
              </button>
            </section>

            <div
              className="enterprise-lens-shell"
              inert={!lensOpen}
            >
              <aside
                id="project-lens"
                className="enterprise-panel enterprise-lens"
                aria-labelledby="project-lens-title"
              >
                <div className="enterprise-panel-heading">
                  <h2 id="project-lens-title">
                    <Building2 size={19} aria-hidden="true" />
                    Project Lens
                  </h2>

                  <button
                    type="button"
                    className="enterprise-small-icon"
                    aria-label="Close Project Lens"
                    onClick={closeLens}
                  >
                    <PanelRightClose size={17} />
                  </button>
                </div>

    <div className="enterprise-lens-body">
  <div className="enterprise-project-photo">
    <img
      src="/images/liva-project-lens.png"
      alt="Illustrative land and infrastructure landscape"
      loading="lazy"
    />
  </div>

  <p
    style={{
      marginTop: 18,
      marginBottom: 0,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#9a7c42',
    }}
  >
    Project workspace
  </p>

  <h3 style={{ marginTop: 7 }}>
    Select a project to explore
  </h3>

  <p className="enterprise-lens-description">
    Choose a saved project to open its acquisition progress,
    linked records and delay intelligence.
  </p>

  <div
    style={{
      display: 'grid',
      gap: 10,
      marginTop: 18,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        border: '1px solid #dce5da',
        borderRadius: 14,
        background: '#f8faf6',
      }}
    >
      <Layers
        size={18}
        aria-hidden="true"
      />

      <div>
        <strong
          style={{
            display: 'block',
            fontSize: 13,
            color: '#173f35',
          }}
        >
          Project overview
        </strong>

        <span
          style={{
            fontSize: 11,
            color: '#718078',
          }}
        >
          Stage, progress and project context
        </span>
      </div>
    </div>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        border: '1px solid #dce5da',
        borderRadius: 14,
        background: '#f8faf6',
      }}
    >
      <FileText
        size={18}
        aria-hidden="true"
      />

      <div>
        <strong
          style={{
            display: 'block',
            fontSize: 13,
            color: '#173f35',
          }}
        >
          Linked acquisition records
        </strong>

        <span
          style={{
            fontSize: 11,
            color: '#718078',
          }}
        >
          Parcels, documents and workflow records
        </span>
      </div>
    </div>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        border: '1px solid #dce5da',
        borderRadius: 14,
        background: '#f8faf6',
      }}
    >
      <ChartNoAxesColumnIncreasing
        size={18}
        aria-hidden="true"
      />

      <div>
        <strong
          style={{
            display: 'block',
            fontSize: 13,
            color: '#173f35',
          }}
        >
          Delay intelligence
        </strong>

        <span
          style={{
            fontSize: 11,
            color: '#718078',
          }}
        >
          Risk score, factors and recommended actions
        </span>
      </div>
    </div>
  </div>

  <button
    type="button"
    className="enterprise-project-button"
    style={{ marginTop: 18 }}
    onClick={() => openModule('Project Portfolio')}
  >
    Choose a project
    <ArrowRight
      size={14}
      aria-hidden="true"
    />
  </button>
</div>
</aside>
</div>
</div>

<div className="enterprise-lower-grid">
  <section
    className="enterprise-panel enterprise-journey"
    aria-labelledby="journey-title"
  >
    <div className="enterprise-panel-heading">
      <h2 id="journey-title">
        <Network size={19} aria-hidden="true" />
        Acquisition Journey
      </h2>
    </div>

    <ol className="enterprise-journey-steps">
      {journey.map((step) => {
        const Icon = step.icon

        return (
          <li key={step.title}>
            <button
              type="button"
              className="enterprise-stage-button"
              aria-expanded={activeStage === step.title}
              aria-controls="journey-stage-detail"
              onClick={() =>
                setActiveStage(
                  activeStage === step.title
                    ? null
                    : step.title,
                )
              }
            >
              <span className="enterprise-stage-icon">
                <Icon
                  size={23}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>

              <h3>{step.title}</h3>
              <p>Explore stage</p>
            </button>
          </li>
        )
      })}
    </ol>

    <div
      id="journey-stage-detail"
      className="enterprise-stage-detail"
      hidden={!activeStage}
    >
      <strong>{activeStage}</strong>

      <p>
        {activeStage
          ? stageDescriptions[activeStage]
          : ''}
      </p>

      <button
        type="button"
        className="enterprise-text-button"
        onClick={() => {
          if (activeStage) {
            openModule(`${activeStage} records`)
          }
        }}
      >
        Explore records
        <ArrowRight
          size={14}
          aria-hidden="true"
        />
      </button>
    </div>
  </section>

  <section
    className="enterprise-panel"
    aria-labelledby="activity-title"
  >
    <div className="enterprise-panel-heading">
      <h2 id="activity-title">
        <ClipboardList
          size={18}
          aria-hidden="true"
        />
        Recent Activities
      </h2>

      <button
        type="button"
        className="enterprise-text-button"
        onClick={() => openModule('Action Centre')}
      >
        Open tasks
        <ArrowRight
          size={13}
          aria-hidden="true"
        />
      </button>
    </div>

    <div className="enterprise-activity-empty">
      <span>
        <Check
          size={22}
          aria-hidden="true"
        />
      </span>

      <h3>
        Keep the next action in view.
      </h3>

      <p>
        Manage saved tasks in Action Centre.
        A combined history of project changes and reviews
        is not connected yet.
      </p>
    </div>
  </section>

  <section
    className="enterprise-panel"
    aria-labelledby="quick-links-title"
  >
    <div className="enterprise-panel-heading">
      <h2 id="quick-links-title">
        <Layers
          size={18}
          aria-hidden="true"
        />
        Quick Links
      </h2>
    </div>

    <div className="enterprise-quick-grid">
      {quickLinks.map((item) => {
        const Icon = item.icon

        return (
          <button
            type="button"
            key={item.title}
            onClick={() =>
              item.title === 'GIS Map'
                ? openMap()
                : openModule(item.title)
            }
          >
            <Icon
              size={23}
              strokeWidth={1.5}
              aria-hidden="true"
            />

            <span>
              {item.title}
            </span>
          </button>
        )
      })}
    </div>
  </section>
</div>

<section
  className="enterprise-service-grid"
  aria-label="Acquisition services"
>
  {services.map((service) => (
    <button
      type="button"
      className="enterprise-service-card"
      key={service.title}
      onClick={() =>
        openModule(service.title)
      }
    >
      <img
        src={service.image}
        alt=""
        loading="lazy"
      />

      <span className="enterprise-service-copy">
        <strong>
          {service.title}
        </strong>

        <span>
          {service.description}
        </span>
      </span>

      <span className="enterprise-service-arrow">
        <ArrowRight
          size={14}
          aria-hidden="true"
        />
      </span>
    </button>
  ))}
</section>

</div>
</main>

      <footer className="enterprise-bottom-band">
        <div className="enterprise-bottom-inner">
          <div className="enterprise-bottom-brand">
            <strong>Liva</strong>
            <span>
              Clearer decisions.
              <br />
              Coordinated progress.
            </span>
          </div>

          <p className="enterprise-bottom-statement">
            Better land decisions. Stronger communities.
          </p>
        </div>
      </footer>

      <dialog
        ref={dialogRef}
        className="enterprise-dialog"
        onCancel={(event) => {
          event.preventDefault()
          closeDialog()
        }}
        aria-labelledby="enterprise-dialog-title"
      >
        <button
          type="button"
          className="enterprise-dialog-close"
          aria-label="Close"
          onClick={closeDialog}
        >
          <X size={20} />
        </button>

        <Users size={28} strokeWidth={1.5} aria-hidden="true" />

        <p className="enterprise-eyebrow">Liva workspace</p>
        <h2 id="enterprise-dialog-title">{moduleName}</h2>

        <p className="enterprise-dialog-description">
          This feature is not connected yet.
          Use the available workspace modules to view and update
          saved records.
        </p>

        <button
          type="button"
          className="enterprise-button enterprise-button-green"
          onClick={closeDialog}
        >
          Continue exploring
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </dialog>
    </div>
  )
}