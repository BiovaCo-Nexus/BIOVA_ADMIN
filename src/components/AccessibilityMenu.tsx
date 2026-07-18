"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAccessibility } from "./AccessibilityProvider"
import { Settings, Eye, Type, Zap, X } from "lucide-react"

export const AccessibilityMenu = () => {
 const [isOpen, setIsOpen] = useState(false)
 const { isHighContrast, isReducedMotion, fontSize, toggleHighContrast, toggleReducedMotion, setFontSize } =
 useAccessibility()

 return (
 <>
 {/* Accessibility Menu Toggle Button */}
 <Button
 onClick={() => setIsOpen(true)}
 className="fixed bottom-4 right-4 z-50 bg-primary/10 hover:bg-primary/10 text-white rounded-full p-3 "
 aria-label="Open accessibility menu"
 title="Accessibility Options"
 >
 <Settings className="h-5 w-5" />
 </Button>

 {/* Accessibility Menu Overlay */}
 {isOpen && (
 <div
 className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
 onClick={() => setIsOpen(false)}
 role="dialog"
 aria-modal="true"
 aria-labelledby="accessibility-menu-title"
 >
 <Card className="w-full max-w-md bg-white" onClick={(e) => e.stopPropagation()}>
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle id="accessibility-menu-title" className="text-lg font-bold">
 Accessibility Options
 </CardTitle>
 <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close accessibility menu">
 <X className="h-4 w-4" />
 </Button>
 </CardHeader>
 <CardContent className="space-y-4">
 {/* High Contrast Toggle */}
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <Eye className="h-4 w-4 text-foreground" />
 <span className="text-sm font-medium">High Contrast</span>
 </div>
 <div className="flex items-center space-x-2">
 {isHighContrast && <Badge variant="secondary">On</Badge>}
 <Button
 variant={isHighContrast ? "default" : "outline"}
 size="sm"
 onClick={toggleHighContrast}
 aria-pressed={isHighContrast}
 >
 {isHighContrast ? "Disable" : "Enable"}
 </Button>
 </div>
 </div>

 {/* Reduced Motion Toggle */}
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-2">
 <Zap className="h-4 w-4 text-foreground" />
 <span className="text-sm font-medium">Reduce Motion</span>
 </div>
 <div className="flex items-center space-x-2">
 {isReducedMotion && <Badge variant="secondary">On</Badge>}
 <Button
 variant={isReducedMotion ? "default" : "outline"}
 size="sm"
 onClick={toggleReducedMotion}
 aria-pressed={isReducedMotion}
 >
 {isReducedMotion ? "Disable" : "Enable"}
 </Button>
 </div>
 </div>

 {/* Font Size Controls */}
 <div className="space-y-2">
 <div className="flex items-center space-x-2">
 <Type className="h-4 w-4 text-foreground" />
 <span className="text-sm font-medium">Font Size</span>
 </div>
 <div className="flex space-x-2">
 <Button
 variant={fontSize === "normal" ? "default" : "outline"}
 size="sm"
 onClick={() => setFontSize("normal")}
 aria-pressed={fontSize === "normal"}
 >
 Normal
 </Button>
 <Button
 variant={fontSize === "large" ? "default" : "outline"}
 size="sm"
 onClick={() => setFontSize("large")}
 aria-pressed={fontSize === "large"}
 >
 Large
 </Button>
 <Button
 variant={fontSize === "extra-large" ? "default" : "outline"}
 size="sm"
 onClick={() => setFontSize("extra-large")}
 aria-pressed={fontSize === "extra-large"}
 >
 Extra Large
 </Button>
 </div>
 </div>

 {/* Keyboard Navigation Info */}
 <div className="pt-4 border-t">
 <h4 className="text-sm font-medium mb-2">Keyboard Navigation</h4>
 <div className="text-xs text-gray-600 space-y-1">
 <p>• Tab: Navigate forward</p>
 <p>• Shift + Tab: Navigate backward</p>
 <p>• Enter/Space: Activate buttons</p>
 <p>• Escape: Close dialogs</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 )}
 </>
 )
}
