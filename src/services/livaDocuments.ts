export type LivaWorkflowType = 'registration' | 'grievance'

export type LivaDocumentType =
  | 'ownershipProof'
  | 'landRecord'
  | 'identityProof'
  | 'grievanceSupporting'

export interface LivaDocumentReference {
  fileId: string
  filename: string
  contentType: 'application/pdf' | 'image/jpeg' | 'image/png'
  size: number
  uploadedAt: string
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export function formatLivaApiDetail(detail: unknown): string {
  if (typeof detail === 'string') {
    const message = detail.trim()
    return message === '[object Object]'
      ? 'The server returned a structured validation error without readable details.'
      : message
  }
  if (typeof detail === 'number' || typeof detail === 'boolean') return String(detail)
  if (Array.isArray(detail)) {
    return detail.map(formatLivaApiDetail).filter(Boolean).join('; ')
  }
  if (detail && typeof detail === 'object') {
    const error = detail as Record<string, unknown>
    const location = error.loc ?? error.field ?? error.path
    const path = Array.isArray(location)
      ? location.filter((part) => part !== 'body').map(String).join('.')
      : typeof location === 'string' ? location : ''
    const messageValue = error.msg ?? error.message ?? error.detail ?? error.error
    if (messageValue !== undefined) {
      return [path, formatLivaApiDetail(messageValue)].filter(Boolean).join(': ')
    }
    return Object.entries(error)
      .map(([key, value]) => {
        const message = formatLivaApiDetail(value)
        return message ? `${key}: ${message}` : ''
      })
      .filter(Boolean)
      .join('; ')
  }
  return ''
}

export function livaDocumentUrl(fileId: string): string {
  return `${API_BASE_URL}/api/liva/documents/${encodeURIComponent(fileId)}`
}

export async function uploadLivaDocument(
  file: File,
  workflowType: LivaWorkflowType,
  documentType: LivaDocumentType,
): Promise<LivaDocumentReference> {
  const form = new FormData()
  form.append('workflowType', workflowType)
  form.append('documentType', documentType)
  form.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/liva/documents`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    const result = await response.json().catch(() => null)
    throw new Error(formatLivaApiDetail(result?.detail) || 'Document upload failed.')
  }

  return response.json() as Promise<LivaDocumentReference>
}

export async function archiveUnlinkedLivaDocument(fileId: string): Promise<void> {
  const response = await fetch(livaDocumentUrl(fileId), {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 409 && response.status !== 404) {
    throw new Error('Could not archive the unused document upload.')
  }
}
