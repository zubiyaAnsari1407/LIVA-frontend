import type {
  DigitalTwinProject,
  DigitalTwinSummary,
} from '../types/digitalTwin'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/+$/, '')

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options)

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = body?.detail

    throw new Error(
      typeof detail === 'string'
        ? detail
        : `Request failed (${response.status}).`,
    )
  }

  return body as T
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function stringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return null
}

function firstString(
  object: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = stringOrNull(object[key])

    if (value) {
      return value
    }
  }

  return null
}

function firstNumber(
  object: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = numberOrNull(object[key])

    if (value !== null) {
      return value
    }
  }

  return null
}

function normalizeProject(
  value: unknown,
): DigitalTwinProject {
  const item =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {}

  const id =
    firstString(item, ['id', '_id', 'projectId']) ||
    ''

  const name =
    firstString(item, ['name', 'projectName', 'title']) ||
    'Project'

  const state =
    firstString(item, ['state', 'stateName']) ||
    ''

  const district =
    firstString(item, ['district', 'districtName']) ||
    ''

  const stage =
    firstString(item, [
      'stage',
      'projectStage',
      'project_stage',
    ]) ||
    'Survey'

  const progress = firstNumber(item, [
    'progress',
    'physical_progress_pct',
    'physicalProgress',
    'physical_progress',
    'completion_percentage',
    'completionPercentage',
  ])

  const locationDisplayName = firstString(item, [
    'locationDisplayName',
    'location_display_name',
    'location',
    'address',
  ])

  const latitude = firstNumber(item, [
    'latitude',
    'lat',
  ])

  const longitude = firstNumber(item, [
    'longitude',
    'lon',
    'lng',
  ])

  const sector = firstString(item, [
    'sector',
    'sectorName',
  ])

  const lineMinistry = firstString(item, [
    'lineMinistry',
    'line_ministry',
    'ministry',
  ])

  const originalCostCr = firstNumber(item, [
    'originalCostCr',
    'original_cost_cr',
    'originalCost',
  ])

  const expenditureCr = firstNumber(item, [
    'expenditureCr',
    'expenditure_cr',
    'expenditure',
  ])

  const originalCompletionYear = firstNumber(item, [
    'originalCompletionYear',
    'original_completion_year',
    'completionYear',
  ])

  const sanctionYear = firstNumber(item, [
    'sanctionYear',
    'sanction_year',
  ])

  const source = firstString(item, [
    'source',
    'dataSource',
  ])

  const sourceRecordId = firstString(item, [
    'sourceRecordId',
    'source_record_id',
    'recordId',
  ])

  const updatedAt = firstString(item, [
    'updatedAt',
    'updated_at',
    'lastUpdated',
  ])

  return {
    id,
    name,
    state,
    district,
    stage,
    description:
      firstString(item, ['description']) ||
      null,
    progress:
      progress === null
        ? null
        : Math.max(0, Math.min(progress, 100)),
    locationDisplayName,
    latitude,
    longitude,
    sector,
    lineMinistry,
    originalCostCr,
    expenditureCr,
    originalCompletionYear,
    sanctionYear,
    source,
    sourceRecordId,
    updatedAt,
    isDemo:
      typeof item.isDemo === 'boolean'
        ? item.isDemo
        : false,
  }
}

function unwrapProjects(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data
  }

  if (!data || typeof data !== 'object') {
    return []
  }

  const object = data as Record<string, unknown>

  if (Array.isArray(object.items)) {
    return object.items
  }

  if (Array.isArray(object.projects)) {
    return object.projects
  }

  if (Array.isArray(object.data)) {
    return object.data
  }

  return []
}

export async function getProjects(): Promise<DigitalTwinProject[]> {
  const [portfolioResult, livaResult] = await Promise.allSettled([
    request<unknown>('/api/projects'),
    request<unknown>('/api/liva/projects'),
  ])

  if (portfolioResult.status === 'rejected' && livaResult.status === 'rejected') {
    throw portfolioResult.reason
  }

  const portfolio = portfolioResult.status === 'fulfilled'
    ? unwrapProjects(portfolioResult.value).map(normalizeProject)
    : []
  const liva = livaResult.status === 'fulfilled'
    ? unwrapProjects(livaResult.value).map(normalizeProject)
    : []

  return [...portfolio, ...liva]
    .filter((project) => Boolean(project.id))
    .filter((project, index, all) => all.findIndex((item) => item.id === project.id) === index)
}

