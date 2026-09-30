export type FlashType =
  | "success"
  | "error"
  | "info";

const FLASH_EVENT = "liva:flash";

export function showFlash(
  message: string,
  type: FlashType = "success",
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(FLASH_EVENT, {
      detail: {
        message,
        type,
      },
    }),
  );
}

export function flashSuccess(
  message: string,
) {
  showFlash(message, "success");
}

export function flashError(
  message: string,
) {
  showFlash(message, "error");
}

export function flashInfo(
  message: string,
) {
  showFlash(message, "info");
}