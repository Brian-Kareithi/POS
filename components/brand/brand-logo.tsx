"use client"

import { useState } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { APP_NAME, PLATFORM_LOGO } from "@/lib/constants"
import { mediaUrl } from "@/lib/utils/media"
import { cn } from "@/lib/utils/cn"

interface LogoProps { className?: string }

/** A plain <img>: logos are small, owner-uploaded and served by the API, so next/image's optimiser adds nothing here. */
function Logo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cn("object-contain", className)} draggable={false} />
}

/** The platform's logo. Used on sign-in and sign-up, where no business is known (and none may be shown). */
export function PlatformLogo({ className }: LogoProps) {
  return <Logo src={PLATFORM_LOGO} alt={APP_NAME} className={className} />
}

/** The signed-in business's logo, or the platform's own when the owner has not uploaded one (or it fails to load). */
export function BusinessLogo({ className }: LogoProps) {
  const business = useDataStore((s) => s.business)
  const url = mediaUrl(business?.logo)
  const [failed, setFailed] = useState<string | null>(null)
  if (!url || failed === url) return <PlatformLogo className={className} />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={`${business?.name ?? "Business"} logo`} className={cn("object-contain", className)} draggable={false} onError={() => setFailed(url)} />
}
