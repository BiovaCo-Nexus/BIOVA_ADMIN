"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface AccessibilityContextType {
 isHighContrast: boolean
 isReducedMotion: boolean
 fontSize: "normal" | "large" | "extra-large"
 toggleHighContrast: () => void
 toggleReducedMotion: () => void
 setFontSize: (size: "normal" | "large" | "extra-large") => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export const useAccessibility = () => {
 const context = useContext(AccessibilityContext)
 if (!context) {
 throw new Error("useAccessibility must be used within AccessibilityProvider")
 }
 return context
}

export const AccessibilityProvider = ({ children }: { children: React.ReactNode }) => {
 const [isHighContrast, setIsHighContrast] = useState(false)
 const [isReducedMotion, setIsReducedMotion] = useState(false)
 const [fontSize, setFontSize] = useState<"normal" | "large" | "extra-large">("normal")

 useEffect(() => {
 // Check for user's system preferences
 const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
 const prefersHighContrast = window.matchMedia("(prefers-contrast: high)").matches

 setIsReducedMotion(prefersReducedMotion)
 setIsHighContrast(prefersHighContrast)

 // Load saved preferences
 const savedHighContrast = localStorage.getItem("accessibility-high-contrast") === "true"
 const savedReducedMotion = localStorage.getItem("accessibility-reduced-motion") === "true"
 const savedFontSize = localStorage.getItem("accessibility-font-size") as "normal" | "large" | "extra-large"

 if (savedHighContrast) setIsHighContrast(true)
 if (savedReducedMotion) setIsReducedMotion(true)
 if (savedFontSize) setFontSize(savedFontSize)
 }, [])

 useEffect(() => {
 // Apply accessibility classes to document
 const root = document.documentElement

 if (isHighContrast) {
 root.classList.add("high-contrast")
 } else {
 root.classList.remove("high-contrast")
 }

 if (isReducedMotion) {
 root.classList.add("reduced-motion")
 } else {
 root.classList.remove("reduced-motion")
 }

 root.classList.remove("font-normal", "font-large", "font-extra-large")
 root.classList.add(`font-${fontSize}`)
 }, [isHighContrast, isReducedMotion, fontSize])

 const toggleHighContrast = () => {
 const newValue = !isHighContrast
 setIsHighContrast(newValue)
 localStorage.setItem("accessibility-high-contrast", newValue.toString())
 }

 const toggleReducedMotion = () => {
 const newValue = !isReducedMotion
 setIsReducedMotion(newValue)
 localStorage.setItem("accessibility-reduced-motion", newValue.toString())
 }

 const handleSetFontSize = (size: "normal" | "large" | "extra-large") => {
 setFontSize(size)
 localStorage.setItem("accessibility-font-size", size)
 }

 return (
 <AccessibilityContext.Provider
 value={{
 isHighContrast,
 isReducedMotion,
 fontSize,
 toggleHighContrast,
 toggleReducedMotion,
 setFontSize: handleSetFontSize,
 }}
 >
 {children}
 </AccessibilityContext.Provider>
 )
}
