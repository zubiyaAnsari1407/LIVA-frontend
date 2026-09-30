import { useMemo } from 'react'
import {
  ArrowRight,
  LockKeyhole,
  UserRound,
} from 'lucide-react'
import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router'
import { useAuth } from '../auth/AuthContext'
import {
  ROLE_LABELS,
  type UserRole,
} from '../auth/roles'

type LoginDetails = {
  username: string
  password: string
}

const LOGIN_DETAILS: Record<UserRole, LoginDetails> = {
  officer: {
    username: 'officer@liva.demo',
    password: 'LIVA@Officer123',
  },

  admin: {
    username: 'admin@liva.demo',
    password: 'LIVA@Admin123',
  },

  landowner: {
    username: 'landowner@liva.demo',
    password: 'LIVA@Landowner123',
  },
}

function isValidRole(
  value: string | null,
): value is UserRole {
  return (
    value === 'officer' ||
    value === 'admin' ||
    value === 'landowner'
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { selectRole } = useAuth()

  const roleParam = searchParams.get('role')

const selectedRole: UserRole =
  isValidRole(roleParam)
    ? roleParam
    : 'officer'

  const details = useMemo(
    () => LOGIN_DETAILS[selectedRole],
    [selectedRole],
  )

  function handleLogin() {
    selectRole(selectedRole)

    navigate('/dashboard', {
      replace: true,
    })
  }

  return (
    <main className="min-h-screen bg-[#f5f4ed] text-[#173f35]">
      <div className="relative min-h-screen overflow-hidden">

        <img
          src="/images/liva-login-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-[#102f28]/40" />

        <div className="absolute inset-0 bg-gradient-to-r from-[#102f28]/45 via-transparent to-[#102f28]/10" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">

          <section className="w-full max-w-md">

            <div className="rounded-[28px] border border-white/70 bg-white/95 p-7 shadow-[0_25px_70px_rgba(16,47,40,0.28)] backdrop-blur-xl md:p-9">

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#173f35] text-white">
                  <LockKeyhole size={20} strokeWidth={1.8} />
                </div>

                <div>
                  <h1 className="text-lg font-bold tracking-tight text-[#173f35]">
                    LIVA
                  </h1>

                  <p className="text-[11px] text-[#708078]">
                    Land Acquisition Intelligence
                  </p>
                </div>
              </div>

              <div className="mt-9">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b68a32]">
                  {ROLE_LABELS[selectedRole]}
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#173f35]">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#66756d]">
                  Your login details are ready. Click Login to continue.
                </p>
              </div>

              <div className="mt-7 space-y-5">

                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-medium text-[#31483f]"
                  >
                    Username
                  </label>

                  <div className="relative">
                    <UserRound
                      size={17}
                      strokeWidth={1.7}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#789087]"
                    />

                    <input
                      id="username"
                      type="text"
                      value={details.username}
                      readOnly
                      className="w-full rounded-xl border border-[#d5dfd9] bg-[#f8faf8] py-3.5 pl-11 pr-4 text-sm text-[#173f35] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-[#31483f]"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={17}
                      strokeWidth={1.7}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#789087]"
                    />

                    <input
                      id="password"
                      type="password"
                      value={details.password}
                      readOnly
                      className="w-full rounded-xl border border-[#d5dfd9] bg-[#f8faf8] py-3.5 pl-11 pr-4 text-sm text-[#173f35] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogin}
                  className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#173f35] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(23,63,53,0.18)] transition-all duration-200 hover:bg-[#215346] hover:shadow-[0_10px_24px_rgba(23,63,53,0.25)]"
                >
                  Login
                  <ArrowRight
                    size={17}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </button>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/access"
                  className="text-xs font-medium text-[#66756d] transition hover:text-[#173f35]"
                >
                  Change role
                </Link>
              </div>

            </div>

            <p className="mt-5 text-center text-[11px] text-white/90">
              LIVA — Land Acquisition Intelligence
            </p>

          </section>
        </div>
      </div>
    </main>
  )
}
