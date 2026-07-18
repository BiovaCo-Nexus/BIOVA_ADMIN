import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
 value?: string;
 onChange: (imageData: string) => void;
 required?: boolean;
 error?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
 value,
 onChange,
 required,
 error,
}) => {
 const canvasRef = useRef<HTMLCanvasElement | null>(null);
 const [isDrawing, setIsDrawing] = useState(false);
 const [hasDrawn, setHasDrawn] = useState(false);

 // Redraw from value if present
 useEffect(() => {
 if (value && canvasRef.current) {
 const ctx = canvasRef.current.getContext("2d");
 if (!ctx) return;
 const img = new window.Image();
 img.src = value;
 img.onload = () => {
 ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
 ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
 };
 }
 if (!value && canvasRef.current) {
 const ctx = canvasRef.current.getContext("2d");
 if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
 }
 }, [value]);

 // Get canvas-relative pointer coordinates
 const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
 const canvas = canvasRef.current;
 if (!canvas) return { x: 0, y: 0 };
 const rect = canvas.getBoundingClientRect();
 if ("touches" in e && e.touches.length > 0) {
 const touch = e.touches[0];
 return {
 x: (touch.clientX - rect.left) * (canvas.width / rect.width),
 y: (touch.clientY - rect.top) * (canvas.height / rect.height),
 };
 } else if ("changedTouches" in e && e.changedTouches.length > 0) {
 const touch = e.changedTouches[0];
 return {
 x: (touch.clientX - rect.left) * (canvas.width / rect.width),
 y: (touch.clientY - rect.top) * (canvas.height / rect.height),
 };
 }
 const mouse = e as React.MouseEvent;
 return {
 x: (mouse.clientX - rect.left) * (canvas.width / rect.width),
 y: (mouse.clientY - rect.top) * (canvas.height / rect.height),
 };
 };

 // Start Drawing
 const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
 e.preventDefault();
 const { x, y } = getPointerPosition(e);
 const ctx = canvasRef.current?.getContext("2d");
 if (!ctx) return;
 ctx.beginPath();
 ctx.moveTo(x, y);
 setIsDrawing(true);
 setHasDrawn(true);

 // Prevent scrolling on mobile while drawing
 if ("touches" in e && e.touches.length > 0) {
 document.body.style.overscrollBehavior = "none";
 document.body.style.touchAction = "none";
 }
 };

 // Drawing as pointer moves
 const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
 if (!isDrawing) return;
 e.preventDefault();
 const { x, y } = getPointerPosition(e);
 const ctx = canvasRef.current?.getContext("2d");
 if (!ctx) return;
 ctx.lineTo(x, y);
 ctx.strokeStyle = "#18181b"; // Corporate Navy Blue
 ctx.lineWidth = 2.5;
 ctx.lineCap = "round";
 ctx.lineJoin = "round";
 ctx.stroke();
 };

 // End Drawing
 const handlePointerUp = (e?: React.MouseEvent | React.TouchEvent) => {
 if (!isDrawing) return;
 setIsDrawing(false);

 // Re-enable scrolling on mobile
 if (e && "changedTouches" in e) {
 document.body.style.overscrollBehavior = "";
 document.body.style.touchAction = "";
 }

 if (canvasRef.current) {
 const data = canvasRef.current.toDataURL("image/png");
 onChange(data);
 }
 };

 // Clear signature
 const handleClear = () => {
 if (canvasRef.current) {
 const ctx = canvasRef.current.getContext("2d");
 ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
 onChange("");
 setHasDrawn(false);
 }
 };

 // Attach native events for better reliability (touch, mouse)
 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;

 // Native listeners for touch events
 const handleTouchStart = (e: TouchEvent) => handlePointerDown(e as any);
 const handleTouchMove = (e: TouchEvent) => handlePointerMove(e as any);
 const handleTouchEnd = (e: TouchEvent) => handlePointerUp(e as any);

 canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
 canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
 canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

 return () => {
 canvas.removeEventListener("touchstart", handleTouchStart);
 canvas.removeEventListener("touchmove", handleTouchMove);
 canvas.removeEventListener("touchend", handleTouchEnd);
 };
 }, [isDrawing, hasDrawn]);

 return (
 <div className="w-full relative flex flex-col">
 <div className="relative w-full h-[180px] bg-transparent">
 <canvas
 ref={canvasRef}
 width={800} // High res internal width
 height={360} // High res internal height for retina displays
 style={{
 touchAction: "none",
 width: "100%",
 height: "100%",
 display: "block",
 cursor: isDrawing ? "crosshair" : "pointer",
 }}
 onMouseDown={handlePointerDown}
 onMouseMove={handlePointerMove}
 onMouseUp={handlePointerUp}
 onMouseLeave={handlePointerUp}
 />
 <Button
 type="button"
 variant="ghost"
 size="sm"
 className="absolute right-4 top-4 text-muted-foreground hover:text-primary hover:bg-gray-200/50 rounded-xl px-3 h-8 bg-gray-100/50 backdrop-blur-sm "
 onClick={handleClear}
 >
 Clear
 </Button>
 </div>
 <div className="p-4 bg-gray-100/50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
 <p className="text-xs text-muted-foreground">
 Draw your signature above. Use your finger (mobile) or mouse (desktop).
 </p>
 {error && <p className="text-xs font-semibold text-red-500 mt-2 sm:mt-0">{error}</p>}
 </div>
 </div>
 );
};
