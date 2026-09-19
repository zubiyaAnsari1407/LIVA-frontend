import { useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  Landmark,
  ShieldCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { ROLE_LABELS, type UserRole } from '../auth/roles'

const roles: {
  id: UserRole
  icon: typeof ShieldCheck
  caption: string
  badge?: string
}[] = [
  {
    id: 'judge',
    icon: Landmark,
    caption: 'SIH Review',
    badge: 'Recommended',
  },
  {
    id: 'admin',
    icon: ShieldCheck,
    caption: 'Administration',
  },
  {
    id: 'officer',
    icon: BriefcaseBusiness,
    caption: 'Project Operations',
  },
  {
    id: 'analyst',
    icon: BarChart3,
    caption: 'Analytics',
  },
]

export default function AccessPage() {
  const navigate = useNavigate()
  const { selectRole } = useAuth()

  const [selectedRole, setSelectedRole] =
    useState<UserRole>('judge')

  function handleContinue() {
    selectRole(selectedRole)
    navigate('/dashboard', { replace: true })
  }

  return (
    <main className="min-h-screen bg-[#f5f4ed] px-5 py-10 text-[#173f35] md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center">
        <section className="w-full max-w-5xl overflow-hidden rounded-[30px] border border-[#d9e1db] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
          
          {/* TOP IMAGE AREA */}
          <div className="relative h-[260px] overflow-hidden border-b border-[#dce4df] md:h-[300px]">
            <img
              src="/images/liva-project-lens.png"
              alt="LIVA access background"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,44,37,0.88)_0%,rgba(16,44,37,0.72)_35%,rgba(16,44,37,0.24)_70%,rgba(16,44,37,0.10)_100%)]" />

            <div className="absolute inset-0 flex flex-col justify-between p-7 md:p-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-md">
                    <Landmark size={22} strokeWidth={1.8} />
                  </div>

                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">
                      LIVA
                    </h1>
                    <p className="text-[11px] text-white/75">
                      Land Acquisition Intelligence
                    </p>
                  </div>
                </div>

                <div className="hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80 backdrop-blur-md md:block">
                  Decision Support Platform
                </div>
              </div>

              <div className="max-w-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d8bf7a]">
                  Access Portal
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-[36px]">
                  Choose your role
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
                  Enter the LIVA workspace and explore land acquisition,
                  project intelligence, GIS mapping and simulation tools.
                </p>
              </div>
            </div>
          </div>

          {/* ROLE GRID */}
          <div className="grid gap-4 bg-[#fbfcfa] p-7 md:grid-cols-2 md:p-10">
            {roles.map(({ id, icon: Icon, caption, badge }) => {
              const selected = selectedRole === id

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedRole(id)}
                  className={`group relative flex min-h-[112px] items-center gap-4 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
                    selected
                      ? 'border-[#b88c32] bg-gradient-to-br from-[#fffdf6] to-[#f7efd9] shadow-[0_10px_28px_rgba(128,96,33,0.13)]'
                      : 'border-[#dfe6e1] bg-white hover:border-[#9bb2a7] hover:shadow-md'
                  }`}
                >
                  {selected && (
                    <div className="absolute inset-y-0 left-0 w-1 bg-[#b68a32]" />
                  )}

                  <div
                    className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                      selected
                        ? 'bg-[#173f35] text-white shadow-md'
                        : 'bg-[#edf3ef] text-[#315f53] group-hover:bg-[#e3eee8]'
                    }`}
                  >
                    <Icon size={21} strokeWidth={1.8} />
                  </div>

                  <div className="relative z-10 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#173f35]">
                        {ROLE_LABELS[id]}
                      </span>

                      {badge && (
                        <span className="rounded-full border border-[#e3d19d] bg-[#f3e8c9] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#84631e]">
                          {badge}
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 text-xs text-[#78857e]">
                      {caption}
                    </p>
                  </div>

                  {selected && (
                    <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#b68a32] text-white shadow-sm">
                      <Check size={15} strokeWidth={2.4} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* FOOTER */}
          <div className="flex flex-col gap-5 border-t border-[#dfe6e1] bg-white px-7 py-6 md:flex-row md:items-center md:justify-between md:px-10">
            <div>
              <p className="text-xs font-medium text-[#596a61]">
                Judge / Demo is pre-selected for quick SIH review.
              </p>

              <p className="mt-1 text-[10px] text-[#8a968f]">
                No email, password or registration required.
              </p>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              className="group inline-flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-[#173f35] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-[#215346]"
            >
              Continue to LIVA
              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}