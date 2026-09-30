import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  X,
} from 'lucide-react'
import {
  type ReactNode,
  useState,
} from 'react'

import {
  livaDocumentUrl,
  type LivaDocumentReference,
} from '../services/livaDocuments'

export type RequestStatus =
  | 'submitted'
  | 'under-verification'
  | 'verified'
  | 'returned'
  | 'approved'
  | 'rejected'

export interface RegistrationReviewHistoryEntry {
  status: RequestStatus
  officerRemark: string
  adminRemark: string
  recordedAt?: string
}

export type RegistrationDocumentKey =
  | 'ownershipProof'
  | 'landRecord'
  | 'identityProof'

export type GrievanceStatus =
  | 'submitted'
  | 'under-verification'
  | 'verified'
  | 'returned'

export type OfficerWorkStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED'

export interface OfficerProjectReport {
  findings: string
  rootCause?: string | null
  actionPlan: string
  workStatus: OfficerWorkStatus
  ownershipIssueConfirmed?: boolean | null
  surveyPending?: boolean | null
  compensationPending?: boolean | null
  overdueDays?: number | null
}

type OfficerProjectReportDraft = {
  findings: string
  rootCause: string
  actionPlan: string
  workStatus: OfficerWorkStatus | ''
  ownershipIssueConfirmed: boolean | null
  surveyPending: boolean | null
  compensationPending: boolean | null
  overdueDays: string
}

function emptyOfficerProjectReport(): OfficerProjectReportDraft {
  return {
    findings: '',
    rootCause: '',
    actionPlan: '',
    workStatus: '',
    ownershipIssueConfirmed: null,
    surveyPending: null,
    compensationPending: null,
    overdueDays: '',
  }
}

export interface GrievanceReviewHistoryEntry {
  status: GrievanceStatus
  officerRemark: string
  officerReport?: OfficerProjectReport | null
  recordedAt?: string
}

export interface RegistrationRequest {
  id: string
  surveyNumber: string
  ownerName: string
  village: string
  district: string
  state: string
  pincode: string
  area: string
  reason: string
  ownershipProof: LivaDocumentReference | string | null
  landRecord: LivaDocumentReference | string | null
  identityProof: LivaDocumentReference | string | null
  status: RequestStatus
  documentVerification: Record<RegistrationDocumentKey, boolean>
  officerRemark: string
  adminRemark?: string
  livaProjectId?: string | null
  submittedAt?: string
  reviewedAt?: string
  reviewHistory?: RegistrationReviewHistoryEntry[]
}

export interface LandownerGrievance {
  id: string
  applicantName: string
  mobile: string
  surveyNumber: string
  village: string
  district: string
  project: string
  projectId?: string | null
  type: string
  description: string
  supportingDocuments: (LivaDocumentReference | string)[]
  status: GrievanceStatus
  officerRemark: string
  submittedAt: string
  reviewedAt?: string
  officerReport?: OfficerProjectReport | null
  reviewHistory?: GrievanceReviewHistoryEntry[]
}

export const REGISTRATION_DOCUMENTS: {
  key: RegistrationDocumentKey
  label: string
}[] = [
  { key: 'ownershipProof', label: 'Ownership Proof' },
  { key: 'landRecord', label: '7/12 Extract / Land Record' },
  { key: 'identityProof', label: 'Identity Proof' },
]

export function areDocumentsVerified(request: RegistrationRequest): boolean {
  return REGISTRATION_DOCUMENTS.every(
    ({ key }) => request.documentVerification[key],
  )
}

export function getStatusLabel(status: RequestStatus): string {
  switch (status) {
    case 'submitted':
      return 'Submitted'
    case 'under-verification':
      return 'Under Verification'
    case 'verified':
      return 'Officer Verified'
    case 'returned':
      return 'Returned'
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}

export function getStatusClass(
  status: RequestStatus | GrievanceStatus,
): string {
  switch (status) {
    case 'verified':
      return 'verified'
    case 'approved':
      return 'verified'
    case 'submitted':
    case 'under-verification':
      return 'pending'
    case 'returned':
      return 'returned'
    case 'rejected':
      return 'rejected'
    default:
      return 'pending'
  }
}

function getGrievanceStatusLabel(status: GrievanceStatus): string {
  switch (status) {
    case 'under-verification':
      return 'Under Verification'
    case 'verified':
      return 'Problem Verified'
    default:
      return status === 'returned' ? 'Returned' : 'Submitted'
  }
}

function getFileType(filename: string): string {
  const extension = filename.split('.').pop()
  return extension && extension !== filename
    ? extension.toUpperCase()
    : 'Unknown'
}

function getDocumentFilename(
  document: LivaDocumentReference | string | null | undefined,
): string {
  return typeof document === 'string'
    ? document
    : document?.filename ?? ''
}

function getDocumentReference(
  document: LivaDocumentReference | string | null | undefined,
): LivaDocumentReference | null {
  return typeof document === 'object' && document !== null && document.fileId
    ? document
    : null
}

function formatRecordDate(value?: string): string {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleString()
}

interface InfoItemProps {
  label: string
  value: string
}

export function InfoItem({
  label,
  value,
}: InfoItemProps) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </div>
  )
}

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
}

