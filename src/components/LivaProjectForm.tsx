import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useFlash } from '../context/FlashContext'
import '../styles/project-form.css'

type LivaProject = {
  id: string
  name: string
  surveyNumber: string
  ownerName?: string
  village: string
  district: string
  state: string
  pincode?: string
  area?: string
  stage: string
  progress: number | null
}

type Draft = {
  name: string
  surveyNumber: string
  ownerName: string
  village: string
  district: string
  state: string
  pincode: string
  area: string
  stage: string
  progress: string
}

function makeDraft(project: LivaProject): Draft {
  return {
    name: project.name,
    surveyNumber: project.surveyNumber,
    ownerName: project.ownerName ?? '',
    village: project.village,
    district: project.district,
    state: project.state,
    pincode: project.pincode ?? '',
    area: project.area ?? '',
    stage: project.stage,
    progress: project.progress == null ? '' : String(project.progress),
  }
}

function errorText(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback
  const detail = (body as { detail?: unknown }).detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => {
      if (!item || typeof item !== 'object') return 'Invalid value'
      const entry = item as { loc?: unknown; msg?: unknown }
      const field = Array.isArray(entry.loc) ? entry.loc.filter((part) => typeof part === 'string').join(' → ') : ''
      const message = typeof entry.msg === 'string' ? entry.msg : 'Invalid value'
      return field ? `${field}: ${message}` : message
    }).join(' · ')
  }
  return fallback
}

export default function LivaProjectForm({
  project,
  onSaved,
}: {
  project: LivaProject
  onSaved: () => void
}) {
  const { can } = useAuth()
  const { success, error: flashError } = useFlash()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState(() => makeDraft(project))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const allowed = can('projects.edit')

  if (!allowed) return null

  function open() {
    setDraft(makeDraft(project))
    setError('')
    dialogRef.current?.showModal()
  }

  function change(key: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
    setError('')
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')

    const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
    const payload = {
      projectName: draft.name.trim(),
      surveyNumber: draft.surveyNumber.trim(),
      ownerName: draft.ownerName.trim(),
      village: draft.village.trim(),
      district: draft.district.trim(),
      state: draft.state.trim(),
      pincode: draft.pincode.trim(),
      area: draft.area.trim(),
      status: draft.stage.trim(),
      progress: draft.progress === '' ? null : Number(draft.progress),
    }

    try {
      const response = await fetch(`${base}/api/liva/projects/${encodeURIComponent(project.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body: unknown = await response.json().catch(() => null)
      if (!response.ok) throw new Error(errorText(body, `Unable to save project (${response.status}).`))
      const result = body as Record<string, unknown> | null
      if (!result || result.projectId !== project.id) throw new Error('The project response could not be confirmed. Refresh before retrying.')
      dialogRef.current?.close()
      success('Project details updated.')
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save project details.'
      setError(message)
      flashError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button type="button" className="pf-primary" onClick={open}>
        <Pencil size={16} aria-hidden="true" /> Edit project details
      </button>
      <dialog ref={dialogRef} className="pf-dialog" aria-label="Edit LIVA project details" onCancel={(event) => { if (saving) event.preventDefault() }}>
        <header className="pf-heading">
          <div><small>PROJECT WORKSPACE</small><h2>Edit project details</h2></div>
          <button className="pf-close" type="button" disabled={saving} aria-label="Close form" onClick={() => dialogRef.current?.close()}><X size={20} /></button>
        </header>
        <form className="pf-form" onSubmit={save}>
          <fieldset disabled={saving}>
            <div className="pf-grid">
              <label>Project name *<input required minLength={3} maxLength={250} value={draft.name} onChange={(event) => change('name', event.target.value)} /></label>
              <label>Survey number *<input required maxLength={100} value={draft.surveyNumber} onChange={(event) => change('surveyNumber', event.target.value)} /></label>
              <label>Landowner name *<input required minLength={2} maxLength={150} value={draft.ownerName} onChange={(event) => change('ownerName', event.target.value)} /></label>
              <label>Village *<input required minLength={2} maxLength={150} value={draft.village} onChange={(event) => change('village', event.target.value)} /></label>
              <label>District *<input required minLength={2} maxLength={100} value={draft.district} onChange={(event) => change('district', event.target.value)} /></label>
              <label>State *<input required minLength={2} maxLength={100} value={draft.state} onChange={(event) => change('state', event.target.value)} /></label>
              <label>PIN code *<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={draft.pincode} onChange={(event) => change('pincode', event.target.value)} /></label>
              <label>Proposed area *<input required maxLength={80} value={draft.area} onChange={(event) => change('area', event.target.value)} /></label>
              <label>Project status<input maxLength={40} value={draft.stage} onChange={(event) => change('stage', event.target.value)} /></label>
              <label>Progress (%)<input type="number" min={0} max={100} step="any" value={draft.progress} onChange={(event) => change('progress', event.target.value)} placeholder="Leave blank if not recorded" /></label>
            </div>
            {error && <p className="pf-error" role="alert">{error}</p>}
          </fieldset>
          <footer className="pf-actions">
            <button type="button" className="pf-secondary" disabled={saving} onClick={() => dialogRef.current?.close()}>Cancel</button>
            <button type="submit" className="pf-primary" disabled={saving}>{saving ? 'Saving…' : 'Save project'}</button>
          </footer>
        </form>
      </dialog>
    </>
  )
}
