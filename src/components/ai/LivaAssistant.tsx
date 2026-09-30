import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  ArrowRight,
  Bot,
  LoaderCircle,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react'

type LivaAssistantProps = {
  projectId?: string | null
}

type Message = {
  id: number
  role: 'user' | 'assistant'
  content: string
}

type ProjectOption = {
  id: string
  name: string
  location?: string
  sector?: string
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

/* ============================================================
   DASHBOARD QUESTIONS
   These are general LIVA questions.
   They must NOT trigger project detection.
   ============================================================ */

const dashboardQuestions = [
  'What is LIVA?',
  'Why is LIVA needed?',
  'What problem does LIVA solve?',
  'How does LIVA detect land acquisition delays?',
  'How does the AI risk prediction work?',
  'What data does LIVA use?',
  'What makes LIVA different from a normal land acquisition system?',
  'What is the Digital Twin in LIVA?',
  'How does LIVA explain why a project is at risk?',
  'How does GIS help in LIVA?',
  'What is the Intervention Simulator?',
  'How does LIVA help officers take action?',
  'Can LIVA identify the cause of a delay?',
  'How does LIVA handle litigation, compensation and ownership data?',
  'What happens if data is missing?',
  'How is LIVA useful for government departments?',
  'What is the workflow of LIVA?',
  'What are the limitations of the current LIVA prototype?',
]
const dashboardAnswers: Record<string, string> = {
  'What is LIVA?': `
**LIVA** is a Land Acquisition Intelligence system designed to help government and project officers detect potential land acquisition delays early and take informed action.

LIVA follows the workflow:

**Predict → Explain → Locate → Simulate → Act → Monitor**

It combines project data, land and parcel information, litigation, compensation, documents, GIS intelligence, risk prediction and workflow monitoring in one platform.

The goal is to move from reactive delay management to proactive delay detection and intervention.
`,

  'Why is LIVA needed?': `
Land acquisition can become a major source of project delays because multiple activities are interdependent — including surveys, ownership verification, documentation, litigation, compensation, approvals and rehabilitation.

LIVA is needed to identify potential delay signals early instead of waiting until a project is already significantly delayed.

It helps officers understand **where the risk is, why the risk exists, what area or process is affected, and what intervention can be considered.**
`,

  'What problem does LIVA solve?': `
LIVA addresses the problem of **late detection and fragmented management of land acquisition delays**.

Traditional workflows may require officers to check information across different records and departments. LIVA brings relevant information together and provides:

- Delay-risk prediction
- Explainable risk factors
- GIS-based location intelligence
- Parcel and ownership intelligence
- Litigation and compensation tracking
- Intervention simulation
- Action and workflow monitoring

This helps officers identify potential bottlenecks earlier and coordinate appropriate interventions.
`,

  'How does LIVA detect land acquisition delays?': `
LIVA detects potential delay risk by analysing available project and land-acquisition indicators.

These can include:

- Project and acquisition progress
- Parcel and survey status
- Ownership-related issues
- Litigation
- Documentation status
- Compensation status
- Approvals
- Pending actions

The risk engine combines relevant indicators and produces a risk assessment. LIVA then explains the contributing factors so that the officer can understand why a project or acquisition workflow may require attention.
`,

  'How does the AI risk prediction work?': `
LIVA uses a machine-learning based risk model for project schedule-delay prediction, together with LIVA's rule-based acquisition risk intelligence.

The current ML model is a **Random Forest pipeline** trained on government and verified public-authority infrastructure data.

Its purpose is to identify patterns associated with schedule-delay risk.

LIVA also provides explainability so that the prediction is not treated as a black box. The system can show the factors contributing to the prediction.

The ML prediction should be interpreted as a risk signal, not as a guaranteed future outcome.
`,

  'What data does LIVA use?': `
LIVA works with structured project and land-acquisition information such as:

- Project details
- Parcel records
- Ownership information
- Survey information
- Litigation and legal cases
- Documents
- Compensation records
- Approvals
- Rehabilitation and resettlement information
- Officer actions and workflow status
- GIS/location information

The system is designed to ground its project-specific answers in the records available in LIVA rather than inventing missing information.
`,

  'What makes LIVA different from a normal land acquisition system?': `
A conventional system may primarily store records and track workflow status.

LIVA adds an intelligence layer on top of the records.

Its approach is:

**Predict → Explain → Locate → Simulate → Act → Monitor**

Instead of only showing what has already happened, LIVA is designed to help identify potential delay risk, explain contributing factors, locate affected areas through GIS, evaluate possible interventions and monitor follow-up actions.
`,

  'What is the Digital Twin in LIVA?': `
The **Digital Twin** in LIVA represents the digital state of a project and its land-acquisition workflow.

It can bring together information such as:

- Project progress
- Parcels
- Surveys
- Ownership
- Litigation
- Compensation
- Documents
- Approvals
- Actions

This creates a consolidated view of the acquisition situation so that officers can understand the current state of the project and its dependencies.

The Digital Twin is therefore not just a map; it represents the evolving acquisition and project state.
`,

  'How does LIVA explain why a project is at risk?': `
LIVA combines the risk result with contributing factors so that the officer can understand the reason behind the risk assessment.

For example, the system can identify factors related to:

- Low progress
- Pending acquisition activities
- Litigation
- Compensation
- Ownership issues
- Documentation
- Approvals
- Pending actions

This makes the prediction more explainable and helps the officer move from **"the project is at risk"** to **"these factors are contributing to the risk."**
`,

  'How does GIS help in LIVA?': `
GIS provides the spatial intelligence layer of LIVA.

It helps officers:

- Locate projects and affected parcels
- View acquisition-related information geographically
- Identify spatial clusters of risk
- Connect project risk with specific locations
- Understand where intervention may be required

This changes the question from only **"Which project is at risk?"** to also **"Where is the risk located?"**
`,

  'What is the Intervention Simulator?': `
The **Intervention Simulator** allows officers to explore the possible effect of intervention scenarios before taking action.

For example, an officer can evaluate how changes in selected acquisition or workflow conditions may affect the overall risk state.

The purpose is to support **what-if analysis** and structured decision-making rather than relying only on the current status.
`,

  'How does LIVA help officers take action?': `
LIVA connects intelligence with an action-oriented workflow.

The system can help officers:

1. Identify a potential risk.
2. Understand why the risk exists.
3. Locate the affected project or parcel.
4. Evaluate possible interventions.
5. Create or follow up on actions.
6. Monitor the resulting status.

This connects prediction with operational decision-making.
`,

  'Can LIVA identify the cause of a delay?': `
LIVA can identify **observed risk factors and contributing indicators** when the relevant records are available.

For example, the system may identify issues associated with litigation, ownership, survey status, compensation, documentation, approvals or low progress.

However, LIVA should not automatically blame a particular person, landowner or officer unless the underlying records explicitly establish that fact.

The system distinguishes between **observed data, risk factors and AI interpretation**.
`,

  'How does LIVA handle litigation, compensation and ownership data?': `
These are treated as separate but connected parts of the acquisition workflow.

LIVA can retrieve and analyse available:

- Ownership records
- Survey information
- Litigation/court records
- Compensation records
- Documents
- Approvals

The information can then contribute to project intelligence and risk explanation.

If a particular record is not available, LIVA should explicitly state that the information is unavailable rather than inventing it.
`,

  'What happens if data is missing?': `
LIVA follows a **no-invention approach**.

If a requested piece of information is not present in the available LIVA records, the system should clearly say that the information is not available in the current records.

Missing information should not be replaced with assumptions.

This is particularly important for sensitive information such as landowner identity, compensation amounts, legal parties or responsibility for delays.
`,

  'How is LIVA useful for government departments?': `
LIVA can provide a common intelligence layer for officers managing complex acquisition workflows.

It can help departments:

- Detect potential delays earlier
- Prioritise projects requiring attention
- Understand contributing risk factors
- Locate affected areas
- Track acquisition-related records
- Coordinate actions
- Evaluate interventions
- Monitor progress
- Maintain an auditable workflow

The aim is to support evidence-based and proactive project management.
`,

  'What is the workflow of LIVA?': `
LIVA follows a six-stage intelligence workflow:

**1. Predict**  
Identify potential delay risk.

**2. Explain**  
Understand the factors contributing to the risk.

**3. Locate**  
Use GIS to identify the affected project or spatial area.

**4. Simulate**  
Evaluate possible intervention scenarios.

**5. Act**  
Create and manage appropriate actions.

**6. Monitor**  
Track changes and continue observing the project.

This creates a continuous loop from early detection to intervention and monitoring.
`,

  'What are the limitations of the current LIVA prototype?': `
The current LIVA prototype has important limitations.

Its intelligence depends on the **quality, completeness and availability of the underlying data**.

The current ML model is a general infrastructure schedule-delay model and should be treated as a risk signal rather than a guaranteed land-acquisition outcome.

The prototype also requires broader real-world datasets and continued validation before being treated as a production decision-making system.

Therefore, LIVA is designed to **support officers**, not replace official verification, legal processes or government decision-making.
`,
}
/* ============================================================
   PROJECT LENS QUESTIONS
   ============================================================ */

const projectLensQuestions = [
  'Tell me about this project.',
  'What is the current risk level?',
  'Why is this project at risk?',
  'Show the available litigation information.',
]

/* ============================================================
   TEXT HELPERS
   ============================================================ */

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/* ============================================================
   GENERAL LIVA QUESTION DETECTION
   Prevents questions like:
   "Why is LIVA needed?"
   from being mistaken for a project named "LIVA..."
   ============================================================ */

function isGeneralLivaQuestion(message: string): boolean {
  const text = normalizeText(message)

  const generalPatterns = [
    'what is liva',
    'why is liva needed',
    'why liva is needed',
    'why do we need liva',
    'what problem does liva solve',
    'how does liva work',
    'how does liva detect',
    'how does the ai risk prediction work',
    'what data does liva use',
    'what makes liva different',
    'what is the digital twin',
    'what is digital twin in liva',
    'how does liva explain',
    'how does gis help in liva',
    'what is the intervention simulator',
    'how does liva help officers',
    'can liva identify the cause',
    'how does liva handle litigation',
    'what happens if data is missing',
    'how is liva useful',
    'what is the workflow of liva',
    'what are the limitations of liva',
  ]

  return generalPatterns.some((pattern) =>
    text.includes(pattern),
  )
}

/* ============================================================
   PROJECT NORMALIZATION
   ============================================================ */

function normalizeProjects(payload: any): ProjectOption[] {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : []

  return items
    .map((item: any) => {
      const id =
        item?._id?.$oid ||
        item?._id ||
        item?.id ||
        item?.project_id ||
        ''

      const name =
        item?.name ||
        item?.project_name ||
        item?.title ||
        'Unnamed Project'

      return {
        id: String(id),
        name: String(name),
        location: item?.location || item?.district || '',
        sector: item?.sector || '',
      }
    })
    .filter((item: ProjectOption) => item.id)
}

/* ============================================================
   TOKENIZER
   ============================================================ */

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3)
}

