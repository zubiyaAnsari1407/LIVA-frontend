import { useState } from 'react'
import { Link } from 'react-router'
import { Menu, X } from 'lucide-react'

const links = [
  ['Overview', '#overview'],
  ['Services', '#services'],
  ['How it works', '#how-it-works'],
  ['Why Liva', '#why-liva'],
  ['Who it’s for', '#who-its-for'],
  ['FAQs', '#faqs'],
]

export default function LandingNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="landing-header">
      <nav
        className="landing-nav"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          className="liva-logo"
          aria-label="Liva home"
        >
          <img
            src="/images/liva-logo.png"
            alt="Liva"
            style={{
              display: 'block',
              width: 135,
              height: 52,
              objectFit: 'contain',
            }}
          />
        </Link>

        <div className="desktop-links">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
            >
              {label}
            </a>
          ))}
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label={
            open
              ? 'Close navigation'
              : 'Open navigation'
          }
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>
      </nav>

      {open && (
        <div
          id="mobile-navigation"
          className="mobile-navigation"
        >
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}