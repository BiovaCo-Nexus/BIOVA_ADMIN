"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface LazyImageProps {
 src: string
 alt: string
 className?: string
 placeholder?: string
 width?: number
 height?: number
}

export const LazyImage: React.FC<LazyImageProps> = ({
 src,
 alt,
 className = "",
 placeholder = "/placeholder.svg?height=400&width=600",
 width,
 height,
}) => {
 const [isLoaded, setIsLoaded] = useState(false)
 const [isInView, setIsInView] = useState(false)
 const imgRef = useRef<HTMLImageElement>(null)

 useEffect(() => {
 const observer = new IntersectionObserver(
 ([entry]) => {
 if (entry.isIntersecting) {
 setIsInView(true)
 observer.disconnect()
 }
 },
 { threshold: 0.1 },
 )

 if (imgRef.current) {
 observer.observe(imgRef.current)
 }

 return () => observer.disconnect()
 }, [])

 return (
 <img
 ref={imgRef}
 src={isInView ? src : placeholder}
 alt={alt}
 className={`transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-70"} ${className}`}
 width={width}
 height={height}
 loading="lazy"
 onLoad={() => setIsLoaded(true)}
 onError={() => setIsLoaded(false)}
 />
 )
}
