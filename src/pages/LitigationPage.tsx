import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Scale,
} from 'lucide-react'

import { useAuth } from '../auth/AuthContext'

import '../styles/litigation.css'


const API = (
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/+$/, '')


const statuses = [
  'Pending',
  'Disposed',
  'Status under verification',
] as const


type Project = {
  id: string
  name: string
  isDemo: boolean
}


type Parcel = {
  id: string
  surveyNumber: string
  village: string
}


type CaseRecord = {
  id: string
  projectId: string
  project: string
  parcelId: string | null
  title: string
  reference: string
  court: string
  status: string
  filedOn: string | null
  nextHearing: string | null
  officer: string
  notes: string
  isDemo: boolean
  sourceName: string | null
  sourceUrl: string | null
}


type Draft = {
  projectId: string
  parcelId: string
  title: string
  reference: string
  court: string
  status: string
  filedOn: string
  nextHearing: string
  officer: string
  notes: string
  isDemo: boolean
  sourceName: string
  sourceUrl: string
}


const emptyDraft: Draft = {
  projectId: '',
  parcelId: '',
  title: '',
  reference: '',
  court: '',
  status: 'Status under verification',
  filedOn: '',
  nextHearing: '',
  officer: '',
  notes: '',
  isDemo: true,
  sourceName: '',
  sourceUrl: '',
}


async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response =
    await fetch(
      `${API}${path}`,
      options,
    )

  const body =
    await response
      .json()
      .catch(() => null)

  if (!response.ok) {
    const detail =
      body?.detail

    throw new Error(
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail
              .map(
                (
                  item: {
                    msg: string
                  },
                ) =>
                  item.msg,
              )
              .join(' ')
          : `Request failed (${response.status}).`,
    )
  }

  return body as T
}


function message(
  error: unknown,
) {
  return error instanceof Error
    ? error.message
    : 'Request failed.'
}


function displayDate(
  value: string | null,
) {
  if (!value) {
    return 'Not recorded'
  }

  const date =
    new Date(
      `${value}T00:00:00`,
    )

  return Number.isNaN(
    date.getTime(),
  )
    ? 'Not recorded'
    : date.toLocaleDateString(
        'en-IN',
      )
}


