"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils/cn"

function generateQRMatrix(text: string, size: number): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))

  const fillRect = (x: number, y: number, w: number, h: number) => {
    for (let i = y; i < y + h; i++)
      for (let j = x; j < x + w; j++)
        if (i < size && j < size) matrix[i][j] = true
  }

  const finderPattern = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
  ]

  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++)
      if (finderPattern[y][x]) matrix[y][x] = true

  for (let y = 0; y < 7; y++)
    for (let x = size - 7; x < size; x++)
      if (finderPattern[y][x - (size - 7)]) matrix[y][x] = true

  for (let y = size - 7; y < size; y++)
    for (let x = 0; x < 7; x++)
      if (finderPattern[y - (size - 7)][x]) matrix[y][x] = true

  const hash = text.split("").reduce((acc, char) => {
    const code = char.charCodeAt(0)
    return ((acc << 5) - acc + code) | 0
  }, 0)

  let seed = Math.abs(hash)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (matrix[y][x]) continue
      const isFinderArea =
        (y < 7 && x < 7) ||
        (y < 7 && x >= size - 7) ||
        (y >= size - 7 && x < 7)
      if (isFinderArea) continue
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      matrix[y][x] = seed % 3 !== 0
    }
  }

  return matrix
}

interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

export function QRCode({ value, size = 200, className }: QRCodeProps) {
  const matrix = useMemo(() => generateQRMatrix(value, 25), [value])
  const cellSize = size / 25

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("", className)}
    >
      <rect width={size} height={size} fill="white" rx="8" />
      {matrix.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  )
}
