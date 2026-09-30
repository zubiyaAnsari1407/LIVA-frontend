import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  Layers3,
} from 'lucide-react'

import type { DigitalTwinSummary } from '../../types/digitalTwin'

type Props = {
  summary: DigitalTwinSummary
}

function MetricRow({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
  description,
}: {
  icon: typeof Layers3
  label: string
  value: number
  tone?: 'neutral' | 'warning' | 'danger' | 'success'
  description: string
}) {
  return (
    <div className="dt-metric-row">
      <div className={`dt-metric-icon ${tone}`}>
        <Icon size={18} />
      </div>

      <div className="dt-metric-copy">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>

      <div className={`dt-metric-value ${tone}`}>
        {value}
      </div>
    </div>
  )
}

export default function LandParcelStatus({
  summary,
}: Props) {
  const {
    totalParcels,
    pendingParcels,
    ownershipPending,
    ownershipDisputes,
    surveyPending,
  } = summary.metrics

  const completedParcels = Math.max(
    totalParcels - pendingParcels,
    0,
  )

  return (
    <section className="dt-card">
      <div className="dt-section-heading">
        <div>
          <span className="dt-eyebrow">
            LAND & PARCEL STATUS
          </span>

          <h2>Land records at a glance</h2>

          <p>
            Parcel, survey and ownership records currently
            connected to this project.
          </p>
        </div>
      </div>

      <div className="dt-summary-strip">
        <div>
          <span>Total parcels</span>
          <strong>{totalParcels}</strong>
        </div>

        <div>
          <span>Completed / closed</span>
          <strong>{completedParcels}</strong>
        </div>

        <div>
          <span>Pending parcels</span>
          <strong>{pendingParcels}</strong>
        </div>
      </div>

      <div className="dt-metric-list">
        <MetricRow
          icon={ClipboardList}
          label="Survey pending"
          value={surveyPending}
          tone={
            surveyPending > 0
              ? 'warning'
              : 'success'
          }
          description="Survey records still marked open."
        />

        <MetricRow
          icon={FileSearch}
          label="Ownership pending"
          value={ownershipPending}
          tone={
            ownershipPending > 0
              ? 'warning'
              : 'success'
          }
          description="Ownership records awaiting completion."
        />

        <MetricRow
          icon={AlertTriangle}
          label="Ownership disputes"
          value={ownershipDisputes}
          tone={
            ownershipDisputes > 0
              ? 'danger'
              : 'success'
          }
          description="Records currently marked as disputed."
        />

        <MetricRow
          icon={CheckCircle2}
          label="Parcel records connected"
          value={totalParcels}
          tone="neutral"
          description="Parcel records linked to this project."
        />
      </div>

      <div className="dt-card-footer">
        LIVA displays the current records available for
        this project; missing records are not treated as
        completed.
      </div>
    </section>
  )
}