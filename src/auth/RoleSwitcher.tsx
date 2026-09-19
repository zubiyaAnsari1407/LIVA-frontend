import {
  ChevronDown,
  LogOut,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react'

import {
  useAuth,
} from './AuthContext'

import {
  ROLE_LABELS,
} from './roles'


export default function RoleSwitcher() {
  const {
    role,
    logout,
  } = useAuth()


  if (!role) {
    return null
  }


  function changeRole() {
    logout()

    window.location.replace(
      `${window.location.origin}/access`,
    )
  }


  function exitDemo() {
    logout()

    window.location.replace(
      `${window.location.origin}/`,
    )
  }


  return (
    <div
      className="
        fixed
        bottom-5
        right-5
        z-[9999]
      "
    >
      <details
        className="
          group
          relative
        "
      >
        <summary
          className="
            flex
            cursor-pointer
            list-none
            items-center
            gap-3
            rounded-2xl
            border
            border-[#d9e3dd]
            bg-white/95
            px-4
            py-3
            shadow-xl
            backdrop-blur-xl
            transition
            hover:border-[#b7c7be]
          "
        >
          <span
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-[#173f35]
              text-white
            "
          >
            <ShieldCheck
              size={17}
              aria-hidden="true"
            />
          </span>


          <span
            className="min-w-0"
          >
            <span
              className="
                block
                text-[9px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-[#9a7b43]
              "
            >
              Current role
            </span>

            <strong
              className="
                block
                max-w-[150px]
                truncate
                text-xs
                text-[#173f35]
              "
            >
              {ROLE_LABELS[role]}
            </strong>
          </span>


          <ChevronDown
            size={15}
            aria-hidden="true"
            className="
              text-[#718078]
              transition-transform
              group-open:rotate-180
            "
          />
        </summary>


        <div
          className="
            absolute
            bottom-[calc(100%+10px)]
            right-0
            w-56
            overflow-hidden
            rounded-2xl
            border
            border-[#dce5df]
            bg-white
            p-2
            shadow-2xl
          "
        >
          <div
            className="
              border-b
              border-[#edf1ee]
              px-3
              py-2
            "
          >
            <p
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.14em]
                text-[#9a7b43]
              "
            >
              LIVA Access
            </p>

            <p
              className="
                mt-1
                text-xs
                font-bold
                text-[#173f35]
              "
            >
              {ROLE_LABELS[role]}
            </p>
          </div>


          <button
            type="button"
            onClick={changeRole}
            className="
              mt-2
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              text-left
              text-xs
              font-semibold
              text-[#315f53]
              transition
              hover:bg-[#edf4f0]
            "
          >
            <RefreshCcw
              size={15}
              aria-hidden="true"
            />

            Change role
          </button>


          <button
            type="button"
            onClick={exitDemo}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              text-left
              text-xs
              font-semibold
              text-[#79534a]
              transition
              hover:bg-[#f8efed]
            "
          >
            <LogOut
              size={15}
              aria-hidden="true"
            />

            Exit to landing page
          </button>
        </div>
      </details>
    </div>
  )
}