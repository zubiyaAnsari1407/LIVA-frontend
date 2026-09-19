import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Image as ImageIcon, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import '../styles/project-form.css'

type EditableProject = {
  id: string
  name: string
  state: string
  district: string
  stage: string
  progress: number | null
  description: string
  image?: string | null
  imagePublicId?: string | null
  isDemo: boolean
  sourceName?: string | null
  sourceUrl?: string | null
  sourceRecordId?: string | null
  sourceDate?: string | null
  sector?: string | null
  line_ministry?: string | null
  original_cost_cr?: number | null
  expenditure_cr?: number | null
  physical_progress_pct?: number | null
  original_completion_year?: number | null
  sanction_year?: number | null
}

type Draft = {
  name: string
  state: string
  district: string
  stage: string
  progress: string
  description: string
  isDemo: boolean
  sourceName: string
  sourceUrl: string
  sourceRecordId: string
  sourceDate: string
  sector: string
  line_ministry: string
  original_cost_cr: string
  expenditure_cr: string
  physical_progress_pct: string
  original_completion_year: string
  sanction_year: string
}

type UploadResult = {
  url: string
  publicId: string
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

function makeDraft(project?: EditableProject): Draft {
  return {
    name: project?.name ?? '',
    state: project?.state ?? '',
    district: project?.district ?? '',
    stage: project?.stage ?? 'Survey',
    progress: project?.progress == null ? '' : String(project.progress),
    description: project?.description ?? '',
    isDemo: project?.isDemo ?? true,
    sourceName: project?.sourceName ?? '',
    sourceUrl: project?.sourceUrl ?? '',
    sourceRecordId: project?.sourceRecordId ?? '',
    sourceDate: project?.sourceDate ?? '',
    sector: project?.sector ?? '',
    line_ministry: project?.line_ministry ?? '',
    original_cost_cr:
      project?.original_cost_cr == null ? '' : String(project.original_cost_cr),
    expenditure_cr:
      project?.expenditure_cr == null ? '' : String(project.expenditure_cr),
    physical_progress_pct:
      project?.physical_progress_pct == null
        ? ''
        : String(project.physical_progress_pct),
    original_completion_year:
      project?.original_completion_year == null
        ? ''
        : String(project.original_completion_year),
    sanction_year:
      project?.sanction_year == null ? '' : String(project.sanction_year),
  }
}

function nullableNumber(value: string) {
  return value === '' ? null : Number(value)
}

function apiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback

  const detail = (payload as { detail?: unknown }).detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          const msg = (item as { msg?: unknown }).msg
          return typeof msg === 'string' ? msg : 'Invalid field'
        }
        return 'Invalid field'
      })
      .join(' ')
  }

  return fallback
}

