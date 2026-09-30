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
import LandingFooter from '../components/landing/LandingFooter'

import '../styles/landing.css'


const steps = [
  {
    title: 'Bring information together',
    description:
      'Keep important project and land information in one place.',
  },
  {
    title: 'Find possible delays',
    description:
      'See which issues may slow the project down.',
  },
  {
    title: 'Take the next step',
    description:
      'Know what needs to be done and follow up.',
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
        View

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
          LIVA brings important project and land information together, so you can quickly see what is happening and know what needs to be done next.
          </p>

          <p className="intro-note">
            <span />

            <br />

       
            <br />

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
                    Map
                  </h3>

                  <p>
                    View projects and land areas on the map.
                  </p>
                </div>
              </div>

              {serviceLink(
                'Map',
              )}
            </div>
          </article>


          {/* DELAY INTELLIGENCE */}

          <article className="service-card delay-card">
            <img
              src="/images/delay.jpg"
              alt="Infrastructure project corridor and delay intelligence"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden'
              }}
            />

            <div className="image-card-overlay" />

            <div className="image-card-content">
              <div className="card-title-row">
                <ChartNoAxesColumnIncreasing
                  size={31}
                  strokeWidth={1.3}
                  aria-hidden="true"
                />

                <div>
                  <h3>Delay Check</h3>
                  <p>
                    See which projects
                    <br />
                    may be delayed.
                  </p>
                </div>
              </div>

              {serviceLink('Delay Check')}
            </div>
          </article>


          {/* DIGITAL TWIN */}

          <article className="service-card twin-card">
            <img
              src="/images/risk.jpg"
              alt="Aerial land parcels with risk intelligence"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden'
              }}
            />

            <div className="image-card-overlay" />

            <div className="image-card-content">
              <div className="card-title-row">
                <Network
                  size={31}
                  strokeWidth={1.3}
                  aria-hidden="true"
                />

                <div>
                  <h3>Risk Intelligence</h3>
                  <p>
                    Identify projects and parcels
                    <br />
                    that need attention.
                  </p>
                </div>
              </div>

              {serviceLink('Risk Intelligence')}
            </div>
          </article>


          {/* COURT */}

          <article className="service-card court-card">
            <img
              src="/images/liva-land.png"
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
                    Land Matters
                  </h3>

                  <p>
                    View important issues
                    <br />
                    related to the land.
                  </p>
                </div>
              </div>

              {serviceLink(
                'Land Matters',
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
                    Check documents
                    <br />
                    and payment details.
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
            <img
              src="/images/action.jpg"
              alt="Project action and follow-up workspace"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden'
              }}
            />

            <div className="image-card-overlay" />

            <div className="image-card-content">
              <div className="card-title-row">
                <CircleCheck
                  size={31}
                  strokeWidth={1.3}
                  aria-hidden="true"
                />

                <div>
                  <h3>Action Centre</h3>
                  <p>
                    See what needs to be done next.
                    <br />
                    Complete important follow-up.
                  </p>
                </div>
              </div>

              {serviceLink('Action Centre')}
            </div>
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

            Choose how you want to use
            LIVA.
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
              How LIVA works
              <br />
              in three simple steps.
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
        {/* WHO IT'S FOR */}
        {/* ================================= */}

        <section
          id="who-its-for"
          className="who-section"
          aria-labelledby="who-heading"
        >
          <div className="who-heading">
            <p className="section-eyebrow">Who it’s for</p>

            <h2 id="who-heading">
              One platform for
             
              different users.
            </h2>

            <p>
              LIVA provides simple access to the information each user needs.
            </p>
          </div>

          <div className="who-grid">
            <article className="who-card">
              <div className="who-icon">
                <ChartNoAxesColumnIncreasing size={24} strokeWidth={1.4} aria-hidden="true" />
              </div>
              <h3>Project Officers</h3>
              <p>
                Review projects, check progress and follow up on pending work.
              </p>
            </article>

            <article className="who-card">
              <div className="who-icon">
                <LockKeyhole size={24} strokeWidth={1.4} aria-hidden="true" />
              </div>
              <h3>Administrator</h3>
              <p>
                Manage records, users and important project information.
              </p>
            </article>

            <article className="who-card">
              <div className="who-icon">
                <Map size={24} strokeWidth={1.4} aria-hidden="true" />
              </div>
              <h3>Land Owners</h3>
              <p>
                View available project information and understand land-related updates.
              </p>
            </article>
          </div>
        </section>

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
              Ready to get started?
              
            </p>

            <h2 id="cta-heading">
              See your project
              and take the next step.
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
              Choose Your Role
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