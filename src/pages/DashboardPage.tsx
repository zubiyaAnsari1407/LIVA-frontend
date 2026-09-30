import GisWorkspace from '../components/dashboard/GisWorkspace'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderOpen,
  MapPin,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react'
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import {
  archiveUnlinkedLivaDocument,
  formatLivaApiDetail,
  livaDocumentUrl,
  uploadLivaDocument,
  type LivaDocumentReference,
} from '../services/livaDocuments'
import { getLivaProjectRisk } from '../services/riskApi'
import type { RiskPrediction } from '../types/risk'
import OfficerDashboard, {
  areDocumentsVerified,
  EmptyState,
  InfoItem,
  getStatusLabel,
  REGISTRATION_DOCUMENTS,
  type GrievanceStatus,
  type LandownerGrievance,
  type OfficerProjectReport,
  type RegistrationDocumentKey,
  type RequestStatus,
} from './OfficerDashboard'
import type { RegistrationRequest } from './OfficerDashboard'
import LandownerProjectWorkspace, { type WorkspaceTab } from './LandownerProjectWorkspace'
import '../styles/dashboard.css'

type Role = 'landowner' | 'officer' | 'admin'

interface LandRecord {
  projectId?: string
  sourceRegistrationRequestId?: string
  surveyNumber: string
  village: string
  district: string
  state: string
  pincode: string
  owner: string
  area: string
  project: string
  taluka?: string
  status?: string
  progress?: number | null
}

interface RegistrationForm {
  surveyNumber: string
  ownerName: string
  village: string
  district: string
  state: string
  pincode: string
  area: string
  reason: string
  ownershipProof: File | LivaDocumentReference | string | null
  landRecord: File | LivaDocumentReference | string | null
  identityProof: File | LivaDocumentReference | string | null
}

interface GrievanceForm {
  applicantName: string
  mobile: string
  type: string
  description: string
  supportingDocuments: File[]
}

const LIVA_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const ACTIVE_REQUEST_KEY = 'liva-active-registration-request-id'
const ACTIVE_GRIEVANCE_KEY = 'liva-active-grievance-id'

function workspaceTabFromPath(value?: string): WorkspaceTab {
  const tabs: Record<string, WorkspaceTab> = {
    overview: 'Overview',
    'delay-intelligence': 'Delay Intelligence',
    summary: 'Summary',
    'digital-twin': 'Digital Twin',
    simulator: 'Simulator',
    grievances: 'Grievances',
  }
  return tabs[value ?? ''] ?? 'Overview'
}

function workspaceTabPath(tab: WorkspaceTab): string {
  return tab.toLowerCase().replaceAll(' ', '-')
}

function requestCurrentStage(request: RegistrationRequest): string {
  if (request.status === 'rejected') return 'Rejected'
  if (request.status === 'returned') return 'Returned for Correction'
  return REGISTRATION_TIMELINE[registrationTimelineIndex(request)]?.label ?? 'Submitted'
}

function landownerRequestStatusLabel(status: RequestStatus): string {
  return ({
    submitted: 'Submitted',
    'under-verification': 'Under Verification',
    returned: 'Returned for Correction',
    verified: 'Officer Verified',
    approved: 'Approved',
    rejected: 'Rejected',
  })[status]
}

function registrationTimelineIndex(request: RegistrationRequest): number {
  if (request.status === 'returned') return 2
  if (request.status === 'rejected') return 3
  if (request.livaProjectId) return 4
  if (request.status === 'approved') return 3
  if (request.status === 'verified') return 2
  if (request.status === 'under-verification') return 1
  return request.status === 'submitted' ? 0 : -1
}

const REGISTRATION_TIMELINE = [
  { label: 'Submitted', detail: 'Registration request submitted.' },
  { label: 'Under Verification', detail: 'Awaiting officer verification.' },
  { label: 'Officer Verified', detail: 'Request sent for Admin review.' },
  { label: 'Admin Approved', detail: 'Registration request approved.' },
  { label: 'Project Created', detail: 'A LIVA project is linked to this request.' },
]

function RegistrationTimeline({ request }: { request: RegistrationRequest }) {
  const activeIndex = registrationTimelineIndex(request)
  const steps = request.status === 'returned'
    ? [
        { label: 'Submitted', detail: 'Registration request submitted.' },
        { label: 'Under Verification', detail: 'Request sent for officer verification.' },
        { label: 'Returned for Correction', detail: 'Officer returned this request for correction.' },
      ]
    : REGISTRATION_TIMELINE
  return (
    <>
    {request.reviewHistory?.length ? <section className="landowner-review-history" aria-label="Previous review history">
      <h3>Previous review history</h3>
      {request.reviewHistory.map((entry, index) => <article className="landowner-review-history__entry" key={`${entry.status}-${entry.recordedAt ?? index}`}>
        <strong>{landownerRequestStatusLabel(entry.status)}</strong>
        {entry.recordedAt && <time dateTime={entry.recordedAt}>{new Date(entry.recordedAt).toLocaleString()}</time>}
        {entry.officerRemark.trim() && <p><b>Officer Remark:</b> {entry.officerRemark}</p>}
        {entry.adminRemark.trim() && <p><b>Admin Remark:</b> {entry.adminRemark}</p>}
      </article>)}
    </section> : null}
    <ol className={`landowner-registration-timeline${request.status === 'rejected' ? ' is-rejected' : ''}`} aria-label={`Request ${request.id} status timeline`}>
      {steps.map((step, index) => {
        const state = activeIndex < 0 ? 'pending' : index < activeIndex ? 'complete' : index === activeIndex ? 'current' : 'pending'
        const label = request.status === 'rejected' && index === 3 ? 'Admin Decision' : step.label
        const detail = request.status === 'rejected' && index === 3
            ? 'Request rejected by Admin.'
            : index === 4 && !request.livaProjectId
              ? 'Project creation is not confirmed yet.'
              : step.detail
        const officerRemarkApplies = (index === 2 && request.status === 'returned')
          || (index === 1 && request.status === 'under-verification' && Boolean(request.officerRemark.trim()))
          || (index === 2 && ['verified', 'approved', 'rejected'].includes(request.status))
        const adminRemarkApplies = index === 3 && ['approved', 'rejected'].includes(request.status)
        return <li className={`landowner-registration-timeline__step is-${state}`} key={step.label}>
          <span className="landowner-registration-timeline__marker" aria-hidden="true">{state === 'complete' ? '✓' : index + 1}</span>
          <div>
            <strong>{label}</strong>
            <p>{detail}</p>
            {index === 4 && request.livaProjectId && <p className="landowner-timeline-project">Project: <b>{request.livaProjectId}</b></p>}
            {officerRemarkApplies && <p className="landowner-timeline-remark"><b>Officer Remark:</b> {request.officerRemark.trim() || 'No officer remark added yet'}</p>}
            {adminRemarkApplies && <p className="landowner-timeline-remark"><b>Admin Remark:</b> {request.adminRemark?.trim() || 'No admin remark added yet'}</p>}
          </div>
        </li>
      })}
    </ol>
    </>
  )
}

function GrievanceTimeline({ grievance }: { grievance: LandownerGrievance }) {
  const activeIndex = grievance.status === 'submitted' ? 0 : grievance.status === 'under-verification' ? 1 : 2
  const steps = [
    { label: 'Submitted', detail: 'Grievance submitted.' },
    { label: 'Under Verification', detail: activeIndex > 1 ? 'Grievance reviewed by the officer.' : 'Awaiting officer verification.' },
    grievance.status === 'returned'
      ? { label: 'Returned for Correction', detail: 'Officer returned this grievance for landowner follow-up.' }
      : { label: 'Problem Verified', detail: grievance.status === 'verified' ? 'Problem verified by the officer.' : 'Awaiting officer decision.' },
  ]

  return <>
    {grievance.reviewHistory?.length ? <section className="landowner-review-history" aria-label="Grievance review history">
      <h3>Review history</h3>
      {grievance.reviewHistory.map((entry, index) => <article className="landowner-review-history__entry" key={`${entry.status}-${entry.recordedAt}-${index}`}>
        <strong>{grievanceStatusLabel(entry.status)}</strong>
        {entry.recordedAt && <time dateTime={entry.recordedAt}>{new Date(entry.recordedAt).toLocaleString()}</time>}
        {entry.officerRemark.trim() && <p className="landowner-grievance-remark"><b>Officer Remark:</b> {entry.officerRemark}</p>}
      </article>)}
    </section> : null}
    <ol className="landowner-registration-timeline landowner-grievance-timeline" aria-label={`Grievance ${grievance.id} status timeline`}>
      {steps.map((step, index) => {
        const state = index < activeIndex ? 'complete' : index === activeIndex ? 'current' : 'pending'
        return <li className={`landowner-registration-timeline__step is-${state}`} key={step.label} aria-current={state === 'current' ? 'step' : undefined}>
          <span className="landowner-registration-timeline__marker" aria-hidden="true">{state === 'complete' ? '\u2713' : index + 1}</span>
          <div>
            <strong>{step.label}</strong>
            <p>{step.detail}</p>
            {index === 0 && grievance.submittedAt && <p><time dateTime={grievance.submittedAt}>{new Date(grievance.submittedAt).toLocaleString()}</time></p>}
            {index === activeIndex && index > 0 && grievance.reviewedAt && <p><time dateTime={grievance.reviewedAt}>{new Date(grievance.reviewedAt).toLocaleString()}</time></p>}
            {index === activeIndex && (grievance.officerRemark.trim() || grievance.status === 'returned') && <p className="landowner-timeline-remark landowner-grievance-remark"><b>Officer Remark:</b> {grievance.officerRemark.trim() || 'No officer remark added yet'}</p>}
          </div>
        </li>
      })}
    </ol>
  </>
}

function grievanceCurrentStage(status: GrievanceStatus): string {
  return ({
    submitted: 'Officer verification',
    'under-verification': 'Officer review',
    returned: 'Landowner follow-up',
    verified: 'Verified',
  })[status]
}

function grievanceStatusLabel(status: GrievanceStatus): string {
  return ({
    submitted: 'Submitted',
    'under-verification': 'Under Verification',
    returned: 'Returned',
    verified: 'Problem Verified',
  })[status]
}

function grievanceTypeLabel(type: string): string {
  return ({
    'land-dispute': 'Land Dispute',
    ownership: 'Ownership Issue',
    compensation: 'Compensation Issue',
    document: 'Document Issue',
    boundary: 'Boundary / Area Issue',
    other: 'Other',
  } as Record<string, string>)[type] ?? type
}

function registrationFromApi(record: Record<string, any>): RegistrationRequest {
  const statusMap: Record<string, RequestStatus> = {
    SUBMITTED: 'submitted',
    UNDER_VERIFICATION: 'under-verification',
    RETURNED: 'returned',
    OFFICER_VERIFIED: 'verified',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  }

  return {
    id: record.requestId,
    surveyNumber: record.surveyNumber,
    ownerName: record.ownerName,
    village: record.village,
    district: record.district,
    state: record.state,
    pincode: record.pincode,
    area: record.area,
    reason: record.reason,
    ownershipProof: record.ownershipProof ?? null,
    landRecord: record.landRecord ?? null,
    identityProof: record.identityProof ?? null,
    status: statusMap[record.status] ?? 'submitted',
    documentVerification: record.documentVerification ?? {
      ownershipProof: false,
      landRecord: false,
      identityProof: false,
    },
    officerRemark: record.officerRemark ?? '',
    adminRemark: record.adminRemark ?? '',
    livaProjectId: record.livaProjectId ?? null,
    submittedAt: record.createdAt,
    reviewedAt: record.reviewedAt,
    reviewHistory: (record.reviewHistory ?? []).map((entry: Record<string, any>) => ({
      status: statusMap[entry.status] ?? 'submitted',
      officerRemark: entry.officerRemark ?? '',
      adminRemark: entry.adminRemark ?? '',
      recordedAt: entry.recordedAt,
    })),
  }
}

function canCorrectRegistrationRequest(request: RegistrationRequest): boolean {
  return request.status === 'returned' || request.status === 'rejected'
}

function grievanceFromApi(record: Record<string, any>): LandownerGrievance {
  const statusMap: Record<string, GrievanceStatus> = {
    SUBMITTED: 'submitted',
    UNDER_VERIFICATION: 'under-verification',
    RETURNED: 'returned',
    PROBLEM_VERIFIED: 'verified',
  }

  return {
    id: record.grievanceId,
    applicantName: record.applicantName,
    mobile: record.mobile,
    surveyNumber: record.surveyNumber,
    village: record.village,
    district: record.district,
    project: record.project,
    projectId: record.projectId ?? null,
    type: record.type,
    description: record.description,
    supportingDocuments: record.supportingDocuments ?? [],
    status: statusMap[record.status] ?? 'submitted',
    officerRemark: record.officerRemark ?? '',
    officerReport: record.officerReport ?? null,
    reviewHistory: (record.reviewHistory ?? []).map((entry: Record<string, any>) => ({
      status: statusMap[entry.status] ?? 'submitted',
      officerRemark: entry.officerRemark ?? '',
      officerReport: entry.officerReport ?? null,
      recordedAt: entry.recordedAt,
    })),
    submittedAt: record.createdAt,
    reviewedAt: record.updatedAt,
  }
}

