import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowRight, Ruler, Users } from 'lucide-react'
import {
  useAuth,
} from '../auth/AuthContext'
import { useFlash } from '../context/FlashContext'

import '../styles/ownership-survey.css'

const API = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

const ownershipStatuses = [
  'Pending verification',
  'Verified',
  'Disputed',
] as const

const surveyStatuses = [
  'Requested',
  'Scheduled',
  'Field work completed',
  'Under review',
  'Approved',
] as const

type Kind = 'ownership' | 'survey'

type Parcel = {
  id: string
  projectId: string
  project: string
  surveyNumber: string
  village: string
  district: string
}

type Review = {
  status: string
  officer: string
  reviewDate: string
  remarks: string
  measuredAreaHa?: number | null
  updatedAt?: string
}

type RecordData = {
  parcelId: string
  projectId: string
  surveyNumber: string
  village: string
  district: string
  areaHa: number | null
  ownership: string
  stage: string
  isDemo: boolean
  ownershipReview: Review | null
  surveyReview: Review | null
}

type Draft = {
  status: string
  officer: string
  reviewDate: string
  remarks: string
  measuredAreaHa: string
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API}${path}`, options)
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = body?.detail

    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((item: { msg: string }) => item.msg).join(' ')
          : `Request failed (${response.status}).`

    throw new Error(message)
  }

  return body as T
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

function localToday() {
  const now = new Date()

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

function makeDraft(record: RecordData, kind: Kind): Draft {
  const saved =
    kind === 'ownership'
      ? record.ownershipReview
      : record.surveyReview

  return {
    status:
      saved?.status ??
      (kind === 'ownership' ? record.ownership : 'Requested'),
    officer: saved?.officer ?? '',
    reviewDate: saved?.reviewDate ?? localToday(),
    remarks: saved?.remarks ?? '',
    measuredAreaHa:
      saved?.measuredAreaHa == null
        ? ''
        : String(saved.measuredAreaHa),
  }
}
function ReviewForm({
  record,
  kind,
  onSaved,
  onBusy,
}: {
  record: RecordData
  kind: Kind
  onSaved: (record: RecordData) => void
  onBusy: (busy: boolean) => void
}) {
  const { can } = useAuth()
  const { success: flashSuccess, error: flashError } = useFlash()

  const canManageWorkflow =
    can('workflow.manage')

  const [draft, setDraft] =
    useState<Draft>(() =>
      makeDraft(record, kind),
    )

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const ownership =
    kind === 'ownership'

  const statuses =
    ownership
      ? ownershipStatuses
      : surveyStatuses

  const saved =
    ownership
      ? record.ownershipReview
      : record.surveyReview

  const [editing, setEditing] = useState(!saved)

  function change(
    field: keyof Draft,
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))

    setSuccess('')
    setError('')
  }
  async function submit(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault()

  if (!canManageWorkflow) {
    return
  }

  if (saving) {
    return
  }

  setSaving(true)
  onBusy(true)
  setError('')
  setSuccess('')

  const payload = {
    status: draft.status,
    officer: draft.officer.trim(),
    reviewDate: draft.reviewDate,
    remarks: draft.remarks.trim(),

    ...(!ownership
      ? {
          measuredAreaHa:
            draft.measuredAreaHa === ''
              ? null
              : Number(
                  draft.measuredAreaHa,
                ),
        }
      : {}),
  }
    try {
      const updated = await request<RecordData>(
        `/api/ownership-survey/${record.parcelId}/${kind}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      onSaved(updated)
      setDraft(makeDraft(updated, kind))
      setEditing(false)
      const successMessage = ownership
        ? 'Ownership review saved. Registry status updated.'
        : 'Survey review saved.'
      setSuccess(successMessage)
      flashSuccess(successMessage)
    } catch (error) {
      const errorText = errorMessage(error)
      setError(errorText)
      flashError(errorText)
    } finally {
      setSaving(false)
      onBusy(false)
    }
  }

  return (
    <form className="os-live-form" onSubmit={submit}>
      <div className="os-form-header">
        <div>
          <h2>{ownership ? 'Ownership verification' : 'Survey review'}</h2>
          <p>
            {ownership
              ? 'Review the recorded ownership outcome for this parcel.'
              : 'Review the latest field survey information for this parcel.'}
          </p>
        </div>

        {canManageWorkflow && saved && !editing && (
          <button
            type="button"
            className="os-edit-button"
            onClick={() => {
              setDraft(makeDraft(record, kind))
              setEditing(true)
              setError('')
              setSuccess('')
            }}
          >
            Edit review
          </button>
        )}
      </div>

      {saved && !editing ? (
        <div className="os-saved-review">
          <div className="os-saved-review-status">
            <span>Current status</span>
            <strong>{saved.status}</strong>
          </div>

          <div className="os-saved-review-grid">
            <div>
              <span>Responsible officer</span>
              <strong>{saved.officer || 'Not recorded'}</strong>
            </div>
            <div>
              <span>Review date</span>
              <strong>{saved.reviewDate || 'Not recorded'}</strong>
            </div>
            {!ownership && (
              <div>
                <span>Measured area</span>
                <strong>
                  {saved.measuredAreaHa == null
                    ? 'Not recorded'
                    : `${saved.measuredAreaHa} ha`}
                </strong>
              </div>
            )}
            <div className="os-saved-wide">
              <span>Remarks / evidence references</span>
              <strong>{saved.remarks?.trim() || 'No remarks recorded.'}</strong>
            </div>
          </div>

          {saved.updatedAt && (
            <p className="os-last-saved">
              Last updated {new Date(saved.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <fieldset disabled={saving || !canManageWorkflow}>
          <div className="os-live-fields">
            <label>
              {ownership ? 'Ownership status' : 'Survey status'}
              <select
                value={draft.status}
                onChange={(event) => change('status', event.target.value)}
                required
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              Responsible officer
              <input
                value={draft.officer}
                onChange={(event) => change('officer', event.target.value)}
                minLength={2}
                maxLength={150}
                placeholder="Enter officer name"
                required
              />
            </label>

            <label>
              Review date
              <input
                type="date"
                value={draft.reviewDate}
                onChange={(event) => change('reviewDate', event.target.value)}
                required
              />
            </label>

            {!ownership && (
              <label>
                Measured area (ha) — optional
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={draft.measuredAreaHa}
                  onChange={(event) => change('measuredAreaHa', event.target.value)}
                  placeholder="Enter measured area"
                />
              </label>
            )}

            <label className="os-live-wide">
              Remarks / evidence references
              <textarea
                rows={5}
                value={draft.remarks}
                onChange={(event) => change('remarks', event.target.value)}
                maxLength={5000}
                placeholder="Record findings and references to supporting records"
              />
            </label>
          </div>

          {!ownership && (
            <p>
              Measured area is saved with this review. Recorded parcel area and
              acquisition stage are updated separately.
            </p>
          )}

          {error && <div className="os-live-error" role="alert">{error}</div>}
          {success && <div className="os-live-success" role="status">{success}</div>}

          {canManageWorkflow ? (
            <div className="os-form-actions">
              {saved && (
                <button
                  type="button"
                  className="os-cancel-button"
                  disabled={saving}
                  onClick={() => {
                    setDraft(makeDraft(record, kind))
                    setEditing(false)
                    setError('')
                    setSuccess('')
                  }}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="os-live-primary">
                {saving ? 'Saving…' : saved ? 'Save changes' : 'Save review'}
              </button>
            </div>
          ) : (
            <p className="os-readonly-note">
              Read-only access. Review updates are available to administrators,
              judges and project officers.
            </p>
          )}
        </fieldset>
      )}
    </form>
  )
}

export default function OwnershipSurveyPage() {
  const [searchParams] = useSearchParams()
  const activeProjectId = searchParams.get('projectId') ?? ''
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [parcelId, setParcelId] = useState('')
  const [record, setRecord] = useState<RecordData | null>(null)
  const [kind, setKind] = useState<Kind>('ownership')
  const [listLoading, setListLoading] = useState(true)
  const [recordLoading, setRecordLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [recordError, setRecordError] = useState('')
  const [retryList, setRetryList] = useState(0)
  const [retryRecord, setRetryRecord] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setListLoading(true)
    setListError('')

    const params = new URLSearchParams({ limit: '100' })
    if (activeProjectId) params.set('projectId', activeProjectId)

    request<{ items: Parcel[] }>(`/api/parcels?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return

        setParcels(data.items)
        setParcelId((current) =>
          data.items.some((item) => item.id === current)
            ? current
            : data.items[0]?.id ?? '',
        )
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setListError(errorMessage(error))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setListLoading(false)
      })

    return () => controller.abort()
  }, [retryList, activeProjectId])

  useEffect(() => {
    const controller = new AbortController()
    setRecord(null)
    setRecordError('')

    if (!parcelId) {
      setRecordLoading(false)
      return () => controller.abort()
    }

    setRecordLoading(true)

    request<RecordData>(`/api/ownership-survey/${parcelId}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) setRecord(data)
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setRecordError(errorMessage(error))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setRecordLoading(false)
      })

    return () => controller.abort()
  }, [parcelId, retryRecord])

  const selected = parcels.find((parcel) => parcel.id === parcelId)
  const current = record?.parcelId === parcelId ? record : null

  return (
    <div className="os-page">
      <style>{`
        .os-page .os-live-box {
          background: #fff;
          border: 1px solid #d6dfcf;
          border-radius: 10px;
          padding: 24px;
          margin: 20px 0;
          color: #203d32;
        }
        .os-page .os-live-box h2,
        .os-page .os-live-box h3 {
          color: #193f36;
          margin: 0 0 14px;
        }
        .os-page .os-live-box p {
          line-height: 1.6;
          margin: 10px 0;
        }
        .os-page .os-live-fields {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin: 20px 0;
        }
        .os-page .os-live-box label {
          display: grid;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
        }
        .os-page .os-live-box input,
        .os-page .os-live-box select,
        .os-page .os-live-box textarea {
          width: 100%;
          box-sizing: border-box;
          background: #fff;
          color: #193f36;
          border: 1px solid #ccd8c5;
          border-radius: 6px;
          padding: 12px;
          font: inherit;
        }
        .os-page .os-live-box textarea { resize: vertical; }
        .os-page .os-live-box :focus-visible {
          outline: 2px solid #b9944c;
          outline-offset: 3px;
        }
        .os-page .os-live-wide { grid-column: 1 / -1; }
        .os-page .os-live-form fieldset {
          border: 0;
          padding: 0;
          margin: 0;
          min-width: 0;
        }
        .os-page .os-live-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background: #193f36;
          color: #fff !important;
          border: 1px solid #193f36;
          border-radius: 6px;
          cursor: pointer;
          text-decoration: none;
        }
        .os-page .os-live-primary:disabled {
          opacity: .65;
          cursor: wait;
        }
        .os-page .os-live-switch {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 24px;
        }
        .os-page .os-live-switch button {
          padding: 12px 16px;
          border: 1px solid #ccd8c5;
          border-radius: 6px;
          background: #f3f6ef;
          color: #193f36;
          cursor: pointer;
        }
        .os-page .os-live-switch button[aria-pressed="true"] {
          background: #193f36;
          color: #fff;
        }
        .os-page .os-live-error,
        .os-page .os-live-success {
          padding: 12px;
          border-radius: 6px;
          margin: 14px 0;
        }
        .os-page .os-live-error { background: #fff0ed; color: #8b2920; }
        .os-page .os-live-success { background: #edf4e5; color: #193f36; }
        .os-page .os-live-context {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 20px;
        }
        .os-page .os-live-context div {
          border-bottom: 1px solid #d6dfcf;
          padding: 10px 0;
          overflow-wrap: anywhere;
        }
        .os-page .os-live-context dt { font-size: 12px; }
        .os-page .os-live-context dd { margin: 6px 0 0; }

        .os-page .os-selection-card,
        .os-page .os-parcel-overview,
        .os-page .os-review-workspace,
        .os-page .os-support-card {
          background:#fff;border:1px solid #dfe6da;border-radius:16px;
          box-shadow:0 10px 30px rgba(31,55,45,.06);
        }
        .os-page .os-selection-card{padding:28px;margin:22px 0}
        .os-page .os-section-heading,.os-page .os-review-intro,.os-page .os-overview-title{display:flex;align-items:flex-start;justify-content:space-between;gap:24px}
        .os-page .os-section-kicker{margin:0 0 7px;color:#9a7637;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
        .os-page .os-section-heading h2,.os-page .os-review-intro h2,.os-page .os-support-card h2{margin:0;color:#193f36;font-size:20px;line-height:1.25}
        .os-page .os-section-heading p:not(.os-section-kicker),.os-page .os-review-intro p:not(.os-section-kicker),.os-page .os-support-card p:not(.os-section-kicker){margin:7px 0 0;color:#66746b;line-height:1.55}
        .os-page .os-record-count{min-width:118px;padding:12px 15px;border:1px solid #e1e7dc;border-radius:12px;background:#f7f9f4;text-align:right}
        .os-page .os-record-count span,.os-page .os-selector-meta span{display:block;color:#748078;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
        .os-page .os-record-count strong{display:block;margin-top:2px;color:#193f36;font-size:22px}
        .os-page .os-parcel-selector{display:grid;grid-template-columns:minmax(0,1fr) 240px;gap:18px;margin-top:24px;padding:18px;border:1px solid #e1e7dc;border-radius:13px;background:#f8faf6}
        .os-page .os-field-label{display:block;margin-bottom:8px;color:#3e5047;font-size:12px;font-weight:750}
        .os-page .os-parcel-selector select{width:100%;min-height:48px;border:1px solid #ccd8c5;border-radius:9px;background:#fff;color:#193f36;padding:0 13px;font:inherit;font-size:14px}
        .os-page .os-selector-meta{padding:3px 0 3px 18px;border-left:1px solid #dce5d8}
        .os-page .os-selector-meta strong{display:block;margin-top:6px;color:#193f36;font-size:15px}.os-page .os-selector-meta small{display:block;margin-top:4px;color:#758078;line-height:1.4}
        .os-page .os-loading-row{margin-top:18px;padding:15px;border-radius:10px;background:#f6f8f3;color:#5f6d65;font-size:13px}
        .os-page .os-message-card,.os-page .os-empty-card{margin-top:18px;padding:18px;border:1px solid #e1e7dc;border-radius:12px;background:#fafbf9}
        .os-page .os-parcel-overview{margin:22px 0;overflow:hidden}.os-page .os-overview-main{padding:28px}
        .os-page .os-overview-title h2{margin:0;color:#193f36;font-size:25px;letter-spacing:-.02em}.os-page .os-overview-title p:not(.os-section-kicker){margin:6px 0 0;color:#6b776f;font-size:14px}
        .os-page .os-status-chip{display:inline-flex;align-items:center;min-height:30px;padding:0 11px;border-radius:999px;background:#e8f1e7;color:#2f5e4e;font-size:11px;font-weight:750}.os-page .os-status-chip.demo{background:#f4eee1;color:#80652f}
        .os-page .os-overview-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:24px;border-top:1px solid #e7ece3;border-bottom:1px solid #e7ece3}
        .os-page .os-overview-item{padding:17px 18px 17px 0;border-right:1px solid #e7ece3}.os-page .os-overview-item:not(:first-child){padding-left:18px}.os-page .os-overview-item:last-child{border-right:0}
        .os-page .os-overview-item span{display:block;color:#7b867f;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}.os-page .os-overview-item strong{display:block;margin-top:6px;color:#263f36;font-size:14px;line-height:1.45}
        .os-page .os-record-note{margin:16px 0 0;color:#758078;font-size:12px;line-height:1.55}
        .os-page .os-review-workspace{margin:22px 0;padding:28px}.os-page .os-review-switch{display:inline-flex;padding:4px;gap:3px;border:1px solid #d9e1d4;border-radius:10px;background:#f4f7f1;flex-shrink:0}
        .os-page .os-review-switch button{border:0;border-radius:7px;padding:9px 13px;background:transparent;color:#5c6b62;font:inherit;font-size:12px;font-weight:700;cursor:pointer}.os-page .os-review-switch button[aria-pressed=true]{background:#193f36;color:#fff;box-shadow:0 2px 7px rgba(25,63,54,.16)}
        .os-page .os-form-header{
          display:flex;align-items:flex-start;justify-content:space-between;
          gap:20px;margin-bottom:22px;
        }
        .os-page .os-form-header h2{margin:0;color:#193f36;font-size:18px}
        .os-page .os-form-header p{margin:6px 0 0;color:#6b776f;font-size:13px;line-height:1.5}
        .os-page .os-edit-button{
          min-height:38px;padding:0 14px;border:1px solid #cbd8c6;
          border-radius:8px;background:#fff;color:#244d40;font:inherit;
          font-size:12px;font-weight:750;cursor:pointer;
        }
        .os-page .os-edit-button:hover{background:#f2f6ef;border-color:#aebfa8}
        .os-page .os-saved-review{
          border:1px solid #e2e9de;border-radius:12px;background:#fafcf9;overflow:hidden;
        }
        .os-page .os-saved-review-status{
          display:flex;align-items:center;justify-content:space-between;gap:16px;
          padding:17px 18px;background:#f3f7f1;border-bottom:1px solid #e2e9de;
        }
        .os-page .os-saved-review-status span{
          color:#718078;font-size:11px;font-weight:750;text-transform:uppercase;letter-spacing:.06em;
        }
        .os-page .os-saved-review-status strong{color:#315f4f;font-size:13px}
        .os-page .os-saved-review-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
        .os-page .os-saved-review-grid>div{padding:16px 18px;border-right:1px solid #e7ece3;border-bottom:1px solid #e7ece3}
        .os-page .os-saved-review-grid>div:nth-child(3){border-right:0}
        .os-page .os-saved-review-grid span{
          display:block;color:#7a867f;font-size:11px;font-weight:700;
          text-transform:uppercase;letter-spacing:.04em;
        }
        .os-page .os-saved-review-grid strong{display:block;margin-top:6px;color:#29483d;font-size:13px;line-height:1.5}
        .os-page .os-saved-review-grid .os-saved-wide{grid-column:1/-1;border-right:0;border-bottom:0}
        .os-page .os-last-saved{margin:0;padding:12px 18px;color:#7a867f;font-size:11px;border-top:1px solid #e7ece3}
        .os-page .os-form-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
        .os-page .os-cancel-button{
          min-height:42px;padding:0 15px;border:1px solid #d1dbcd;border-radius:8px;
          background:#fff;color:#586860;font:inherit;font-size:12px;font-weight:700;cursor:pointer;
        }
        .os-page .os-cancel-button:hover{background:#f6f8f4}
        .os-page .os-readonly-note{
          margin-top:14px;padding:11px 12px;border-radius:8px;background:#f3f6ef;
          border:1px solid #d6dfcf;color:#52634f;font-size:12px;
        }
        .os-page .os-review-workspace .os-live-form{margin-top:24px;padding-top:24px;border-top:1px solid #e6ebe2}.os-page .os-review-workspace .os-live-form h2,.os-page .os-review-workspace .os-live-form>p:first-of-type{display:none}
        .os-page .os-support-card{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:22px 0;padding:22px 24px}.os-page .os-support-card>div{display:flex;align-items:flex-start;gap:14px}
        .os-page .os-support-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:#eef4ec;color:#315d4e;flex-shrink:0}.os-page .os-support-card h2{font-size:16px}.os-page .os-support-card .os-live-primary{flex-shrink:0}
        @media (max-width: 820px) {
          .os-page .os-section-heading,.os-page .os-review-intro,.os-page .os-overview-title,.os-page .os-support-card{flex-direction:column}
          .os-page .os-parcel-selector{grid-template-columns:1fr}
          .os-page .os-selector-meta{padding:12px 0 0;border-left:0;border-top:1px solid #dce5d8}
          .os-page .os-overview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
          .os-page .os-overview-item:nth-child(2){border-right:0}
          .os-page .os-overview-item:nth-child(3),.os-page .os-overview-item:nth-child(4){border-top:1px solid #e7ece3}
        }
        @media (max-width: 820px) {
          .os-page .os-saved-review-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
          .os-page .os-saved-review-grid>div:nth-child(2){border-right:0}
        }

        @media (max-width: 640px) {
          .os-page .os-live-fields,.os-page .os-live-context,.os-page .os-overview-grid{grid-template-columns:1fr}
          .os-page .os-live-box,.os-page .os-selection-card,.os-page .os-overview-main,.os-page .os-review-workspace{padding:18px}
          .os-page .os-overview-item,.os-page .os-overview-item:not(:first-child){padding:13px 0;border-right:0}
          .os-page .os-review-switch{width:100%}.os-page .os-review-switch button{flex:1}
        }
          /* ================================
   Review form — edit mode
================================ */

.os-page .os-review-workspace .os-live-form fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

.os-page .os-review-workspace .os-live-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px 28px;
  margin: 0;
}

.os-page .os-review-workspace .os-live-fields label {
  display: grid;
  gap: 8px;
  color: #405249;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.os-page .os-review-workspace .os-live-fields input,
.os-page .os-review-workspace .os-live-fields select,
.os-page .os-review-workspace .os-live-fields textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #ccd8c5;
  border-radius: 8px;
  background: #fff;
  color: #193f36;
  font: inherit;
  font-size: 13px;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.os-page .os-review-workspace .os-live-fields select {
  cursor: pointer;
}

.os-page .os-review-workspace .os-live-fields textarea {
  min-height: 120px;
  resize: vertical;
  line-height: 1.5;
}

.os-page .os-review-workspace .os-live-fields input:focus,
.os-page .os-review-workspace .os-live-fields select:focus,
.os-page .os-review-workspace .os-live-fields textarea:focus {
  border-color: #6d9583;
  box-shadow: 0 0 0 3px rgba(69, 108, 91, 0.10);
}

.os-page .os-review-workspace .os-live-wide {
  grid-column: 1 / -1;
}

.os-page .os-review-workspace .os-live-fields + p {
  margin: 14px 0 0;
  color: #758078;
  font-size: 11px;
  line-height: 1.5;
}

.os-page .os-review-workspace .os-form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #e5ebe1;
}

@media (max-width: 720px) {
  .os-page .os-review-workspace .os-live-fields {
    grid-template-columns: 1fr;
  }

  .os-page .os-review-workspace .os-live-wide {
    grid-column: auto;
  }
}
      `}</style>

    
      <main className="os-main">
        <div className="os-breadcrumb">
          <Link to="/parcels">Land parcels</Link>
          <span>/</span>
          <span>Ownership & Survey</span>
        </div>

        <section className="os-banner" aria-labelledby="os-title">
          <img src="/images/liva-owner.png" alt="" fetchPriority="high" />
          <div className="os-banner-overlay" />
          <div className="os-banner-copy">
            <p className="os-eyebrow">OWNERSHIP & FIELD REVIEW</p>
            <h1 id="os-title">
              Know the land.<br />Understand the records.
            </h1>
            <p>
              Record ownership findings, survey progress and
              responsible officers for each parcel.
            </p>
            <Link to="/parcels" className="os-banner-button">
              Open parcel registry <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="os-selection-card">
          <div className="os-section-heading">
            <div>
              <p className="os-section-kicker">PARCEL WORKSPACE</p>
              <h2>Select a parcel to review</h2>
              <p>Choose a saved parcel to view its current ownership and survey information.</p>
            </div>
            <div className="os-record-count">
              <span>Available records</span>
              <strong>{parcels.length}</strong>
            </div>
          </div>

          {listLoading ? (
            <div className="os-loading-row" role="status">Loading parcels…</div>
          ) : listError ? (
            <div className="os-message-card" role="alert">
              <p className="os-live-error">{listError}</p>
              <button className="os-live-primary" onClick={() => setRetryList((value) => value + 1)}>Retry</button>
            </div>
          ) : parcels.length === 0 ? (
            <div className="os-empty-card">
              <h3>No parcels found</h3>
              <p>Open the parcel registry and add a parcel before starting an ownership or survey review.</p>
              <Link to="/parcels" className="os-live-primary">Open parcel registry <ArrowRight size={16} /></Link>
            </div>
          ) : (
            <div className="os-parcel-selector">
              <div>
                <span className="os-field-label">Parcel / project</span>
                <select value={parcelId} disabled={busy} onChange={(event) => { setRecord(null); setRecordError(''); setParcelId(event.target.value) }}>
                  {parcels.map((parcel) => (
                    <option key={parcel.id} value={parcel.id}>
                      {parcel.surveyNumber} — {parcel.project || 'Project'} — {parcel.village}
                    </option>
                  ))}
                </select>
              </div>
              <div className="os-selector-meta">
                <span>Current selection</span>
                <strong>{selected?.surveyNumber || '—'}</strong>
                <small>{selected ? `${selected.village}, ${selected.district}` : 'Select a parcel'}</small>
              </div>
            </div>
          )}

          {recordLoading && <div className="os-loading-row" role="status">Loading saved reviews…</div>}
          {recordError && (
            <div className="os-message-card" role="alert">
              <p className="os-live-error">{recordError}</p>
              <button className="os-live-primary" onClick={() => setRetryRecord((value) => value + 1)}>Retry reviews</button>
            </div>
          )}
        </section>

        {current && (
          <>
            <section className="os-parcel-overview" aria-label="Selected parcel overview">
              <div className="os-overview-main">
                <div className="os-overview-title">
                  <div>
                    <p className="os-section-kicker">SELECTED PARCEL</p>
                    <h2>{current.surveyNumber}</h2>
                    <p>{selected?.project || 'Project not available'} · {current.village}, {current.district}</p>
                  </div>
                  <span className={current.isDemo ? 'os-status-chip demo' : 'os-status-chip'}>{current.isDemo ? 'Demo record' : 'Saved record'}</span>
                </div>

                <div className="os-overview-grid">
                  {[
                    ['Project', selected?.project || 'Not available'],
                    ['Survey number', current.surveyNumber],
                    ['Location', `${current.village}, ${current.district}`],
                    ['Recorded area', current.areaHa == null ? 'Not available' : `${current.areaHa} ha`],
                  ].map(([label, value]) => (
                    <div className="os-overview-item" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <p className="os-record-note">
                  {current.isDemo ? 'Demo parcel — illustrative record.' : 'Saved parcel record.'} Review status is entered by the reviewer; it is not independent verification.
                </p>
              </div>
            </section>

            <section className="os-summary" aria-label="Saved review status">
              {[
                { title: 'Ownership status', value: current.ownership, icon: Users, note: 'Recorded review outcome' },
                { title: 'Survey status', value: current.surveyReview?.status ?? 'Not recorded', icon: Ruler, note: 'Saved survey review' },
              ].map(({ title, value, icon: Icon, note }) => (
                <article key={title}>
                  <span className="os-summary-icon"><Icon size={22} /></span>
                  <div><h2>{title}</h2><strong>{value}</strong><p>{note}</p></div>
                </article>
              ))}
            </section>

            <section className="os-review-workspace">
              <div className="os-review-intro">
                <div>
                  <p className="os-section-kicker">REVIEW WORKSPACE</p>
                  <h2>Update the current record</h2>
                  <p>Record the latest finding for ownership verification or field survey. Changes are saved to the selected parcel.</p>
                </div>
                <div className="os-review-switch" aria-label="Review type">
                  {(['ownership', 'survey'] as const).map((value) => (
                    <button key={value} type="button" disabled={busy} aria-pressed={kind === value} onClick={() => setKind(value)}>
                      {value === 'ownership' ? 'Ownership review' : 'Survey review'}
                    </button>
                  ))}
                </div>
              </div>

              <ReviewForm key={`${current.parcelId}-${kind}`} record={current} kind={kind} onSaved={setRecord} onBusy={setBusy} />
            </section>

            <section className="os-support-card">
              <div>
                <span className="os-support-icon"><ArrowRight size={18} /></span>
                <div>
                  <p className="os-section-kicker">SUPPORTING RECORDS</p>
                  <h2>Supporting documents</h2>
                  <p>Review supporting files in the document workspace. Individual evidence files are not linked to these reviews yet.</p>
                </div>
              </div>
              <Link to="/documents" className="os-live-primary">Open documents <ArrowRight size={16} /></Link>
            </section>
          </>
        )}

        <p className="os-image-note">Banner image is illustrative.</p>
      </main>

      <footer className="os-footer">
        <strong>Liva</strong>
        <span>Better land decisions. Stronger communities.</span>
      </footer>
    </div>
  )
}
