import {
  ArrowRight,
  FileSearch,
  Layers,
  Users,
  BriefcaseBusiness,
  MapPinned,
  Scale,
  ShieldCheck,
} from 'lucide-react'

const benefits = [
  {
    icon: FileSearch,
    title: 'See the blockers.',
    problem: 'Critical information sits across disconnected records.',
    solution:
      'Bring project stages, documents and pending matters into one connected view.',
    className: 'benefit-cream',
  },
  {
    icon: Layers,
    title: 'Understand the context.',
    problem: 'A pending milestone alone does not explain the whole delay.',
    solution:
      'Connect acquisition progress with parcel context, approvals and legal matters.',
    className: 'benefit-sage',
  },
  {
    icon: Users,
    title: 'Coordinate the next step.',
    problem: 'Follow-ups lose momentum when responsibility is unclear.',
    solution:
      'Organize officer actions, ownership and progress in a shared workflow.',
    className: 'benefit-green',
  },
]

const roles = [
  {
    icon: BriefcaseBusiness,
    title: 'Project Officers',
    description:
      'Review acquisition stages, identify pending work and coordinate follow-ups.',
  },
  {
    icon: MapPinned,
    title: 'Field Officers',
    description:
      'Connect verified field updates and supporting evidence to project records.',
  },
  {
    icon: Scale,
    title: 'Legal Teams',
    description:
      'Organize case references, hearing milestones and litigation-related blockers.',
  },
  {
    icon: ShieldCheck,
    title: 'Senior Officers',
    description:
      'Review portfolio progress, priority issues and cross-department coordination.',
  },
]

const faqs = [
  {
    question: 'What is Liva?',
    answer:
      'Liva is a land acquisition intelligence and decision-support project. It is being built to connect acquisition records, project progress, parcel context and officer actions in one workspace.',
  },
  {
    question: 'Who is the platform designed for?',
    answer:
      'Liva is designed for authorized project officers, field officers, legal teams and senior officers involved in acquisition workflows. Login and role-based access will be implemented in later phases.',
  },
  {
    question: 'Does Liva replace officer or legal decisions?',
    answer:
      'No. Liva is intended to support review and coordination. Officers and legal teams remain responsible for verifying information and making administrative or legal decisions.',
  },
  {
    question: 'Are delay predictions guaranteed?',
    answer:
      'No. Prediction features are planned and depend on suitable historical data and model evaluation. Any future estimates will communicate their limitations and uncertainty, not guaranteed completion dates.',
  },
  {
    question: 'How will court cases be handled?',
    answer:
      'The planned litigation module will link verified case information, hearings and orders to relevant projects or parcels. Remaining case-duration estimates will only be offered if suitable historical data is available. Legal verdicts will not be predicted.',
  },
  {
    question: 'Can I access the services now?',
    answer:
      'This landing page is currently a frontend preview. Dashboard services, authentication and live data integration are being developed in the next project phases.',
  },
]

export default function LandingExtras() {
  return (
    <div className="landing-extras">
      <section
        id="why-liva"
        className="why-section"
        aria-labelledby="why-heading"
      >
        <div className="extras-section-heading">
          <div>
            <p className="section-eyebrow">Why Liva</p>

            <h2 id="why-heading">
              Less fragmentation.
              <br />
              More clarity.
            </h2>
          </div>

          <p className="extras-description">
            Designed to help teams move from scattered information
            to a clearer understanding of what needs attention.
          </p>
        </div>

       <div className="benefits-grid">
  {benefits.map((benefit) => {
    const Icon = benefit.icon

    return (
      <article
        className={`benefit-card ${benefit.className}`}
        key={benefit.title}
      >
        <div className="benefit-header">
          <span className="benefit-icon">
            <Icon
              size={25}
              strokeWidth={1.4}
              aria-hidden="true"
            />
          </span>

          <h3>{benefit.title}</h3>
        </div>

        <div className="benefit-challenge">
          <span className="benefit-label">The challenge</span>
          <p>{benefit.problem}</p>
        </div>

        <div className="benefit-outcome">
          <span className="benefit-label">With Liva</span>
          <p>{benefit.solution}</p>
        </div>
      </article>
    )
  })}
</div>
      </section>

      <section
        id="who-its-for"
        className="roles-section"
        aria-labelledby="roles-heading"
      >
        <div className="extras-section-heading">
          <div>
            <p className="section-eyebrow">Who it is for</p>

            <h2 id="roles-heading">
              Different responsibilities.
              <br />
              One connected picture.
            </h2>
          </div>

          <p className="extras-description">
            Planned workflows for the teams involved in land
            acquisition—from field evidence to portfolio review.
          </p>
        </div>

        <div className="roles-grid">
          {roles.map((role) => {
            const Icon = role.icon

            return (
              <article className="role-card" key={role.title}>
                <span className="role-icon">
                  <Icon
                    size={25}
                    strokeWidth={1.4}
                    aria-hidden="true"
                  />
                </span>

                <h3>{role.title}</h3>
                <p>{role.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section
        id="faqs"
        className="faq-section"
        aria-labelledby="faq-heading"
      >
        <div className="faq-intro">
          <p className="section-eyebrow">A little more clarity</p>

          <h2 id="faq-heading">Questions? Start here.</h2>

          <p>
            A quick guide to Liva, its intended users and what
            this preview includes.
          </p>

          <a href="#overview" className="faq-overview-link">
            Explore the overview
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className="faq-list">
          {faqs.map((faq) => (
            <details className="faq-item" key={faq.question}>
              <summary>
                <span>{faq.question}</span>
                <span className="faq-toggle" aria-hidden="true" />
              </summary>

              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}