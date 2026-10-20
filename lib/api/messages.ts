import { ApiError } from "@/lib/api/client"

export type Tone = "error" | "waiting"

/** One place that turns API error codes into the wording people see on the sign-in and sign-up screens. */
export function authFailure(e: unknown, fallback = "Something went wrong. Please try again."): { tone: Tone; message: string; code?: string } {
  if (!(e instanceof ApiError)) return { tone: "error", message: e instanceof Error ? e.message : fallback }
  switch (e.code) {
    case "ACCOUNT_PENDING": return { tone: "waiting", code: e.code, message: "Your account is waiting for the owner's approval. You'll be able to sign in once they approve it." }
    case "ACCOUNT_REJECTED": return { tone: "error", code: e.code, message: "Your request was declined. Contact the owner." }
    case "ACCOUNT_DISABLED": return { tone: "error", code: e.code, message: "Your account has been switched off. Contact the owner." }
    case "INVALID_CREDENTIALS": return { tone: "error", code: e.code, message: "Incorrect email or password." }
    case "TOTP_REQUIRED": return { tone: "error", code: e.code, message: "Enter the 6-digit code from your authenticator app." }
    case "TOTP_INVALID": return { tone: "error", code: e.code, message: "That code isn't right. Check your authenticator app and try again." }
    case "BUSINESS_REQUIRED":
    case "BUSINESS_NOT_FOUND": return { tone: "error", code: e.code, message: "This join link is invalid. Ask your employer for the correct link." }
    case "REGISTRATION_FAILED":
    case "DUPLICATE": return { tone: "error", code: e.code, message: "We could not register with those details. Check them and try again." }
    case "RATE_LIMITED": return { tone: "error", code: e.code, message: "Too many attempts. Please try again later." }
    default:
      if (e.status === 429) return { tone: "error", code: e.code, message: "Too many attempts. Please try again later." }
      return { tone: "error", code: e.code, message: e.message || fallback }
  }
}