/* ============================================================
   PROJECT DETECTION
   ============================================================ */

function findProjectFromMessage(
  message: string,
  projects: ProjectOption[],
): ProjectOption | null {
  const normalizedMessage = normalizeText(message)

  /*
   * Never attempt project detection for general LIVA questions.
   */
  if (isGeneralLivaQuestion(message)) {
    return null
  }

  /* Exact project-name match */
  const exactMatch = projects.find((project) => {
    const projectName = normalizeText(project.name)

    return (
      projectName.length > 3 &&
      normalizedMessage.includes(projectName)
    )
  })

  if (exactMatch) {
    return exactMatch
  }

  /* Token based matching */
  const messageTokens = new Set(tokenize(message))

  let bestProject: ProjectOption | null = null
  let bestScore = 0

  for (const project of projects) {
    const projectTokens = tokenize(project.name)

    if (!projectTokens.length) {
      continue
    }

    let score = 0

    for (const token of projectTokens) {
      if (messageTokens.has(token)) {
        score += 1
      }
    }

    const locationTokens = tokenize(
      project.location || '',
    )

    for (const token of locationTokens) {
      if (messageTokens.has(token)) {
        score += 0.25
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestProject = project
    }
  }

  /*
   * Require at least a meaningful project match.
   * A single generic token such as "liva" is not enough.
   */
  if (bestProject && bestScore >= 2) {
    return bestProject
  }

  return null
}

/* ============================================================
   INLINE MARKDOWN
   ============================================================ */

function renderInlineMarkdown(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (
      part.startsWith('**') &&
      part.endsWith('**') &&
      part.length >= 4
    ) {
      return (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      )
    }

    return <span key={index}>{part}</span>
  })
}

