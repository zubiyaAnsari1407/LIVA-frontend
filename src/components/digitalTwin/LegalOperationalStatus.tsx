import {
  AlertCircle,
  ClipboardList,
  FileWarning,
  Gavel,
  IndianRupee,
} from 'lucide-react'

import type { DigitalTwinSummary } from '../../types/digitalTwin'

type Props = {
  summary: DigitalTwinSummary
}

export default function LegalOperationalStatus({
  summary,
}: Props) {
  const {
    activeLitigationCases,
    highRiskLitigationCases,
    missingDocuments,
    compensationPending,
    pendingApprovals,
    openActions,
    overdueActions,
  } = summary.metrics

  const items = [
    {
      icon: Gavel,
      title: 'Active litigation',
      value: activeLitigationCases,
      description:
        'Open litigation records connected to the project.',
      tone:
        activeLitigationCases > 0
          ? 'warning'
          : 'success',
    },
    {
      icon: AlertCircle,
      title: 'High-priority legal cases',
      value: highRiskLitigationCases,
      description:
        'Open cases marked as high risk in the records.',
      tone:
        highRiskLitigationCases > 0
          ? 'danger'
          : 'success',
    },
    {
      icon: FileWarning,
      title: 'Missing documents',
      value: missingDocuments,
      description:
        'Required document records that are still missing.',
      tone:
        missingDocuments > 0
          ? 'warning'
          : 'success',
    },
    {
      icon: IndianRupee,
      title: 'Compensation pending',
      value: compensationPending,
      description:
        'Compensation records currently marked open.',
      tone:
        compensationPending > 0
          ? 'warning'
          : 'success',
    },
    {
      icon: ClipboardList,
      title: 'Pending approvals',
      value: pendingApprovals,
      description:
        'Approval records currently awaiting completion.',
      tone:
        pendingApprovals > 0
          ? 'warning'
          : 'success',
    },
    {
      icon: ClipboardList,
      title: 'Open actions',
      value: openActions,
      description:
        'Follow-up actions that are still open.',
      tone:
        openActions > 0
          ? 'warning'
          : 'success',
    },
  ] as const

  return (
    <section className="dt-card">
      <div className="dt-section-heading">
        <div>
          <span className="dt-eyebrow">
            LEGAL & OPERATIONAL STATUS
          </span>

          <h2>Open items requiring attention</h2>

          <p>
            These indicators show where records remain
            unresolved across legal and operational workflows.
          </p>
        </div>
      </div>

      <div className="dt-status-grid">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <div
              className="dt-status-item"
              key={item.title}
            >
              <div
                className={`dt-status-icon ${item.tone}`}
              >
                <Icon size={18} />
              </div>

              <div className="dt-status-copy">
                <span>{item.title}</span>
                <strong>{item.value}</strong>
                <p>{item.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="dt-operational-footer">
        <div>
          <span>Overdue actions</span>
          <strong>{overdueActions}</strong>
        </div>

        <div>
          <span>Longest overdue duration</span>
          <strong>
            {summary.metrics.maxOverdueDays > 0
              ? `${summary.metrics.maxOverdueDays} days`
              : 'None reported'}
          </strong>
        </div>
      </div>
    </section>
  )
}