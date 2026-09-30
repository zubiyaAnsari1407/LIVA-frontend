import {
  Activity,
  CalendarClock,
  Database,
  FileCheck2,
  Info,
} from 'lucide-react'

import type {
  DigitalTwinProject,
  DigitalTwinSummary,
} from '../../types/digitalTwin'

type Props = {
  project: DigitalTwinProject
  summary: DigitalTwinSummary
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Current snapshot'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function RecentChanges({
  project,
  summary,
}: Props) {
  const metrics = summary.metrics

  const snapshotItems = [
    {
      icon: Database,
      title: 'Workflow snapshot refreshed',
      text:
        'LIVA has loaded the currently available project workflow records.',
    },
    {
      icon: FileCheck2,
      title: 'Connected records checked',
      text:
        `${metrics.totalParcels} parcel records and ${metrics.missingDocuments} missing-document records are reflected in the current snapshot.`,
    },
    {
      icon: Activity,
      title: 'Open workflow items identified',
      text:
        `${metrics.openActions} open actions, ${metrics.pendingApprovals} pending approvals and ${metrics.compensationPending} open compensation records are currently reported.`,
    },
  ]

  return (
    <section className="dt-card">
      <div className="dt-section-heading">
        <div>
          <span className="dt-eyebrow">
            RECENT DATA ACTIVITY
          </span>

          <h2>What changed in the available data</h2>

          <p>
            LIVA only displays a change event when a dated
            project record is available. The current view
            therefore separates the latest snapshot from a
            historical activity log.
          </p>
        </div>

        <div className="dt-update-badge">
          <CalendarClock size={15} />

          {formatDate(
            project.updatedAt ||
              summary.generatedAt,
          )}
        </div>
      </div>

      <div className="dt-change-list">
        {snapshotItems.map((item) => {
          const Icon = item.icon

          return (
            <div
              className="dt-change-item"
              key={item.title}
            >
              <div className="dt-change-icon">
                <Icon size={17} />
              </div>

              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="dt-info-note">
        <Info size={16} />

        <span>
          A dated historical activity timeline can be
          connected here later when project-level audit
          events are available through the backend.
        </span>
      </div>
    </section>
  )
}