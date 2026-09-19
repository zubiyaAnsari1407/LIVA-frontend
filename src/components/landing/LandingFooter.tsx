import {
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react'

import {
  Link,
} from 'react-router'


const exploreLinks = [
  ['Overview', '#overview'],
  ['Services', '#services'],
  ['How it works', '#how-it-works'],
]

const aboutLinks = [
  ['Why Liva', '#why-liva'],
  ['Who it’s for', '#who-its-for'],
  ['FAQs', '#faqs'],
]


export default function LandingFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">

        <div className="footer-main">

          {/* BRAND */}

          <div className="footer-brand">
            <Link
              to="/"
              className="navbar-brand"
              aria-label="Liva home"
            >
              <img
                src="/images/liva-logo.png"
                alt="Liva"
                className="navbar-logo"
                loading="lazy"
              />
            </Link>

            <p>
              A clearer picture of land
              acquisition. Connected records,
              informed decisions and
              coordinated action.
            </p>

            <span className="footer-brand-note">
              Land acquisition intelligence
            </span>
          </div>


          {/* EXPLORE */}

          <nav
            className="footer-link-group"
            aria-label="Explore Liva"
          >
            <h3>
              Explore
            </h3>

            {exploreLinks.map(
              ([label, href]) => (
                <a
                  href={href}
                  key={label}
                >
                  {label}

                  <ArrowUpRight
                    size={14}
                    aria-hidden="true"
                  />
                </a>
              ),
            )}
          </nav>


          {/* ABOUT */}

          <nav
            className="footer-link-group"
            aria-label="About Liva"
          >
            <h3>
              About Liva
            </h3>

            {aboutLinks.map(
              ([label, href]) => (
                <a
                  href={href}
                  key={label}
                >
                  {label}

                  <ArrowUpRight
                    size={14}
                    aria-hidden="true"
                  />
                </a>
              ),
            )}
          </nav>


          {/* ACCESS */}

          <div className="footer-access">
            <h3>
              Your next step.
            </h3>

            <p>
              Explore the platform designed
              for officers and acquisition
              teams.
            </p>

            <Link
              to="/access"
              className="landing-button button-dark"
            >
              Enter LIVA

              <ArrowRight
                size={16}
                aria-hidden="true"
              />
            </Link>
          </div>

        </div>


        {/* FOOTER BOTTOM */}

        <div className="footer-bottom">

          <p>
            © {new Date().getFullYear()} Liva.
          </p>

          <span>
            Land Acquisition Intelligence
            &amp; Decision Support
          </span>

          <a href="#main-content">
            Back to top

            <ArrowUpRight
              size={14}
              aria-hidden="true"
            />
          </a>

        </div>

      </div>
    </footer>
  )
}