export default function LitigationPage() {
  const {
    can,
  } = useAuth()

  const canManageWorkflow =
    can('workflow.manage')


  const [
    cases,
    setCases,
  ] =
    useState<
      CaseRecord[]
    >([])

  const [
    projects,
    setProjects,
  ] =
    useState<
      Project[]
    >([])

  const [
    parcels,
    setParcels,
  ] =
    useState<
      Parcel[]
    >([])

  const [
    totalParcels,
    setTotalParcels,
  ] =
    useState(0)

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    parcelLoading,
    setParcelLoading,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    parcelError,
    setParcelError,
  ] =
    useState('')

  const [
    saveError,
    setSaveError,
  ] =
    useState('')

  const [
    success,
    setSuccess,
  ] =
    useState('')

  const [
    reload,
    setReload,
  ] =
    useState(0)

  const [
    parcelReload,
    setParcelReload,
  ] =
    useState(0)


  const [
    query,
    setQuery,
  ] =
    useState('')

  const [
    status,
    setStatus,
  ] =
    useState('')

  const [
    projectFilter,
    setProjectFilter,
  ] =
    useState('')

  const [
    selected,
    setSelected,
  ] =
    useState<
      CaseRecord | null
    >(null)


  const [
    formOpen,
    setFormOpen,
  ] =
    useState(false)

  const [
    editingId,
    setEditingId,
  ] =
    useState<
      string | null
    >(null)

  const [
    draft,
    setDraft,
  ] =
    useState<Draft>({
      ...emptyDraft,
    })

  const [
    saving,
    setSaving,
  ] =
    useState(false)


  const saveLock =
    useRef(false)

  const formRef =
    useRef<HTMLElement>(
      null,
    )


  useEffect(() => {
    const controller =
      new AbortController()

    setLoading(true)
    setError('')

    Promise.all([
      request<{
        items:
          CaseRecord[]
      }>(
        '/api/litigation',
        {
          signal:
            controller.signal,
        },
      ),

      request<{
        items:
          Project[]
      }>(
        '/api/projects',
        {
          signal:
            controller.signal,
        },
      ),
    ])
      .then(
        ([
          caseData,
          projectData,
        ]) => {
          if (
            controller
              .signal
              .aborted
          ) {
            return
          }

          setCases(
            caseData.items,
          )

          setProjects(
            projectData.items,
          )
        },
      )
      .catch(
        (error) => {
          if (
            !controller
              .signal
              .aborted
          ) {
            setError(
              message(
                error,
              ),
            )
          }
        },
      )
      .finally(
        () => {
          if (
            !controller
              .signal
              .aborted
          ) {
            setLoading(
              false,
            )
          }
        },
      )

    return () =>
      controller.abort()
  }, [reload])


  useEffect(() => {
    const controller =
      new AbortController()

    setParcels([])
    setTotalParcels(0)
    setParcelError('')

    if (
      !formOpen ||
      !draft.projectId
    ) {
      setParcelLoading(
        false,
      )

      return () =>
        controller.abort()
    }

    setParcelLoading(
      true,
    )

    request<{
      items: Parcel[]
      total: number
    }>(
      `/api/parcels?projectId=${encodeURIComponent(
        draft.projectId,
      )}&limit=100`,
      {
        signal:
          controller.signal,
      },
    )
      .then(
        (data) => {
          if (
            controller
              .signal
              .aborted
          ) {
            return
          }

          setParcels(
            data.items,
          )

          setTotalParcels(
            data.total,
          )
        },
      )
      .catch(
        (error) => {
          if (
            !controller
              .signal
              .aborted
          ) {
            setParcelError(
              message(
                error,
              ),
            )
          }
        },
      )
      .finally(
        () => {
          if (
            !controller
              .signal
              .aborted
          ) {
            setParcelLoading(
              false,
            )
          }
        },
      )

    return () =>
      controller.abort()
  }, [
    draft.projectId,
    formOpen,
    parcelReload,
  ])


  useEffect(() => {
    if (formOpen) {
      formRef.current
        ?.focus()
    }
  }, [
    formOpen,
    editingId,
  ])


  function change<
    K extends keyof Draft
  >(
    key: K,
    value: Draft[K],
  ) {
    setDraft(
      (current) => ({
        ...current,
        [key]: value,
      }),
    )

    setSaveError('')
  }


  function openForm(
    item?: CaseRecord,
  ) {
    if (
      !canManageWorkflow
    ) {
      return
    }

    setEditingId(
      item?.id ?? null,
    )

    setSaveError('')
    setSuccess('')

    setDraft(
      item
        ? {
            projectId:
              item.projectId,

            parcelId:
              item.parcelId ??
              '',

            title:
              item.title,

            reference:
              item.reference,

            court:
              item.court,

            status:
              item.status,

            filedOn:
              item.filedOn ??
              '',

            nextHearing:
              item.nextHearing ??
              '',

            officer:
              item.officer ??
              '',

            notes:
              item.notes ??
              '',

            isDemo:
              item.isDemo,

            sourceName:
              item.sourceName ??
              '',

            sourceUrl:
              item.sourceUrl ??
              '',
          }
        : {
            ...emptyDraft,

            projectId:
              projects[0]
                ?.id ??
              '',
          },
    )

    setFormOpen(
      true,
    )
  }


  async function save(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !canManageWorkflow ||
      saveLock.current
    ) {
      return
    }

    saveLock.current =
      true

    setSaving(true)
    setSaveError('')
    setSuccess('')

    const payload = {
      ...draft,

      title:
        draft.title.trim(),

      reference:
        draft.reference.trim(),

      court:
        draft.court.trim(),

      officer:
        draft.officer.trim(),

      notes:
        draft.notes.trim(),

      parcelId:
        draft.parcelId ||
        null,

      filedOn:
        draft.filedOn ||
        null,

      nextHearing:
        draft.nextHearing ||
        null,

      sourceName:
        draft.sourceName
          .trim() ||
        null,

      sourceUrl:
        draft.sourceUrl
          .trim() ||
        null,
    }

    try {
      const saved =
        await request<CaseRecord>(
          editingId
            ? `/api/litigation/${editingId}`
            : '/api/litigation',
          {
            method:
              editingId
                ? 'PUT'
                : 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        )

      setCases(
        (current) =>
          editingId
            ? current.map(
                (item) =>
                  item.id ===
                  saved.id
                    ? saved
                    : item,
              )
            : [
                saved,
                ...current,
              ].slice(
                0,
                100,
              ),
      )

      setSelected(
        saved,
      )

      setFormOpen(
        false,
      )

      setSuccess(
        editingId
          ? 'Case updated.'
          : 'Case created and saved.',
      )
    } catch (
      error
    ) {
      setSaveError(
        message(
          error,
        ),
      )
    } finally {
      saveLock.current =
        false

      setSaving(
        false,
      )
    }
  }


  const filtered =
    cases.filter(
      (item) => {
        const text =
          `${item.reference} ${item.title} ${item.court} ${item.project}`
            .toLowerCase()

        return (
          text.includes(
            query
              .trim()
              .toLowerCase(),
          ) &&
          (
            !status ||
            item.status ===
              status
          ) &&
          (
            !projectFilter ||
            item.projectId ===
              projectFilter
          )
        )
      },
    )


  const knownProject =
    projects.some(
      (item) =>
        item.id ===
        draft.projectId,
    )


  const knownParcel =
    parcels.some(
      (item) =>
        item.id ===
        draft.parcelId,
    )


  return (
    <div className="lit-page">

      <style>{`
        .lit-page .lc-box {
          background:#fff;
          border:1px solid #d6dfcf;
          border-radius:10px;
          padding:24px;
          margin:20px 0;
          color:#203d32;
        }

        .lit-page .lc-box h2,
        .lit-page .lc-box h3 {
          color:#193f36;
          margin:0 0 14px;
        }

        .lit-page .lc-box p {
          line-height:1.6;
          margin:10px 0;
        }

        .lit-page .lc-grid {
          display:grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0,1fr)
            );
          gap:18px;
          margin:18px 0;
        }

        .lit-page .lc-box label {
          display:grid;
          gap:8px;
          font-size:13px;
        }

        .lit-page .lc-box input,
        .lit-page .lc-box select,
        .lit-page .lc-box textarea {
          width:100%;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #ccd8c5;
          border-radius:6px;
          background:#fff;
          color:#193f36;
          font:inherit;
        }

        .lit-page .lc-box textarea {
          resize:vertical;
        }

        .lit-page .lc-wide {
          grid-column:1/-1;
        }

        .lit-page .lc-actions {
          display:flex;
          gap:12px;
          flex-wrap:wrap;
        }

        .lit-page .lc-button {
          display:inline-flex;
          align-items:center;
          gap:8px;
          background:#193f36;
          color:#fff !important;
          border:1px solid #193f36;
          border-radius:6px;
          padding:11px 16px;
          cursor:pointer;
          text-decoration:none;
        }

        .lit-page .lc-secondary {
          background:#fff;
          color:#193f36 !important;
        }

        .lit-page button:disabled {
          opacity:.6;
          cursor:default;
        }

        .lit-page .lc-box fieldset {
          border:0;
          margin:0;
          padding:0;
          min-width:0;
        }

        .lit-page .lc-error {
          background:#fff0ed;
          color:#8b2920;
          padding:12px;
        }

        .lit-page .lc-success {
          background:#edf4e5;
          color:#193f36;
          padding:12px;
        }

        .lit-page .lc-facts {
          display:grid;
          gap:12px;
        }

        .lit-page .lc-facts div {
          border-bottom:
            1px solid #d6dfcf;
          padding:10px 0;
          overflow-wrap:anywhere;
        }

        .lit-page .lc-facts dt {
          font-size:12px;
        }

        .lit-page .lc-facts dd {
          margin:6px 0 0;
        }

        .lit-page .lc-box
        :focus-visible {
          outline:
            2px solid #b9944c;
          outline-offset:3px;
        }

        @media(max-width:640px) {
          .lit-page .lc-grid {
            grid-template-columns:
              1fr;
          }

          .lit-page .lc-box {
            padding:16px;
          }
        }
      `}</style>


      <header className="lit-header">

        <Link
          to="/"
          className="lit-brand"
        >
          Liva
          <span>.</span>
        </Link>


        <nav
          aria-label="
            Workspace navigation
          "
        >
          <Link to="/dashboard">
            Overview
          </Link>

          <Link to="/projects">
            Projects
          </Link>

          <Link to="/parcels">
            Land Parcels
          </Link>

          <Link to="/documents">
            Documents
          </Link>

          <Link
            to="/litigation"
            aria-current="page"
          >
            Litigation
          </Link>
        </nav>


        <Link
          to="/dashboard"
          className="lit-back"
        >
          <ArrowLeft
            size={16}
          />

          Dashboard
        </Link>

      </header>


      <main className="lit-main">

        <div className="lit-breadcrumb">
          <Link to="/dashboard">
            Workspace
          </Link>

          <span>/</span>

          <span>
            Court & Litigation
          </span>
        </div>


        <section className="lit-banner">

          <img
            src="/images/liva-litigation-banner.png"
            alt=""
            onError={
              (event) => {
                const image =
                  event.currentTarget

                if (
                  !image.dataset
                    .fallback
                ) {
                  image.dataset
                    .fallback =
                    'used'

                  image.src =
                    '/images/liva-court.png'
                } else {
                  image.style
                    .visibility =
                    'hidden'
                }
              }
            }
          />


          <div
            className="
              lit-banner-shade
            "
          />


          <div
            className="
              lit-banner-copy
            "
          >
            <p className="lit-eyebrow">
              COURT & LITIGATION
            </p>

            <h1>
              Keep legal matters
              <br />
              in project context.
            </h1>

            <p>
              Record case references,
              hearing dates and
              responsible officers.
            </p>
          </div>

        </section>


        <section className="lc-box">

          <h2>
            <Scale size={22} />

            Case registry
          </h2>

          <p>
            Latest 100 case records.
            Demo records are included;
            source links do not
            independently verify a case.
          </p>


          <div className="lc-actions">

            {canManageWorkflow && (
              <button
                type="button"
                className="lc-button"
                disabled={
                  loading ||
                  !!error ||
                  !projects.length ||
                  formOpen
                }
                onClick={() =>
                  openForm()
                }
              >
                <Plus size={16} />

                Add case
              </button>
            )}


            <button
              type="button"
              className="
                lc-button
                lc-secondary
              "
              disabled={
                loading ||
                formOpen
              }
              onClick={() =>
                setReload(
                  (value) =>
                    value + 1,
                )
              }
            >
              Refresh
            </button>

          </div>


          {success && (
            <p
              className="
                lc-success
              "
              role="status"
            >
              {success}
            </p>
          )}


          {error && (
            <p
              className="
                lc-error
              "
              role="alert"
            >
              {error}
            </p>
          )}


          {loading && (
            <p role="status">
              Loading cases and
              projects…
            </p>
          )}


          {!loading &&
            !error &&
            !projects.length && (
              <p>
                Create a project first
                to link a case.
              </p>
            )}

        </section>


        {formOpen && (
          <section
            className="lc-box"
            ref={formRef}
            tabIndex={-1}
            aria-labelledby="
              lc-form-title
            "
          >

            <h2 id="lc-form-title">
              {editingId
                ? 'Edit case'
                : 'Create case'}
            </h2>


            <form
              onSubmit={save}
            >

              <fieldset
                disabled={
                  saving ||
                  !canManageWorkflow
                }
              >

                <div className="lc-grid">

                  <label>
                    Project *

                    <select
                      required
                      value={
                        draft.projectId
                      }
                      onChange={
                        (event) => {
                          setParcels(
                            [],
                          )

                          setDraft(
                            (
                              current,
                            ) => ({
                              ...current,

                              projectId:
                                event
                                  .target
                                  .value,

                              parcelId:
                                '',
                            }),
                          )
                        }
                      }
                    >
                      <option value="">
                        Select project
                      </option>


                      {draft.projectId &&
                        !knownProject && (
                          <option
                            value={
                              draft
                                .projectId
                            }
                          >
                            Current linked
                            project
                          </option>
                        )}


                      {projects.map(
                        (item) => (
                          <option
                            key={
                              item.id
                            }
                            value={
                              item.id
                            }
                          >
                            {
                              item.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>


                  <label>
                    Parcel — optional

                    <select
                      value={
                        draft.parcelId
                      }
                      disabled={
                        parcelLoading ||
                        !!parcelError
                      }
                      onChange={
                        (event) =>
                          change(
                            'parcelId',
                            event
                              .target
                              .value,
                          )
                      }
                    >
                      <option value="">
                        Project-level case
                      </option>


                      {draft.parcelId &&
                        !knownParcel && (
                          <option
                            value={
                              draft
                                .parcelId
                            }
                          >
                            Current parcel:
                            {' '}
                            {
                              draft
                                .parcelId
                            }
                          </option>
                        )}


                      {parcels.map(
                        (item) => (
                          <option
                            key={
                              item.id
                            }
                            value={
                              item.id
                            }
                          >
                            {
                              item
                                .surveyNumber
                            }
                            {' — '}
                            {
                              item
                                .village
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>


                  {[
                    [
                      'title',
                      'Case title',
                      3,
                      200,
                    ],

                    [
                      'reference',
                      'Case number / CNR',
                      2,
                      100,
                    ],

                    [
                      'court',
                      'Court',
                      2,
                      200,
                    ],

                    [
                      'officer',
                      'Responsible officer',
                      0,
                      150,
                    ],
                  ].map(
                    (
                      [
                        key,
                        label,
                        min,
                        max,
                      ],
                    ) => (
                      <label
                        key={
                          String(
                            key,
                          )
                        }
                      >
                        {label}
                        {Number(min) > 0
                          ? ' *'
                          : ''}

                        <input
                          value={
                            String(
                              draft[
                                key as keyof Draft
                              ],
                            )
                          }
                          onChange={
                            (event) =>
                              change(
                                key as
                                  | 'title'
                                  | 'reference'
                                  | 'court'
                                  | 'officer',

                                event
                                  .target
                                  .value,
                              )
                          }
                          required={
                            Number(
                              min,
                            ) > 0
                          }
                          minLength={
                            Number(
                              min,
                            )
                          }
                          maxLength={
                            Number(
                              max,
                            )
                          }
                        />
                      </label>
                    ),
                  )}


                  <label>
                    Case status

                    <select
                      value={
                        draft.status
                      }
                      onChange={
                        (event) => {
                          const value =
                            event
                              .target
                              .value

                          setDraft(
                            (
                              current,
                            ) => ({
                              ...current,

                              status:
                                value,

                              nextHearing:
                                value ===
                                'Disposed'
                                  ? ''
                                  : current
                                      .nextHearing,
                            }),
                          )
                        }
                      }
                    >
                      {statuses.map(
                        (item) => (
                          <option
                            key={
                              item
                            }
                          >
                            {item}
                          </option>
                        ),
                      )}
                    </select>
                  </label>


                  <label>
                    Record type

                    <select
                      value={
                        draft.isDemo
                          ? 'demo'
                          : 'source'
                      }
                      onChange={
                        (event) =>
                          change(
                            'isDemo',
                            event
                              .target
                              .value ===
                              'demo',
                          )
                      }
                    >
                      <option value="demo">
                        Demo — illustrative
                      </option>

                      <option value="source">
                        Source-backed
                        record
                      </option>
                    </select>
                  </label>


                  <label>
                    Filed on

                    <input
                      type="date"
                      value={
                        draft.filedOn
                      }
                      onChange={
                        (event) =>
                          change(
                            'filedOn',
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>


                  <label>
                    Next hearing

                    <input
                      type="date"
                      disabled={
                        draft.status ===
                        'Disposed'
                      }
                      min={
                        draft.filedOn ||
                        undefined
                      }
                      value={
                        draft.nextHearing
                      }
                      onChange={
                        (event) =>
                          change(
                            'nextHearing',
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>


                  <label>
                    Source name
                    {!draft.isDemo &&
                      ' *'}

                    <input
                      required={
                        !draft.isDemo
                      }
                      maxLength={200}
                      value={
                        draft.sourceName
                      }
                      onChange={
                        (event) =>
                          change(
                            'sourceName',
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>


                  <label>
                    Source URL
                    {!draft.isDemo &&
                      ' *'}

                    <input
                      type="url"
                      required={
                        !draft.isDemo
                      }
                      value={
                        draft.sourceUrl
                      }
                      placeholder="https://..."
                      onChange={
                        (event) =>
                          change(
                            'sourceUrl',
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>


                  <label
                    className="
                      lc-wide
                    "
                  >
                    Notes

                    <textarea
                      rows={4}
                      maxLength={5000}
                      value={
                        draft.notes
                      }
                      onChange={
                        (event) =>
                          change(
                            'notes',
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>

                </div>


                {parcelLoading && (
                  <p role="status">
                    Loading project
                    parcels…
                  </p>
                )}


                {totalParcels >
                  100 && (
                  <p>
                    Showing the latest
                    100 parcels for this
                    project.
                  </p>
                )}


                {parcelError && (
                  <div>

                    <p
                      className="
                        lc-error
                      "
                      role="alert"
                    >
                      {parcelError}
                    </p>


                    <button
                      type="button"
                      className="
                        lc-button
                        lc-secondary
                      "
                      onClick={() =>
                        setParcelReload(
                          (
                            value,
                          ) =>
                            value + 1,
                        )
                      }
                    >
                      Retry parcels
                    </button>

                  </div>
                )}


                {saveError && (
                  <p
                    className="
                      lc-error
                    "
                    role="alert"
                  >
                    {saveError}
                  </p>
                )}


                <div className="lc-actions">

                  <button
                    className="lc-button"
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving…'
                      : editingId
                        ? 'Save changes'
                        : 'Create case'}
                  </button>


                  <button
                    type="button"
                    className="
                      lc-button
                      lc-secondary
                    "
                    disabled={saving}
                    onClick={() =>
                      setFormOpen(
                        false,
                      )
                    }
                  >
                    Cancel
                  </button>

                </div>

              </fieldset>

            </form>

          </section>
        )}


        {!loading &&
          !error && (
          <section className="lc-box">

            <div className="lc-grid">

              <label>
                Search

                <input
                  type="search"
                  placeholder="
                    Case number, title,
                    court or project
                  "
                  value={query}
                  onChange={
                    (event) =>
                      setQuery(
                        event
                          .target
                          .value,
                      )
                  }
                />
              </label>


              <label>
                Case status

                <select
                  value={status}
                  onChange={
                    (event) =>
                      setStatus(
                        event
                          .target
                          .value,
                      )
                  }
                >
                  <option value="">
                    All statuses
                  </option>

                  {statuses.map(
                    (item) => (
                      <option
                        key={item}
                      >
                        {item}
                      </option>
                    ),
                  )}
                </select>
              </label>


              <label>
                Project

                <select
                  value={
                    projectFilter
                  }
                  onChange={
                    (event) =>
                      setProjectFilter(
                        event
                          .target
                          .value,
                      )
                  }
                >
                  <option value="">
                    All projects
                  </option>

                  {Array.from(
                    new Map(
                      cases.map(
                        (item) => [
                          item.projectId,
                          item.project,
                        ],
                      ),
                    ),
                  ).map(
                    ([
                      id,
                      name,
                    ]) => (
                      <option
                        key={id}
                        value={id}
                      >
                        {name}
                      </option>
                    ),
                  )}
                </select>
              </label>

            </div>


            <p>
              {filtered.length}
              {' shown · '}
              {cases.length}
              {' loaded'}
            </p>


            <div className="lit-table-scroll">

              <table className="lit-table">

                <thead>
                  <tr>
                    <th>
                      Case reference
                    </th>

                    <th>
                      Court / Project
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Next hearing
                    </th>

                    <th>
                      Details
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {filtered.map(
                    (item) => (
                      <tr
                        key={
                          item.id
                        }
                      >

                        <td>
                          <strong>
                            {
                              item
                                .reference
                            }
                          </strong>

                          <span>
                            {
                              item
                                .title
                            }
                          </span>

                          {item.isDemo && (
                            <small>
                              Demo record
                            </small>
                          )}
                        </td>


                        <td>
                          <strong>
                            {
                              item
                                .court
                            }
                          </strong>

                          <span>
                            {
                              item
                                .project
                            }
                          </span>
                        </td>


                        <td>
                          {
                            item
                              .status
                          }
                        </td>


                        <td>
                          {displayDate(
                            item
                              .nextHearing,
                          )}
                        </td>


                        <td>
                          <button
                            type="button"
                            className="
                              lc-button
                              lc-secondary
                            "
                            onClick={() =>
                              setSelected(
                                item,
                              )
                            }
                          >
                            View

                            <ArrowRight
                              size={14}
                            />
                          </button>
                        </td>

                      </tr>
                    ),
                  )}

                </tbody>

              </table>

            </div>


            {!filtered.length && (
              <p>
                {canManageWorkflow
                  ? 'No matching cases. Add a case or change the filters.'
                  : 'No matching cases. Change the filters.'}
              </p>
            )}

          </section>
        )}


        {selected && (
          <section className="lc-box">

            <h2>
              {
                selected
                  .reference
              }
            </h2>

            <h3>
              {
                selected
                  .title
              }
            </h3>


            <dl className="lc-facts">

              {[
                [
                  'Court',
                  selected.court,
                ],

                [
                  'Project',
                  selected.project,
                ],

                [
                  'Parcel ID',
                  selected.parcelId ||
                    'Project-level case',
                ],

                [
                  'Status',
                  selected.status,
                ],

                [
                  'Filed on',
                  displayDate(
                    selected
                      .filedOn,
                  ),
                ],

                [
                  'Next hearing',
                  displayDate(
                    selected
                      .nextHearing,
                  ),
                ],

                [
                  'Responsible officer',
                  selected.officer ||
                    'Not recorded',
                ],

                [
                  'Source',
                  selected.sourceName ||
                    'Not recorded',
                ],

                [
                  'Notes',
                  selected.notes ||
                    'Not recorded',
                ],
              ].map(
                ([
                  label,
                  value,
                ]) => (
                  <div
                    key={
                      label
                    }
                  >
                    <dt>
                      {label}
                    </dt>

                    <dd>
                      {value}
                    </dd>
                  </div>
                ),
              )}

            </dl>


            {selected.sourceUrl &&
              /^https?:\/\//i.test(
                selected
                  .sourceUrl,
              ) && (
                <p>
                  <a
                    href={
                      selected
                        .sourceUrl
                    }
                    target="_blank"
                    rel="
                      noopener
                      noreferrer
                    "
                  >
                    Open source
                  </a>
                </p>
              )}


            <p>
              Hearing history,
              order attachments and
              follow-up tasks are not
              connected yet. Case
              duration estimates are
              unavailable.
            </p>


            <div className="lc-actions">

              {canManageWorkflow && (
                <button
                  type="button"
                  className="lc-button"
                  disabled={
                    formOpen
                  }
                  onClick={() =>
                    openForm(
                      selected,
                    )
                  }
                >
                  Edit case
                </button>
              )}


              <Link
                to={`/projects/${selected.projectId}`}
                className="
                  lc-button
                  lc-secondary
                "
              >
                Open project
              </Link>


              <button
                type="button"
                className="
                  lc-button
                  lc-secondary
                "
                onClick={() =>
                  setSelected(
                    null,
                  )
                }
              >
                Close details
              </button>

            </div>

          </section>
        )}


        <p className="lit-footnote">
          Recorded case information ·
          Banner is illustrative
        </p>

      </main>


      <footer className="lit-footer">
        <strong>
          Liva
        </strong>

        <span>
          Better land decisions.
          Stronger communities.
        </span>
      </footer>

    </div>
  )
}