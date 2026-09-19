import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Link,
} from 'react-router'

import {
  WORKFLOW_API,
  workflowError,
  workflowRequest,
} from '../services/workflowApi'

import WorkflowSummary from '../components/WorkflowSummary'

import {
  useAuth,
} from '../auth/AuthContext'

import '../styles/workflow.css'


type Project = {
  id: string
  name: string
}


export default function ReportsPage() {
  const {
    can,
  } = useAuth()

  const canExportReports =
    can('reports.export')


  const [
    projectId,
    setProjectId,
  ] = useState('')

  const [
    projects,
    setProjects,
  ] = useState<Project[]>([])

  const [
    kind,
    setKind,
  ] = useState(
    'compensation',
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    projectError,
    setProjectError,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  const [
    busy,
    setBusy,
  ] = useState(false)

  const [
    retry,
    setRetry,
  ] = useState(0)


  const lock =
    useRef(false)


  useEffect(() => {
    const controller =
      new AbortController()

    setLoading(true)
    setProjectError('')

    workflowRequest<{
      items: Project[]
    }>(
      '/api/projects',
      {
        signal:
          controller.signal,
      },
    )
      .then((data) => {
        if (
          !controller.signal.aborted
        ) {
          setProjects(
            data.items,
          )
        }
      })
      .catch((error) => {
        if (
          !controller.signal.aborted
        ) {
          setProjectError(
            workflowError(
              error,
            ),
          )
        }
      })
      .finally(() => {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false)
        }
      })

    return () =>
      controller.abort()
  }, [retry])


  async function download() {
    if (!canExportReports) {
      return
    }

    if (lock.current) {
      return
    }

    lock.current = true

    setBusy(true)
    setError('')

    try {
      const query =
        projectId
          ? `?projectId=${encodeURIComponent(
              projectId,
            )}`
          : ''

      const response =
        await fetch(
          `${WORKFLOW_API}/api/workflow/reports/${kind}.csv${query}`,
        )

      if (!response.ok) {
        const body =
          await response
            .json()
            .catch(
              () => null,
            )

        throw new Error(
          typeof body?.detail ===
            'string'
            ? body.detail
            : `Export failed (${response.status}).`,
        )
      }

      const url =
        URL.createObjectURL(
          await response.blob(),
        )

      const anchor =
        document.createElement(
          'a',
        )

      anchor.href = url

      anchor.download =
        `liva-${kind}.csv`

      document.body.appendChild(
        anchor,
      )

      anchor.click()
      anchor.remove()

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            url,
          ),
        1000,
      )
    } catch (error) {
      setError(
        workflowError(
          error,
        ),
      )
    } finally {
      lock.current = false
      setBusy(false)
    }
  }


  return (
    <div className="wf-page">

      <header className="wf-nav">
        <Link
          to="/projects"
          className="wf-brand"
        >
          Liva.
        </Link>

        <nav aria-label="Workspace">
          <Link to="/dashboard">
            Overview
          </Link>

          <Link to="/compensation">
            Compensation
          </Link>

          <Link to="/rehabilitation">
            R&R
          </Link>

          <Link to="/actions">
            Actions
          </Link>
        </nav>
      </header>


      <main className="wf-main">

        <section className="wf-hero">
          <h1>
            Reports from saved records.
          </h1>

          <p>
            Download project records
            as CSV for review and
            discussion.
          </p>
        </section>


        <section className="wf-box">

          <h2>
            Prepare a report
          </h2>


          {loading && (
            <p role="status">
              Loading project choices…
            </p>
          )}


          {projectError && (
            <div
              className="wf-error"
              role="alert"
            >
              <p>
                {projectError}
              </p>

              <button
                type="button"
                onClick={() =>
                  setRetry(
                    (value) =>
                      value + 1,
                  )
                }
              >
                Retry
              </button>
            </div>
          )}


          <div className="wf-grid">

            <label>
              Project

              <select
                disabled={
                  busy ||
                  loading ||
                  !!projectError
                }
                value={
                  projectId
                }
                onChange={
                  (event) =>
                    setProjectId(
                      event
                        .target
                        .value,
                    )
                }
              >
                <option value="">
                  All projects
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={
                        project.id
                      }
                      value={
                        project.id
                      }
                    >
                      {
                        project.name
                      }
                    </option>
                  ),
                )}
              </select>
            </label>


            <label>
              Report

              <select
                disabled={busy}
                value={kind}
                onChange={
                  (event) =>
                    setKind(
                      event
                        .target
                        .value,
                    )
                }
              >
                <option value="compensation">
                  Compensation
                </option>

                <option value="actions">
                  Actions
                </option>

                <option value="rehabilitation">
                  Rehabilitation &
                  Resettlement
                </option>

                <option value="litigation">
                  Litigation
                </option>
              </select>
            </label>

          </div>


          <p className="wf-note">
            CSV includes demo/source
            fields. Up to 10,000
            records per export; larger
            exports require a project
            filter. Project selector
            shows the latest 100
            projects.
          </p>


          {canExportReports ? (
            <button
              type="button"
              disabled={busy}
              onClick={download}
            >
              {busy
                ? 'Preparing…'
                : 'Download CSV'}
            </button>
          ) : (
            <p className="wf-note">
              Report export is not
              available for this role.
            </p>
          )}


          {error && (
            <p
              className="wf-error"
              role="alert"
            >
              {error}
            </p>
          )}

        </section>


        <WorkflowSummary
          projectId={
            projectId ||
            undefined
          }
        />

      </main>
    </div>
  )
}