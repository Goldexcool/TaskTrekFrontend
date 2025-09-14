"use client"
 
import * as React from "react"
 
export function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="dark">{children}</div>
}
