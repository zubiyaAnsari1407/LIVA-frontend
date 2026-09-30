import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

export type FlashType =
  | "success"
  | "error"
  | "info";

export type FlashMessageData = {
  id: string;
  message: string;
  type: FlashType;
};

type FlashContextValue = {
  showFlash: (
    message: string,
    type?: FlashType,
  ) => void;

  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;

  dismissFlash: (id: string) => void;
};

const FlashContext =
  createContext<FlashContextValue | null>(null);

const FLASH_EVENT = "liva:flash";

type FlashEventDetail = {
  message: string;
  type?: FlashType;
};

function createFlashId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function FlashProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [messages, setMessages] = useState<
    FlashMessageData[]
  >([]);

  const dismissFlash = useCallback(
    (id: string) => {
      setMessages((current) =>
        current.filter(
          (message) => message.id !== id,
        ),
      );
    },
    [],
  );

  const showFlash = useCallback(
    (
      message: string,
      type: FlashType = "success",
    ) => {
      const trimmed = message.trim();

      if (!trimmed) {
        return;
      }

      const id = createFlashId();

      setMessages((current) => [
        ...current.slice(-2),
        {
          id,
          message: trimmed,
          type,
        },
      ]);

      window.setTimeout(() => {
        dismissFlash(id);
      }, 3500);
    },
    [dismissFlash],
  );

  const success = useCallback(
    (message: string) => {
      showFlash(message, "success");
    },
    [showFlash],
  );

  const error = useCallback(
    (message: string) => {
      showFlash(message, "error");
    },
    [showFlash],
  );

  const info = useCallback(
    (message: string) => {
      showFlash(message, "info");
    },
    [showFlash],
  );

  /*
   * Allows flash messages to be triggered
   * from anywhere in the application.
   *
   * Example:
   * window.dispatchEvent(
   *   new CustomEvent("liva:flash", {
   *     detail: {
   *       message: "Project created successfully.",
   *       type: "success",
   *     },
   *   }),
   * );
   */
  useEffect(() => {
    const handleFlash = (
      event: CustomEvent<FlashEventDetail>,
    ) => {
      const detail = event.detail;

      if (!detail?.message) {
        return;
      }

      showFlash(
        detail.message,
        detail.type ?? "success",
      );
    };

    window.addEventListener(
      FLASH_EVENT,
      handleFlash as EventListener,
    );

    return () => {
      window.removeEventListener(
        FLASH_EVENT,
        handleFlash as EventListener,
      );
    };
  }, [showFlash]);

  const value = useMemo<FlashContextValue>(
    () => ({
      showFlash,
      success,
      error,
      info,
      dismissFlash,
    }),
    [
      showFlash,
      success,
      error,
      info,
      dismissFlash,
    ],
  );

  return (
    <FlashContext.Provider value={value}>
      {children}

      {/* GLOBAL FLASH MESSAGES */}
      <div
        className="
          fixed
          top-5
          right-5
          z-[9999]
          flex
          w-[min(420px,calc(100vw-2rem))]
          flex-col
          gap-3
          pointer-events-none
        "
        aria-live="polite"
        aria-atomic="true"
      >
        {messages.map((item) => {
          const isSuccess =
            item.type === "success";

          const isError =
            item.type === "error";

          return (
            <div
              key={item.id}
              className={`
                pointer-events-auto
                flex
                items-start
                gap-3
                rounded-xl
                border
                bg-white
                px-4
                py-3.5
                shadow-[0_12px_35px_rgba(15,23,42,0.16)]
                backdrop-blur-sm
                animate-[livaFlashIn_0.25s_ease-out]
                ${
                  isSuccess
                    ? "border-emerald-200"
                    : isError
                    ? "border-red-200"
                    : "border-sky-200"
                }
              `}
              role={isError ? "alert" : "status"}
            >
              {/* ICON */}
              <div
                className={`
                  mt-0.5
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  ${
                    isSuccess
                      ? "bg-emerald-50 text-emerald-600"
                      : isError
                      ? "bg-red-50 text-red-600"
                      : "bg-sky-50 text-sky-600"
                  }
                `}
              >
                {isSuccess ? (
                  <CheckCircle2
                    size={20}
                    strokeWidth={2}
                  />
                ) : isError ? (
                  <AlertCircle
                    size={20}
                    strokeWidth={2}
                  />
                ) : (
                  <Info
                    size={20}
                    strokeWidth={2}
                  />
                )}
              </div>

              {/* CONTENT */}
              <div className="min-w-0 flex-1">
                <p
                  className={`
                    text-[13px]
                    font-semibold
                    ${
                      isSuccess
                        ? "text-emerald-800"
                        : isError
                        ? "text-red-800"
                        : "text-sky-800"
                    }
                  `}
                >
                  {isSuccess
                    ? "Action completed"
                    : isError
                    ? "Action failed"
                    : "Information"}
                </p>

                <p className="mt-0.5 text-[13px] leading-5 text-slate-600">
                  {item.message}
                </p>
              </div>

              {/* CLOSE */}
              <button
                type="button"
                onClick={() =>
                  dismissFlash(item.id)
                }
                className="
                  mt-0.5
                  shrink-0
                  rounded-md
                  p-1
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                "
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <style>
        {`
          @keyframes livaFlashIn {
            from {
              opacity: 0;
              transform: translateY(-10px) translateX(8px);
            }

            to {
              opacity: 1;
              transform: translateY(0) translateX(0);
            }
          }
        `}
      </style>
    </FlashContext.Provider>
  );
}

export function useFlash() {
  const context = useContext(FlashContext);

  if (!context) {
    throw new Error(
      "useFlash must be used inside FlashProvider",
    );
  }

  return context;
}