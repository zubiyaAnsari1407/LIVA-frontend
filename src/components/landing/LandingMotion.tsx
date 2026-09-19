import { useEffect } from 'react'

export default function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector('.landing-page')
    if (!root) return

    const targets = root.querySelectorAll<HTMLElement>(`
  .landing-intro,
  .service-card,
  .workflow-heading,
  .workflow-step,
  .team-banner,
  .extras-section-heading,
  .benefit-card,
  .role-card,
  .faq-intro,
  .faq-list,
  .landing-cta
`)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (media.matches || !('IntersectionObserver' in window)) {
      return
    }

    targets.forEach((element) => {
      element.classList.add('scroll-reveal')
    })

    root.querySelectorAll<HTMLElement>('.service-card')
      .forEach((element, index) => {
        element.style.setProperty(
          '--reveal-delay',
          `${(index % 3) * 80}ms`,
        )
      })

    root.querySelectorAll<HTMLElement>('.workflow-step')
      .forEach((element, index) => {
        element.style.setProperty(
          '--reveal-delay',
          `${index * 90}ms`,
        )
      })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -20px 0px',
      },
    )

    targets.forEach((element) => observer.observe(element))

    function showEverything() {
      if (!media.matches) return

      observer.disconnect()
      targets.forEach((element) => {
        element.classList.add('is-visible')
      })
    }

    media.addEventListener('change', showEverything)

    return () => {
      observer.disconnect()
      media.removeEventListener('change', showEverything)

      targets.forEach((element) => {
        element.classList.remove('scroll-reveal', 'is-visible')
        element.style.removeProperty('--reveal-delay')
      })
    }
  }, [])

  return null
}