function livaProjectFromApi(record: Record<string, any>): LandRecord {
  return {
    projectId: record.projectId,
    sourceRegistrationRequestId: record.sourceRegistrationRequestId,
    surveyNumber: record.surveyNumber,
    village: record.village,
    district: record.district,
    state: record.state,
    pincode: record.pincode,
    owner: record.ownerName,
    area: record.area,
    project: record.projectName,
    taluka: record.taluka,
    status: record.status,
    progress: typeof record.progress === 'number' ? record.progress : null,
  }
}

function registrationDocumentName(
  document: File | LivaDocumentReference | string | null,
): string {
  if (document instanceof File) return document.name
  if (typeof document === 'string') return document
  return document?.filename ?? ''
}

// Fictional records for prototype testing and demonstration only.
const DEMO_LANDS: LandRecord[] = [
  {
    surveyNumber: '41/2A',
    village: 'Anantwadi',
    district: 'Nashik',
    state: 'Maharashtra',
    pincode: '422101',
    owner: 'Meera Kulkarni',
    area: '0.64 hectares',
    project: 'Anantwadi Farm Access Improvement Project',
  },
  {
    surveyNumber: '58/1',
    village: 'Navrangpur',
    district: 'Satara',
    state: 'Maharashtra',
    pincode: '415001',
    owner: 'Aarav Deshmukh',
    area: '1.12 hectares',
    project: 'Navrangpur Community Water Network Project',
  },
  {
    surveyNumber: '73/4B',
    village: 'Chandrapada',
    district: 'Sehore',
    state: 'Madhya Pradesh',
    pincode: '466001',
    owner: 'Kavya Patil',
    area: '0.83 hectares',
    project: 'Chandrapada Rural Link Upgrade Project',
  },
  {
    surveyNumber: '96/3',
    village: 'Kesarpur',
    district: 'Jalgaon',
    state: 'Maharashtra',
    pincode: '425001',
    owner: 'Rohan Shinde',
    area: '1.45 hectares',
    project: 'Kesarpur Smallholder Irrigation Support Project',
  },
  {
    surveyNumber: '112/2C',
    village: 'Nirmalwadi',
    district: 'Udaipur',
    state: 'Rajasthan',
    pincode: '313001',
    owner: 'Anaya Joshi',
    area: '0.72 hectares',
    project: 'Nirmalwadi Community Resource Project',
  },
  {
    surveyNumber: '137/5',
    village: 'Suryanagar',
    district: 'Dharwad',
    state: 'Karnataka',
    pincode: '580001',
    owner: 'Veerappa Gowda',
    area: '1.36 hectares',
    project: 'Suryanagar Village Access Renewal Project',
  },
  {
    surveyNumber: '204/1A',
    village: 'Amritkheda',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    pincode: '522001',
    owner: 'Nisha Reddy',
    area: '0.91 hectares',
    project: 'Amritkheda Farm Service Link Project',
  },
  {
    surveyNumber: '219/6',
    village: 'Devikheda',
    district: 'Kota',
    state: 'Rajasthan',
    pincode: '324001',
    owner: 'Kabir Solanki',
    area: '1.58 hectares',
    project: 'Devikheda Local Water Reliability Project',
  },
  {
    surveyNumber: '266/3B',
    village: 'Haritgaon',
    district: 'Sangli',
    state: 'Maharashtra',
    pincode: '416416',
    owner: 'Isha More',
    area: '0.66 hectares',
    project: 'Haritgaon Market Access Improvement Project',
  },
  {
    surveyNumber: '301/2',
    village: 'Sonamati',
    district: 'Raipur',
    state: 'Chhattisgarh',
    pincode: '492001',
    owner: 'Arjun Sahu',
    area: '0.95 hectares',
    project: 'Sonamati Community Drainage Project',
  },
  {
    surveyNumber: '344/7A',
    village: 'Madhuban',
    district: 'Hassan',
    state: 'Karnataka',
    pincode: '573201',
    owner: 'Tanvi Hegde',
    area: '1.27 hectares',
    project: 'Madhuban Rural Resource Link Project',
  },
  {
    surveyNumber: '402/1C',
    village: 'Pipalgaon',
    district: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
    owner: 'Samar Kulkarni',
    area: '0.88 hectares',
    project: 'Pipalgaon Village Access Project',
  },
  {
    surveyNumber: '437/5',
    village: 'Udaypur',
    district: 'Jabalpur',
    state: 'Madhya Pradesh',
    pincode: '482001',
    owner: 'Diya Rathore',
    area: '1.64 hectares',
    project: 'Udaypur Local Water Distribution Project',
  },
  {
    surveyNumber: '508/2B',
    village: 'Kalpanagar',
    district: 'Kolhapur',
    state: 'Maharashtra',
    pincode: '416003',
    owner: 'Omkar Jadhav',
    area: '1.03 hectares',
    project: 'Kalpanagar Farm Road Safety Project',
  },
  {
    surveyNumber: '561/4',
    village: 'Neelwadi',
    district: 'Belagavi',
    state: 'Karnataka',
    pincode: '590001',
    owner: 'Ritu Naik',
    area: '0.77 hectares',
    project: 'Neelwadi Community Storage Project',
  },
  {
    surveyNumber: '603/3A',
    village: 'Rajkheda',
    district: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452001',
    owner: 'Dev Malhotra',
    area: '1.49 hectares',
    project: 'Rajkheda Village Drainage Improvement Project',
  },
  {
    surveyNumber: '677/1',
    village: 'Belgaon',
    district: 'Tumakuru',
    state: 'Karnataka',
    pincode: '572101',
    owner: 'Leela Gowda',
    area: '0.69 hectares',
    project: 'Belgaon Small Farm Connectivity Project',
  },
  {
    surveyNumber: '721/8',
    village: 'Anandpur',
    district: 'Nanded',
    state: 'Maharashtra',
    pincode: '431601',
    owner: 'Farah Shaikh',
    area: '1.21 hectares',
    project: 'Anandpur Local Resource Access Project',
  },
  {
    surveyNumber: '846/2D',
    village: 'Tarapur',
    district: 'Mysuru',
    state: 'Karnataka',
    pincode: '570001',
    owner: 'Nitin Bhosale',
    area: '0.94 hectares',
    project: 'Tarapur Community Water Access Project',
  },
  {
    surveyNumber: '915/6',
    village: 'Kalyanwadi',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    pincode: '462001',
    owner: 'Pooja Verma',
    area: '1.72 hectares',
    project: 'Kalyanwadi Rural Services Link Project',
  },
]

function isRole(value: unknown): value is Role {
  return (
    value === 'landowner' ||
    value === 'officer' ||
    value === 'admin'
  )
}

function isLandownerRole(role: Role): boolean {
  return role === 'landowner'
}

