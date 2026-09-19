import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section
      className="landing-hero"
      aria-labelledby="hero-heading"
    >
      <img
        className="hero-image"
        src="/images/liva-hero.png"
        alt=""
        fetchPriority="high"
      />

      <div className="hero-overlay" />

      <div className="hero-content">
        <p className="section-eyebrow hero-eyebrow">
          Land acquisition intelligence
        </p>

        <h1 id="hero-heading">
          Land acquisition.
          <br />
          Clearer decisions.
          <br />
          Earlier action.
        </h1>

        <p className="hero-description">
          Track acquisition progress,
          understand delay risks and
          coordinate action in one
          connected workspace.
        </p>

        <div className="hero-actions">
          <Link
            className="landing-button button-lime"
            to="/access"
          >
            Enter LIVA
            <ArrowRight
              size={18}
              aria-hidden="true"
            />
          </Link>

          <a
            className="landing-button button-outline"
            href="#services"
          >
            Explore services
            <ArrowRight
              size={18}
              aria-hidden="true"
            />
          </a>
        </div>
      </div>

      <div
        className="hero-caption"
        aria-hidden="true"
      >
        <span />
        Connected land.
        <br />
        Coordinated progress.
      </div>
    </section>
  )
}