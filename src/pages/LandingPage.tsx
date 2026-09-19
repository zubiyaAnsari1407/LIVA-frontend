import { Link } from 'react-router'

import {
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  CircleCheck,
  FileText,
  LockKeyhole,
  Map,
  Network,
  Scale,
} from 'lucide-react'

import LandingNavbar from '../components/landing/LandingNavbar'
import HeroSection from '../components/landing/HeroSection'
import LandingMotion from '../components/landing/LandingMotion'
import LandingExtras from '../components/landing/LandingExtras'
import LandingFooter from '../components/landing/LandingFooter'

import '../styles/landing.css'


const steps = [
  {
    title: 'Connect verified data',
    description:
      'Bring together land, planning, legal and project records in one place.',
  },
  {
    title: 'Understand risks',
    description:
      'See what might cause delay, explore the drivers and assess the implications.',
  },
  {
    title: 'Assign and monitor action',
    description:
      'Coordinate with your team, track progress and keep acquisition moving.',
  },
]


export default function LandingPage() {
  function serviceLink(
    service: string,
  ) {
    return (
      <Link
        to="/access"
        className="service-link"
        aria-label={`Access ${service}`}
      >
        Explore service

        <ArrowRight
          size={17}
          aria-hidden="true"
        />
      </Link>
    )
  }


  return (
    <div className="landing-page">
      <LandingMotion />

      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to content
      </a>

      <LandingNavbar />

      <main
        id="main-content"
        className="landing-main"
      >
        <HeroSection />


        {/* ================================= */}
        {/* OVERVIEW */}
        {/* ================================= */}

        <section
          id="overview"
          className="landing-intro"
          aria-labelledby="overview-heading"
        >
          <h2 id="overview-heading">
            Know what is holding
            <br />
            your project back.
          </h2>

          <p>
            Liva brings together land,
            legal, planning and stakeholder
            information so you can see
            what’s happening, understand
            what might delay progress,
            and take coordinated action
            earlier.
          </p>

          <p className="intro-note">
            <span />

            Clearer insight
            <br />

            Smoother acquisition
            <br />

            Stronger coordination
          </p>
        </section>


        {/* ================================= */}
        {/* SERVICES */}
        {/* ================================= */}

        <section
          id="services"
          className="services-grid"
          aria-label="Liva services"
        >

          {/* GIS */}

          <article className="service-card gis-card">
            <img
              src="/images/liva-gis.png"
              alt="Illustrative aerial landscape with land parcels and a highway"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.onerror =
                  null

                event.currentTarget.src =
                  '/images/liva-hero.png'
              }}
            />

            <div className="gis-content">
              <div className="card-title-row">
                <Map
                  size={31}
                  strokeWidth={1.3}
                  aria-hidden="true"
                />

                <div>
                  <h3>
                    GIS Workspace
                  </h3>

                  <p>
                    See projects in context.
                  </p>
                </div>
              </div>

              {serviceLink(
                'GIS Workspace',
              )}
            </div>
          </article>


          {/* DELAY INTELLIGENCE */}

          <article className="service-card delay-card">
            <ChartNoAxesColumnIncreasing
              size={38}
              strokeWidth={1.3}
              aria-hidden="true"
            />

            <h3>
              Delay Intelligence
            </h3>

            <p>
              Understand risk.
              <br />
              Explain the drivers.
            </p>

            {serviceLink(
              'Delay Intelligence',
            )}
          </article>


          {/* DIGITAL TWIN */}

          <article className="service-card twin-card">
            <div className="card-title-row">
              <Network
                size={36}
                strokeWidth={1.3}
                aria-hidden="true"
              />

              <div>
                <h3>
                  Digital Twin &amp;
                  Scenarios
                </h3>

                <p>
                  Test options.
                  Explore dependencies.
                </p>
              </div>
            </div>

            <svg
              className="twin-illustration"
              viewBox="0 0 500 120"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M0 98L55 65L110 82L170 43L228 76L285 30L342 62L400 35L500 73V120H0Z"
                fill="currentColor"
                opacity=".13"
              />

              <path
                d="M0 110L75 94L136 110L205 70L266 98L330 55L405 74L500 46V120H0Z"
                fill="currentColor"
                opacity=".17"
              />

              <path
                d="M12 105L490 65M12 93L490 53M85 95V118M195 85V118M305 75V118M415 65V118"
                stroke="currentColor"
                strokeWidth="1.4"
              />

              <path
                d="M12 16L490 76M110 28V106M260 47V93M410 66V78"
                stroke="currentColor"
                strokeWidth="1"
                opacity=".65"
              />
            </svg>

            <div className="card-bottom-row">
              <span className="concept-label">
                Concept preview
              </span>

              {serviceLink(
                'Digital Twin & Scenarios',
              )}
            </div>
          </article>


          {/* COURT */}

          <article className="service-card court-card">
            <img
              src="/images/liva-court.png"
              alt="Illustrative courthouse architecture"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.visibility =
                  'hidden'
              }}
            />

            <div className="court-content">
              <div className="card-title-row">
                <Scale
                  size={33}
                  strokeWidth={1.3}
                  aria-hidden="true"
                />

                <div>
                  <h3>
                    Court &amp;
                    Litigation
                  </h3>

                  <p>
                    Track key matters.
                    <br />
                    Stay ahead.
                  </p>
                </div>
              </div>

              {serviceLink(
                'Court & Litigation',
              )}
            </div>
          </article>


          {/* DOCUMENTS */}

          <article className="service-card documents-card">
            <div className="documents-copy">
              <div className="card-title-row">
                <FileText
                  size={32}
                  strokeWidth={1.3}
                  aria-hidden="true"
                />

                <div>
                  <h3>
                    Documents &amp;
                    Compensation
                  </h3>

                  <p>
                    Find what you need.
                    <br />
                    Keep things moving.
                  </p>
                </div>
              </div>

              {serviceLink(
                'Documents & Compensation',
              )}
            </div>

            <img
              src="/images/liva-documents.png"
              alt="Illustrative folders and project paperwork"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.visibility =
                  'hidden'
              }}
            />
          </article>


          {/* ACTION CENTRE */}

          <article className="service-card action-card">
            <div className="card-title-row">
              <CircleCheck
                size={36}
                strokeWidth={1.3}
                aria-hidden="true"
              />

              <div>
                <h3>
                  Action Centre
                </h3>

                <p>
                  Turn insight into
                  follow-up.
                  <br />
                  Keep your project moving.
                </p>
              </div>
            </div>

            {serviceLink(
              'Action Centre',
            )}
          </article>

        </section>


        {/* ================================= */}
        {/* ACCESS NOTE */}
        {/* ================================= */}

        <div className="services-access-note">
          <span />

          <p>
            <LockKeyhole
              size={15}
              aria-hidden="true"
            />

            Select a role to enter
            the LIVA workspace.
          </p>

          <span />
        </div>


        {/* ================================= */}
        {/* HOW IT WORKS */}
        {/* ================================= */}

        <section
          id="how-it-works"
          className="workflow-section"
          aria-labelledby="workflow-heading"
        >
          <div className="workflow-heading">
            <p className="section-eyebrow">
              How it works
            </p>

            <h2 id="workflow-heading">
              From data to
              <br />
              action, in three steps.
            </h2>
          </div>

          {steps.map(
            (
              step,
              index,
            ) => (
              <article
                className="workflow-step"
                key={step.title}
              >
                <span className="step-number">
                  {index + 1}
                </span>

                <h3>
                  {step.title}
                </h3>

                <p>
                  {step.description}
                </p>
              </article>
            ),
          )}
        </section>


        {/* ================================= */}
        {/* TEAM */}
        {/* ================================= */}

        <section
          className="team-banner"
          aria-labelledby="team-heading"
        >
          <img
            src="/images/liva-team.png"
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror =
                null

              event.currentTarget.src =
                '/images/liva-hero.png'
            }}
          />

          <div className="team-overlay" />

          <div className="team-copy">
            <h2 id="team-heading">
              Built for coordinated
              <br />
              acquisition workflows.
            </h2>

            <p>
              Get a clearer view of
              progress, make informed
              decisions and keep your
              infrastructure projects
              moving.
            </p>
          </div>

          <p className="team-caption">
            Align
            <br />
            Resolve
            <br />
            Progress together
          </p>
        </section>


        {/* ================================= */}
        {/* EXTRA LANDING SECTIONS */}
        {/* ================================= */}

        <LandingExtras />


        {/* ================================= */}
        {/* FINAL CTA */}
        {/* ================================= */}

        <section
          id="access"
          className="landing-cta"
          aria-labelledby="cta-heading"
        >
          <div>
            <p className="section-eyebrow">
              A clearer path for
              what’s next
            </p>

            <h2 id="cta-heading">
              Move from uncertainty
              to informed action.
            </h2>
          </div>

          <div className="cta-actions">
            <Link
              to="/access"
              className="landing-button button-lime"
            >
              Enter LIVA

              <ArrowRight
                size={16}
                aria-hidden="true"
              />
            </Link>

            <Link
              to="/access"
              className="landing-button button-outline"
            >
              Choose Access Role
            </Link>
          </div>
        </section>

      </main>


      {/* ================================= */}
      {/* FOOTER */}
      {/* ================================= */}

      <LandingFooter />
    </div>
  )
}