export default function DashboardPage() {
  const { role } = useAuth()
  const location = useLocation()
  const officerProjectManagement = (role === 'officer' || role === 'admin') && location.pathname.startsWith('/officer/projects')
  const projectBasePath = officerProjectManagement ? '/officer/projects' : '/landowner/projects'
  const isAdminApprovalPage = location.pathname === '/admin/approval' || (role === 'admin' && location.pathname === '/dashboard')
  const officerPage = location.pathname === '/officer/grievances' ? 'grievances' : 'registrations'
  const navigate = useNavigate()
  const { projectId: routeProjectId, tab: routeProjectTab } = useParams()
  const [searchParams] = useSearchParams()
  const grievanceProjectId = searchParams.get('grievanceProjectId')
  const registrationEditId = location.pathname.match(/^\/landowner\/requests\/([^/]+)\/edit$/)?.[1]
  const isRegistrationFormRoute = location.pathname === '/landowner/requests/new' || Boolean(registrationEditId)
  const [trackingTab, setTrackingTab] = useState<'requests' | 'grievances'>('requests')
  const [projectView, setProjectView] = useState<'list' | 'map'>('list')
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)

  const currentRole: Role = isRole(role)
    ? role
    : 'landowner'

  const [searchValue, setSearchValue] = useState('')
  const [landFound, setLandFound] = useState<boolean | null>(
    null,
  )

  const [showRequestForm, setShowRequestForm] =
    useState(false)

  const [showGrievance, setShowGrievance] = useState(
    () => Boolean(new URLSearchParams(window.location.search).get('grievanceProjectId')),
  )

  const [projectOpened, setProjectOpened] =
    useState(false)

  const [selectedLandOverride, setSelectedLand] =
    useState<LandRecord | null>(null)

  const [requestSubmitted, setRequestSubmitted] =
    useState(false)
  const [requestSubmission, setRequestSubmission] = useState<{
    id: string
    status: RequestStatus
  } | null>(null)

  const [editingRequestId, setEditingRequestId] =
    useState<string | null>(null)

  const [grievanceSubmitted, setGrievanceSubmitted] =
    useState(false)

  const [submittingRequest, setSubmittingRequest] =
    useState(false)

  const [submittingGrievance, setSubmittingGrievance] =
    useState(false)

  const [flashMessage, setFlashMessage] = useState<{
    type: 'success' | 'warning' | 'error'
    message: string
  } | null>(null)

  const [livaProjects, setLivaProjects] = useState<LandRecord[]>([])
  const [livaProjectsLoaded, setLivaProjectsLoaded] = useState(false)
  const [dataLoadError, setDataLoadError] = useState('')
  const [activeRequestId, setActiveRequestId] = useState<string | null>(
    () => window.localStorage.getItem(ACTIVE_REQUEST_KEY),
  )
  const [activeGrievanceId, setActiveGrievanceId] = useState<string | null>(
    () => window.localStorage.getItem(ACTIVE_GRIEVANCE_KEY),
  )

  const [request, setRequest] =
    useState<RegistrationForm>({
      surveyNumber: '',
      ownerName: '',
      village: 'Anantwadi',
      district: 'Nashik',
      state: 'Maharashtra',
      pincode: '422101',
      area: '',
      reason: '',
      ownershipProof: null,
      landRecord: null,
      identityProof: null,
    })

  const [grievance, setGrievance] =
    useState<GrievanceForm>({
      applicantName: '',
      mobile: '',
      type: '',
      description: '',
      supportingDocuments: [],
    })

  const [requests, setRequests] = useState<RegistrationRequest[]>([])
  const [grievances, setGrievances] = useState<LandownerGrievance[]>([])

  useEffect(() => {
    const controller = new AbortController()

    async function loadLivaRecords() {
      try {
        const [requestsResult, grievancesResult, projectsResult] =
          await Promise.allSettled([
            fetch(`${LIVA_API_BASE_URL}/api/liva/registration-requests`, {
              signal: controller.signal,
            }),
            fetch(`${LIVA_API_BASE_URL}/api/liva/grievances`, {
              signal: controller.signal,
            }),
            fetch(`${LIVA_API_BASE_URL}/api/liva/projects`, {
              signal: controller.signal,
            }),
          ])

        if (controller.signal.aborted) {
          return
        }

        const errors: string[] = []
        if (requestsResult.status === 'fulfilled' && requestsResult.value.ok) {
          const result = await requestsResult.value.json()
          setRequests((result.items ?? []).map(registrationFromApi))
        } else {
          errors.push('Registration request records are currently unavailable.')
        }
        if (grievancesResult.status === 'fulfilled' && grievancesResult.value.ok) {
          const result = await grievancesResult.value.json()
          setGrievances((result.items ?? []).map(grievanceFromApi))
        } else {
          errors.push('Grievance records are currently unavailable.')
        }
        if (projectsResult.status === 'fulfilled' && projectsResult.value.ok) {
          const result = await projectsResult.value.json()
          setLivaProjects((result ?? []).map(livaProjectFromApi))
        } else {
          errors.push('Project records are currently unavailable.')
        }
        setDataLoadError(errors.join(' '))
      } catch (error) {
        if (!controller.signal.aborted) {
          setDataLoadError(
            error instanceof Error
              ? error.message
              : 'Unable to load persisted LIVA records.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setLivaProjectsLoaded(true)
      }
    }

    void loadLivaRecords()
    return () => controller.abort()
  }, [currentRole, location.pathname])

  useEffect(() => {
    const isTrackingPath = location.pathname.startsWith('/landowner/tracking')
    if (!isLandownerRole(currentRole)
      || (location.pathname !== '/landowner/requests' && !isTrackingPath)) return
    const controller = new AbortController()
    async function refreshTrackingRecords() {
      try {
        const [requestResponse, grievanceResponse] = await Promise.all([
          fetch(`${LIVA_API_BASE_URL}/api/liva/registration-requests`, { signal: controller.signal }),
          isTrackingPath
            ? fetch(`${LIVA_API_BASE_URL}/api/liva/grievances`, { signal: controller.signal })
            : Promise.resolve(null),
        ])
        if (!requestResponse.ok) throw new Error('Registration request tracking could not be refreshed.')
        const requestResult = await requestResponse.json()
        if (!controller.signal.aborted) setRequests((requestResult.items ?? []).map(registrationFromApi))
        if (grievanceResponse) {
          if (!grievanceResponse.ok) throw new Error('Grievance tracking could not be refreshed.')
          const grievanceResult = await grievanceResponse.json()
          if (!controller.signal.aborted) setGrievances((grievanceResult.items ?? []).map(grievanceFromApi))
        }
        if (!controller.signal.aborted) setDataLoadError('')
      } catch (error) {
        if (!controller.signal.aborted) setDataLoadError(error instanceof Error ? error.message : 'Tracking records could not be refreshed.')
      }
    }
    void refreshTrackingRecords()
    return () => controller.abort()
  }, [currentRole, location.pathname])

  useEffect(() => {
    if (!['landowner', 'officer', 'admin'].includes(currentRole) || !routeProjectId) return
    const controller = new AbortController()
    fetch(`${LIVA_API_BASE_URL}/api/liva/grievances`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Project grievance updates are unavailable.')
        const result = await response.json()
        if (!controller.signal.aborted) setGrievances((result.items ?? []).map(grievanceFromApi))
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setDataLoadError(error instanceof Error ? error.message : 'Project grievance updates are unavailable.')
      })
    return () => controller.abort()
  }, [currentRole, routeProjectId])

  useEffect(() => {
    if (!livaProjectsLoaded) return
    if (routeProjectId && currentRole !== 'landowner' && currentRole !== 'officer' && !(currentRole === 'admin' && location.pathname.startsWith('/officer/projects'))) {
      navigate('/dashboard', { replace: true })
      return
    }
    if (routeProjectId) {
      if (!routeProjectTab || !['overview', 'delay-intelligence', 'summary', 'digital-twin', 'simulator', 'grievances'].includes(routeProjectTab)) {
        navigate(`${projectBasePath}/${encodeURIComponent(routeProjectId)}/overview`, { replace: true })
        return
      }
      const grievanceRequiredTabs = ['delay-intelligence', 'digital-twin', 'simulator']
      const hasOfficerReport = grievances.some((item) => item.projectId === routeProjectId && item.status === 'verified' && item.officerReport)
      if (grievanceRequiredTabs.includes(routeProjectTab) && !hasOfficerReport) {
        navigate(`${projectBasePath}/${encodeURIComponent(routeProjectId)}/overview`, { replace: true })
      }
    }
    if (grievanceProjectId) {
      const project = livaProjects.find((item) => item.projectId === grievanceProjectId)
      if (!project) {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [livaProjectsLoaded, livaProjects, grievances, routeProjectId, routeProjectTab, grievanceProjectId, currentRole, navigate, projectBasePath, location.pathname])

  const activeRequest = requests.find(
    (item) => item.id === activeRequestId,
  )
  const activeGrievance = grievances.find(
    (item) => item.id === activeGrievanceId,
  )

  const registeredLands = [...livaProjects, ...DEMO_LANDS]
  const selectedLand = (grievanceProjectId
    ? livaProjects.find((item) => item.projectId === grievanceProjectId)
    : null) ?? selectedLandOverride

  function showFlash(
    message: string,
    type: 'success' | 'warning' | 'error' = 'success',
  ) {
    setFlashMessage({ type, message })

    window.setTimeout(() => {
      setFlashMessage(null)
    }, 3500)
  }

  async function deleteLivaProject(project: LandRecord) {
    if (currentRole !== 'admin' || !project.projectId || deletingProjectId) return
    const projectId = project.projectId
    const confirmed = window.confirm(
      `Permanently delete ${project.project} and its registration request, grievances, documents, parcels, and other linked records? This removes the project and details from every role.`,
    )
    if (!confirmed) return

    setDeletingProjectId(projectId)
    try {
      const response = await fetch(
        `${LIVA_API_BASE_URL}/api/liva/projects/${encodeURIComponent(projectId)}`,
        { method: 'DELETE', headers: { 'X-Liva-Role': currentRole } },
      )
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(typeof result?.detail === 'string' ? result.detail : 'Project could not be deleted.')
      }

      setLivaProjects((items) => items.filter((item) => item.projectId !== projectId))
      setRequests((items) => items.filter((item) => item.id !== project.sourceRegistrationRequestId && item.livaProjectId !== projectId))
      setGrievances((items) => items.filter((item) => item.projectId !== projectId))
      if (project.sourceRegistrationRequestId && window.localStorage.getItem(ACTIVE_REQUEST_KEY) === project.sourceRegistrationRequestId) {
        window.localStorage.removeItem(ACTIVE_REQUEST_KEY)
        setActiveRequestId(null)
      }
      showFlash('Project and linked records deleted from all workspaces.', 'success')
    } catch (error) {
      showFlash(error instanceof Error ? error.message : 'Project could not be deleted.', 'error')
    } finally {
      setDeletingProjectId(null)
    }
  }

  async function syncLivaRecord<T>(
    path: string,
    payload: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(`${LIVA_API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const result = await response.json().catch(() => null)
      throw new Error(formatLivaApiDetail(result?.detail) || 'LIVA record update failed.')
    }

    return response.json() as Promise<T>
  }

  function handleSearch(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!searchValue.trim()) {
      return
    }

    const value = searchValue
      .trim()
      .toLowerCase()

    const matchedLand =
      registeredLands.find((land) =>
        [
          land.surveyNumber,
          land.village,
          land.district,
          land.project,
          land.owner,
        ]
          .join(' ')
          .toLowerCase()
          .includes(value),
      ) ?? null

    const found = matchedLand !== null

    setLandFound(found)
    setSelectedLand(matchedLand)
    setShowRequestForm(false)
    setShowGrievance(false)
    setProjectOpened(false)
    setRequestSubmitted(false)
    setGrievanceSubmitted(false)

    showFlash(
      found
        ? `${matchedLand?.project} found successfully.`
        : 'Land not found in LIVA. You can submit a registration request.',
      found ? 'success' : 'warning',
    )
  }

  function openRequestForm() {
    setShowRequestForm(true)
    setRequestSubmitted(false)
    setProjectOpened(false)
    setLandFound(false)
    navigate('/landowner/requests/new')
  }

  function openProject(land: LandRecord | null) {
    if (!land) {
      return
    }

    setSelectedLand(land)
    setLandFound(true)
    setShowRequestForm(false)
    setRequestSubmitted(false)
    setShowGrievance(false)
    setGrievanceSubmitted(false)
    setProjectOpened(true)
    if (land.projectId) {
      navigate(`/landowner/projects/${encodeURIComponent(land.projectId)}/overview`)
    }
  }

  async function handleRequestSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    if (!request.ownershipProof || !request.landRecord || !request.identityProof) {
      showFlash('Upload all three required registration documents.', 'error')
      return
    }

    const uploaded: LivaDocumentReference[] = []
    let requestWasPersisted = false
    setSubmittingRequest(true)

    try {
      async function resolveDocument(
        value: RegistrationForm['ownershipProof'],
        documentType: 'ownershipProof' | 'landRecord' | 'identityProof',
      ): Promise<LivaDocumentReference | string> {
        if (value instanceof File) {
          const reference = await uploadLivaDocument(value, 'registration', documentType)
          uploaded.push(reference)
          return reference
        }
        if (value) return value
        throw new Error('Upload all three required registration documents.')
      }

      const ownershipProof = await resolveDocument(request.ownershipProof, 'ownershipProof')
      const landRecord = await resolveDocument(request.landRecord, 'landRecord')
      const identityProof = await resolveDocument(request.identityProof, 'identityProof')

      const payload = {
        surveyNumber: request.surveyNumber,
        ownerName: request.ownerName,
        village: request.village,
        district: request.district,
        state: request.state,
        pincode: request.pincode,
        area: request.area,
        reason: request.reason,
        ownershipProof,
        landRecord,
        identityProof,
      }
      const requestId = editingRequestId
      if (requestId) {
        const saved = await syncLivaRecord<Record<string, unknown>>(
          `/api/liva/registration-requests/${encodeURIComponent(requestId)}`,
          {
            ...payload,
            status: 'UNDER_VERIFICATION',
            documentVerification: {
              ownershipProof: false,
              landRecord: false,
              identityProof: false,
            },
          },
        )
        const updatedRequest = registrationFromApi(saved)
        setRequests((previous) => previous.map((item) => item.id === requestId ? updatedRequest : item))
        window.localStorage.setItem(ACTIVE_REQUEST_KEY, requestId)
        setActiveRequestId(requestId)
        setEditingRequestId(null)
        setShowRequestForm(false)
        showFlash(`Registration request ${requestId} resubmitted for Officer verification.`, 'success')
        navigate('/landowner/requests')
      } else {
        const response = await fetch(
          `${LIVA_API_BASE_URL}/api/liva/registration-requests`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        )

        if (!response.ok) {
          const result = await response.json().catch(() => null)
          throw new Error(formatLivaApiDetail(result?.detail) || 'Registration request could not be saved.')
        }

        requestWasPersisted = true
        const saved = await response.json()
        const allowedStatuses = ['SUBMITTED', 'UNDER_VERIFICATION', 'RETURNED', 'OFFICER_VERIFIED', 'APPROVED', 'REJECTED']
        if (typeof saved.requestId !== 'string' || !saved.requestId || !allowedStatuses.includes(saved.status)) {
          throw new Error('The registration API accepted the request but returned an incomplete confirmation.')
        }
        const createdRequest = registrationFromApi(saved)
        setRequestSubmission({ id: createdRequest.id, status: createdRequest.status })
        window.localStorage.setItem(ACTIVE_REQUEST_KEY, createdRequest.id)
        setActiveRequestId(createdRequest.id)

        try {
          const listResponse = await fetch(`${LIVA_API_BASE_URL}/api/liva/registration-requests`)
          if (!listResponse.ok) throw new Error('The request was saved, but My Requests could not be refreshed.')
          const listResult = await listResponse.json()
          const refreshedRequests: RegistrationRequest[] = (listResult.items ?? []).map(registrationFromApi)
          setRequests(refreshedRequests.some((item) => item.id === createdRequest.id)
            ? refreshedRequests
            : [createdRequest, ...refreshedRequests])
          setDataLoadError('')
        } catch (refreshError) {
          // Keep the authoritative POST response visible if the list read temporarily fails.
          setRequests((previous) => [createdRequest, ...previous.filter((item) => item.id !== createdRequest.id)])
          setDataLoadError(refreshError instanceof Error ? refreshError.message : 'The request was saved, but My Requests could not be refreshed.')
        }
        setRequestSubmitted(true)
        showFlash(`Registration request submitted successfully. Request ID: ${createdRequest.id}. Status: ${landownerRequestStatusLabel(createdRequest.status)}.`, 'success')
      }
    } catch (error) {
      if (!requestWasPersisted) {
        await Promise.all(
          uploaded.map((document) =>
            archiveUnlinkedLivaDocument(document.fileId).catch(() => undefined),
          ),
        )
      }
      showFlash(
        error instanceof Error
          ? error.message
          : 'Registration request could not be saved.',
        'error',
      )
    } finally {
      setSubmittingRequest(false)
    }
  }

  async function handleGrievanceSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!selectedLand) {
      return
    }

    const uploaded: LivaDocumentReference[] = []
    setSubmittingGrievance(true)

    try {
      const supportingDocuments: LivaDocumentReference[] = []
      for (const file of grievance.supportingDocuments.slice(0, 3)) {
        const document = await uploadLivaDocument(
          file,
          'grievance',
          'grievanceSupporting',
        )
        uploaded.push(document)
        supportingDocuments.push(document)
      }

      const payload = {
        applicantName: grievance.applicantName.trim(),
        mobile: grievance.mobile.trim(),
        surveyNumber: selectedLand.surveyNumber,
        projectId: selectedLand.projectId ?? null,
        village: selectedLand.village,
        district: selectedLand.district,
        project: selectedLand.project,
        type: grievance.type,
        description: grievance.description.trim(),
        supportingDocuments,
      }
      const response = await fetch(
        `${LIVA_API_BASE_URL}/api/liva/grievances`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const result = await response.json().catch(() => null)
          throw new Error(formatLivaApiDetail(result?.detail) || 'Grievance could not be saved.')
      }

      const saved = await response.json()
      const newGrievance: LandownerGrievance = {
        ...payload,
        id: saved.grievanceId,
        supportingDocuments: saved.supportingDocuments,
        status: 'submitted',
        officerRemark: saved.officerRemark ?? '',
        submittedAt: saved.createdAt,
      }

      setGrievances((previous) => [newGrievance, ...previous])
      window.localStorage.setItem(ACTIVE_GRIEVANCE_KEY, newGrievance.id)
      setActiveGrievanceId(newGrievance.id)
      setGrievanceSubmitted(true)
      setShowGrievance(false)
      showFlash('Grievance submitted successfully.', 'success')
      if (selectedLand.projectId) {
        navigate(`/landowner/projects/${encodeURIComponent(selectedLand.projectId)}/grievances`)
      }
    } catch (error) {
      await Promise.all(
        uploaded.map((document) =>
          archiveUnlinkedLivaDocument(document.fileId).catch(() => undefined),
        ),
      )
      showFlash(
        error instanceof Error ? error.message : 'Grievance could not be saved.',
        'error',
      )
    } finally {
      setSubmittingGrievance(false)
    }
  }

  async function updateRequestStatus(
    id: string,
    status: RequestStatus,
    officerRemark = '',
  ) {
    const existingRequest = requests.find(
      (item) => item.id === id,
    )

    if (
      status === 'verified' &&
      (!existingRequest || !areDocumentsVerified(existingRequest))
    ) {
      return
    }

    const backendStatus: Partial<Record<RequestStatus, string>> = {
      'under-verification': 'UNDER_VERIFICATION',
      returned: 'RETURNED',
      verified: 'OFFICER_VERIFIED',
    }

    try {
      let savedRecord: Record<string, any>
      if (status === 'approved' || status === 'rejected') {
        savedRecord = await syncLivaRecord(
          `/api/liva/registration-requests/${encodeURIComponent(id)}/admin-decision`,
          {
            decision: status === 'approved' ? 'APPROVE' : 'REJECT',
            adminRemark: officerRemark,
          },
        )
      } else if (backendStatus[status]) {
        savedRecord = await syncLivaRecord(
          `/api/liva/registration-requests/${encodeURIComponent(id)}`,
          {
            status: backendStatus[status],
            ...(status === 'verified' || status === 'returned'
              ? { officerRemark }
              : {}),
          },
        )
      } else {
        return
      }

      const updatedRequest = registrationFromApi(savedRecord)
      setRequests((previous) =>
        previous.map((item) => item.id === id ? updatedRequest : item),
      )

      if (updatedRequest.livaProjectId) {
        const projectsResponse = await fetch(`${LIVA_API_BASE_URL}/api/liva/projects`)
        if (projectsResponse.ok) {
          const projects = await projectsResponse.json()
          setLivaProjects((projects ?? []).map(livaProjectFromApi))
        }
      }

      if (status === 'verified') {
        showFlash('Registration request verified successfully.', 'success')
      } else if (status === 'returned') {
        showFlash('Registration request returned for correction.', 'warning')
      } else if (status === 'approved') {
        showFlash('Request approved and LIVA project created.', 'success')
      } else if (status === 'rejected') {
        showFlash('Request rejected by Admin.', 'error')
      }
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : 'Registration request update failed.',
        'error',
      )
    }
  }

  function editCorrectableRequest(item: RegistrationRequest) {
    setRequest({
      surveyNumber: item.surveyNumber,
      ownerName: item.ownerName,
      village: item.village,
      district: item.district,
      state: item.state,
      pincode: item.pincode,
      area: item.area,
      reason: item.reason,
      ownershipProof: item.ownershipProof,
      landRecord: item.landRecord,
      identityProof: item.identityProof,
    })
    setEditingRequestId(item.id)
    setRequestSubmitted(false)
    setShowRequestForm(true)
    setProjectOpened(false)
  }

  useEffect(() => {
    if (isRegistrationFormRoute && !isLandownerRole(currentRole)) {
      navigate('/dashboard', { replace: true })
      return
    }
    const editRequestId = registrationEditId ?? searchParams.get('editRequestId')
    if (editRequestId) {
      const correctable = requests.find((item) => item.id === editRequestId && canCorrectRegistrationRequest(item))
      if (correctable) editCorrectableRequest(correctable)
      else if (livaProjectsLoaded) setShowRequestForm(false)
    } else if (searchParams.has('startRegistration')) {
      setShowRequestForm(true)
      setLandFound(false)
    }
  }, [searchParams, requests, registrationEditId, livaProjectsLoaded, isRegistrationFormRoute, currentRole, navigate])

  useEffect(() => {
    if (location.pathname === '/landowner/requests/new') {
      setShowRequestForm(true)
      setRequestSubmitted(false)
      setRequestSubmission(null)
      setEditingRequestId(null)
      setRequest({
        surveyNumber: '', ownerName: '', village: '', district: '', state: 'Maharashtra',
        pincode: '', area: '', reason: '', ownershipProof: null, landRecord: null, identityProof: null,
      })
    }
  }, [location.pathname])

  async function updateRequestDocumentVerification(
    id: string,
    key: RegistrationDocumentKey,
    verified: boolean,
  ) {
    try {
      const savedRecord = await syncLivaRecord<Record<string, any>>(
        `/api/liva/registration-requests/${encodeURIComponent(id)}`,
        { documentVerification: { [key]: verified } },
      )
      const updatedRequest = registrationFromApi(savedRecord)
      setRequests((previous) =>
        previous.map((item) => item.id === id ? updatedRequest : item),
      )
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : 'Document status could not be saved.',
        'error',
      )
    }
  }

  async function updateGrievanceStatus(
    id: string,
    status: GrievanceStatus,
    officerRemark: string,
    officerReport?: OfficerProjectReport,
  ) {
    try {
      const savedRecord = await syncLivaRecord<Record<string, any>>(
        `/api/liva/grievances/${encodeURIComponent(id)}`,
        {
          status: status === 'verified' ? 'PROBLEM_VERIFIED' : 'RETURNED',
          officerRemark,
          ...(officerReport ? { officerReport } : {}),
        },
      )
      const updatedGrievance = grievanceFromApi(savedRecord)
      setGrievances((previous) =>
        previous.map((item) => item.id === id ? updatedGrievance : item),
      )

      showFlash(
        status === 'verified'
          ? 'Grievance verified successfully.'
          : 'Grievance returned for clarification.',
        status === 'verified' ? 'success' : 'warning',
      )
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : 'Grievance update failed.',
        'error',
      )
    }
  }

  async function beginGrievanceVerification(id: string) {
    try {
      const savedRecord = await syncLivaRecord<Record<string, any>>(
        `/api/liva/grievances/${encodeURIComponent(id)}`,
        { status: 'UNDER_VERIFICATION' },
      )
      const updatedGrievance = grievanceFromApi(savedRecord)
      setGrievances((previous) =>
        previous.map((item) => item.id === id ? updatedGrievance : item),
      )
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : 'Grievance status update failed.',
        'error',
      )
    }
  }

  function updateRequestField(
    field: keyof RegistrationForm,
    value: string,
  ) {
    setRequest((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

function handleDocumentUpload(
  field:
    | 'ownershipProof'
    | 'landRecord'
    | 'identityProof',
  event: ChangeEvent<HTMLInputElement>,
) {
  const file = event.target.files?.[0]

  if (!file) {
    return
  }

  setRequest((previous) => ({
    ...previous,
    [field]: file,
  }))
}

if ((isLandownerRole(currentRole) || officerProjectManagement) && routeProjectId && !grievanceProjectId) {
  return (
    <LandownerProjectWorkspace
      viewerRole={officerProjectManagement ? 'officer' : 'landowner'}
      initialProjectId={routeProjectId}
      projectsLoaded={livaProjectsLoaded}
      projects={livaProjects
        .filter((project): project is LandRecord & { projectId: string } => Boolean(project.projectId))
        .map((project) => ({
          projectId: project.projectId,
          projectName: project.project,
          surveyNumber: project.surveyNumber,
          village: project.village,
          taluka: project.taluka,
          district: project.district,
          state: project.state,
          pincode: project.pincode,
          owner: project.owner,
          area: project.area,
          status: project.status,
          progress: project.progress,
        }))}
      grievances={grievances}
      loadError={dataLoadError}
      activeTab={workspaceTabFromPath(routeProjectTab)}
      onBackToSearch={() => {
        setProjectOpened(false)
        setShowGrievance(false)
        navigate(projectBasePath)
      }}
      onTabChange={(tab, projectId) => navigate(
        `${projectBasePath}/${encodeURIComponent(projectId)}/${workspaceTabPath(tab)}`,
      )}
      onProjectChange={(projectId) => navigate(
        `${projectBasePath}/${encodeURIComponent(projectId)}/${workspaceTabPath(workspaceTabFromPath(routeProjectTab))}`,
      )}
      onOpenGrievanceForm={(projectId) => {
        const project = livaProjects.find((item) => item.projectId === projectId)
        if (!project) return
        setSelectedLand(project)
        setGrievance({
          applicantName: '',
          mobile: '',
          type: '',
          description: '',
          supportingDocuments: [],
        })
        setGrievanceSubmitted(false)
        setShowGrievance(true)
        navigate(`/dashboard?grievanceProjectId=${encodeURIComponent(projectId)}`)
      }}
    />
  )
}

  const landownerProjectList = livaProjects.filter((item) => Boolean(item.projectId))
  const isLandownerHomeRoute = isLandownerRole(currentRole)
    && location.pathname === '/dashboard'
    && !searchParams.has('editRequestId')
    && !searchParams.has('startRegistration')
    && !grievanceProjectId
  if ((isLandownerRole(currentRole) || officerProjectManagement) && location.pathname === projectBasePath) {
    const query = searchValue.trim().toLowerCase()
    const visibleProjects = landownerProjectList.filter((item) =>
      [item.projectId, item.project, item.surveyNumber, item.village, item.taluka, item.district]
        .join(' ').toLowerCase().includes(query),
    )
    return (
      <main className="liva-dashboard landowner-route-page">
        <section className="page-heading"><div><div className="eyebrow">{officerProjectManagement ? 'OFFICER WORKSPACE' : 'LANDOWNER WORKSPACE'}</div><h1>{officerProjectManagement ? 'Project Management' : 'My Land / Projects'}</h1><p>Search available projects and open a project workspace to view details.</p></div></section>
        {officerProjectManagement && <div className="officer-project-map-action">
          <button type="button" className="primary-btn" aria-expanded={projectView === 'map'} aria-controls="officer-project-map" onClick={() => setProjectView(projectView === 'map' ? 'list' : 'map')}><MapPin size={16} />Map</button>
          <p>View project locations on the map. Select a marker to open project details.</p>
        </div>}
        {officerProjectManagement && projectView === 'map' ? <div id="officer-project-map" className="officer-project-map"><button type="button" className="text-btn" onClick={() => setProjectView('list')}>Back to projects</button><GisWorkspace livaOnly /></div> : <section className="workspace-card landowner-route-card">
          <label className="landowner-project-search"><Search size={18} /><input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search by survey number or location" aria-label="Search by survey number or location" /></label>
          {dataLoadError && <p className="landowner-route-notice">{dataLoadError}</p>}
          {!livaProjectsLoaded ? <p>Loading your projects…</p> : visibleProjects.length ? <div className="landowner-project-list">{visibleProjects.map((item) => <article className="landowner-project-list-card" key={item.projectId}>
            <div><span className="eyebrow">{item.projectId}</span><h2>{item.project}</h2><p>{[item.village, item.taluka, item.district].filter(Boolean).join(' · ')}</p></div>
            <dl><div><dt>Survey Number</dt><dd>{item.surveyNumber || 'Not available'}</dd></div><div><dt>Proposed Area</dt><dd>{item.area || 'Not available'}</dd></div><div><dt>Status</dt><dd>{item.status || 'Not available'}</dd></div></dl>
            <div className="landowner-project-actions">
              <button className="primary-btn" type="button" onClick={() => officerProjectManagement ? navigate(`${projectBasePath}/${encodeURIComponent(item.projectId!)}/overview`) : openProject(item)}>Open Project <ArrowRight size={16} /></button>
              {currentRole === 'admin' && <button
                className="landowner-project-delete"
                type="button"
                disabled={deletingProjectId === item.projectId}
                onClick={() => void deleteLivaProject(item)}
              >
                <Trash2 size={15} />
                {deletingProjectId === item.projectId ? 'Deleting…' : 'Delete project'}
              </button>}
            </div>
          </article>)}</div> : <div className="landowner-project-empty"><h2>{query ? 'No matching project found' : 'No registered projects found'}</h2><p>Try another project, survey number or location.</p>{currentRole === 'landowner' && <button className="primary-btn" type="button" onClick={() => navigate('/landowner/requests/new')}>Register / Request Land</button>}</div>}
        </section>}
      </main>
    )
  }
  if (isLandownerRole(currentRole) && location.pathname === '/landowner/requests') {
    return (
      <main className="liva-dashboard landowner-route-page">
        <section className="page-heading"><div><div className="eyebrow">LANDOWNER WORKSPACE</div><h1>My Requests</h1><p>Manage your land registration requests and continue returned corrections.</p></div><button className="primary-btn" type="button" onClick={() => navigate('/landowner/requests/new')}>New Registration Request</button></section>
        <section className="workspace-card landowner-route-card">
          {dataLoadError && <div className="landowner-route-notice" role="alert">{dataLoadError}</div>}
          {requests.length ? <div className="landowner-project-list">{requests.map((item) => <article className="landowner-project-list-card" key={item.id}>
            <div><span className="eyebrow">{item.id}</span><h2>Survey {item.surveyNumber}</h2><p>{[item.village, item.district].filter(Boolean).join(' · ')}</p></div>
            <dl><div><dt>Status</dt><dd>{landownerRequestStatusLabel(item.status)}</dd></div><div><dt>Project</dt><dd>{item.livaProjectId || 'Awaiting approval'}</dd></div><div><dt>Submitted</dt><dd>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Not available'}</dd></div></dl>
            {canCorrectRegistrationRequest(item) && <button className="primary-btn" type="button" onClick={() => navigate(`/landowner/requests/${encodeURIComponent(item.id)}/edit`)}>Edit &amp; Resubmit</button>}
          </article>)}</div> : <div className="landowner-project-empty"><h2>No requests yet</h2><p>Registration requests submitted for your land will appear here.</p><button className="primary-btn" type="button" onClick={() => navigate('/landowner/requests/new')}>Start a Registration Request</button></div>}
        </section>
      </main>
    )
  }
  if (isLandownerRole(currentRole) && location.pathname.startsWith('/landowner/tracking')) {
    return (
      <main className="liva-dashboard landowner-route-page">
        <section className="page-heading"><div><div className="eyebrow">LANDOWNER WORKSPACE</div><h1>Tracking</h1><p>Follow registration requests and grievances submitted through LIVA.</p></div></section>
        <nav className="landowner-tracking-tabs" aria-label="Tracking categories">
          <button type="button" className={trackingTab === 'requests' ? 'active' : ''} onClick={() => setTrackingTab('requests')}>Registration Requests <span>{requests.length}</span></button>
          <button type="button" className={trackingTab === 'grievances' ? 'active' : ''} onClick={() => setTrackingTab('grievances')}>Grievances <span>{grievances.length}</span></button>
        </nav>
        {dataLoadError && <div className="landowner-route-notice" role="alert">{dataLoadError}</div>}
        {trackingTab === 'requests' ? (
          <section className="landowner-tracking-list" aria-label="Registration request tracking">
            {requests.length ? requests.map((item) => <article className="workspace-card landowner-tracking-card" key={item.id}>
              <div className="landowner-tracking-card__heading"><div><span className="eyebrow">REQUEST ID</span><h2>{item.id}</h2></div><span className={`landowner-tracking-status landowner-tracking-status--${item.status}`}>{landownerRequestStatusLabel(item.status)}</span></div>
              <dl><div><dt>Survey Number</dt><dd>{item.surveyNumber}</dd></div><div><dt>Village</dt><dd>{item.village || 'Not available'}</dd></div><div><dt>Project</dt><dd>{item.livaProjectId || 'Not created yet'}</dd></div><div><dt>Submitted</dt><dd>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Not available'}</dd></div><div><dt>Current stage</dt><dd>{requestCurrentStage(item)}</dd></div></dl>
              <RegistrationTimeline request={item} />
              {canCorrectRegistrationRequest(item) && <button type="button" className="primary-btn landowner-tracking-edit" onClick={() => navigate(`/landowner/requests/${encodeURIComponent(item.id)}/edit`)}>Edit &amp; Resubmit</button>}
            </article>) : <section className="workspace-card landowner-tracking-empty"><h2>No registration requests yet</h2><p>New registration requests and their progress will appear here.</p><button className="primary-btn" type="button" onClick={() => navigate('/landowner/requests/new')}>New Registration Request</button></section>}
          </section>
        ) : (
          <section className="landowner-tracking-list" aria-label="Grievance tracking">
            {grievances.length ? grievances.map((item) => <article className="workspace-card landowner-tracking-card" key={item.id}>
              <div className="landowner-tracking-card__heading"><div><span className="eyebrow">GRIEVANCE ID</span><h2>{item.id}</h2></div><span className={`landowner-tracking-status landowner-tracking-status--${item.status}`}>{grievanceStatusLabel(item.status)}</span></div>
              <dl><div><dt>Project ID</dt><dd>{item.projectId || 'Not linked'}</dd></div><div><dt>Issue / problem type</dt><dd>{item.type || 'Not available'}</dd></div><div><dt>Survey Number</dt><dd>{item.surveyNumber || 'Not available'}</dd></div><div><dt>Submitted</dt><dd>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Not available'}</dd></div><div><dt>Current stage</dt><dd>{grievanceCurrentStage(item.status)}</dd></div></dl>
              <GrievanceTimeline grievance={item} />
              {item.status === 'returned' && item.projectId && <button
                type="button"
                className="primary-btn landowner-tracking-edit"
                onClick={() => {
                  setGrievance({ applicantName: '', mobile: '', type: '', description: '', supportingDocuments: [] })
                  setGrievanceSubmitted(false)
                  setShowGrievance(true)
                  navigate(`/dashboard?grievanceProjectId=${encodeURIComponent(item.projectId!)}`)
                }}
              >Open Grievance Form</button>}
            </article>) : <section className="workspace-card landowner-tracking-empty"><h2>No grievances yet</h2><p>Grievances submitted from a project workspace will appear here.</p></section>}
          </section>
        )}
      </main>
    )
  }
  if (isLandownerRole(currentRole) && registrationEditId && livaProjectsLoaded && !requests.some((item) => item.id === registrationEditId && canCorrectRegistrationRequest(item))) {
    return <main className="liva-dashboard landowner-route-page"><section className="workspace-card"><h1>Request not available for correction</h1><p>This request is unavailable or is no longer waiting for correction.</p><button type="button" className="primary-btn" onClick={() => navigate('/landowner/requests')}>Back to My Requests</button></section></main>
  }
  if (isLandownerHomeRoute) {
    const previewProjects = [...landownerProjectList]
      .sort((left, right) => (left.projectId ?? '').localeCompare(right.projectId ?? '', undefined, { numeric: true }))
      .slice(0, 3)
    const recentEntries = [
      ...requests.map((item) => ({ key: `request-${item.id}`, label: `Registration request ${item.id}`, status: getStatusLabel(item.status), date: item.submittedAt })),
      ...grievances.map((item) => ({ key: `grievance-${item.id}`, label: `Grievance ${item.id}`, status: getStatusLabel(item.status), date: item.submittedAt })),
    ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 5)
    return (
      <main className="liva-dashboard landowner-route-page">
        <section className="page-heading"><div><div className="eyebrow">LANDOWNER WORKSPACE</div><h1>Welcome to LIVA</h1><p>Your land, projects, and requests at a glance.</p></div></section>
        <section className="landowner-overview-counts" aria-label="Dashboard statistics">
          <article><span>AVAILABLE LAND</span><strong>20</strong></article>
          <article><span>PROJECTS</span><strong>20</strong></article>
          <article><span>MY REQUESTS</span><strong>2</strong></article>
        </section>
        <section className="workspace-card landowner-route-card landowner-available-projects">
          <div className="landowner-section-heading"><div><div className="eyebrow">LANDOWNER PROJECTS</div><h2>Available Projects</h2><p>Open a project to view its workspace and current information.</p></div></div>
          {!livaProjectsLoaded ? <p>Loading available projects…</p> : previewProjects.length ? <div className="landowner-preview-list">
            {previewProjects.map((project) => (
              <article className="landowner-preview-row" key={project.projectId}>
                <div className="landowner-preview-id"><span>PROJECT ID</span><strong>{project.projectId}</strong></div>
                <div><span>VILLAGE</span><strong>{project.village || 'Not available'}</strong></div>
                <div><span>SURVEY</span><strong>{project.surveyNumber || 'Not available'}</strong></div>
                <div><span>DISTRICT</span><strong>{project.district || 'Not available'}</strong></div>
                <span className="landowner-project-status-badge">{(project.status || 'Not available').replaceAll('_', ' ')}</span>
                <button type="button" className="secondary-btn" onClick={() => openProject(project)}>Open Project <ArrowRight size={15} /></button>
              </article>
            ))}
          </div> : <p>No projects are available right now.</p>}
          <button className="landowner-view-all" type="button" onClick={() => navigate('/landowner/projects')}>View All Projects <ArrowRight size={16} /></button>
        </section>
        <section className="workspace-card landowner-route-card"><div className="eyebrow">RECENT ACTIVITY</div><h2>Recent Activity</h2>{recentEntries.length ? <ul className="landowner-activity-list">{recentEntries.map((item) => <li key={item.key}><span>{item.label}</span><strong>{item.status}</strong></li>)}</ul> : <p>No recent requests or grievances are available.</p>}<button className="text-btn" type="button" onClick={() => navigate('/landowner/requests')}>View My Requests</button></section>
      </main>
    )
  }

  return (
    <div className={`liva-dashboard${isRegistrationFormRoute ? ' landowner-registration-form-page' : ''}`}>
      {flashMessage && (
        <div
          className={`flash-message ${flashMessage.type}`}
          role="status"
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 320,
            maxWidth: 460,
            padding: '14px 16px',
            borderRadius: 12,
            background: '#ffffff',
            color: '#1f2b3a',
            border: '1px solid rgba(31, 43, 58, 0.12)',
            boxShadow: '0 14px 36px rgba(31, 43, 58, 0.16)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <div>
            {flashMessage.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : flashMessage.type === 'warning' ? (
              <AlertCircle size={18} />
            ) : (
              <XCircle size={18} />
            )}
          </div>

          <span style={{ flex: 1, lineHeight: 1.45 }}>
            {flashMessage.message}
          </span>

          <button
            type="button"
            onClick={() => setFlashMessage(null)}
            aria-label="Close notification"
            style={{
              border: 0,
              background: 'transparent',
              padding: 4,
              cursor: 'pointer',
              color: '#5b7089',
            }}
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

     
      {/* PAGE HEADER */}
{!grievanceProjectId && !isRegistrationFormRoute && <section className="page-heading">
  <div>
    <div className="eyebrow">
      <ShieldCheck size={15} />
      LIVA WORKSPACE
    </div>

    <h2>
      {currentRole === 'landowner'
        ? 'Landowner Dashboard'
        : currentRole === 'officer'
          ? officerPage === 'grievances' ? 'Grievance / Problem Verification' : 'Registration Requests'
          : isAdminApprovalPage ? 'Administrative Approval' : 'Administration & Project Control'}
    </h2>

    <p>
      {currentRole === 'landowner'
        ? 'Find your land, access registered projects, or submit a registration request when your land is not found.'
        : currentRole === 'officer'
          ? officerPage === 'grievances'
            ? 'Review landowner grievances, record field findings and verify project problems.'
            : 'Verify land registration requests and supporting documents before administrative approval.'
          : isAdminApprovalPage
            ? 'Review officer-verified requests and approve or reject land registration.'
            : 'Review project activity, officer findings and administrative workflow.'}
    </p>
  </div>
</section>}
      {/* LANDOWNER */}

      {currentRole === 'landowner' && (
        <>
          {!grievanceProjectId && <>
          {!isRegistrationFormRoute && <>
            <LandownerJourney
      landFound={landFound}
      projectOpened={projectOpened}
      showRequestForm={showRequestForm}
      requestSubmitted={requestSubmitted}
      showGrievance={showGrievance}
      grievanceSubmitted={grievanceSubmitted}
      requestStatus={activeRequest?.status}
    />

          {dataLoadError && (
            <section className="workspace-card">
              <div className="not-found-note">
                <AlertCircle size={18} />
                <div>
                  <strong>Unable to load saved LIVA records</strong>
                  <p>{dataLoadError}</p>
                </div>
              </div>
            </section>
          )}
          {/* SEARCH */}

          <section className="workspace-card search-card">
            <div className="section-icon">
              <Search size={21} />
            </div>

            <div className="section-content">
              <div className="section-title-row">
                <div>
                  <h3>Find Land</h3>

                  <p>
                    Search using survey number,
                    village or project name.
                  </p>
                </div>

                <span className="step-badge">
                  STEP 1
                </span>
              </div>

              <form
                className="land-search"
                onSubmit={handleSearch}
              >
                <div className="search-input-wrap">
                  <Search size={18} />

                  <input
                    value={searchValue}
                    onChange={(event) =>
                      setSearchValue(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 112/2C or Nirmalwadi"
                  />
                </div>

                <button
                  type="submit"
                  className="primary-btn"
                >
                  Search Land
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="search-hint">
                Demo searches:
                <strong>
                  {' '}
                  112/2C
                </strong>
                {' · '}
                <strong>204/1A</strong>
                {' · '}
                <strong>721/8</strong>
              </div>
            </div>
          </section>

          <section className="workspace-card">
            <div className="section-title-row">
              <div>
                <h3>Registered Land &amp; Projects</h3>
                <p>
                  Browse registered demo parcels and their linked projects.
                </p>
              </div>

              <span className="count-badge">
                {registeredLands.length} Projects
              </span>
            </div>

            <div className="request-table registered-projects-table">
              <div className="table-head">
                <span>Project Name</span>
                <span>Survey Number</span>
                <span>Village</span>
                <span>District</span>
                <span>Area</span>
                <span>Action</span>
              </div>

              {registeredLands.map((land) => (
                <div className="table-row" key={land.surveyNumber}>
                  <div>
                    <strong>{land.project}</strong>
                  </div>

                  <div>{land.surveyNumber}</div>
                  <div>{land.village}</div>
                  <div>{land.district}</div>
                  <div>{land.area}</div>

                  <div>
                    <button
                      type="button"
                      className="small-btn success-btn"
                      onClick={() => openProject(land)}
                    >
                      <FolderOpen size={14} />
                      View Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* LAND FOUND */}

          {landFound === true && (
            <section className="result-card">
              <div className="result-header">
                <div className="result-icon success">
                  <CheckCircle2 size={24} />
                </div>

                <div>
                  <span className="result-label">
                    LAND FOUND
                  </span>

                  <h3>
                    Land is already registered
                    in LIVA
                  </h3>

                  <p>
                    The land is linked with an
                    existing acquisition project.
                  </p>
                </div>

                <span className="status-pill registered">
                  Registered
                </span>
              </div>

              <div className="land-details-grid">
                <InfoItem
                  label="Survey Number"
                  value={
                    selectedLand?.surveyNumber ?? '—'
                  }
                />

                <InfoItem
                  label="Village"
                  value={selectedLand?.village ?? '—'}
                />

                <InfoItem
                  label="District"
                  value={selectedLand?.district ?? '—'}
                />

                <InfoItem
                  label="State"
                  value={selectedLand?.state ?? '—'}
                />

                <InfoItem
                  label="Area"
                  value={selectedLand?.area ?? '—'}
                />

                <InfoItem
                  label="Project"
                  value={selectedLand?.project ?? '—'}
                />
              </div>

              <div className="result-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => openProject(selectedLand)}
                >
                  <FolderOpen size={16} />
                  Continue to Project
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>
          )}

          {/* EXISTING PROJECT */}

          {projectOpened && (
            <section className="workspace-card project-access-card">
              <div className="section-title-row">
                <div>
                  <div className="eyebrow">
                    <FolderOpen size={14} />
                    PROJECT ACCESS
                  </div>

                  <h3>
                    {selectedLand?.project ?? 'Selected Project'}
                  </h3>

                  <p>
                    Current project information
                    for your registered land.
                  </p>
                </div>

                <span className="status-pill registered">
                  Active Project
                </span>
              </div>

              <div className="land-details-grid">
                <InfoItem
                  label="Survey Number"
                  value={
                    selectedLand?.surveyNumber ?? '—'
                  }
                />

                <InfoItem
                  label="Acquisition Area"
                  value={selectedLand?.area ?? '—'}
                />

                <InfoItem
                  label="Project Location"
                  value={`${selectedLand?.village ?? '—'}, ${selectedLand?.district ?? '—'}`}
                />

                <InfoItem
                  label="Registration Status"
                  value="Verified"
                />

                <InfoItem
                  label="Problem Status"
                  value="No active submission"
                />

                <InfoItem
                  label="Project Access"
                  value="Landowner Access"
                />
              </div>

              <div className="not-found-note">
                <ShieldCheck size={18} />

                <div>
                  <strong>
                    Your land is connected to
                    this project.
                  </strong>

                  <p>
                    You can submit a problem or
                    grievance related to this land.
                    The submission will go to the
                    Officer for verification.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={() =>
                  setShowGrievance(true)
                }
              >
                <AlertCircle size={16} />
                Submit Problem / Grievance
              </button>
            </section>
          )}

          {/* LAND NOT FOUND */}

          {landFound === false && !showRequestForm && (
            <section className="result-card not-found-card">
              <div className="result-header">
                <div className="result-icon warning">
                  <AlertCircle size={24} />
                </div>

                <div>
                  <span className="result-label">
                    LAND NOT FOUND
                  </span>

                  <h3>
                    This land is not registered
                    in LIVA
                  </h3>

                  <p>
                    No matching registered land
                    record was found.
                  </p>
                </div>
              </div>

              <div className="not-found-note">
                <FileText size={18} />

                <div>
                  <strong>
                    You can submit a request.
                  </strong>

                  <p>
                    Enter your land details,
                    ownership information and
                    supporting documents. The
                    request will first go to the
                    Officer for verification and
                    then to the Admin for approval.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={openRequestForm}
              >
                <FileText size={16} />
                Register / Request This Land
              </button>
            </section>
          )}
          </>}

          {/* REGISTRATION REQUEST */}

          {showRequestForm && (
            <section className="workspace-card form-card">
              <div className="section-title-row">
                <div>
                  <div className="eyebrow">
                    <FileText size={14} />
                    REGISTRATION REQUEST
                  </div>

                  <h3>
                    {editingRequestId ? 'Edit Returned Registration Request' : 'Land Registration Request'}
                  </h3>

                  <p>
                    {editingRequestId
                      ? `Correct the returned details and resubmit request ${editingRequestId}.`
                      : 'Submit your land details and supporting proof.'}
                  </p>
                </div>

                <span className="status-pill pending">
                  Officer Verification
                </span>
                {isRegistrationFormRoute && <button type="button" className="secondary-btn" onClick={() => navigate('/landowner/requests')}>Back to My Requests</button>}
              </div>

              {requestSubmitted ? (
                <>
                  <RequestSubmittedCard
                    requestId={requestSubmission?.id ?? ''}
                    status={requestSubmission?.status ?? 'submitted'}
                  />
                  {isRegistrationFormRoute && <button type="button" className="primary-btn" onClick={() => navigate('/landowner/requests')}>View My Requests</button>}
                </>
              ) : (
                <form
                  onSubmit={
                    handleRequestSubmit
                  }
                >
                  <div className="form-grid">
                    <FormField
                      label="Survey Number"
                      required
                      value={
                        request.surveyNumber
                      }
                      onChange={(value) =>
                        updateRequestField(
                          'surveyNumber',
                          value,
                        )
                      }
                      placeholder="e.g. 972/5"
                    />

                    <FormField
                      label="Owner Name"
                      required
                      value={
                        request.ownerName
                      }
                      onChange={(value) =>
                        updateRequestField(
                          'ownerName',
                          value,
                        )
                      }
                      placeholder="Landowner name"
                    />

                    <FormField
                      label="Village"
                      required
                      value={request.village}
                      onChange={(value) =>
                        updateRequestField(
                          'village',
                          value,
                        )
                      }
                    />

                    <FormField
                      label="District"
                      required
                      value={
                        request.district
                      }
                      onChange={(value) =>
                        updateRequestField(
                          'district',
                          value,
                        )
                      }
                    />

                    <FormField
                      label="State"
                      required
                      value={request.state}
                      onChange={(value) =>
                        updateRequestField(
                          'state',
                          value,
                        )
                      }
                    />

                    <FormField
                      label="Pincode"
                      required
                      value={
                        request.pincode
                      }
                      onChange={(value) =>
                        updateRequestField(
                          'pincode',
                          value,
                        )
                      }
                    />

                    <FormField
                      label="Land Area"
                      required
                      value={request.area}
                      onChange={(value) =>
                        updateRequestField(
                          'area',
                          value,
                        )
                      }
                      placeholder="e.g. 1.20 hectares"
                    />

                    <div className="form-field full">
                      <label>
                        Reason for Registration
                        <span>*</span>
                      </label>

                      <textarea
                        required
                        rows={4}
                        value={
                          request.reason
                        }
                        onChange={(event) =>
                          setRequest(
                            (previous) => ({
                              ...previous,
                              reason:
                                event.target
                                  .value,
                            }),
                          )
                        }
                        placeholder="Explain why this land should be added to LIVA..."
                      />
                    </div>

                    <div className="form-field full">
                      <label>
                        Supporting Documents
                        <span>*</span>
                      </label>

                      <div className="document-upload-grid">
                        <label className="document-upload-box">
                          <FileText size={20} />

                          <div>
                            <strong>
                              Ownership Proof *
                            </strong>

                            <span>
                              Upload valid ownership document
                            </span>

                            {request.ownershipProof && (
                              <small>
                                {registrationDocumentName(request.ownershipProof)}
                              </small>
                            )}
                          </div>

                          <input
                            type="file"
                            required={!request.ownershipProof}
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(event) =>
                              handleDocumentUpload(
                                'ownershipProof',
                                event,
                              )
                            }
                          />
                        </label>

                        <label className="document-upload-box">
                          <FileText size={20} />

                          <div>
                            <strong>
                              7/12 Extract / Land Record *
                            </strong>

                            <span>
                              Upload latest land record
                            </span>

                            {request.landRecord && (
                              <small>
                                {registrationDocumentName(request.landRecord)}
                              </small>
                            )}
                          </div>

                          <input
                            type="file"
                            required={!request.landRecord}
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(event) =>
                              handleDocumentUpload(
                                'landRecord',
                                event,
                              )
                            }
                          />
                        </label>

                        <label className="document-upload-box">
                          <ShieldCheck size={20} />

                          <div>
                            <strong>
                              Identity Proof *
                            </strong>

                            <span>
                              Upload applicant identity document
                            </span>

                            {request.identityProof && (
                              <small>
                                {registrationDocumentName(request.identityProof)}
                              </small>
                            )}
                          </div>

                          <input
                            type="file"
                            required={!request.identityProof}
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(event) =>
                              handleDocumentUpload(
                                'identityProof',
                                event,
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>

                  </div>

                  <div className="form-footer">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => isRegistrationFormRoute
                        ? navigate('/landowner/requests')
                        : (setShowRequestForm(false), setEditingRequestId(null))}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={submittingRequest}
                    >
                      {submittingRequest
                        ? editingRequestId ? 'Resubmitting Request...' : 'Submitting Registration Request...'
                        : editingRequestId ? 'Edit & Resubmit' : 'Submit Registration Request'}
                      <ArrowRight
                        size={16}
                      />
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* REQUEST TRACKING */}

          {!isRegistrationFormRoute && <div id="registration-tracking">
          {activeRequest && (
            <section className="workspace-card">
              <div className="section-title-row">
                <div>
                  <div className="eyebrow">
                    <ClipboardCheck
                      size={14}
                    />
                    REQUEST TRACKING
                  </div>

                  <h3>
                    Registration Request
                    Status
                  </h3>

                  <p>
                    Track what happens after
                    submission.
                  </p>
                </div>

                <span className="request-id">
                  {activeRequest.id}
                </span>
              </div>

              <div className="land-details-grid">
                <InfoItem label="Survey Number" value={activeRequest.surveyNumber} />
                <InfoItem label="Status" value={activeRequest.status === 'returned' ? 'Returned for Correction' : getStatusLabel(activeRequest.status)} />
                <InfoItem
                  label="Project"
                  value={activeRequest.livaProjectId ?? 'Waiting for Admin approval'}
                />
              </div>

              {(activeRequest.officerRemark || activeRequest.adminRemark) && (
                <div className="admin-flow-note">
                  <ShieldCheck size={18} />
                  <div>
                    {activeRequest.officerRemark && (
                      <p>Officer remark: {activeRequest.officerRemark}</p>
                    )}
                    {activeRequest.adminRemark && (
                      <p>Admin remark: {activeRequest.adminRemark}</p>
                    )}
                  </div>
                </div>
              )}
              {canCorrectRegistrationRequest(activeRequest) && !showRequestForm && (
  <div className="admin-flow-note">
    <AlertCircle size={18} />

    <div>
      <strong>Returned for Correction</strong>

      <p>
        Your registration request was returned for correction.
      </p>

      {activeRequest.officerRemark && (
        <p>
          <strong>Officer remark:</strong>{' '}
          {activeRequest.officerRemark}
        </p>
      )}

      <button
        type="button"
        className="primary-btn"
        onClick={() => editCorrectableRequest(activeRequest)}
      >
        <ArrowRight size={16} />
        Edit &amp; Resubmit
      </button>
    </div>
  </div>
)}

              <div className="tracking-timeline">
                <TrackingStep
                  label="Submitted"
                  active
                />

                <TrackingStep
                  label="Officer Verification"
                  active={
                    activeRequest.status ===
                      'under-verification' ||
                    activeRequest.status ===
                      'returned' ||
                    activeRequest.status ===
                      'verified' ||
                    activeRequest.status ===
                      'approved'
                  }
                />

                <TrackingStep
                  label="Admin Approval"
                  active={
                    activeRequest.status === 'approved' ||
                    activeRequest.status === 'rejected'
                  }
                />

                <TrackingStep
                  label="Project Created"
                  active={Boolean(activeRequest.livaProjectId)}
                />
              </div>
            </section>
          )}
          {!activeRequest && (
            <section className="workspace-card">
              <div className="eyebrow"><ClipboardCheck size={14} /> REQUEST TRACKING</div>
              <h3>My Registration Requests</h3>
              <p>No registration request is linked to this browser session yet.</p>
            </section>
          )}
          </div>}

          {!isRegistrationFormRoute && activeGrievance && (
            <section className="workspace-card">
              <div className="section-title-row">
                <div>
                  <div className="eyebrow">
                    <AlertCircle size={14} /> GRIEVANCE TRACKING
                  </div>
                  <h3>Problem / Grievance Status</h3>
                  <p>
                    {activeGrievance.id}
                    {' · '}{activeGrievance.project}
                  </p>
                </div>
                <span className={`status-pill ${activeGrievance.status === 'verified' ? 'verified' : activeGrievance.status === 'returned' ? 'returned' : 'pending'}`}>
                  {activeGrievance.status === 'verified'
                    ? 'Problem Verified'
                    : activeGrievance.status === 'returned'
                      ? 'Returned / Clarification Required'
                      : activeGrievance.status === 'under-verification'
                        ? 'Under Verification'
                        : 'Problem Submitted'}
                </span>
              </div>
              {activeGrievance.officerRemark && (
                <div className="admin-flow-note">
                  <AlertCircle size={18} />
                  <div>
                    <strong>Officer remark</strong>
                    <p>{activeGrievance.officerRemark}</p>
                  </div>
                </div>
              )}
              {activeGrievance.status === 'verified' && (
                <div className="admin-flow-note">
                  <ShieldCheck size={18} />
                  <div>
                    <strong>Risk Assessment</strong>
                    <p>Verified information has been sent to the Risk Engine.</p>
                  </div>
                </div>
              )}
            </section>
          )}
          </>}

          {/* GRIEVANCE */}

          {showGrievance && !selectedLand && (
            <section className="workspace-card" role="status">
              <p>Loading the selected project and grievance form…</p>
            </section>
          )}

          {showGrievance && selectedLand && (
            <section className="workspace-card form-card landowner-grievance-form-page">
              <button
                type="button"
                className="secondary-btn grievance-back-button"
                onClick={() => selectedLand?.projectId && navigate(
                  `/landowner/projects/${encodeURIComponent(selectedLand.projectId)}/grievances`,
                )}
              >
                Back to Project Grievances
              </button>
              <div className="section-title-row">
                <div>
                  <div className="eyebrow">
                    <AlertCircle size={14} />
                    {selectedLand.projectId} · {selectedLand.village} · Survey {selectedLand.surveyNumber}
                  </div>

                  <h3>
                    Problem / Grievance
                  </h3>

                  <p>
                    Submit a problem affecting
                    your land.
                  </p>
                </div>

                <span className="status-pill pending">
                  Officer Verification
                </span>
              </div>

              {grievanceSubmitted ? (
                <div className="success-box">
                  <CheckCircle2 size={24} />

                  <div>
                    <strong>
                      Problem submitted
                      successfully
                    </strong>

                    <p>
                      Your problem is now waiting
                      for Officer verification.
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={
                    handleGrievanceSubmit
                  }
                >
                  <div className="form-grid">
                    <FormField
                      label="Applicant / Landowner Name"
                      required
                      value={grievance.applicantName}
                      onChange={(value) =>
                        setGrievance((previous) => ({
                          ...previous,
                          applicantName: value,
                        }))
                      }
                      placeholder="Enter applicant name"
                    />

                    <FormField
                      label="Mobile Number"
                      required
                      value={grievance.mobile}
                      onChange={(value) =>
                        setGrievance((previous) => ({
                          ...previous,
                          mobile: value,
                        }))
                      }
                      placeholder="Enter mobile number"
                    />

                    <div className="form-field full">
                      <label>
                        Problem Type
                        <span>*</span>
                      </label>

                      <select
                        required
                        value={
                          grievance.type
                        }
                        onChange={(event) =>
                          setGrievance(
                            (previous) => ({
                              ...previous,
                              type: event.target
                                .value,
                            }),
                          )
                        }
                      >
                        <option value="">
                          Select problem
                        </option>

                        <option value="land-dispute">
                          Land Dispute
                        </option>

                        <option value="ownership">
                          Ownership Issue
                        </option>

                        <option value="compensation">
                          Compensation Issue
                        </option>

                        <option value="document">
                          Document Issue
                        </option>

                        <option value="boundary">
                          Boundary / Area Issue
                        </option>

                        <option value="other">
                          Other
                        </option>
                      </select>
                    </div>

                    <div className="form-field full">
                      <label>
                        Describe the Problem
                        <span>*</span>
                      </label>

                      <textarea
                        required
                        rows={5}
                        value={
                          grievance.description
                        }
                        onChange={(event) =>
                          setGrievance(
                            (previous) => ({
                              ...previous,
                              description:
                                event.target
                                  .value,
                            }),
                          )
                        }
                        placeholder="Describe the issue..."
                      />
                    </div>

                    <div className="form-field full">
                      <label htmlFor="grievance-supporting-documents">
                        Supporting Documents
                      </label>

                      <div className="document-upload-box grievance-upload-box">
                        <Upload size={20} aria-hidden="true" />

                        <div>
                          <strong>
                            Upload supporting documents
                          </strong>

                          <span>
                            You can upload multiple supporting documents.
                          </span>

                          <small>
                            PDF, JPG, JPEG, PNG · Maximum 3 files
                          </small>
                        </div>

                        <span className="small-btn success-btn grievance-upload-choose">
                          Choose Files
                        </span>

                        <input
                          id="grievance-supporting-documents"
                          className="grievance-upload-input"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          aria-label="Choose supporting documents"
                          onChange={(event) => {
                            const files = Array.from(
                              event.currentTarget.files ?? [],
                            )
                            const availableSlots =
                              3 - grievance.supportingDocuments.length

                            event.currentTarget.value = ''

                            const filesToAdd = files.slice(
                              0,
                              availableSlots,
                            )

                            if (filesToAdd.length < files.length) {
                              showFlash(
                                'You can upload a maximum of 3 supporting documents.',
                                'warning',
                              )
                            }

                            if (filesToAdd.length > 0) {
                              setGrievance((previous) => ({
                                ...previous,
                                supportingDocuments: [
                                  ...previous.supportingDocuments,
                                    ...filesToAdd,
                                ],
                              }))
                            }
                          }}
                        />
                      </div>

                      {grievance.supportingDocuments.length > 0 && (
                        <div
                          className="grievance-upload-list"
                          aria-live="polite"
                        >
                          {grievance.supportingDocuments.map(
                            (file, index) => (
                              <div
                                className="grievance-upload-file"
                                key={`${file.name}-${index}`}
                              >
                                <FileText size={17} aria-hidden="true" />

                                <span title={file.name}>
                                  {file.name}
                                </span>

                                <button
                                  type="button"
                                  className="grievance-upload-remove"
                                  aria-label={`Remove ${file.name}`}
                                  title={`Remove ${file.name}`}
                                  onClick={() =>
                                    setGrievance((previous) => ({
                                      ...previous,
                                      supportingDocuments:
                                        previous.supportingDocuments.filter(
                                          (_, fileIndex) => fileIndex !== index,
                                        ),
                                    }))
                                  }
                                >
                                  <X size={16} aria-hidden="true" />
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-footer">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => selectedLand?.projectId && navigate(
                        `/landowner/projects/${encodeURIComponent(selectedLand.projectId)}/grievances`,
                      )}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={submittingGrievance}
                    >
                      {submittingGrievance
                        ? 'Submitting Problem...'
                        : 'Submit Problem'}
                      <ArrowRight
                        size={16}
                      />
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}
        </>
      )}

      {/* OFFICER */}

      {currentRole === 'officer' && (
        <OfficerDashboard
          key={officerPage}
          page={officerPage}
          requests={requests}
          grievances={grievances}
          onUpdate={updateRequestStatus}
          onUpdateDocumentVerification={
            updateRequestDocumentVerification
          }
          onUpdateGrievance={updateGrievanceStatus}
          onBeginGrievance={beginGrievanceVerification}
        />
      )}

      {/* ADMIN */}

      {currentRole === 'admin' && (
        <AdminDashboard
          requests={requests}
          grievances={grievances}
          onUpdate={updateRequestStatus}
          approvalOnly={isAdminApprovalPage}
        />
      )}
    </div>
  )
}

/* ======================================================
   WORKFLOW STEP
====================================================== */

interface WorkflowStepProps {
  number: string
  label: string
  active?: boolean
}

function WorkflowStep({
  number,
  label,
  active = false,
}: WorkflowStepProps) {
  return (
    <div
      className={`workflow-step ${
        active ? 'active' : ''
      }`}
    >
      <span>{number}</span>
      {label}
    </div>
  )
}

/* ======================================================
   INFO ITEM
====================================================== */

/* ======================================================
   FORM FIELD
====================================================== */

interface FormFieldProps {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function FormField({
  label,
  required = false,
  value,
  onChange,
  placeholder,
}: FormFieldProps) {
  return (
    <div className="form-field">
      <label>
        {label}

        {required && (
          <span> *</span>
        )}
      </label>

      <input
        required={required}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
      />
    </div>
  )
}

/* ======================================================
   TRACKING STEP
====================================================== */

interface TrackingStepProps {
  label: string
  active?: boolean
}

function TrackingStep({
  label,
  active = false,
}: TrackingStepProps) {
  return (
    <div
      className={`tracking-step ${
        active ? 'active' : ''
      }`}
    >
      <div className="tracking-dot">
        {active ? (
          <CheckCircle2 size={16} />
        ) : (
          '•'
        )}
      </div>

      <span>{label}</span>
    </div>
  )
}

/* ======================================================
   REQUEST SUBMITTED
====================================================== */

interface RequestSubmittedCardProps {
  requestId: string
  status: RequestStatus
}

function RequestSubmittedCard({
  requestId,
  status,
}: RequestSubmittedCardProps) {
  return (
    <div className="success-box">
      <CheckCircle2 size={25} />

      <div>
        <strong>
          Registration request submitted
        </strong>

        <p>
          Your request has been sent to the
          Officer for verification.
        </p>

        <p>
          Request ID:{' '}
          <strong>{requestId}</strong>
        </p>
        <p>Status: <strong>{landownerRequestStatusLabel(status)}</strong></p>
      </div>
    </div>
  )
}

/* ======================================================
   OFFICER DASHBOARD
====================================================== */

/* ======================================================
   ADMIN DASHBOARD
====================================================== */

interface AdminDashboardProps {
  requests: RegistrationRequest[]
  grievances: LandownerGrievance[]
  approvalOnly: boolean
  onUpdate: (
    id: string,
    status: RequestStatus,
    adminRemark?: string,
  ) => void
}

function AdminDashboard({
  requests,
  grievances,
  onUpdate,
  approvalOnly,
}: AdminDashboardProps) {
  const [selectedRequestId, setSelectedRequestId] =
    useState<string | null>(null)
  const [adminRemark, setAdminRemark] = useState('')
  const [projectRisks, setProjectRisks] = useState<Record<string, RiskPrediction | null>>({})

  useEffect(() => {
    let active = true
    const projectIds = [...new Set(grievances
      .filter((item) => item.projectId && item.status === 'verified' && item.officerReport)
      .map((item) => item.projectId as string))]
    if (!projectIds.length) {
      setProjectRisks({})
      return () => { active = false }
    }
    Promise.all(projectIds.map(async (projectId) => {
      try {
        return [projectId, await getLivaProjectRisk(projectId)] as const
      } catch {
        return [projectId, null] as const
      }
    })).then((entries) => {
      if (active) setProjectRisks(Object.fromEntries(entries))
    })
    return () => { active = false }
  }, [grievances])

  const verifiedRequests =
    requests.filter(
      (request) =>
        request.status === 'verified',
    )

  const approvedRequests =
    requests.filter(
      (request) =>
        request.status === 'approved',
    )

  const selectedRequest = requests.find(
    (request) => request.id === selectedRequestId,
  )

  return (
    <>
      {!approvalOnly && <>
      <section className="workflow-progress">
        <WorkflowStep
          number="1"
          label="Request Submitted"
          active
        />

        <ArrowRight size={15} />

        <WorkflowStep
          number="2"
          label="Officer Verified"
          active={
            verifiedRequests.length > 0 ||
            approvedRequests.length > 0
          }
        />

        <ArrowRight size={15} />

        <WorkflowStep
          number="3"
          label="Admin Approval"
          active={
            approvedRequests.length > 0
          }
        />

        <ArrowRight size={15} />

        <WorkflowStep
          number="4"
          label="Project Created"
          active={
            approvedRequests.length > 0
          }
        />
      </section>

      <section className="workspace-card admin-grievance-reports">
        <div className="section-title-row">
          <div><div className="eyebrow"><AlertCircle size={14} /> LANDOWNER + OFFICER CASE RECORDS</div><h3>Project problems and field reports</h3><p>Original landowner submissions, Officer findings and replies, and saved project risk assessments.</p></div>
          <span className="count-badge">{grievances.length} Cases</span>
        </div>
        {grievances.length ? <div className="admin-grievance-report-list">{grievances.map((grievance) => {
          const history = grievance.reviewHistory?.filter((entry) => entry.officerReport || entry.officerRemark.trim()) ?? []
          const displayedReports = history.length > 0
            ? history
            : (grievance.officerReport || grievance.officerRemark)
              ? [{ officerReport: grievance.officerReport, officerRemark: grievance.officerRemark, recordedAt: grievance.reviewedAt }]
              : []
          const risk = grievance.projectId ? projectRisks[grievance.projectId] : null
          return <article className="admin-grievance-report" key={grievance.id}>
            <header><div><span className="eyebrow">{grievance.id} | {grievance.projectId || 'Project not linked'}</span><h4>{grievance.project} | Survey {grievance.surveyNumber}</h4></div><span className={`status-pill ${grievance.status === 'verified' ? 'verified' : grievance.status === 'returned' ? 'returned' : 'pending'}`}>{grievanceStatusLabel(grievance.status)}</span></header>
            <div className="admin-grievance-conversation">
              <section className="admin-grievance-message admin-grievance-message--landowner">
                <div className="admin-grievance-message__heading">
                  <strong>Landowner problem</strong>
                  <span>{grievance.applicantName}</span>
                </div>
                <div className="admin-grievance-meta"><span><b>Contact</b>{grievance.mobile}</span><span><b>Problem type</b>{grievanceTypeLabel(grievance.type)}</span><span><b>Submitted</b>{grievance.submittedAt ? new Date(grievance.submittedAt).toLocaleDateString('en-IN') : 'Not available'}</span></div>
                <p className="admin-grievance-description">{grievance.description}</p>
                {grievance.supportingDocuments.length > 0 && <div className="admin-grievance-documents">
                  <h5>Landowner documents</h5>
                  <div className="admin-grievance-documents__items">{grievance.supportingDocuments.map((document, index) => typeof document === 'string' ? <span key={`${document}-${index}`}>{document}</span> : <a key={document.fileId} href={livaDocumentUrl(document.fileId)} target="_blank" rel="noreferrer"><FileText size={16} />{document.filename || `Document ${index + 1}`}</a>)}</div>
                </div>}
              </section>
              {displayedReports.length ? displayedReports.map((entry, index) => <section key={`${entry.recordedAt ?? index}-${index}`}>
                <strong>Officer response{entry.recordedAt ? ` | ${new Date(entry.recordedAt).toLocaleString()}` : ''}</strong>
                {entry.officerReport?.findings && <p><b>Ground findings:</b> {entry.officerReport.findings}</p>}
                {entry.officerReport?.rootCause && <p><b>Cause:</b> {entry.officerReport.rootCause}</p>}
                {entry.officerReport?.actionPlan && <p><b>Action / solution:</b> {entry.officerReport.actionPlan}</p>}
                {entry.officerReport?.workStatus && <p><b>Work status:</b> {entry.officerReport.workStatus.replaceAll('_', ' ')}</p>}
                {entry.officerReport?.ownershipIssueConfirmed != null && <p><b>Ownership issue:</b> {entry.officerReport.ownershipIssueConfirmed ? 'Confirmed' : 'Not confirmed'}</p>}
                {entry.officerReport?.surveyPending != null && <p><b>Survey pending:</b> {entry.officerReport.surveyPending ? 'Yes' : 'No'}</p>}
                {entry.officerReport?.compensationPending != null && <p><b>Compensation pending:</b> {entry.officerReport.compensationPending ? 'Yes' : 'No'}</p>}
                {entry.officerReport?.overdueDays != null && <p><b>Confirmed overdue days:</b> {entry.officerReport.overdueDays}</p>}
                {entry.officerRemark && <p><b>Officer remark:</b> {entry.officerRemark}</p>}
              </section>) : <section><strong>Officer response</strong><p>Not recorded yet.</p></section>}
            </div>
            <div className="admin-grievance-risk"><strong>Saved project risk</strong>{risk ? <span>{risk.risk_level} | {risk.risk_score.toFixed(1)} / 100</span> : <span>{grievance.status === 'verified' ? 'No persisted assessment available' : 'Available after Officer verification'}</span>}</div>
            {risk?.factors.length ? <ul className="admin-grievance-risk-factors">{risk.factors.map((factor) => <li key={factor.code}><b>{factor.label}:</b> {factor.reason}</li>)}</ul> : null}
          </article>
        })}</div> : <EmptyState icon={<AlertCircle size={24} />} title="No project problems yet" description="Landowner problems and Officer responses will be recorded here." />}
      </section>
      </>}
      {approvalOnly && <section id="admin-registration-approval" className="workspace-card">
        <div className="section-title-row">
          <div>
            <div className="eyebrow">
              <ShieldCheck size={14} />
              ADMIN WORKSPACE
            </div>

            <h3>
              Administrative Approval
            </h3>

            <p>
              Review Officer-verified land
              registration requests.
            </p>
          </div>

          <span className="count-badge">
            {verifiedRequests.length}{' '}
            Awaiting
          </span>
        </div>

        {verifiedRequests.length ===
        0 ? (
          <EmptyState
            icon={
              <ShieldCheck size={24} />
            }
            title="No requests awaiting approval"
            description="Officer-verified requests will appear here."
          />
        ) : (
          <div className="request-table">
            <div className="table-head">
              <span>Request</span>
              <span>Land</span>
              <span>Owner</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {verifiedRequests.map(
              (request) => (
                <div
                  className="table-row"
                  key={request.id}
                >
                  <div>
                    <strong>
                      {request.id}
                    </strong>
                  </div>

                  <div>
                    <strong>
                      {
                        request.surveyNumber
                      }
                    </strong>

                    <small>
                      {request.village}
                    </small>
                  </div>

                  <div>
                    {request.ownerName}
                  </div>

                  <div>
                    <span className="status-pill verified">
                      Officer Verified
                    </span>
                  </div>

                  <div className="table-actions">
                    <button
                      type="button"
                      className="small-btn success-btn"
                      onClick={() => {
                        setSelectedRequestId(request.id)
                        setAdminRemark(request.adminRemark ?? '')
                      }}
                    >
                      Review Request
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>}

      {!approvalOnly && approvedRequests.length > 0 && (
        <section className="workspace-card">
          <div className="success-box">
            <CheckCircle2 size={24} />

            <div>
              <strong>
                Request approved
              </strong>

              <p>
                LIVA project created:{' '}
                {approvedRequests
                  .map((request) => request.livaProjectId)
                  .filter(Boolean)
                  .join(', ') || 'Project creation pending.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {approvalOnly && selectedRequest && selectedRequest.status === 'verified' && (
        <section className="workspace-card officer-detail-workspace">
          <div className="section-title-row">
            <div>
              <div className="eyebrow"><ShieldCheck size={14} /> ADMIN DECISION</div>
              <h3>{selectedRequest.id}</h3>
              <p>Officer has verified all three registration documents.</p>
            </div>
            <span className="status-pill verified">Officer Verified</span>
          </div>

          <div className="land-details-grid">
            <InfoItem label="Landowner" value={selectedRequest.ownerName} />
            <InfoItem label="Survey Number" value={selectedRequest.surveyNumber} />
            <InfoItem label="Village" value={selectedRequest.village} />
            <InfoItem label="District" value={selectedRequest.district} />
            <InfoItem label="State" value={selectedRequest.state} />
            <InfoItem label="Pincode" value={selectedRequest.pincode} />
            <InfoItem label="Area" value={selectedRequest.area} />
          </div>

          <div className="officer-detail-section">
            <div className="eyebrow">REGISTRATION REASON</div>
            <div className="officer-long-detail">{selectedRequest.reason}</div>
          </div>

          <div className="document-upload-grid">
            {REGISTRATION_DOCUMENTS.map(({ key, label }) => {
              const document = selectedRequest[key]
              const filename = typeof document === 'string'
                ? document
                : document?.filename ?? 'Not uploaded'

              return (
                <div className="officer-document-card" key={key}>
                  <FileText size={17} aria-hidden="true" />
                  <strong>{label}</strong>
                  <span>{filename}</span>
                  <small>
                    {selectedRequest.documentVerification[key]
                      ? 'Officer verified'
                      : 'Not verified'}
                  </small>
                  {document && typeof document === 'object' && (
                    <button
                      type="button"
                      className="small-btn success-btn"
                      onClick={() => window.open(
                        `${LIVA_API_BASE_URL}/api/liva/documents/${encodeURIComponent(document.fileId)}`,
                        '_blank',
                        'noopener,noreferrer',
                      )}
                    >
                      View Document
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {selectedRequest.officerRemark && (
            <div className="admin-flow-note">
              <ShieldCheck size={18} />
              <div>
                <strong>Officer remark</strong>
                <p>{selectedRequest.officerRemark}</p>
              </div>
            </div>
          )}

          <div className="form-field officer-remarks-field">
            <label htmlFor="admin-registration-remarks">Admin Remark</label>
            <textarea
              id="admin-registration-remarks"
              rows={3}
              value={adminRemark}
              onChange={(event) => setAdminRemark(event.target.value)}
              placeholder="Optional approval or rejection remark..."
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
              onClick={() => onUpdate(selectedRequest.id, 'rejected', adminRemark)}
            >
              Reject
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => onUpdate(selectedRequest.id, 'approved', adminRemark)}
            >
              Approve &amp; Create Project
            </button>
          </div>
        </section>
      )}

      {approvalOnly && requests.some(
        (request) =>
          request.status === 'rejected',
      ) && (
        <section className="workspace-card">
          <div className="admin-flow-note">
            <XCircle size={18} />

            <div>
              <strong>
                Rejected requests
              </strong>

              <p>
                Rejected requests remain
                recorded for administrative
                tracking.
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  )
}

/* ======================================================
   EMPTY STATE
====================================================== */

interface LandownerJourneyProps {
  landFound: boolean | null
  projectOpened: boolean
  showRequestForm: boolean
  requestSubmitted: boolean
  showGrievance: boolean
  grievanceSubmitted: boolean
  requestStatus?: RequestStatus
}

function LandownerJourney({
  landFound,
  projectOpened,
  showRequestForm,
  requestSubmitted,
  showGrievance,
  grievanceSubmitted,
  requestStatus,
}: LandownerJourneyProps) {
  let currentStep = 1

  if (landFound !== null) {
    currentStep = 2
  }

  if (
    projectOpened ||
    showRequestForm ||
    requestSubmitted
  ) {
    currentStep = 3
  }

  if (showGrievance || grievanceSubmitted) {
    currentStep = 4
  }

  if (
    requestStatus === 'verified' ||
    requestStatus === 'approved' ||
    requestStatus === 'returned'
  ) {
    currentStep = 4
  }

  const steps = [
    {
      title: 'Find Land',
      description: 'Search your land record',
      icon: <Search size={16} />,
    },
    {
      title: 'Land Status',
      description:
        landFound === true
          ? 'Land found in LIVA'
          : landFound === false
            ? 'Registration required'
            : 'Waiting for search',
      icon: <MapPin size={16} />,
    },
    {
      title: 'Project / Request',
      description:
        requestSubmitted
          ? 'Request submitted'
          : projectOpened
            ? 'Project accessed'
            : 'Next stage',
      icon: <FolderOpen size={16} />,
    },
    {
      title: 'Verification',
      description:
        grievanceSubmitted
          ? 'Problem sent to Officer'
          : requestStatus === 'returned'
            ? 'Correction required'
          : requestStatus === 'verified'
            ? 'Officer verified'
            : requestStatus === 'approved'
              ? 'Approved'
              : 'Officer review',
      icon: <ShieldCheck size={16} />,
    },
  ]

  return (
    <section className="journey-card">
      <div className="journey-header">
        <div>
          <div className="eyebrow">
            <ClipboardCheck size={14} />
            YOUR JOURNEY
          </div>

          <h3>Land Acquisition Workflow</h3>

          <p>
            Track your land request from search to verification.
          </p>
        </div>

        <span className="journey-status">
          Step {currentStep} of 4
        </span>
      </div>

      <div className="journey-track">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const completed = stepNumber < currentStep
          const active = stepNumber === currentStep

          return (
            <div
              className={`journey-step ${
                completed ? 'completed' : ''
              } ${active ? 'active' : ''}`}
              key={step.title}
            >
              <div className="journey-icon">
                {completed ? (
                  <CheckCircle2 size={17} />
                ) : (
                  step.icon
                )}
              </div>

              <div className="journey-content">
                <strong>{step.title}</strong>
                <span>{step.description}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
