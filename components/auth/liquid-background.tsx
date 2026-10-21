"use client"

import { useEffect, useState } from "react"
import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react"
import { useUIStore } from "@/lib/stores/ui-store"

// Serve the player's WebAssembly from our own origin instead of a public CDN.
setWasmUrl("/animations/dotlottie-player.wasm")

/**
 * The animated liquid backdrop behind sign-in and sign-up ("Liquid style abstract animated background" by Meenu Chan,
 * LottieFiles, Lottie Simple License; the file is served from /public so nothing loads from a third party).
 * It sits behind everything, ignores the pointer, and follows the light/dark theme, and stays still for people who ask their device for less motion.
 */
export function LiquidBackground() {
  const theme = useUIStore((s) => s.theme)
  const [still, setStill] = useState(false)
  useEffect(() => {
    const q = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    if (!q) return
    const update = () => setStill(q.matches)
    update()
    q.addEventListener("change", update)
    return () => q.removeEventListener("change", update)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {/* two colourings of the same animation: soft greens for light mode, deep greens for dark mode */}
      <DotLottieReact
        key={theme}
        src={theme === "dark" ? "/animations/liquid-background-dark.json" : "/animations/liquid-background.json"}
        loop
        autoplay={!still}
        renderConfig={{ autoResize: true }}
        layout={{ fit: "cover", align: [0.5, 0.5] }}
        className="h-full w-full"
      />
      {/* keeps text readable whatever colours the animation is showing */}
      <div className="absolute inset-0 bg-white/20 dark:bg-black/30" />
    </div>
  )
}
