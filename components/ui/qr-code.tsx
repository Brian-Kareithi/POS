"use client"

import { useEffect, useState } from "react"
import QRCodeLib from "qrcode"
import { cn } from "@/lib/utils/cn"

interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

/** A real, scannable QR code (rendered to an SVG data URL in the browser). */
export function QRCode({ value, size = 200, className }: QRCodeProps) {
  const [src, setSrc] = useState("")

  useEffect(() => {
    let cancelled = false
    QRCodeLib.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M" })
      .then((svg) => { if (!cancelled) setSrc(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`) })
      .catch(() => { if (!cancelled) setSrc("") })
    return () => { cancelled = true }
  }, [value])

  return (
    <div className={cn("overflow-hidden rounded-lg bg-white", className)} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} width={size} height={size} alt={`QR code for ${value}`} />}
    </div>
  )
}