export default function ProjectForm({
  project,
  onSaved,
}: {
  project?: EditableProject
  onSaved?: () => void
}) {
  const navigate = useNavigate()
  const { can } = useAuth()

  const dialogRef = useRef<HTMLDialogElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submitting = useRef(false)

  const [draft, setDraft] = useState<Draft>(() => makeDraft(project))
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [error, setError] = useState('')

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(project?.image ?? '')
  const [removeImage, setRemoveImage] = useState(false)
  const [imageBroken, setImageBroken] = useState(false)

  const editing = Boolean(project)
  const allowed = editing ? can('projects.edit') : can('projects.create')

  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
  }

  function resetImageState() {
    setImageFile(null)
    setImagePreview(project?.image ?? '')
    setRemoveImage(false)
    setImageBroken(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function openForm() {
    if (!allowed) return

    setDraft(makeDraft(project))
    setError('')
    setSaveStatus('')
    resetImageState()
    dialogRef.current?.showModal()
  }

  function chooseImage() {
    if (saving) return
    fileInputRef.current?.click()
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Use a JPG, PNG or WEBP image.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError('Project image must be 5 MB or smaller.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(typeof reader.result === 'string' ? reader.result : '')
      setImageBroken(false)
    }
    reader.readAsDataURL(file)

    setImageFile(file)
    setRemoveImage(false)
    setError('')
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview('')
    setRemoveImage(true)
    setImageBroken(false)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadImage(base: string): Promise<UploadResult> {
    if (!imageFile) {
      throw new Error('No image selected.')
    }

    const body = new FormData()
    body.append('file', imageFile)

    const response = await fetch(`${base}/api/projects/upload-image`, {
      method: 'POST',
      body,
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(
        apiErrorMessage(payload, `Image upload failed (${response.status}).`),
      )
    }

    if (
      !payload ||
      typeof payload.url !== 'string' ||
      typeof payload.publicId !== 'string'
    ) {
      throw new Error('Cloud image upload returned an invalid response.')
    }

    return {
      url: payload.url,
      publicId: payload.publicId,
    }
  }

  async function cleanupUploadedImage(base: string, publicId: string) {
    await fetch(`${base}/api/projects/upload-image`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    }).catch(() => null)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!allowed || submitting.current) return

    submitting.current = true
    setSaving(true)
    setSaveStatus('Saving project…')
    setError('')

    const base = (
      import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    ).replace(/\/+$/, '')

    let uploadedPublicId: string | null = null

    try {
      let image = project?.image ?? null
      let imagePublicId = project?.imagePublicId ?? null

      if (removeImage) {
        image = null
        imagePublicId = null
      }

      if (imageFile) {
        setSaveStatus('Uploading project image…')
        const uploaded = await uploadImage(base)
        image = uploaded.url
        imagePublicId = uploaded.publicId
        uploadedPublicId = uploaded.publicId
      }

      setSaveStatus(editing ? 'Saving changes…' : 'Creating project…')

      const common = {
        name: draft.name.trim(),
        state: draft.state.trim(),
        district: draft.district.trim(),
        stage: draft.stage,
        progress: nullableNumber(draft.progress),
        description: draft.description.trim(),
        image,
        imagePublicId,
        sector: draft.sector.trim() || null,
        line_ministry: draft.line_ministry.trim() || null,
        original_cost_cr: nullableNumber(draft.original_cost_cr),
        expenditure_cr: nullableNumber(draft.expenditure_cr),
        physical_progress_pct: nullableNumber(draft.physical_progress_pct),
        original_completion_year: nullableNumber(draft.original_completion_year),
        sanction_year: nullableNumber(draft.sanction_year),
        sourceName: draft.sourceName.trim() || null,
        sourceUrl: draft.sourceUrl.trim() || null,
        sourceRecordId: draft.sourceRecordId.trim() || null,
        sourceDate: draft.sourceDate || null,
      }

      const response = await fetch(
        project
          ? `${base}/api/projects/${encodeURIComponent(project.id)}`
          : `${base}/api/projects`,
        {
          method: project ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            project ? common : { ...common, isDemo: draft.isDemo },
          ),
        },
      )

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          apiErrorMessage(result, `Unable to save (${response.status}).`),
        )
      }

      if (typeof result?.id !== 'string') {
        throw new Error(
          'Unexpected save response. Check the Projects list before retrying.',
        )
      }

      uploadedPublicId = null
      dialogRef.current?.close()

      if (project) {
        onSaved?.()
      } else {
        navigate(`/projects/${encodeURIComponent(result.id)}`)
      }
    } catch (err) {
      if (uploadedPublicId) {
        await cleanupUploadedImage(base, uploadedPublicId)
      }

      setError(
        err instanceof TypeError
          ? 'Connection interrupted. Check the Projects list before retrying to avoid duplicates.'
          : err instanceof Error
            ? err.message
            : 'Unable to save the project.',
      )
    } finally {
      submitting.current = false
      setSaving(false)
      setSaveStatus('')
    }
  }

  if (!allowed) return null

  return (
    <>
      <button type="button" className="pf-primary" onClick={openForm}>
        {editing ? (
          <Pencil size={16} aria-hidden="true" />
        ) : (
          <Plus size={16} aria-hidden="true" />
        )}
        {editing ? 'Edit project' : 'Create project'}
      </button>

      <dialog
        ref={dialogRef}
        className="pf-dialog"
        aria-label={editing ? 'Edit project' : 'Create project'}
        onCancel={(event) => {
          if (submitting.current) event.preventDefault()
        }}
      >
        <header className="pf-heading">
          <div>
            <small>PROJECT WORKSPACE</small>
            <h2>{editing ? 'Edit project' : 'Create project'}</h2>
          </div>

          <button
            className="pf-close"
            type="button"
            disabled={saving}
            aria-label="Close form"
            onClick={() => dialogRef.current?.close()}
          >
            <X size={20} />
          </button>
        </header>

        <form className="pf-form" onSubmit={save}>
          <fieldset disabled={saving || !allowed}>
            <label>
              Project name *
              <input
                autoFocus
                required
                minLength={3}
                maxLength={500}
                value={draft.name}
                onChange={(event) => change('name', event.target.value)}
              />
            </label>

            <div className="pf-grid">
              <label>
                State *
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={draft.state}
                  onChange={(event) => change('state', event.target.value)}
                />
              </label>

              <label>
                District *
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={draft.district}
                  onChange={(event) => change('district', event.target.value)}
                />
              </label>

              <label>
                Acquisition stage
                <select
                  value={draft.stage}
                  onChange={(event) => change('stage', event.target.value)}
                >
                  {[
                    'Not specified',
                    'Survey',
                    'Verification',
                    'Award',
                    'Compensation',
                    'Possession',
                  ].map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </label>

              <label>
                Reported progress (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  placeholder="Leave blank if unknown"
                  value={draft.progress}
                  onChange={(event) => change('progress', event.target.value)}
                />
              </label>
            </div>

            <label>
              Description
              <textarea
                rows={3}
                maxLength={3000}
                value={draft.description}
                onChange={(event) => change('description', event.target.value)}
              />
            </label>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#294f44' }}>
                  Project image
                </span>

                {(imagePreview || project?.image) && (
                  <button
                    type="button"
                    onClick={clearImage}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      border: 'none',
                      background: 'transparent',
                      color: '#9a4c45',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                onClick={chooseImage}
                style={{
                  width: '100%',
                  minHeight: 86,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '16px 18px',
                  border: '1px dashed #bfcfc5',
                  borderRadius: 14,
                  background: '#f7faf7',
                  color: '#315f53',
                  cursor: 'pointer',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 42,
                    height: 42,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 12,
                    background: '#e8f0eb',
                  }}
                >
                  {imagePreview ? <ImageIcon size={18} /> : <Upload size={18} />}
                </span>

                <span style={{ textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: 12 }}>
                    {imageFile
                      ? imageFile.name
                      : imagePreview
                        ? 'Replace project image'
                        : 'Choose project image'}
                  </strong>
                  <small
                    style={{
                      display: 'block',
                      marginTop: 3,
                      color: '#7b8b84',
                      fontSize: 10,
                    }}
                  >
                    JPG, PNG or WEBP · maximum 5 MB · stored on Cloudinary
                  </small>
                </span>
              </button>

              {imagePreview && !removeImage && (
                <div
                  style={{
                    marginTop: 10,
                    minHeight: 116,
                    border: '1px solid #dce5df',
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: '#f1f5f1',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {!imageBroken ? (
                    <img
                      src={imagePreview}
                      alt="Project preview"
                      onError={() => setImageBroken(true)}
                      style={{ width: '100%', height: 170, objectFit: 'cover' }}
                    />
                  ) : (
                    <p style={{ margin: 0, padding: 16, color: '#7b8882' }}>
                      Image preview could not be loaded.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="pf-grid">
              <label>
                Sector
                <input
                  value={draft.sector}
                  placeholder="e.g. Railways"
                  onChange={(event) => change('sector', event.target.value)}
                />
              </label>

              <label>
                Line ministry
                <input
                  value={draft.line_ministry}
                  placeholder="e.g. Ministry of Railways"
                  onChange={(event) => change('line_ministry', event.target.value)}
                />
              </label>

              <label>
                Original cost (₹ crore)
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={draft.original_cost_cr}
                  onChange={(event) =>
                    change('original_cost_cr', event.target.value)
                  }
                />
              </label>

              <label>
                Expenditure (₹ crore)
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={draft.expenditure_cr}
                  onChange={(event) => change('expenditure_cr', event.target.value)}
                />
              </label>

              <label>
                Physical progress (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  value={draft.physical_progress_pct}
                  onChange={(event) =>
                    change('physical_progress_pct', event.target.value)
                  }
                />
              </label>

              <label>
                Original completion year
                <input
                  type="number"
                  min={1900}
                  max={2200}
                  value={draft.original_completion_year}
                  onChange={(event) =>
                    change('original_completion_year', event.target.value)
                  }
                />
              </label>

              <label>
                Sanction year
                <input
                  type="number"
                  min={1900}
                  max={2200}
                  value={draft.sanction_year}
                  onChange={(event) => change('sanction_year', event.target.value)}
                />
              </label>
            </div>

            <label>
              Record type
              <select
                disabled={editing}
                value={draft.isDemo ? 'demo' : 'source'}
                onChange={(event) =>
                  change('isDemo', event.target.value === 'demo')
                }
              >
                <option value="demo">Demo — illustrative</option>
                <option value="source">Non-demo — source required</option>
              </select>
            </label>

            <p className="pf-note">
              Adding a source does not automatically verify a record.
              {editing && ' Record type is fixed for existing projects.'}
            </p>

            <div className="pf-grid">
              <label>
                Source name {!draft.isDemo && '*'}
                <input
                  required={!draft.isDemo}
                  maxLength={200}
                  value={draft.sourceName}
                  onChange={(event) => change('sourceName', event.target.value)}
                />
              </label>

              <label>
                Source URL {!draft.isDemo && '*'}
                <input
                  type="url"
                  required={!draft.isDemo}
                  placeholder="https://..."
                  value={draft.sourceUrl}
                  onChange={(event) => change('sourceUrl', event.target.value)}
                />
              </label>

              <label>
                Source record ID
                <input
                  maxLength={200}
                  value={draft.sourceRecordId}
                  onChange={(event) =>
                    change('sourceRecordId', event.target.value)
                  }
                />
              </label>

              <label>
                Source date
                <input
                  type="date"
                  value={draft.sourceDate}
                  onChange={(event) => change('sourceDate', event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          {error && (
            <p className="pf-error" role="alert">
              {error}
            </p>
          )}

          <div className="pf-actions">
            <button
              type="button"
              className="pf-secondary"
              disabled={saving}
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </button>

            <button type="submit" className="pf-primary" disabled={saving}>
              {saving
                ? saveStatus || 'Saving…'
                : editing
                  ? 'Save changes'
                  : 'Create project'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
