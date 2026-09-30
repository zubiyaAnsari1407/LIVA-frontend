import { useState } from 'react'
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Landmark,
  ShieldCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { ROLE_LABELS, type UserRole } from '../auth/roles'

const roles: {
  id: UserRole
  icon: typeof ShieldCheck
  caption: string
}[] = [
  {
    id: 'landowner',
    icon: Landmark,
    caption: 'View available information about land and projects.',
  },
  {
    id: 'officer',
    icon: BriefcaseBusiness,
    caption: 'Review projects and follow up on pending work.',
  },
  {
    id: 'admin',
    icon: ShieldCheck,
    caption: 'Manage records and important project information.',
  },
]

export default function AccessPage() {
  const navigate = useNavigate()

  const [selectedRole, setSelectedRole] =
    useState<UserRole>('landowner')

  function handleContinue() {
    navigate(
      `/login?role=${selectedRole}`,
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f4ed] px-5 py-10 text-[#173f35] md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center">
        <section className="w-full max-w-5xl overflow-hidden rounded-[30px] border border-[#d9e1db] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.10)]">

          {/* TOP IMAGE */}
          <div className="relative h-[260px] overflow-hidden border-b border-[#dce4df] md:h-[300px]">
            <img
              src="/images/liva-project-lens.png"
              alt="LIVA project"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,44,37,0.88)_0%,rgba(16,44,37,0.72)_35%,rgba(16,44,37,0.24)_70%,rgba(16,44,37,0.10)_100%)]" />

            <div className="absolute inset-0 flex flex-col justify-between p-7 md:p-10">

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

              <div className="max-w-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d8bf7a]">
                  Access Portal
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-[36px]">
                  Choose your role
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
                  Select your role to continue to LIVA.
                </p>
              </div>

            </div>
          </div>

          {/* ROLE GRID */}
          <div className="grid gap-4 bg-[#fbfcfa] p-7 md:grid-cols-3 md:p-10">

            {roles.map(
              ({
                id,
                icon: Icon,
                caption,
              }) => {
                const selected =
                  selectedRole === id

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setSelectedRole(id)
                    }
                    className={`group relative flex min-h-[170px] flex-col justify-center overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300 ${
                      selected
                        ? 'border-[#b88c32] bg-gradient-to-br from-[#fffdf6] to-[#f7efd9] shadow-[0_10px_28px_rgba(128,96,33,0.13)]'
                        : 'border-[#dfe6e1] bg-white hover:border-[#9bb2a7] hover:shadow-md'
                    }`}
                  >

                    {selected && (
                      <div className="absolute inset-y-0 left-0 w-1 bg-[#b68a32]" />
                    )}

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        selected
                          ? 'bg-[#173f35] text-white'
                          : 'bg-[#edf3ef] text-[#315f53]'
                      }`}
                    >
                      <Icon
                        size={21}
                        strokeWidth={1.8}
                      />
                    </div>

                    <div className="mt-5">
                      <span className="text-base font-bold text-[#173f35]">
                        {ROLE_LABELS[id]}
                      </span>

                      <p className="mt-2 text-sm leading-6 text-[#78857e]">
                        {caption}
                      </p>
                    </div>

                    {selected && (
                      <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#b68a32] text-white">
                        <Check
                          size={15}
                          strokeWidth={2.4}
                        />
                      </div>
                    )}

                  </button>
                )
              },
            )}

          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end border-t border-[#dfe6e1] bg-white px-7 py-6 md:px-10">

            <button
              type="button"
              onClick={handleContinue}
              className="group inline-flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-[#173f35] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-[#215346]"
            >
              Continue to Login

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
