import {
  Building2,
  CalendarDays,
  MapPin,
  TrendingUp,
} from 'lucide-react'

import type {
  DigitalTwinProject,
  DigitalTwinSummary,
} from '../../types/digitalTwin'

type Props = {
  project: DigitalTwinProject
  summary: DigitalTwinSummary
}

function formatCost(value: number | null | undefined) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return 'Not available'
  }

  return `₹${value.toLocaleString('en-IN')} Cr`
}

export default function ProjectCurrentState({
  project,
  summary,
}: Props) {
  const progress =
    project.progress ??
    summary.metrics.completionPercentage ??
    0

  return (
    <section className="dt-card dt-current-state">
      <div className="dt-section-heading">
        <div>
          <span className="dt-eyebrow">
            PROJECT CURRENT STATE
          </span>

          <h2>Current project position</h2>

          <p>
            A current snapshot of the project stage,
            physical progress and available project
            information.
          </p>
        </div>

        <div className="dt-state-badge">
          <span className="dt-status-dot" />
          Live project record
        </div>
      </div>

      <div className="dt-current-grid">
        <div className="dt-project-primary">
          <div className="dt-project-icon">
            <Building2 size={22} />
          </div>

          <div>
            <span className="dt-label">
              Project
            </span>

            <h3>{project.name}</h3>

            <div className="dt-location">
              <MapPin size={14} />
              <span>
                {project.locationDisplayName ||
                  [project.district, project.state]
                    .filter(Boolean)
                    .join(', ') ||
                  'Location not available'}
              </span>
            </div>
          </div>
        </div>

        <div className="dt-state-metric">
          <span className="dt-label">
            Current stage
          </span>

          <strong>{project.stage || 'Not available'}</strong>
        </div>

        <div className="dt-state-metric">
          <span className="dt-label">
            Physical progress
          </span>

          <strong>
            {Math.round(progress)}%
          </strong>

          <div className="dt-progress-track">
            <div
              className="dt-progress-fill"
              style={{
                width: `${Math.min(
                  Math.max(progress, 0),
                  100,
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="dt-state-metric">
          <span className="dt-label">
            Original cost
          </span>

          <strong>
            {formatCost(project.originalCostCr)}
          </strong>
        </div>
      </div>

      <div className="dt-project-meta">
        <div>
          <CalendarDays size={15} />
          <span>
            Sanction year:{' '}
            <strong>
              {project.sanctionYear ?? 'Not available'}
            </strong>
          </span>
        </div>

        <div>
          <TrendingUp size={15} />
          <span>
            Original completion:{' '}
            <strong>
              {project.originalCompletionYear ??
                'Not available'}
            </strong>
          </span>
        </div>

        <div>
          <Building2 size={15} />
          <span>
            Ministry:{' '}
            <strong>
              {project.lineMinistry ||
                'Not available'}
            </strong>
          </span>
        </div>
      </div>
    </section>
  )
}