export type DigitalTwinProject = {
  id: string
  name: string
  state: string
  district: string
  stage: string
  description?: string | null
  progress: number | null
  locationDisplayName?: string | null
  latitude?: number | null
  longitude?: number | null
  sector?: string | null
  lineMinistry?: string | null
  originalCostCr?: number | null
  expenditureCr?: number | null
  originalCompletionYear?: number | null
  sanctionYear?: number | null
  source?: string | null
  sourceRecordId?: string | null
  updatedAt?: string | null
  isDemo?: boolean
}

export type DigitalTwinMetrics = {
  totalParcels: number
  pendingParcels: number

  ownershipDisputes: number
  ownershipPending: number

  surveyPending: number

  activeLitigationCases: number
  highRiskLitigationCases: number

  missingDocuments: number

  compensationPending: number

  pendingApprovals: number

  openActions: number
  overdueActions: number
  highPriorityOpenActions: number

  maxOverdueDays: number

  completionPercentage: number

  approvedPaise: number
  disbursedPaise: number
  balancePaise: number

  documents: number
  cases: number
  rehabilitationRecords: number
}

export type DigitalTwinSummary = {
  metrics: DigitalTwinMetrics
  generatedAt: string
  includesDemo?: boolean
}

export type AcquisitionStage =
  | 'Survey'
  | 'Verification'
  | 'Award'
  | 'Compensation'
  | 'Possession'

export type WorkflowStageStatus =
  | 'complete'
  | 'current'
  | 'pending'

export type AcquisitionWorkflowStage = {
  title: AcquisitionStage
  description: string
  status: WorkflowStageStatus
}

export type DigitalTwinRecentChange = {
  id: string
  title: string
  description: string
  date?: string | null
  type?: 'workflow' | 'record' | 'legal' | 'financial' | 'action'
}

export type DigitalTwinData = {
  project: DigitalTwinProject
  summary: DigitalTwinSummary
  workflow: AcquisitionWorkflowStage[]
  recentChanges: DigitalTwinRecentChange[]
}