/* ============================================================
   MARKDOWN TABLE HELPERS
   ============================================================ */

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim()

  if (!trimmed.includes('|')) {
    return false
  }

  const cells = trimmed
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)

  if (!cells.length) {
    return false
  }

  return cells.every((cell) =>
    /^:?-{3,}:?$/.test(cell),
  )
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function renderMarkdownTable(
  headerLine: string,
  rows: string[],
): ReactNode {
  const headers = splitTableRow(headerLine)

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        margin: '10px 0',
        border: '1px solid #dbe4df',
        borderRadius: 10,
        background: '#ffffff',
      }}
    >
      <table
        style={{
          width: '100%',
          minWidth: 400,
          borderCollapse: 'collapse',
          fontSize: 11.5,
        }}
      >
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                style={{
                  textAlign: 'left',
                  padding: '9px 10px',
                  borderBottom:
                    '1px solid #dbe4df',
                  background: '#f4f8f6',
                  color: '#173f35',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {renderInlineMarkdown(header)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => {
            const cells = splitTableRow(row)

            return (
              <tr key={rowIndex}>
                {headers.map((_, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      padding: '9px 10px',
                      borderBottom:
                        rowIndex === rows.length - 1
                          ? 'none'
                          : '1px solid #e7eeeb',
                      color: '#30443e',
                      verticalAlign: 'top',
                    }}
                  >
                    {renderInlineMarkdown(
                      cells[cellIndex] ?? '',
                    )}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ============================================================
   MESSAGE RENDERER
   ============================================================ */

function renderMessage(content: string): ReactNode {
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')

  const output: ReactNode[] = []

  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    /* Markdown table */
    if (
      line.includes('|') &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1])
    ) {
      const headerLine = line
      const tableRows: string[] = []

      index += 2

      while (
        index < lines.length &&
        lines[index].trim() &&
        lines[index].includes('|')
      ) {
        tableRows.push(lines[index])
        index += 1
      }

      output.push(
        <div key={`table-${index}`}>
          {renderMarkdownTable(
            headerLine,
            tableRows,
          )}
        </div>,
      )

      continue
    }

    const trimmed = line.trim()

    /* Empty line */
    if (!trimmed) {
      output.push(
        <div
          key={`space-${index}`}
          style={{ height: 6 }}
        />,
      )

      index += 1
      continue
    }

    /* Heading */
    if (/^#{1,4}\s+/.test(trimmed)) {
      const heading = trimmed.replace(
        /^#{1,4}\s+/,
        '',
      )

      output.push(
        <div
          key={`heading-${index}`}
          style={{
            fontWeight: 700,
            color: '#173f35',
            fontSize: 13,
            marginTop: 8,
            marginBottom: 5,
          }}
        >
          {renderInlineMarkdown(heading)}
        </div>,
      )

      index += 1
      continue
    }

    /* Bullet */
    if (/^[-*]\s+/.test(trimmed)) {
      const bullet = trimmed.replace(
        /^[-*]\s+/,
        '',
      )

      output.push(
        <div
          key={`bullet-${index}`}
          style={{
            display: 'flex',
            gap: 7,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              color: '#2f6f61',
              fontWeight: 700,
            }}
          >
            •
          </span>

          <span>
            {renderInlineMarkdown(bullet)}
          </span>
        </div>,
      )

      index += 1
      continue
    }

    /* Numbered list */
    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(
        /^(\d+)\.\s+(.*)$/,
      )

      output.push(
        <div
          key={`number-${index}`}
          style={{
            display: 'flex',
            gap: 7,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              color: '#2f6f61',
              fontWeight: 700,
              minWidth: 16,
            }}
          >
            {match?.[1]}.
          </span>

          <span>
            {renderInlineMarkdown(
              match?.[2] || trimmed,
            )}
          </span>
        </div>,
      )

      index += 1
      continue
    }

    /* Normal paragraph */
    output.push(
      <div
        key={`line-${index}`}
        style={{
          marginBottom: 5,
          lineHeight: 1.55,
        }}
      >
        {renderInlineMarkdown(trimmed)}
      </div>,
    )

    index += 1
  }

  return <>{output}</>
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function LivaAssistant({
  projectId: projectIdProp = null,
}: LivaAssistantProps) {
  const navigate = useNavigate()

  const { projectId: routeProjectId } =
    useParams<{ projectId: string }>()

  const projectId =
    projectIdProp || routeProjectId || null

  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: projectId
        ? 'Hello. I am LIVA AI. Ask me about this project, its risk, parcels, ownership, litigation, documents, compensation, approvals, or actions.'
        : 'Hello. I am LIVA AI. Ask me anything about LIVA, or ask about a specific project from the LIVA records.',
    },
  ])

  const [projects, setProjects] = useState<
    ProjectOption[]
  >([])

  const [activeProjectId, setActiveProjectId] =
    useState<string | null>(projectId)

  const [activeProjectName, setActiveProjectName] =
    useState<string | null>(null)

  /* ==========================================================
     KEEP PROJECT CONTEXT IN SYNC WITH ROUTE
     ========================================================== */

  useEffect(() => {
    setActiveProjectId(projectId)
  }, [projectId])

  /* ==========================================================
     QUESTION LIST
     ========================================================== */

  const visibleQuestions = useMemo(() => {
    return activeProjectId
      ? projectLensQuestions
      : dashboardQuestions
  }, [activeProjectId])

  /* ==========================================================
     LOAD PROJECTS
     ========================================================== */

  const loadProjects =
    async (): Promise<ProjectOption[]> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/projects`,
        )

        if (!response.ok) {
          throw new Error(
            'Unable to load projects.',
          )
        }

        const data = await response.json()

        const normalized =
          normalizeProjects(data)

        setProjects(normalized)

        return normalized
      } catch {
        return []
      }
    }

  /* ==========================================================
     SEND MESSAGE
     ========================================================== */

  const sendMessage = async (
    messageOverride?: string,
  ) => {
    const message =
      messageOverride?.trim() ||
      input.trim()

    if (!message || loading) {
      return
    }

    setInput('')

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: message,
    }

    setMessages((previous) => [
      ...previous,
      userMessage,
    ])

    setLoading(true)

    try {
      let selectedProjectId = activeProjectId


/* ======================================================
   DASHBOARD LIVA KNOWLEDGE MODE

   General LIVA questions are answered locally from
   the verified product knowledge base.

   IMPORTANT:
   Do NOT send these questions to MongoDB/RAG.
   ====================================================== */
        if (
  !selectedProjectId &&
  dashboardAnswers[message]
) {
  setMessages((previous) => [
    ...previous,
    {
      id: Date.now() + 1,
      role: 'assistant',
      content:
        dashboardAnswers[message],
    },
  ])

  setLoading(false)
  return
}
      
      /*
       * Dashboard:
       * Only try project detection when this is NOT
       * a general LIVA question.
       */
      if (
        !selectedProjectId &&
        !isGeneralLivaQuestion(message)
      ) {
        let availableProjects = projects

        if (!availableProjects.length) {
          availableProjects =
            await loadProjects()
        }

        const project =
          findProjectFromMessage(
            message,
            availableProjects,
          )

        if (project) {
          selectedProjectId =
            project.id

          setActiveProjectId(
            project.id,
          )

          setActiveProjectName(
            project.name,
          )

          setMessages((previous) => [
            ...previous,
            {
              id: Date.now() + 1,
              role: 'assistant',
              content: `I found the project **${project.name}** in the LIVA records. You can now ask project-specific questions.`,
            },
          ])

          setLoading(false)
          return
        }
      }

      /* ======================================================
         AI BACKEND REQUEST
         ====================================================== */

      const response = await fetch(
        `${API_BASE_URL}/api/ai/chat`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            message,

            project_id:
              selectedProjectId || null,

            project: selectedProjectId
              ? {
                  name:
                    activeProjectName ||
                    'LIVA Land Acquisition Intelligence System',
                }
              : null,

            risk: null,
          }),
        },
      )

      const body =
        await response
          .json()
          .catch(() => null)

      if (!response.ok) {
        throw new Error(
          typeof body?.detail ===
            'string'
            ? body.detail
            : 'LIVA AI request failed.',
        )
      }

      const answer =
        typeof body?.answer ===
        'string'
          ? body.answer
          : 'No answer was returned by LIVA AI.'

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 2,
          role: 'assistant',
          content: answer,
        },
      ])
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to connect to LIVA AI.'

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 3,
          role: 'assistant',
          content: `I could not process that request.\n\n${errorMessage}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  /* ==========================================================
     OPEN PROJECT LENS
     ========================================================== */

  const openProjectLens = () => {
    if (!activeProjectId) {
      return
    }

    setIsOpen(false)

    navigate(
      `/projects/${encodeURIComponent(
        activeProjectId,
      )}`,
    )
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <>
      {/* ======================================================
          FLOATING AI BUTTON
          ====================================================== */}

      {!isOpen && (
        <button
          type="button"
          aria-label="Open LIVA AI Assistant"
          onClick={() =>
            setIsOpen(true)
          }
          style={{
            position: 'fixed',

            right: 24,
            bottom: 90,

            width: 56,
            height: 56,

            borderRadius: '50%',

            border:
              '1px solid rgba(255,255,255,0.18)',

            background:
              'linear-gradient(145deg, #164f43 0%, #0d382f 100%)',

            color: '#ffffff',

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            cursor: 'pointer',

            boxShadow:
              '0 12px 30px rgba(0,0,0,0.28)',

            zIndex: 99999,

            transition:
              'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform =
              'translateY(-2px) scale(1.04)'

            event.currentTarget.style.boxShadow =
              '0 16px 34px rgba(0,0,0,0.32)'
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform =
              'translateY(0) scale(1)'

            event.currentTarget.style.boxShadow =
              '0 12px 30px rgba(0,0,0,0.28)'
          }}
        >
          <Bot
            size={25}
            strokeWidth={2.1}
          />

          <span
            style={{
              position: 'absolute',
              top: 1,
              right: 1,

              width: 11,
              height: 11,

              borderRadius: '50%',

              background: '#63b39f',

              border:
                '2px solid #ffffff',
            }}
          />
        </button>
      )}

      {/* ======================================================
          CHAT WINDOW
          ====================================================== */}

      {isOpen && (
        <div
          className="liva-ai-window"
          style={{
            position: 'fixed',

            right: 24,
            bottom: 90,

            width: 480,

            /*
             * Never exceed the visible browser height.
             * This fixes the header getting cut off.
             */
            height:
              'min(700px, calc(100vh - 110px))',

            maxWidth:
              'calc(100vw - 32px)',

            maxHeight:
              'calc(100vh - 110px)',

            background: '#ffffff',

            border:
              '1px solid rgba(24, 65, 56, 0.15)',

            borderRadius: 18,

            boxShadow:
              '0 24px 60px rgba(15, 42, 36, 0.24)',

            display: 'flex',
            flexDirection: 'column',

            overflow: 'hidden',

            zIndex: 99998,
          }}
        >
          {/* ==================================================
              HEADER
              ================================================== */}

          <div
            style={{
              padding: '13px 15px',

              background:
                'linear-gradient(135deg, #164f43 0%, #0e3c33 100%)',

              color: '#ffffff',

              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',

              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,

                  borderRadius: 10,

                  background:
                    'rgba(255,255,255,0.13)',

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  flexShrink: 0,
                }}
              >
                <Bot
                  size={20}
                  strokeWidth={2}
                />
              </div>

              <div
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  LIVA AI
                </div>

                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.75,
                    marginTop: 2,
                  }}
                >
                  Land Acquisition Intelligence
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close LIVA AI"
              onClick={() =>
                setIsOpen(false)
              }
              style={{
                width: 32,
                height: 32,

                border: 'none',
                borderRadius: 9,

                background:
                  'rgba(255,255,255,0.10)',

                color: '#ffffff',

                cursor: 'pointer',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ==================================================
              PROJECT CONTEXT
              ================================================== */}

          {activeProjectId && (
            <div
              style={{
                padding:
                  '8px 13px',

                background: '#f3f7f5',

                borderBottom:
                  '1px solid #e1e9e5',

                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',

                gap: 10,

                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,

                  minWidth: 0,
                }}
              >
                <Sparkles
                  size={13}
                  color="#2f6f61"
                />

                <span
                  style={{
                    fontSize: 10,
                    color: '#50645e',

                    overflow: 'hidden',
                    textOverflow:
                      'ellipsis',
                    whiteSpace:
                      'nowrap',
                  }}
                >
                  Project context active
                </span>
              </div>

              <button
                type="button"
                onClick={
                  openProjectLens
                }
                style={{
                  border: 'none',
                  background:
                    'transparent',

                  color: '#1c6253',

                  fontSize: 10,
                  fontWeight: 700,

                  cursor: 'pointer',

                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,

                  whiteSpace:
                    'nowrap',
                }}
              >
                Open Project Lens
                <ArrowRight
                  size={12}
                />
              </button>
            </div>
          )}

          {/* ==================================================
              MESSAGES
              ================================================== */}

          <div
            className="liva-ai-messages"
            style={{
              flex: 1,

              minHeight: 0,

              overflowY: 'auto',
              overflowX: 'hidden',

              padding:
                '14px 13px',

              background: '#f8faf9',
            }}
          >
            {messages.map(
              (message) => {
                const isUser =
                  message.role ===
                  'user'

                return (
                  <div
                    key={
                      message.id
                    }
                    style={{
                      display:
                        'flex',

                      justifyContent:
                        isUser
                          ? 'flex-end'
                          : 'flex-start',

                      marginBottom: 11,

                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',

                        flexDirection:
                          isUser
                            ? 'row-reverse'
                            : 'row',

                        alignItems:
                          'flex-start',

                        gap: 7,

                        maxWidth:
                          '96%',

                        width: isUser
                          ? 'auto'
                          : '100%',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: 28,
                          height: 28,

                          borderRadius: 8,

                          flexShrink: 0,

                          background:
                            isUser
                              ? '#dfeae6'
                              : '#d7e9e3',

                          color:
                            isUser
                              ? '#52645f'
                              : '#174f43',

                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                        }}
                      >
                        {isUser ? (
                          <User
                            size={14}
                          />
                        ) : (
                          <Bot
                            size={14}
                          />
                        )}
                      </div>

                      {/* Message */}
                      <div
                        style={{
                          maxWidth:
                            isUser
                              ? 'calc(100% - 35px)'
                              : '100%',

                          padding:
                            '9px 11px',

                          borderRadius:
                            isUser
                              ? '12px 12px 4px 12px'
                              : '4px 12px 12px 12px',

                          background:
                            isUser
                              ? '#164f43'
                              : '#ffffff',

                          color:
                            isUser
                              ? '#ffffff'
                              : '#30443e',

                          border:
                            isUser
                              ? 'none'
                              : '1px solid #e0e8e4',

                          fontSize: 12,

                          lineHeight:
                            1.5,

                          overflowX:
                            'auto',

                          overflowY:
                            'hidden',

                          wordBreak:
                            'break-word',

                          overflowWrap:
                            'anywhere',

                          boxShadow:
                            isUser
                              ? 'none'
                              : '0 2px 7px rgba(22, 65, 55, 0.04)',
                        }}
                      >
                        {renderMessage(
                          message.content,
                        )}
                      </div>
                    </div>
                  </div>
                )
              },
            )}

            {/* =================================================
                LOADING
                ================================================= */}

            {loading && (
              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'flex-start',
                  gap: 7,
                  marginBottom: 11,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,

                    borderRadius: 8,

                    background:
                      '#d7e9e3',

                    color:
                      '#174f43',

                    display: 'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                  }}
                >
                  <Bot
                    size={14}
                  />
                </div>

                <div
                  style={{
                    padding:
                      '9px 12px',

                    borderRadius:
                      '4px 12px 12px 12px',

                    background:
                      '#ffffff',

                    border:
                      '1px solid #e0e8e4',

                    color:
                      '#547069',

                    display: 'flex',
                    alignItems:
                      'center',

                    gap: 7,

                    fontSize: 12,
                  }}
                >
                  <LoaderCircle
                    size={14}
                    style={{
                      animation:
                        'liva-spin 0.9s linear infinite',
                    }}
                  />

                  <span>
                    Analysing LIVA
                    records...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ==================================================
              SUGGESTED QUESTIONS

              IMPORTANT:
              This does NOT depend on messages.length.
              Therefore suggestions stay visible after
              every general LIVA question.
              ================================================== */}

          {!loading && (
            <div
              className="liva-ai-suggestions"
              style={{
                padding:
                  '8px 12px 7px',

                background:
                  '#ffffff',

                borderTop:
                  '1px solid #e6ece9',

                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: 5,

                  fontSize: 10,

                  color:
                    '#71827d',

                  marginBottom: 6,
                }}
              >
                <Sparkles
                  size={12}
                />

                {activeProjectId
                  ? 'Suggested questions'
                  : 'Suggested questions for LIVA'}
              </div>

              <div
                style={{
                  display: 'flex',

                  flexDirection:
                    'column',

                  gap: 5,

                  maxHeight: 128,

                  overflowY:
                    'auto',

                  overflowX:
                    'hidden',

                  paddingRight: 3,
                }}
              >
                {visibleQuestions.map(
                  (question) => (
                    <button
                      key={
                        question
                      }
                      type="button"
                      onClick={() =>
                        sendMessage(
                          question,
                        )
                      }
                      style={{
                        width:
                          '100%',

                        minHeight:
                          32,

                        flexShrink: 0,

                        border:
                          '1px solid #d8e4df',

                        background:
                          '#f8faf9',

                        color:
                          '#35564d',

                        borderRadius:
                          8,

                        padding:
                          '7px 10px',

                        fontSize:
                          10.5,

                        fontWeight:
                          500,

                        cursor:
                          'pointer',

                        textAlign:
                          'left',

                        /*
                         * IMPORTANT:
                         * Every question stays on one line.
                         */
                        whiteSpace:
                          'nowrap',

                        overflow:
                          'hidden',

                        textOverflow:
                          'ellipsis',
                      }}
                      title={
                        question
                      }
                    >
                      {question}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              INPUT
              ================================================== */}

          <div
            style={{
              padding:
                '9px 12px 11px',

              background:
                '#ffffff',

              borderTop:
                '1px solid #e3ebe7',

              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems:
                  'flex-end',

                gap: 7,

                padding: 4,

                border:
                  '1px solid #d6e1dd',

                borderRadius: 11,

                background:
                  '#fbfcfc',
              }}
            >
              <textarea
                value={input}
                onChange={(event) =>
                  setInput(
                    event.target.value,
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      'Enter' &&
                    !event.shiftKey
                  ) {
                    event.preventDefault()

                    sendMessage()
                  }
                }}
                placeholder={
                  activeProjectId
                    ? 'Ask about this project...'
                    : 'Ask about LIVA or a project...'
                }
                rows={1}
                disabled={
                  loading
                }
                style={{
                  flex: 1,

                  resize: 'none',

                  border: 'none',
                  outline: 'none',

                  background:
                    'transparent',

                  color:
                    '#263d36',

                  fontSize: 12,

                  lineHeight:
                    1.4,

                  padding:
                    '7px 7px',

                  minHeight: 30,

                  maxHeight: 70,
                }}
              />

              <button
                type="button"
                aria-label="Send message"
                onClick={() =>
                  sendMessage()
                }
                disabled={
                  loading ||
                  !input.trim()
                }
                style={{
                  width: 34,
                  height: 34,

                  border: 'none',
                  borderRadius: 9,

                  background:
                    loading ||
                    !input.trim()
                      ? '#d8e2de'
                      : '#164f43',

                  color:
                    loading ||
                    !input.trim()
                      ? '#8b9a95'
                      : '#ffffff',

                  cursor:
                    loading ||
                    !input.trim()
                      ? 'not-allowed'
                      : 'pointer',

                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',

                  flexShrink: 0,
                }}
              >
                <Send
                  size={16}
                  strokeWidth={2.2}
                />
              </button>
            </div>

            <div
              style={{
                fontSize: 9,

                color:
                  '#8a9994',

                textAlign:
                  'center',

                marginTop: 5,
              }}
            >
              LIVA AI answers using
              available project
              records and risk
              intelligence.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          RESPONSIVE + ANIMATION
          ======================================================== */}

      <style>
        {`
          @keyframes liva-spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          .liva-ai-messages::-webkit-scrollbar,
          .liva-ai-suggestions::-webkit-scrollbar {
            width: 5px;
          }

          .liva-ai-messages::-webkit-scrollbar-track,
          .liva-ai-suggestions::-webkit-scrollbar-track {
            background: transparent;
          }

          .liva-ai-messages::-webkit-scrollbar-thumb,
          .liva-ai-suggestions::-webkit-scrollbar-thumb {
            background: #cbd8d3;
            border-radius: 10px;
          }

          @media (max-width: 600px) {
            .liva-ai-window {
              left: 10px !important;
              right: 10px !important;

              bottom: 76px !important;

              width: auto !important;

              height: calc(100vh - 92px) !important;
              max-height: calc(100vh - 92px) !important;

              border-radius: 16px !important;
            }
          }

          @media (max-height: 720px) and (min-width: 601px) {
            .liva-ai-window {
              bottom: 72px !important;

              height: calc(100vh - 86px) !important;
              max-height: calc(100vh - 86px) !important;
            }
          }
        `}
      </style>
    </>
  )
}