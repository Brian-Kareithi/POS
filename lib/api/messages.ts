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
    case "BUSINESS_SUSPENDED": return { tone: "error", code: e.code, message: "This business account has been suspended, so nobody in it can sign in right now. Please contact support." }
    case "BUSINESS_CLOSED": return { tone: "error", code: e.code, message: "This business account has been closed." }
    case "TOKEN_REVOKED": return { tone: "error", code: e.code, message: "Your access changed, so you were signed out. Please sign in again." }
    case "REFRESH_REUSED":
    case "REFRESH_EXPIRED":
    case "REFRESH_INVALID": return { tone: "error", code: e.code, message: "Your session has ended. Please sign in again." }
    case "NETWORK": return { tone: "error", code: e.code, message: "Cannot reach the server. Check your internet connection and try again." }
    case "VALIDATION_ERROR": return { tone: "error", code: e.code, message: e.message }
    case "RATE_LIMITED": return { tone: "error", code: e.code, message: "Too many attempts. Please try again later." }
    default:
      if (e.status === 429) return { tone: "error", code: e.code, message: "Too many attempts. Please try again later." }
      if (e.status === 0) return { tone: "error", code: e.code, message: "Cannot reach the server. Check your internet connection and try again." }
      return { tone: "error", code: e.code, message: e.message || fallback }
  }
}
