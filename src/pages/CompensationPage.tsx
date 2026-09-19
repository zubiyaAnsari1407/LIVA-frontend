import WorkflowWorkspace from '../components/WorkflowWorkspace'
import type { WorkspaceConfig } from '../components/WorkflowWorkspace'

const config: WorkspaceConfig = {
  endpoint: '/api/compensation',
  title: 'Compensation records',
  description:
    'Track recorded approvals, cumulative payments and remaining balances. This workspace records amounts; it does not calculate legal entitlement or execute payments.',
  image: '/images/liva-compensation-banner.png',

  fields: [
    {
      key: 'reference',
      label: 'Award / record reference',
      required: true,
      minLength: 2,
      max: 120,
    },
    {
      key: 'beneficiaryReference',
      label: 'Beneficiary reference (use a non-sensitive ID)',
      required: true,
      minLength: 2,
      max: 150,
    },
    {
      key: 'approved',
      label: 'Approved amount (INR)',
      type: 'number',
      required: true,
    },
    {
      key: 'disbursed',
      label: 'Cumulative paid amount (INR)',
      type: 'number',
      required: true,
    },
    {
      key: 'lastPaymentDate',
      label: 'Last payment date — required when paid amount is positive',
      type: 'date',
    },
    {
      key: 'officer',
      label: 'Responsible officer',
      max: 150,
    },
  ],

  columns: [
    { key: 'reference', label: 'Reference' },
    { key: 'approved', label: 'Approved (INR)' },
    { key: 'disbursed', label: 'Paid (INR)' },
    { key: 'balance', label: 'Balance (INR)' },
    { key: 'paymentStatus', label: 'Recorded status' },
  ],
}

export default function CompensationPage() {
  return <WorkflowWorkspace config={config} />
}