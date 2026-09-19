import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, Ruler, Users } from 'lucide-react'
import {
  useAuth,
} from '../auth/AuthContext'

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
      setSuccess(
        ownership
          ? 'Ownership review saved. Registry status updated.'
          : 'Survey review saved.',
      )
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setSaving(false)
      onBusy(false)
    }
  }

  return (
    <form className="os-live-form" onSubmit={submit}>
      <h2>
        {ownership ? 'Ownership verification' : 'Survey review'}
      </h2>

      <p>
        {ownership
          ? 'Record the review outcome and the supporting remarks.'
          : 'Record field progress, measurements and review remarks.'}
      </p>

      {saved?.updatedAt && (
        <p>
          Last saved: {new Date(saved.updatedAt).toLocaleString()}
        </p>
      )}

   <fieldset
  disabled={
    saving ||
    !canManageWorkflow
  }
>
        <div className="os-live-fields">
          <label>
            {ownership ? 'Ownership status' : 'Survey status'}
            <select
              value={draft.status}
              onChange={(event) => change('status', event.target.value)}
              required
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
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
              onChange={(event) =>
                change('reviewDate', event.target.value)
              }
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
                onChange={(event) =>
                  change('measuredAreaHa', event.target.value)
                }
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
            Measured area is saved with this review. Recorded parcel
            area and acquisition stage are updated separately.
          </p>
        )}

        {error && <div className="os-live-error" role="alert">{error}</div>}
        {success && (
          <div className="os-live-success" role="status">{success}</div>
        )}

        {canManageWorkflow ? (
  <button
    type="submit"
    className="os-live-primary"
  >
    {saving
      ? 'Saving…'
      : saved
        ? 'Update review'
        : 'Save review'}
  </button>
) : (
  <p
    style={{
      marginTop: '14px',
      padding: '10px 12px',
      borderRadius: '6px',
      background: '#f3f6ef',
      border: '1px solid #d6dfcf',
      color: '#52634f',
      fontSize: '12px',
    }}
  >
    Read-only access. Review updates are available
    to administrators, judges and project officers.
  </p>
)}
      </fieldset>
    </form>
  )
}

export default function OwnershipSurveyPage() {
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

    request<{ items: Parcel[] }>('/api/parcels?limit=100', {
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
  }, [retryList])

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
        @media (max-width: 640px) {
          .os-page .os-live-fields,
          .os-page .os-live-context { grid-template-columns: 1fr; }
          .os-page .os-live-box { padding: 18px; }
        }
      `}</style>

      <header className="os-header">
        <Link to="/" className="os-brand">Liva<span>.</span></Link>
        <nav aria-label="Workspace navigation">
          <Link to="/dashboard">Overview</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/parcels">Land Parcels</Link>
          <Link to="/ownership-survey" aria-current="page">
            Ownership & Survey
          </Link>
        </nav>
        <Link className="os-back" to="/parcels">
          <ArrowLeft size={16} /> Registry
        </Link>
      </header>

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

        <section className="os-live-box">
          <h2>Select a parcel</h2>
          <p>Latest 100 saved parcels are available in this selector.</p>

          {listLoading ? (
            <p role="status">Loading parcels…</p>
          ) : listError ? (
            <div role="alert">
              <p className="os-live-error">{listError}</p>
              <button
                className="os-live-primary"
                onClick={() => setRetryList((value) => value + 1)}
              >
                Retry
              </button>
            </div>
          ) : parcels.length === 0 ? (
            <p>
              No parcels found. <Link to="/parcels">Open the registry</Link>
              {' '}and add a parcel first.
            </p>
          ) : (
            <label>
              Parcel / project
              <select
                value={parcelId}
                disabled={busy}
                onChange={(event) => {
                  setRecord(null)
                  setRecordError('')
                  setParcelId(event.target.value)
                }}
              >
                {parcels.map((parcel) => (
                  <option key={parcel.id} value={parcel.id}>
                    {parcel.surveyNumber} — {parcel.project || 'Project'}
                    {' '}— {parcel.village}
                  </option>
                ))}
              </select>
            </label>
          )}

          {recordLoading && <p role="status">Loading saved reviews…</p>}

          {recordError && (
            <div role="alert">
              <p className="os-live-error">{recordError}</p>
              <button
                className="os-live-primary"
                onClick={() => setRetryRecord((value) => value + 1)}
              >
                Retry reviews
              </button>
            </div>
          )}

          {current && (
            <>
              <p>
                {current.isDemo
                  ? 'Demo parcel — illustrative record.'
                  : 'Saved parcel record.'}
                {' '}Review status is entered by the reviewer;
                it is not independent verification.
              </p>

              <dl className="os-live-context">
                {[
                  ['Project', selected?.project || 'Not available'],
                  ['Survey number', current.surveyNumber],
                  ['Location', `${current.village}, ${current.district}`],
                  [
                    'Recorded area',
                    current.areaHa == null ? 'Not available' : `${current.areaHa} ha`,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        {current && (
          <>
            <section className="os-summary" aria-label="Saved review status">
              {[
                {
                  title: 'Ownership status',
                  value: current.ownership,
                  icon: Users,
                  note: 'Recorded review outcome',
                },
                {
                  title: 'Survey status',
                  value: current.surveyReview?.status ?? 'Not recorded',
                  icon: Ruler,
                  note: 'Saved survey review',
                },
              ].map(({ title, value, icon: Icon, note }) => (
                <article key={title}>
                  <span className="os-summary-icon"><Icon size={24} /></span>
                  <div>
                    <h2>{title}</h2>
                    <strong>{value}</strong>
                    <p>{note}</p>
                  </div>
                </article>
              ))}
            </section>

            <section className="os-live-box">
              <div className="os-live-switch" aria-label="Review type">
                {(['ownership', 'survey'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={busy}
                    aria-pressed={kind === value}
                    onClick={() => setKind(value)}
                  >
                    {value === 'ownership' ? 'Ownership review' : 'Survey review'}
                  </button>
                ))}
              </div>

              <ReviewForm
                key={`${current.parcelId}-${kind}`}
                record={current}
                kind={kind}
                onSaved={setRecord}
                onBusy={setBusy}
              />
            </section>

            <section className="os-live-box">
              <h2>Supporting documents</h2>
              <p>
                Review supporting files in the document workspace.
                Individual evidence files are not linked to these reviews yet.
              </p>
              <Link to="/documents" className="os-live-primary">
                Open documents <ArrowRight size={16} />
              </Link>
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