export async function getProject(
  projectId: string,
): Promise<DigitalTwinProject> {
  const data = await request<unknown>(
    `${projectId.startsWith('LIVA-PRJ-') ? '/api/liva/projects' : '/api/projects'}/${encodeURIComponent(projectId)}`,
  )

  return normalizeProject(data)
}

function readMetric(
  metrics: Record<string, unknown>,
  summary: Record<string, unknown>,
  keys: string[],
): number {
  for (const key of keys) {
    const metricValue = numberOrNull(metrics[key])

    if (metricValue !== null) {
      return metricValue
    }

    const summaryValue = numberOrNull(summary[key])

    if (summaryValue !== null) {
      return summaryValue
    }
  }

  return 0
}

export async function getProjectSummary(
  projectId: string,
): Promise<DigitalTwinSummary> {
  const data = await request<unknown>(
    `/api/workflow/summary?projectId=${encodeURIComponent(projectId)}`,
  )

  const object =
    data && typeof data === 'object'
      ? (data as Record<string, unknown>)
      : {}

  const metrics =
    object.metrics &&
    typeof object.metrics === 'object'
      ? (object.metrics as Record<string, unknown>)
      : object

  const summary = object

  return {
    metrics: {
      totalParcels: readMetric(
        metrics,
        summary,
        ['total_parcels', 'totalParcels'],
      ),

      pendingParcels: readMetric(
        metrics,
        summary,
        ['pending_parcels', 'pendingParcels'],
      ),

      ownershipDisputes: readMetric(
        metrics,
        summary,
        [
          'ownership_disputes',
          'ownershipDisputes',
        ],
      ),

      ownershipPending: readMetric(
        metrics,
        summary,
        [
          'ownership_pending',
          'ownershipPending',
        ],
      ),

      surveyPending: readMetric(
        metrics,
        summary,
        ['survey_pending', 'surveyPending'],
      ),

      activeLitigationCases: readMetric(
        metrics,
        summary,
        [
          'active_litigation_cases',
          'activeLitigationCases',
          'cases',
        ],
      ),

      highRiskLitigationCases: readMetric(
        metrics,
        summary,
        [
          'high_risk_litigation_cases',
          'highRiskLitigationCases',
        ],
      ),

      missingDocuments: readMetric(
        metrics,
        summary,
        [
          'missing_documents',
          'missingDocuments',
        ],
      ),

      compensationPending: readMetric(
        metrics,
        summary,
        [
          'compensation_pending',
          'compensationPending',
        ],
      ),

      pendingApprovals: readMetric(
        metrics,
        summary,
        [
          'pending_approvals',
          'pendingApprovals',
        ],
      ),

      openActions: readMetric(
        metrics,
        summary,
        ['open_actions', 'openActions'],
      ),

      overdueActions: readMetric(
        metrics,
        summary,
        ['overdue_actions', 'overdueActions'],
      ),

      highPriorityOpenActions: readMetric(
        metrics,
        summary,
        [
          'high_priority_open_actions',
          'highPriorityOpenActions',
        ],
      ),

      maxOverdueDays: readMetric(
        metrics,
        summary,
        ['max_overdue_days', 'maxOverdueDays'],
      ),

      completionPercentage: readMetric(
        metrics,
        summary,
        [
          'completion_percentage',
          'completionPercentage',
        ],
      ),

      approvedPaise: readMetric(
        metrics,
        summary,
        ['approved_paise', 'approvedPaise'],
      ),

      disbursedPaise: readMetric(
        metrics,
        summary,
        ['disbursed_paise', 'disbursedPaise'],
      ),

      balancePaise: readMetric(
        metrics,
        summary,
        ['balance_paise', 'balancePaise'],
      ),

      documents: readMetric(
        metrics,
        summary,
        ['documents'],
      ),

      cases: readMetric(
        metrics,
        summary,
        ['cases'],
      ),

      rehabilitationRecords: readMetric(
        metrics,
        summary,
        [
          'rehabilitation_records',
          'rehabilitationRecords',
        ],
      ),
    },

    generatedAt:
      firstString(summary, [
        'generatedAt',
        'generated_at',
      ]) ||
      new Date().toISOString(),

    includesDemo:
      typeof summary.includesDemo === 'boolean'
        ? summary.includesDemo
        : false,
  }
}
