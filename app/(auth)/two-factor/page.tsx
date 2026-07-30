"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function TwoFactorPage() {
  const router = useRouter()
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backward" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = () => {
    router.push("/")
  }

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Two-factor authentication</h2>
        <p className="text-sm text-gray-500 mb-6">Enter the 6-digit code from your authenticator app.</p>

        <div className="flex items-center justify-center gap-2 mb-6">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-10 h-12 text-center text-lg font-semibold rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ))}
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={code.some((d) => !d)}>
          Verify
        </Button>

        <p className="mt-4 text-sm text-gray-500">
          <button className="text-blue-600 hover:text-blue-700">Use a recovery code</button>
        </p>
      </CardContent>
    </Card>
  )
}
