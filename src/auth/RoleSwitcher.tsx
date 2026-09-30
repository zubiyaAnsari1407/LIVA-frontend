import {
  ChevronDown,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  GripHorizontal,
} from 'lucide-react'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

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

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  })

  const [dragging, setDragging] = useState(false)

  const dragStart = useRef({
    mouseX: 0,
    mouseY: 0,
    x: 0,
    y: 0,
  })

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


  function startDrag(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    event.preventDefault()

    dragStart.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      x: position.x,
      y: position.y,
    }

    setDragging(true)
  }


  useEffect(() => {
    if (!dragging) {
      return
    }

    function handleMouseMove(event: MouseEvent) {
      const deltaX =
        event.clientX - dragStart.current.mouseX

      const deltaY =
        event.clientY - dragStart.current.mouseY

      const nextX =
        dragStart.current.x + deltaX

      const nextY =
        dragStart.current.y + deltaY

      /*
       * Keep the switcher inside the viewport.
       */
      const maxHorizontal =
        Math.max(
          0,
          window.innerWidth - 180,
        )

      const maxVertical =
        Math.max(
          0,
          window.innerHeight - 80,
        )

      setPosition({
        x: Math.min(
          Math.max(nextX, -window.innerWidth + 180),
          maxHorizontal,
        ),

        y: Math.min(
          Math.max(nextY, -window.innerHeight + 80),
          maxVertical,
        ),
      })
    }


    function stopDrag() {
      setDragging(false)
    }


    window.addEventListener(
      'mousemove',
      handleMouseMove,
    )

    window.addEventListener(
      'mouseup',
      stopDrag,
    )


    return () => {
      window.removeEventListener(
        'mousemove',
        handleMouseMove,
      )

      window.removeEventListener(
        'mouseup',
        stopDrag,
      )
    }
  }, [dragging])


  return (
    <div
      className="fixed bottom-5 right-5 z-[9999]"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <div
        className={`
          relative
          ${dragging ? 'cursor-grabbing' : ''}
        `}
      >

        {/* Drag Handle */}
        <div
          onMouseDown={startDrag}
          title="Drag to move"
          className="
            absolute
            -top-5
            left-1/2
            z-20
            flex
            h-6
            w-12
            -translate-x-1/2
            cursor-grab
            items-center
            justify-center
            rounded-t-lg
            border
            border-b-0
            border-[#d9e3dd]
            bg-white
            text-[#718078]
            shadow-sm
            transition
            hover:text-[#173f35]
            active:cursor-grabbing
          "
        >
          <GripHorizontal
            size={16}
            aria-hidden="true"
          />
        </div>


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
    </div>
  )
}