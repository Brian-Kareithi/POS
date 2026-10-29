"use client"

import * as React from "react"
import { cn } from "@/lib/utils/cn"

export type CatState = "idle" | "shy" | "peek" | "happy" | "sad"
export type LookAtTarget = { x: number; y: number } | "pointer"

export interface CatProps {
  state?: CatState
  lookAt?: LookAtTarget
  className?: string
  style?: React.CSSProperties
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"
const mediaQuery = () => (typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION) : null)

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = mediaQuery()
      mq?.addEventListener("change", onChange)
      return () => mq?.removeEventListener("change", onChange)
    },
    () => mediaQuery()?.matches ?? false,
    () => false
  )
}

function Eye({ side, cx, clipId, pupilRef }: { side: "l" | "r"; cx: number; clipId: string; pupilRef: React.RefObject<SVGGElement | null> }) {
  return (
    <g className={`cat-eye cat-eye-${side}`} data-cx={cx}>
      <ellipse className="eye-w" cx={cx} cy={86} rx={13} ry={14} />
      <g clipPath={`url(#${clipId})`}>
        <g className="pupil" ref={pupilRef}>
          <circle className="pup" cx={cx} cy={87} r={7} />
          <circle className="glint" cx={cx + 3} cy={83} r={2.2} />
        </g>
        <rect className="fur lid" x={cx - 14} y={71} width={28} height={31} style={{ transformOrigin: `${cx}px 71px` }} />
      </g>
      <path className="lash" d={`M${cx - 11} 89 Q${cx} 97 ${cx + 11} 89`} />
      <path className="happy-mouth" d={`M${cx - 10} 91 Q${cx} 78 ${cx + 10} 91`} />
    </g>
  )
}

/** The mascot. Its eyes follow the pointer; `state` drives the shy / peeking / happy / sad poses. */
export function Cat({ state = "idle", lookAt = "pointer", className, style }: CatProps) {
  const uid = React.useId().replace(/:/g, "")
  const svgRef = React.useRef<SVGSVGElement>(null)
  const leftPupil = React.useRef<SVGGElement>(null)
  const rightPupil = React.useRef<SVGGElement>(null)
  const [blink, setBlink] = React.useState(false)
  const [twitch, setTwitch] = React.useState(false)
  const reduceMotion = usePrefersReducedMotion()

  const shy = state === "shy" || state === "peek"
  const peek = state === "peek"
  const happy = state === "happy"
  const sad = state === "sad"

  const look = React.useCallback((x: number, y: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (!rect.width) return
    const scale = rect.width / 200
    ;[
      { ref: leftPupil, cx: 76 },
      { ref: rightPupil, cx: 124 },
    ].forEach(({ ref, cx }) => {
      const el = ref.current
      if (!el) return
      const dx = x - (rect.left + cx * scale)
      const dy = y - (rect.top + 86 * scale)
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      const m = Math.min(1, d / (140 * scale))
      el.style.transform = `translate(${((dx / d) * 5.5 * m).toFixed(2)}px,${((dy / d) * 5 * m).toFixed(2)}px)`
    })
  }, [])

  React.useEffect(() => {
    if (lookAt !== "pointer") return
    const onMove = (e: MouseEvent) => look(e.clientX, e.clientY)
    document.addEventListener("mousemove", onMove)
    return () => document.removeEventListener("mousemove", onMove)
  }, [lookAt, look])

  React.useEffect(() => {
    if (lookAt !== "pointer" && lookAt) look(lookAt.x, lookAt.y)
  }, [lookAt, look])

  React.useEffect(() => {
    if (reduceMotion || shy || happy) return
    let cancelled = false
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t)
        if (!cancelled) fn()
      }, ms)
      timers.add(t)
    }
    const loop = () => {
      later(() => {
        setBlink(true)
        later(() => setBlink(false), 130)
        if (Math.random() < 0.25) {
          later(() => {
            setBlink(true)
            later(() => setBlink(false), 110)
          }, 260)
        }
        if (Math.random() < 0.3) {
          setTwitch(false)
          requestAnimationFrame(() => setTwitch(true))
        }
        loop()
      }, 2400 + Math.random() * 3400)
    }
    loop()
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [shy, happy, reduceMotion])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 150"
      aria-hidden="true"
      className={cn("cat", blink && "is-blink", shy && "is-shy", peek && "is-peek", happy && "is-happy", sad && "is-sad", twitch && "is-twitch", className)}
      style={style}
      onAnimationEnd={() => setTwitch(false)}
    >
      <defs>
        <clipPath id={`${uid}-l`}><ellipse cx={76} cy={86} rx={13} ry={14} /></clipPath>
        <clipPath id={`${uid}-r`}><ellipse cx={124} cy={86} rx={13} ry={14} /></clipPath>
      </defs>
      <g className="cat-head">
        <g className="cat-ear cat-ear-l">
          <path className="fur" d="M44 72 L54 12 L96 46 Z" />
          <path className="ear-in" d="M55 60 L60 27 L83 46 Z" />
        </g>
        <g className="cat-ear cat-ear-r">
          <path className="fur" d="M156 72 L146 12 L104 46 Z" />
          <path className="ear-in" d="M145 60 L140 27 L117 46 Z" />
        </g>
        <ellipse className="fur" cx={100} cy={94} rx={64} ry={52} />
        <Eye side="l" cx={76} clipId={`${uid}-l`} pupilRef={leftPupil} />
        <Eye side="r" cx={124} clipId={`${uid}-r`} pupilRef={rightPupil} />
        <path className="nose" d="M94 104 Q100 102 106 104 L100 111 Z" />
        <path className="mouth" d="M100 111 Q100 118 92 118 M100 111 Q100 118 108 118" />
        <g className="whisk">
          <path d="M62 106 L28 99 M62 113 L28 116 M138 106 L172 99 M138 113 L172 116" />
        </g>
      </g>
      <g className="cat-paws">
        <ellipse className="fur" cx={66} cy={140} rx={18} ry={10} />
        <ellipse className="fur" cx={134} cy={140} rx={18} ry={10} />
        <path className="toe" d="M60 136v6M66 135v7M72 136v6M128 136v6M134 135v7M140 136v6" />
      </g>
    </svg>
  )
}
