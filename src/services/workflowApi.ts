export const WORKFLOW_API = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

export async function workflowRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${WORKFLOW_API}${path}`, options)
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = body?.detail

    throw new Error(
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((item: { msg: string }) => item.msg).join(' ')
          : `Request failed (${response.status}).`,
    )
  }

  return body as T
}

export function workflowError(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed.'
}

export type WorkflowSummary = {
  projects: number
  parcels: number
  documents: number
  cases: number
  compensationRecords: number
  rehabilitationRecords: number
  openActions: number
  approvedPaise: number
  disbursedPaise: number
  balancePaise: number
  generatedAt: string
  includesDemo: boolean
}

export function rupees(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(paise / 100)
}