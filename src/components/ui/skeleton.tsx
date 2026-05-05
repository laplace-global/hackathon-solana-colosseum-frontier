import * as React from "react"

import { cn } from "@/lib/utils"

type SkeletonTone = "dark" | "light"

type SkeletonProps = React.ComponentProps<"div"> & {
  tone?: SkeletonTone
}

const toneClasses: Record<SkeletonTone, string> = {
  dark: "bg-card",
  light: "bg-card",
}

function Skeleton({ className, tone = "dark", ...props }: SkeletonProps) {
  return <div data-slot="skeleton" className={cn("animate-pulse rounded-none", toneClasses[tone], className)} {...props} />
}

export { Skeleton }
