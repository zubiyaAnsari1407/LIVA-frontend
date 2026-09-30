import {
  ArrowRight,
  CircleAlert,
  FileCheck2,
  Gavel,
  IndianRupee,
  Layers3,
  ShieldCheck,
} from 'lucide-react'

import type { DigitalTwinSummary } from '../../types/digitalTwin'

type Props = {
  summary: DigitalTwinSummary
}

type Signal = {
  icon: typeof Layers3
  title: string
  text: string
  count: number
  tone: 'normal' | 'attention'
}

export default function CurrentWorkflowSignal({
  summary,
}: Props) {
  const metrics = summary.metrics

  const signals: Signal[] = [
    {
      icon: Layers3,
      title: 'Parcel processing',
      count: metrics.pendingParcels,
      text:
        metrics.pendingParcels > 0
          ? 'Pending parcel records are still present.'
          : 'No pending parcel records are currently reported.',
      tone:
        metrics.pendingParcels > 0
          ? 'attention'
          : 'normal',
    },
    {
      icon: ShieldCheck,
      title: 'Ownership verification',
      count: metrics.ownershipPending,
      text:
        metrics.ownershipPending > 0
          ? 'Some ownership records still require completion.'
          : 'No open ownership records are currently reported.',
      tone:
        metrics.ownershipPending > 0
          ? 'attention'
          : 'normal',
    },
    {
      icon: Gavel,
      title: 'Legal workflow',
      count: metrics.activeLitigationCases,
      text:
        metrics.activeLitigationCases > 0
          ? 'Active litigation records are connected to the project.'
          : 'No active litigation records are currently reported.',
      tone:
        metrics.activeLitigationCases > 0
          ? 'attention'
          : 'normal',
    },
    {
      icon: IndianRupee,
      title: 'Compensation',
      count: metrics.compensationPending,
      text:
        metrics.compensationPending > 0
          ? 'Compensation records remain open.'
          : 'No open compensation records are currently reported.',
      tone:
        metrics.compensationPending > 0
          ? 'attention'
          : 'normal',
    },
    {
      icon: FileCheck2,
      title: 'Approvals',
      count: metrics.pendingApprovals,
      text:
        metrics.pendingApprovals > 0
          ? 'Approval records are awaiting completion.'
          : 'No pending approval records are currently reported.',
      tone:
        metrics.pendingApprovals > 0
          ? 'attention'
          : 'normal',
    },
  ]

  const activeSignals = signals.filter(
    (signal) => signal.count > 0,
  )

  const primarySignal =
    activeSignals[0] || null

  return (
    <section className="dt-card dt-signal-card">
      <div className="dt-section-heading">
        <div>
          <span className="dt-eyebrow">
            CURRENT WORKFLOW SIGNAL
          </span>

          <h2>Where attention may be needed now</h2>

          <p>
            This section summarizes unresolved workflow
            records. It does not replace the separate
            Delay Intelligence risk assessment.
          </p>
        </div>
      </div>

      {primarySignal ? (
        <div className="dt-primary-signal">
          <div className="dt-primary-signal-icon">
            <CircleAlert size={22} />
          </div>

          <div>
            <span>Current workflow signal</span>

            <h3>{primarySignal.title}</h3>

            <p>{primarySignal.text}</p>
          </div>

          <div className="dt-primary-count">
            <strong>{primarySignal.count}</strong>
            <span>open records</span>
          </div>
        </div>
      ) : (
        <div className="dt-clear-signal">
          <ShieldCheck size={22} />

          <div>
            <strong>
              No open workflow signal detected
            </strong>

            <p>
              The currently connected workflow records do
              not report an unresolved item in the monitored
              categories.
            </p>
          </div>
        </div>
      )}

      <div className="dt-signal-list">
        {signals.map((signal) => {
          const Icon = signal.icon

          return (
            <div
              className={`dt-signal-row ${signal.tone}`}
              key={signal.title}
            >
              <div className="dt-signal-row-icon">
                <Icon size={17} />
              </div>

              <div className="dt-signal-row-copy">
                <strong>{signal.title}</strong>
                <span>{signal.text}</span>
              </div>

              <div className="dt-signal-row-count">
                {signal.count}
              </div>

              <ArrowRight size={15} />
            </div>
          )
        })}
      </div>
    </section>
  )
}