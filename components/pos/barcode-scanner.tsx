"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Detector {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>
}
type DetectorCtor = new (options?: { formats?: string[] }) => Detector

interface BarcodeScannerProps {
  open: boolean
  onClose: () => void
  onDetected: (code: string) => void
  /** Keep the camera open after each scan (useful when ringing up many items). */
  continuous?: boolean
}

export function BarcodeScanner({ open, onClose, onDetected, continuous = false }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastScan = useRef({ code: "", at: 0 })
  const onDetectedRef = useRef(onDetected)
  const [error, setError] = useState("")
  const [manual, setManual] = useState("")

  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onDetectedRef.current = onDetected
    onCloseRef.current = onClose
  }, [onDetected, onClose])

  useEffect(() => {
    if (!open) return
    let stream: MediaStream | undefined
    let timer: ReturnType<typeof setInterval> | undefined
    let cancelled = false
    const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector

    const start = async () => {
      if (!Ctor) return setError("Camera scanning isn't supported in this browser. Use a handheld scanner or type the code below.")
      if (!navigator.mediaDevices?.getUserMedia) return setError("Camera access isn't available. It needs HTTPS or localhost.")
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        const detector = new Ctor()
        timer = setInterval(async () => {
          if (video.readyState < 2) return
          const codes = await detector.detect(video).catch(() => [])
          const code = codes[0]?.rawValue
          if (!code) return
          const now = Date.now()
          if (code === lastScan.current.code && now - lastScan.current.at < 2000) return
          lastScan.current = { code, at: now }
          onDetectedRef.current(code)
          if (!continuous) onCloseRef.current()
        }, 300)
      } catch {
        setError("Couldn't open the camera. Check the browser's camera permission, or type the code below.")
      }
    }
    start()

    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [open, continuous])

  const submitManual = () => {
    const code = manual.trim()
    if (!code) return
    onDetected(code)
    setManual("")
    if (!continuous) onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Scan barcode" size="md">
      <div className="space-y-4">
        {error ? (
          <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-700">{error}</p>
        ) : (
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80" />
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); submitManual() }} className="flex items-end gap-2">
          <div className="flex-1"><Input label="Or enter barcode / SKU" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="e.g. 5449000000996" /></div>
          <Button type="submit">Add</Button>
        </form>
      </div>
    </Dialog>
  )
}