export function EmptyState({
  icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  )
}

interface OfficerDashboardProps {
  page?: 'registrations' | 'grievances'
  requests: RegistrationRequest[]
  grievances: LandownerGrievance[]
  onUpdate: (
    id: string,
    status: RequestStatus,
    officerRemark?: string,
  ) => void
  onUpdateDocumentVerification: (
    id: string,
    key: RegistrationDocumentKey,
    verified: boolean,
  ) => void
  onUpdateGrievance: (
    id: string,
    status: GrievanceStatus,
    officerRemark: string,
    officerReport?: OfficerProjectReport,
  ) => void
  onBeginGrievance: (id: string) => void
}

export default function OfficerDashboard({
  page = 'registrations',
  requests,
  grievances,
  onUpdate,
  onUpdateDocumentVerification,
  onUpdateGrievance,
  onBeginGrievance,
}: OfficerDashboardProps) {
  const pendingRequests = requests.filter(
    (request) =>
      request.status === 'submitted' ||
      request.status === 'under-verification',
  )

  const pendingGrievances = grievances.filter(
    (grievance) =>
      grievance.status === 'submitted' ||
      grievance.status === 'under-verification',
  )

  const verifiedRequests = requests.filter(
    (request) => request.status === 'verified',
  )

  const returnedRequests = requests.filter(
    (request) => request.status === 'returned',
  )

  const [selectedRequestId, setSelectedRequestId] =
    useState<string | null>(null)
  const [selectedGrievanceId, setSelectedGrievanceId] =
    useState<string | null>(null)
  const [requestRemark, setRequestRemark] = useState('')
  const [grievanceRemark, setGrievanceRemark] = useState('')
  const [officerReportDraft, setOfficerReportDraft] = useState<OfficerProjectReportDraft>(emptyOfficerProjectReport)
  const [imagePreview, setImagePreview] = useState<{
    url: string
    filename: string
  } | null>(null)

  const selectedRequest = requests.find(
    (request) => request.id === selectedRequestId,
  )
  const selectedGrievance = grievances.find(
    (grievance) => grievance.id === selectedGrievanceId,
  )
  const officerReportReady = Boolean(
    officerReportDraft.findings.trim()
    && officerReportDraft.actionPlan.trim()
    && officerReportDraft.workStatus,
  )

  function currentOfficerReport(): OfficerProjectReport | undefined {
    if (!officerReportReady || !officerReportDraft.workStatus) return undefined
    return {
      ...officerReportDraft,
      findings: officerReportDraft.findings.trim(),
      rootCause: officerReportDraft.rootCause.trim() || null,
      actionPlan: officerReportDraft.actionPlan.trim(),
      workStatus: officerReportDraft.workStatus,
      overdueDays: officerReportDraft.overdueDays === '' ? null : Number(officerReportDraft.overdueDays),
    }
  }

  const activity = [
    ...requests
      .filter((request) => request.reviewedAt)
      .map((request) => ({
        id: request.id,
        type: 'Registration Request',
        action: request.status === 'returned'
          ? 'Returned for correction'
          : 'Verified and sent to Admin',
        date: request.reviewedAt as string,
      })),
    ...grievances
      .filter((grievance) => grievance.reviewedAt)
      .map((grievance) => ({
        id: grievance.id,
        type: 'Grievance',
        action: grievance.status === 'returned'
          ? 'Returned for clarification'
          : 'Problem verified',
        date: grievance.reviewedAt as string,
      })),
  ]
    .sort((first, second) =>
      new Date(second.date).getTime() - new Date(first.date).getTime(),
    )
    .slice(0, 8)

  function openRequest(request: RegistrationRequest) {
    setSelectedRequestId(request.id)
    setSelectedGrievanceId(null)
    setRequestRemark(request.officerRemark)
    setImagePreview(null)

    if (request.status === 'submitted') {
      onUpdate(request.id, 'under-verification')
    }
  }

  function openGrievance(grievance: LandownerGrievance) {
    setSelectedGrievanceId(grievance.id)
    setSelectedRequestId(null)
    setGrievanceRemark(grievance.officerRemark)
    setOfficerReportDraft({
      ...emptyOfficerProjectReport(),
      findings: grievance.officerReport?.findings ?? '',
      rootCause: grievance.officerReport?.rootCause ?? '',
      actionPlan: grievance.officerReport?.actionPlan ?? '',
      workStatus: grievance.officerReport?.workStatus ?? '',
      ownershipIssueConfirmed: grievance.officerReport?.ownershipIssueConfirmed ?? null,
      surveyPending: grievance.officerReport?.surveyPending ?? null,
      compensationPending: grievance.officerReport?.compensationPending ?? null,
      overdueDays: grievance.officerReport?.overdueDays == null ? '' : String(grievance.officerReport.overdueDays),
    })
    setImagePreview(null)

    if (grievance.status === 'submitted') {
      onBeginGrievance(grievance.id)
    }
  }

  function getGrievanceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'land-dispute': 'Land Dispute',
      ownership: 'Ownership Issue',
      compensation: 'Compensation Issue',
      document: 'Document Issue',
      boundary: 'Boundary / Area Issue',
      other: 'Other',
    }

    return labels[type] ?? type
  }

  function viewDocument(document: LivaDocumentReference | string | null | undefined) {
    const reference = getDocumentReference(document)
    if (!reference) {
      return
    }

    const url = livaDocumentUrl(reference.fileId)
    if (reference.contentType === 'application/pdf') {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    setImagePreview({
      url,
      filename: reference.filename,
    })
  }

  return (
    <>
      {page === 'registrations' && <>
      <section className="workspace-card officer-overview">
        <div className="section-title-row">
          <div>
            <div className="eyebrow">
              <ClipboardCheck size={14} />
              OFFICER OVERVIEW
            </div>
            <h3>Verification Work Queue</h3>
            <p>Review submissions and forward verified information to the next stage.</p>
          </div>
        </div>

        <div className="land-details-grid">
          <InfoItem label="Pending Registration Requests" value={String(pendingRequests.length)} />
          <InfoItem label="Pending Grievances" value={String(pendingGrievances.length)} />
          <InfoItem label="Verified Requests" value={String(verifiedRequests.length)} />
          <InfoItem label="Returned Requests" value={String(returnedRequests.length)} />
        </div>
      </section>

      <section id="registration-requests" className="workspace-card">
        <div className="section-title-row">
          <div>
            <div className="eyebrow">
              <FileText size={14} />
              REGISTRATION VERIFICATION
            </div>
            <h3>Registration Requests</h3>
            <p>Verify land details and each required registration document before forwarding to Admin.</p>
          </div>
          <span className="count-badge">{pendingRequests.length} Pending</span>
        </div>

        {requests.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title="No registration requests"
            description="Landowner submissions will appear here."
          />
        ) : (
          <div className="request-table officer-request-table">
            <div className="table-head">
              <span>Request ID</span>
              <span>Survey Number</span>
              <span>Landowner</span>
              <span>Village</span>
              <span>District</span>
              <span>Area</span>
              <span>Submitted</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {requests.map((request) => (
              <div className="table-row" key={request.id}>
                <div><strong>{request.id}</strong></div>
                <div>{request.surveyNumber}</div>
                <div>{request.ownerName}</div>
                <div>{request.village}</div>
                <div>{request.district}</div>
                <div>{request.area}</div>
                <div>{formatRecordDate(request.submittedAt)}</div>
                <div>
                  <span className={`status-pill ${getStatusClass(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    className="small-btn success-btn"
                    onClick={() => openRequest(request)}
                  >
                    View Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedRequest && (
        <section className="workspace-card officer-detail-workspace">
          <div className="section-title-row">
            <div>
              <div className="eyebrow"><ClipboardCheck size={14} /> REQUEST REVIEW</div>
              <h3>{selectedRequest.id}</h3>
              <p>Officer verification does not create or approve a project.</p>
            </div>
            <span className={`status-pill ${getStatusClass(selectedRequest.status)}`}>
              {getStatusLabel(selectedRequest.status)}
            </span>
          </div>

          <div className="officer-detail-section">
            <div className="eyebrow">LAND DETAILS</div>
            <div className="land-details-grid">
              <InfoItem label="Survey Number" value={selectedRequest.surveyNumber} />
              <InfoItem label="Village" value={selectedRequest.village} />
              <InfoItem label="District" value={selectedRequest.district} />
              <InfoItem label="State" value={selectedRequest.state} />
              <InfoItem label="Pincode" value={selectedRequest.pincode} />
              <InfoItem label="Area" value={selectedRequest.area} />
            </div>
          </div>

          <div className="officer-detail-section">
            <div className="eyebrow">LANDOWNER DETAILS</div>
            <div className="land-details-grid">
              <InfoItem label="Owner / Applicant Name" value={selectedRequest.ownerName} />
            </div>
          </div>

          <div className="officer-detail-section">
            <div className="eyebrow">REGISTRATION REASON</div>
            <div className="officer-long-detail">{selectedRequest.reason}</div>
          </div>

          <div className="officer-detail-section">
            <div className="eyebrow">DOCUMENTS</div>
            <div className="document-upload-grid">
              {REGISTRATION_DOCUMENTS.map(({ key, label }) => {
                const document = selectedRequest[key]
                const filename = getDocumentFilename(document)
                const reference = getDocumentReference(document)

                return (
                  <div className="officer-document-card" key={key}>
                    <FileText size={17} aria-hidden="true" />
                    <strong>{label}</strong>
                    <span>{filename || 'Not uploaded'}</span>
                    <small>
                      Document type: {reference?.contentType ?? getFileType(filename)}
                    </small>
                    <button
                      type="button"
                      className="small-btn success-btn"
                      disabled={!reference}
                      onClick={() => viewDocument(document)}
                    >
                      View Document
                    </button>
                    {filename && !reference && (
                      <p className="officer-document-info" role="status">
                        No stored file reference is available for this older record.
                      </p>
                    )}
                    <label className="officer-document-check">
                      <input
                        type="checkbox"
                        checked={selectedRequest.documentVerification?.[key] ?? false}
                        disabled={!filename || selectedRequest.status !== 'under-verification'}
                        onChange={(event) =>
                          onUpdateDocumentVerification(
                            selectedRequest.id,
                            key,
                            event.target.checked,
                          )
                        }
                      />
                      Verified
                    </label>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="form-field officer-remarks-field">
            <label htmlFor="registration-verification-remarks">Verification Remarks</label>
            <textarea
              id="registration-verification-remarks"
              rows={3}
              value={requestRemark}
              onChange={(event) => setRequestRemark(event.target.value)}
              placeholder="Add a remark if clarification or correction is required..."
            />
          </div>

          <div className="form-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setSelectedRequestId(null)}
            >
              Close Request
            </button>
            <button
              type="button"
              className="small-btn danger-btn"
              disabled={selectedRequest.status !== 'submitted' && selectedRequest.status !== 'under-verification'}
              onClick={() => onUpdate(selectedRequest.id, 'returned', requestRemark)}
            >
              Return for Correction
            </button>
            <button
              type="button"
              className="primary-btn"
              disabled={
                selectedRequest.status !== 'under-verification' ||
                !areDocumentsVerified(selectedRequest)
              }
              onClick={() => onUpdate(selectedRequest.id, 'verified', requestRemark)}
            >
              Verify Request
            </button>
          </div>
        </section>
      )}

      </>}

      {page === 'grievances' && <section id="grievance-verification" className="workspace-card">
        <div className="section-title-row">
          <div>
            <div className="eyebrow"><AlertCircle size={14} /> PROBLEM VERIFICATION</div>
            <h3>Grievance / Problem Verification</h3>
            <p>Review each landowner grievance independently, including multiple issues linked to the same project.</p>
          </div>
          <span className="count-badge">{pendingGrievances.length} Pending</span>
        </div>

        {grievances.length === 0 ? (
          <EmptyState
            icon={<AlertCircle size={24} />}
            title="No grievances submitted"
            description="Landowner problems will appear here as separate records."
          />
        ) : (
          <div className="request-table officer-grievance-table">
            <div className="table-head">
              <span>Grievance ID</span>
              <span>Applicant</span>
              <span>Problem Type</span>
              <span>Survey / Project</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {grievances.map((grievance) => (
              <div className="table-row" key={grievance.id}>
                <div><strong>{grievance.id}</strong></div>
                <div>{grievance.applicantName}</div>
                <div>{getGrievanceTypeLabel(grievance.type)}</div>
                <div>
                  <strong>{grievance.surveyNumber}</strong>
                  <small>{grievance.project}</small>
                </div>
                <div>
                  <span className={`status-pill ${getStatusClass(grievance.status)}`}>
                    {getGrievanceStatusLabel(grievance.status)}
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    className="small-btn success-btn"
                    onClick={() => openGrievance(grievance)}
                  >
                    View Grievance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>}

      {page === 'grievances' && selectedGrievance && (
        <section className="workspace-card officer-detail-workspace">
          <div className="section-title-row">
            <div>
              <div className="eyebrow"><AlertCircle size={14} /> GRIEVANCE REVIEW</div>
              <h3>{selectedGrievance.id}</h3>
            </div>
            <span className={`status-pill ${getStatusClass(selectedGrievance.status)}`}>
              {getGrievanceStatusLabel(selectedGrievance.status)}
            </span>
          </div>

          <div className="land-details-grid">
            <InfoItem label="Applicant Name" value={selectedGrievance.applicantName} />
            <InfoItem label="Mobile Number" value={selectedGrievance.mobile} />
            <InfoItem label="Survey Number" value={selectedGrievance.surveyNumber} />
            <InfoItem label="Village" value={selectedGrievance.village} />
            <InfoItem label="District" value={selectedGrievance.district} />
            <InfoItem label="Project Name" value={selectedGrievance.project} />
            <InfoItem label="Problem Type" value={getGrievanceTypeLabel(selectedGrievance.type)} />
          </div>

          {selectedGrievance.status === 'verified' && (
            <div className="admin-flow-note">
              <ShieldCheck size={18} />
              <div>
                <strong>Next stage: Risk Assessment</strong>
                <p>
                  Verified grievance information is ready for the Risk Engine. No risk level is assigned during Officer verification.
                </p>
              </div>
            </div>
          )}

          <div className="officer-detail-section">
            <div className="eyebrow">PROBLEM DESCRIPTION</div>
            <div className="officer-long-detail">{selectedGrievance.description}</div>
          </div>

          <section className="officer-detail-section officer-project-report">
            <div className="eyebrow">OFFICER FIELD REPORT</div>
            <p className="officer-report-help">Record what you confirmed on the ground and the action being taken. Confirmed fields are saved with this grievance and used by the existing risk assessment.</p>
            <div className="form-grid">
              <div className="form-field full"><label htmlFor="officer-findings">Confirmed project / land issue <span>*</span></label><textarea id="officer-findings" rows={3} value={officerReportDraft.findings} onChange={(event) => setOfficerReportDraft((previous) => ({ ...previous, findings: event.target.value }))} placeholder="Describe the issue confirmed during review or field inspection" /></div>
              <div className="form-field full"><label htmlFor="officer-root-cause">Cause (if known)</label><textarea id="officer-root-cause" rows={2} value={officerReportDraft.rootCause} onChange={(event) => setOfficerReportDraft((previous) => ({ ...previous, rootCause: event.target.value }))} placeholder="Leave blank if the cause is not confirmed" /></div>
              <div className="form-field full"><label htmlFor="officer-action-plan">Officer action / solution <span>*</span></label><textarea id="officer-action-plan" rows={3} value={officerReportDraft.actionPlan} onChange={(event) => setOfficerReportDraft((previous) => ({ ...previous, actionPlan: event.target.value }))} placeholder="Record the response, action taken, or next follow-up" /></div>
              <div className="form-field"><label htmlFor="officer-work-status">Work status <span>*</span></label><select id="officer-work-status" value={officerReportDraft.workStatus} onChange={(event) => setOfficerReportDraft((previous) => ({ ...previous, workStatus: event.target.value as OfficerWorkStatus | '' }))}><option value="">Select current status</option><option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="ON_HOLD">On hold</option><option value="RESOLVED">Resolved</option></select></div>
              <div className="form-field"><label htmlFor="officer-overdue-days">Confirmed overdue days (if known)</label><input id="officer-overdue-days" type="number" min="0" max="3650" value={officerReportDraft.overdueDays} onChange={(event) => setOfficerReportDraft((previous) => ({ ...previous, overdueDays: event.target.value }))} placeholder="Not recorded" /></div>
              {([
                ['ownershipIssueConfirmed', 'Ownership issue confirmed'],
                ['surveyPending', 'Survey work pending'],
                ['compensationPending', 'Compensation pending'],
              ] as const).map(([field, label]) => <div className="form-field" key={field}><label htmlFor={`officer-${field}`}>{label}</label><select id={`officer-${field}`} value={officerReportDraft[field] === null ? '' : officerReportDraft[field] ? 'yes' : 'no'} onChange={(event) => setOfficerReportDraft((previous) => ({ ...previous, [field]: event.target.value === '' ? null : event.target.value === 'yes' }))}><option value="">Not assessed</option><option value="yes">Yes</option><option value="no">No</option></select></div>)}
            </div>
          </section>

          <div className="officer-detail-section">
            <div className="eyebrow">SUPPORTING DOCUMENTS</div>
            {selectedGrievance.supportingDocuments.length === 0 ? (
              <p className="officer-no-documents">No supporting documents were submitted. The grievance can still be reviewed.</p>
            ) : (
              <div className="officer-grievance-documents">
                {selectedGrievance.supportingDocuments.map((document, index) => {
                  const filename = getDocumentFilename(document)
                  const reference = getDocumentReference(document)

                  return (
                    <div className="officer-grievance-document" key={`${filename}-${index}`}>
                      <FileText size={17} />
                      <span>{filename}</span>
                      <small>{reference?.contentType ?? getFileType(filename)}</small>
                      <button
                        type="button"
                        className="small-btn success-btn"
                        disabled={!reference}
                        onClick={() => viewDocument(document)}
                      >
                        View Document
                      </button>
                      {!reference && (
                        <p className="officer-document-info" role="status">
                          No stored file reference is available for this older record.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="form-field officer-remarks-field">
            <label htmlFor="grievance-verification-remarks">Verification Remarks</label>
            <textarea
              id="grievance-verification-remarks"
              rows={3}
              value={grievanceRemark}
              onChange={(event) => setGrievanceRemark(event.target.value)}
              placeholder="Add a remark if clarification or correction is required..."
            />
          </div>

          <div className="form-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setSelectedGrievanceId(null)}
            >
              Close Grievance
            </button>
            <button
              type="button"
              className="small-btn danger-btn"
              disabled={selectedGrievance.status === 'verified'}
              onClick={() =>
                onUpdateGrievance(
                  selectedGrievance.id,
                  'returned',
                  grievanceRemark,
                  currentOfficerReport(),
                )
              }
            >
              Return for Clarification
            </button>
            <button
              type="button"
              className="primary-btn"
              disabled={selectedGrievance.status === 'verified' || !officerReportReady}
              onClick={() =>
                onUpdateGrievance(
                  selectedGrievance.id,
                  'verified',
                  grievanceRemark,
                  currentOfficerReport(),
                )
              }
            >
              Verify Grievance
            </button>
          </div>
        </section>
      )}

      {page === 'registrations' && <section className="workspace-card">
        <div className="section-title-row">
          <div>
            <div className="eyebrow"><CheckCircle2 size={14} /> RECENT VERIFICATION ACTIVITY</div>
            <h3>Recent Verification Activity</h3>
            <p>Recent Officer decisions across registration requests and grievances.</p>
          </div>
        </div>

        {activity.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={24} />}
            title="No verification activity yet"
            description="Completed Officer decisions will appear here."
          />
        ) : (
          <div className="request-table officer-activity-table">
            <div className="table-head">
              <span>Record</span>
              <span>Type</span>
              <span>Activity</span>
              <span>Date</span>
            </div>
            {activity.map((item) => (
              <div className="table-row" key={`${item.type}-${item.id}`}>
                <div><strong>{item.id}</strong></div>
                <div>{item.type}</div>
                <div>{item.action}</div>
                <div>{formatRecordDate(item.date)}</div>
              </div>
            ))}
          </div>
        )}
      </section>}

      {imagePreview && (
        <div
          className="officer-image-preview-overlay"
          role="presentation"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="officer-image-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`Preview ${imagePreview.filename}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="officer-image-preview-header">
              <strong>{imagePreview.filename}</strong>
              <button
                type="button"
                className="grievance-upload-remove"
                aria-label="Close image preview"
                onClick={() => setImagePreview(null)}
              >
                <X size={18} />
              </button>
            </div>
            <img src={imagePreview.url} alt={imagePreview.filename} />
          </div>
        </div>
      )}
    </>
  )
}
