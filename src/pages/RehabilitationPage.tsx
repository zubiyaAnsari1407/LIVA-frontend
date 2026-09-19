import WorkflowWorkspace from '../components/WorkflowWorkspace'
import type { WorkspaceConfig } from '../components/WorkflowWorkspace'

const rehabilitationConfig: WorkspaceConfig = {
  endpoint: '/api/rehabilitation',

  title: 'Rehabilitation & Resettlement',

  description:
    'Record affected family references, reviewed milestones and delivery status. These entries do not establish eligibility or verify delivery.',

  // Community / rehabilitation visual shown in the hero.
  image: '/images/liva-team.png',

  fields: [
    {
      key: 'familyReference',
      label: 'Family reference',
      type: 'text',
      required: true,
      minLength: 2,
      max: 150,
    },
    {
      key: 'milestone',
      label: 'R&R milestone',
      type: 'text',
      required: true,
      minLength: 3,
      max: 200,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        'Assessment',
        'Under review',
        'Approved',
        'Delivered',
        'Closed',
      ],
    },
    {
      key: 'officer',
      label: 'Responsible officer',
      type: 'text',
      max: 150,
    },
    {
      key: 'targetDate',
      label: 'Target date',
      type: 'date',
    },
  ],

  columns: [
    {
      key: 'familyReference',
      label: 'Family reference',
    },
    {
      key: 'milestone',
      label: 'Milestone',
    },
    {
      key: 'status',
      label: 'Status',
    },
    {
      key: 'targetDate',
      label: 'Target date',
    },
  ],
}

export default function RehabilitationPage() {
  return <WorkflowWorkspace config={rehabilitationConfig} />
}
