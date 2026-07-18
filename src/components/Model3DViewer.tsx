"use client"

import { Suspense, useRef, useState, useEffect, type ReactNode } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, ContactShadows, Center } from "@react-three/drei"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Heart, MessageCircle, X, Send, Box } from "lucide-react"
import { ShareMenu } from "@/components/ShareMenu"
import { supabase } from "@/integrations/supabase/client"
import * as THREE from "three"
import { useLoader } from "@react-three/fiber"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader"
import React from "react"

interface Model3DProps {
 url: string
 fileType: string
 colorHex?: string
}

// Helper to center and scale any Object3D into a target size box
function fitObject(object: THREE.Object3D, targetSize = 2) {
 const box = new THREE.Box3().setFromObject(object)
 const size = new THREE.Vector3()
 const center = new THREE.Vector3()
 box.getSize(size)
 box.getCenter(center)

 const maxDim = Math.max(size.x, size.y, size.z) || 1
 const scale = targetSize / maxDim

 object.traverse((child: any) => {
 if (child.isMesh) {
 child.castShadow = false
 child.receiveShadow = false
 }
 })

 object.scale.setScalar(scale)
 object.position.sub(center.multiplyScalar(scale)) // recenters to origin
}

// Individual loaders per format to avoid conditional hooks
const PRIMARY_MODEL_COLOR = "#E0F0E0" // from RGB(179, 265, 203) -> clamped to (179, 255, 203)

const GLTFModel = ({ url, colorHex = PRIMARY_MODEL_COLOR }: { url: string; colorHex?: string }) => {
 const ref = useRef<THREE.Object3D>(null)
 const gltf = useLoader(GLTFLoader, url, (loader) => {
 loader.setCrossOrigin("anonymous")
 })

 const scene = React.useMemo(() => {
 return gltf?.scene ? (gltf.scene.clone() as THREE.Object3D) : null
 }, [gltf])

 useEffect(() => {
 if (scene) {
 fitObject(scene, 2)
 }
 }, [scene])

 useEffect(() => {
 if (!scene) return
 const color = new THREE.Color(colorHex)

 scene.traverse((child: any) => {
 if (child?.isMesh) {
 // ensure unique material and geometry per canvas instance
 if (Array.isArray(child.material)) {
 child.material = child.material.map((m: any) => (m?.isMaterial ? m.clone() : m))
 } else if (child.material?.isMaterial) {
 child.material = child.material.clone()
 }
 if (child.geometry?.isBufferGeometry) {
 child.geometry = child.geometry.clone()
 }

 // apply color and visibility tweaks
 if (Array.isArray(child.material)) {
 child.material.forEach((m: any) => {
 if (m?.color) {
 m.color.copy(color)
 if ("roughness" in m && typeof m.roughness === "number") m.roughness = Math.min(0.25, m.roughness)
 if ("metalness" in m && typeof m.metalness === "number") m.metalness = Math.max(0.1, m.metalness)
 if ("emissive" in m && m.emissive) {
 m.emissive = color.clone()
 if ("emissiveIntensity" in m) m.emissiveIntensity = 0.06
 }
 m.needsUpdate = true
 }
 })
 } else if (child.material?.color) {
 child.material.color.copy(color)
 if ("roughness" in child.material && typeof child.material.roughness === "number")
 child.material.roughness = Math.min(0.25, child.material.roughness ?? 0.25)
 if ("metalness" in child.material && typeof child.material.metalness === "number")
 child.material.metalness = Math.max(0.1, child.material.metalness ?? 0.1)
 if ("emissive" in child.material && child.material.emissive) {
 child.material.emissive = color.clone()
 if ("emissiveIntensity" in child.material) child.material.emissiveIntensity = 0.06
 }
 child.material.needsUpdate = true
 }
 }
 })
 }, [scene, colorHex])

 useFrame(() => {
 if (ref.current) {
 ref.current.rotation.y += 0.005
 }
 })

 return scene ? <primitive ref={ref} object={scene} /> : null
}

const STLModel = ({ url, colorHex = PRIMARY_MODEL_COLOR }: { url: string; colorHex?: string }) => {
 const ref = useRef<THREE.Mesh>(null)
 const geometry = useLoader(STLLoader, url, (loader) => {
 loader.setCrossOrigin("anonymous")
 })

 useEffect(() => {
 if (geometry) {
 const geometryClone = geometry.clone()
 const mat = new THREE.MeshStandardMaterial({
 color: new THREE.Color(colorHex),
 metalness: 0.12,
 roughness: 0.25,
 emissive: new THREE.Color(colorHex),
 emissiveIntensity: 0.06,
 })
 const mesh = new THREE.Mesh(geometryClone, mat)
 fitObject(mesh, 2)
 if (ref.current) {
 ref.current.geometry = geometryClone
 ref.current.material = mat
 ref.current.scale.copy(mesh.scale)
 ref.current.position.copy(mesh.position)
 }
 }
 }, [geometry, colorHex])

 useFrame(() => {
 if (ref.current) {
 ref.current.rotation.y += 0.005
 }
 })

 return <mesh ref={ref} />
}

const OBJModel = ({ url, colorHex = PRIMARY_MODEL_COLOR }: { url: string; colorHex?: string }) => {
 const ref = useRef<THREE.Object3D>(null)
 const originalObj = useLoader(OBJLoader, url, (loader) => {
 loader.setCrossOrigin("anonymous")
 })

 const obj = React.useMemo(() => {
 return originalObj ? (originalObj.clone(true) as THREE.Object3D) : null
 }, [originalObj])

 useEffect(() => {
 if (obj) {
 obj.traverse((child: any) => {
 if (child.isMesh) {
 // ensure unique material and geometry per canvas instance
 if (Array.isArray(child.material)) {
 child.material = child.material.map((m: any) => (m?.isMaterial ? m.clone() : m))
 } else if (child.material?.isMaterial) {
 child.material = child.material.clone()
 }
 if (child.geometry?.isBufferGeometry) {
 child.geometry = child.geometry.clone()
 }

 if (!child.material) {
 child.material = new THREE.MeshStandardMaterial({
 color: new THREE.Color(colorHex),
 metalness: 0.12,
 roughness: 0.25,
 emissive: new THREE.Color(colorHex),
 emissiveIntensity: 0.06,
 })
 } else if (child.material?.color) {
 child.material.color = new THREE.Color(colorHex)
 if ("roughness" in child.material && typeof child.material.roughness === "number")
 child.material.roughness = Math.min(0.25, child.material.roughness ?? 0.25)
 if ("metalness" in child.material && typeof child.material.metalness === "number")
 child.material.metalness = Math.max(0.12, child.material.metalness ?? 0.12)
 if ("emissive" in child.material && child.material.emissive) {
 child.material.emissive = new THREE.Color(colorHex)
 if ("emissiveIntensity" in child.material) child.material.emissiveIntensity = 0.06
 }
 child.material.needsUpdate = true
 }
 }
 })
 fitObject(obj, 2)
 }
 }, [obj, colorHex])

 useFrame(() => {
 if (ref.current) {
 ref.current.rotation.y += 0.005
 }
 })

 return obj ? <primitive ref={ref} object={obj} /> : null
}

const FallbackCube = ({ fileType }: { fileType: string }) => {
 const ref = useRef<THREE.Mesh>(null)

 useEffect(() => {
 if (fileType?.toLowerCase() === "step") {
 console.warn("[v0] STEP files are not natively supported by three.js. Showing fallback preview.")
 }
 }, [fileType])

 useFrame(() => {
 if (ref.current) {
 ref.current.rotation.y += 0.005
 }
 })

 const color =
 fileType === "stl" ? 0xff6b35 : fileType === "step" ? 0x1f6635 : fileType === "obj" ? 0xe11d48 : 0x1f6635

 return (
 <mesh ref={ref} scale={[1.2, 1.2, 1.2]}>
 <boxGeometry args={[1.5, 1.5, 1.5]} />
 <meshPhongMaterial color={color} shininess={100} transparent opacity={0.9} />
 </mesh>
 )
}

const Model3D = ({ url, fileType, colorHex = PRIMARY_MODEL_COLOR }: Model3DProps) => {
 const type = (fileType || "").toLowerCase()

 if (type === "glb" || type === "gltf") {
 return <GLTFModel url={url} colorHex={colorHex} />
 }
 if (type === "stl") {
 return <STLModel url={url} colorHex={colorHex} />
 }
 if (type === "obj") {
 return <OBJModel url={url} colorHex={colorHex} />
 }

 return <FallbackCube fileType={type} />
}

interface Comment {
 id: string
 user_name: string
 comment: string
 created_at: string
}

interface Model3DData {
 id: string
 title: string
 description: string
 file_url: string
 file_type: string
 created_at: string
 is_active: boolean
 likes: number
 likedBy: string[]
 comments: Comment[]
}

// ColorizeGroup helper that applies color to meshes and scales the entire model
const ColorizeGroup = ({
 colorHex,
 scale = 1,
 children,
}: { colorHex: string; scale?: number; children: ReactNode }) => {
 const groupRef = useRef<THREE.Group>(null)

 useEffect(() => {
 if (!groupRef.current) return
 const color = new THREE.Color(colorHex || "#9e9e9e")
 groupRef.current.traverse((child: any) => {
 if (child?.isMesh) {
 // Support single or array materials
 if (Array.isArray(child.material)) {
 child.material.forEach((m: any) => {
 if (m && "color" in m && m.color) {
 m.color.copy(color)
 m.needsUpdate = true
 }
 })
 } else if (child.material && "color" in child.material && child.material.color) {
 child.material.color.copy(color)
 child.material.needsUpdate = true
 }
 }
 })
 }, [colorHex])

 return (
 <group ref={groupRef} scale={[scale, scale, scale]}>
 {children}
 </group>
 )
}

const BrightStudioLights = () => {
 return (
 <>
 <ambientLight intensity={0.5} />
 <hemisphereLight args={[0xffffff, 0xd8ead8, 0.5]} />
 <directionalLight position={[8, 10, 5]} intensity={1.1} />
 <directionalLight position={[-8, 6, -5]} intensity={0.7} />
 <ContactShadows opacity={0.06} scale={10} blur={1.6} far={10} resolution={256} frames={1} />
 </>
 )
}

export const Model3DViewer = () => {
 const [models, setModels] = useState<Model3DData[]>([])
 const [selectedModel, setSelectedModel] = useState<Model3DData | null>(null)
 const [newComment, setNewComment] = useState("")
 const [currentUser] = useState(() => {
 if (typeof window !== "undefined") {
 let sessionId = localStorage.getItem("user_session_id")
 if (!sessionId) {
 sessionId = "user_" + Math.random().toString(36).substr(2, 9)
 localStorage.setItem("user_session_id", sessionId)
 }
 return sessionId
 }
 return "user_" + Math.random().toString(36).substr(2, 9)
 })

 const [viewerColor, setViewerColor] = useState<string>(PRIMARY_MODEL_COLOR)
 const [viewerScale, setViewerScale] = useState<number>(0.9)

 useEffect(() => {
 // reset controls when switching models
 if (selectedModel) {
 setViewerColor(PRIMARY_MODEL_COLOR)
 setViewerScale(0.9)
 }
 }, [selectedModel])

 const loadModels = async () => {
 try {
 const { data: modelsData, error: modelsError } = await supabase
 .from("model_3d")
 .select("*")
 .eq("is_active", true)
 .order("created_at", { ascending: false })

 if (modelsError) throw modelsError

 const modelsWithInteractions = await Promise.all(
 (modelsData || []).map(async (model) => {
 const { count: likesCount } = await supabase
 .from("model_3d_likes")
 .select("*", { count: "exact", head: true })
 .eq("model_id", model.id)

 const { data: userLike } = await supabase
 .from("model_3d_likes")
 .select("user_id")
 .eq("model_id", model.id)
 .eq("user_id", currentUser)
 .single()

 const { data: commentsData } = await supabase
 .from("model_3d_comments")
 .select("*")
 .eq("model_id", model.id)
 .order("created_at", { ascending: true })

 return {
 ...model,
 likes: likesCount || 0,
 likedBy: userLike ? [currentUser] : [],
 comments: commentsData || [],
 }
 }),
 )

 setModels(modelsWithInteractions)
 } catch (error) {
 console.error("Failed to load 3D models:", error)
 }
 }

 useEffect(() => {
 loadModels()

 const modelsSubscription = supabase
 .channel("model_3d_changes")
 .on("postgres_changes", { event: "*", schema: "public", table: "model_3d" }, loadModels)
 .on("postgres_changes", { event: "*", schema: "public", table: "model_3d_likes" }, loadModels)
 .on("postgres_changes", { event: "*", schema: "public", table: "model_3d_comments" }, loadModels)
 .subscribe()

 return () => {
 supabase.removeChannel(modelsSubscription)
 }
 }, [currentUser])

 const handleLike = async (modelId: string) => {
 try {
 const { data: existingLike } = await supabase
 .from("model_3d_likes")
 .select("id")
 .eq("model_id", modelId)
 .eq("user_id", currentUser)
 .single()

 if (existingLike) {
 await supabase.from("model_3d_likes").delete().eq("model_id", modelId).eq("user_id", currentUser)
 } else {
 await supabase.from("model_3d_likes").insert({ model_id: modelId, user_id: currentUser })
 }

 await loadModels()
 } catch (error) {
 console.error("Failed to toggle like:", error)
 }
 }

 const handleAddComment = async (modelId: string) => {
 if (!newComment.trim()) return

 try {
 await supabase.from("model_3d_comments").insert({
 model_id: modelId,
 user_name: "Anonymous User",
 comment: newComment.trim(),
 })

 setNewComment("")
 await loadModels()
 } catch (error) {
 console.error("Failed to add comment:", error)
 }
 }

 const getModelShareUrl = (modelId: string) => {
 if (typeof window === "undefined") return `/?model=${modelId}`
 return `${window.location.origin}/?model=${modelId}`
 }

 if (models.length === 0) {
 return null
 }

 return (
 <>
 <section className="py-12 sm:py-16">
 <div className="text-center mb-8 sm:mb-12 relative">
 <div className="absolute inset-0 bg-muted/10 rounded-3xl opacity-60"></div>
 <div className="relative py-8 px-4">
 <div
 className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-full text-sm font-medium mb-4 "
 style={{ backgroundColor: "#1F6635" }}
 >
 <Box className="w-4 h-4" />
 3D Models
 </div>
 <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "#1F6635" }}>
 Explore Our 3D Innovation
 </h2>
 <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: "#555555" }}>
 Interactive 3D models showcasing our electroculture technology and innovations
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
 {models.map((model) => (
 <Card
 key={model.id}
 className="border-0 hover:shadow-2xl group overflow-hidden bg-white rounded-2xl hover:scale-[1.02]"
 >
 <div
 className="aspect-square overflow-hidden cursor-pointer relative bg-muted/10"
 onClick={() => setSelectedModel(model)}
 >
 <Canvas
 camera={{ position: [0, 0, 5], fov: 50 }}
 gl={{ antialias: true, alpha: true }}
 onCreated={({ gl }) => {
 gl.toneMapping = THREE.ACESFilmicToneMapping
 ;(gl as any).outputColorSpace = THREE.SRGBColorSpace
 // @ts-expect-error - property exists on WebGLRenderer
 gl.toneMappingExposure = 1.2 // was 1.4
 }}
 >
 {/* replace simple lights with a balanced bright rig */}
 <BrightStudioLights />
 <Suspense fallback={null}>
 {/* Wrap with ColorizeGroup so user color + scale apply */}
 <Center disableZ={false} fit>
 {/* Reduce showcase scale from 2 -> 1.6 for "thoda chhota" */}
 <ColorizeGroup colorHex={PRIMARY_MODEL_COLOR} scale={1.1}>
 <Model3D url={model.file_url} fileType={model.file_type} />
 </ColorizeGroup>
 </Center>
 <OrbitControls
 enableZoom={false}
 enablePan={false}
 enableRotate={true}
 autoRotate
 autoRotateSpeed={1}
 target={[0, 0, 0]}
 minPolarAngle={Math.PI / 2}
 maxPolarAngle={Math.PI / 2}
 enableDamping
 dampingFactor={0.1}
 />
 </Suspense>
 </Canvas>
 <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
 <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
 <Box className="h-4 w-4 text-foreground" />
 </div>
 </div>

 {/* Card content */}
 <CardContent className="p-6 sm:p-8">
 <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
 <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#1F6635" }}></div>
 {new Date(model.created_at).toLocaleDateString("en-US", {
 year: "numeric",
 month: "long",
 day: "numeric",
 })}
 </div>

 <h3
 className="text-xl sm:text-2xl font-bold mb-4 cursor-pointer leading-tight"
 style={{ color: "#1F6635" }}
 onClick={() => setSelectedModel(model)}
 >
 {model.title}
 </h3>

 <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">{model.description}</p>

 <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handleLike(model.id)}
 className={`flex items-center gap-2 px-3 py-2 rounded-full ${
 model.likedBy?.includes(currentUser)
 ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100"
 : "text-gray-600 hover:text-red-500 hover:bg-red-50"
 }`}
 >
 <Heart
 className={`h-4 w-4 transition-transform duration-200 ${model.likedBy?.includes(currentUser) ? "fill-current scale-110" : "hover:scale-110"}`}
 />
 <span className="font-medium">{model.likes || 0}</span>
 </Button>

 <Button
 variant="ghost"
 size="sm"
 onClick={() => setSelectedModel(model)}
 className="flex items-center gap-2 text-gray-600 px-3 py-2 rounded-full "
 style={{ borderRadius: 9999 }}
 >
 <MessageCircle className="h-4 w-4" style={{ color: "#1F6635" }} />
 <span className="font-medium">{model.comments?.length || 0}</span>
 </Button>

 <ShareMenu
 title={model.title}
 url={getModelShareUrl(model.id)}
 description={model.description?.slice(0, 120)}
 variant="ghost"
 size="sm"
 />
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </section>

 <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
 <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white rounded-3xl border-0 shadow-2xl">
 <DialogHeader className="border-b border-gray-100 pb-4">
 <DialogTitle className="flex items-center justify-between">
 <span className="text-2xl font-bold" style={{ color: "#1F6635" }}>
 {selectedModel?.title}
 </span>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => setSelectedModel(null)}
 className="rounded-full hover:bg-gray-100 p-2"
 >
 <X className="h-5 w-5" />
 </Button>
 </DialogTitle>
 </DialogHeader>

 {selectedModel && (
 <div className="space-y-8 pt-6">
 <div className="w-full h-96 rounded-2xl overflow-hidden bg-muted/10">
 {/* key resets controls/camera when switching models */}
 <Canvas
 key={selectedModel.id}
 camera={{ position: [0, 0, 5], fov: 50 }}
 gl={{ antialias: true, alpha: true }}
 onCreated={({ gl }) => {
 gl.toneMapping = THREE.ACESFilmicToneMapping
 ;(gl as any).outputColorSpace = THREE.SRGBColorSpace
 // Keep modal lighting bright for clarity
 // @ts-expect-error - property exists on WebGLRenderer
 gl.toneMappingExposure = 1.4 // was 1.6
 }}
 >
 {/* replace simple lights with a balanced bright rig */}
 <BrightStudioLights />
 <Suspense fallback={null}>
 {/* Wrap with ColorizeGroup so user color + scale apply */}
 <Center disableZ={false} fit>
 <ColorizeGroup colorHex={viewerColor} scale={viewerScale}>
 <Model3D
 url={selectedModel.file_url}
 fileType={selectedModel.file_type}
 colorHex={viewerColor}
 />
 </ColorizeGroup>
 </Center>
 <OrbitControls
 makeDefault
 enableZoom={true}
 enablePan={true}
 enableRotate={true}
 autoRotate={false}
 target={[0, 0, 0]}
 minDistance={0.5}
 maxDistance={20}
 zoomSpeed={0.8}
 rotateSpeed={0.8}
 panSpeed={0.8}
 mouseButtons={{
 LEFT: THREE.MOUSE.ROTATE,
 MIDDLE: THREE.MOUSE.DOLLY,
 RIGHT: THREE.MOUSE.PAN,
 }}
 />
 </Suspense>
 </Canvas>
 </div>

 {/* Controls UI (unchanged) */}
 <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
 <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2">
 <span className="text-sm text-gray-600">Color</span>
 <input
 type="color"
 aria-label="Model color"
 value={viewerColor}
 onChange={(e) => setViewerColor(e.target.value)}
 className="w-10 h-10 rounded-full border border-gray-200 p-0 bg-transparent"
 />
 </div>

 <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2">
 <span className="text-sm text-gray-600">Scale</span>
 <input
 type="range"
 aria-label="Model scale"
 min={0.5}
 max={3}
 step={0.1}
 value={viewerScale}
 onChange={(e) => setViewerScale(Number.parseFloat(e.target.value))}
 className="w-full accent-green-600"
 />
 <span className="text-sm text-gray-700 w-10 text-right">{viewerScale.toFixed(1)}x</span>
 </div>

 <Button
 variant="outline"
 onClick={() => {
 setViewerColor(PRIMARY_MODEL_COLOR)
 setViewerScale(0.9)
 }}
 className="border-border text-foreground hover:bg-muted/50"
 >
 Reset
 </Button>
 </div>

 <div className="prose prose-lg max-w-none">
 <h3 className="text-3xl font-bold mb-6 text-gray-900 leading-tight">{selectedModel.title}</h3>
 <p className="text-gray-700 text-xl leading-relaxed mb-6">{selectedModel.description}</p>
 </div>

 <div className="border-t border-gray-100 pt-8">
 <div className="flex items-center gap-6 mb-8">
 <Button
 variant="ghost"
 onClick={() => handleLike(selectedModel.id)}
 className={`flex items-center gap-3 px-6 py-3 rounded-full text-lg font-medium ${
 selectedModel.likedBy?.includes(currentUser)
 ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100"
 : "text-gray-600 hover:text-red-500 hover:bg-red-50"
 }`}
 >
 <Heart
 className={`h-6 w-6 ${selectedModel.likedBy?.includes(currentUser) ? "fill-current" : ""}`}
 />
 {selectedModel.likes || 0} Likes
 </Button>

 <div
 className="flex items-center gap-3 text-gray-600 rounded-full px-6 py-3"
 style={{ backgroundColor: "#EAF4ED" }}
 >
 <MessageCircle className="h-6 w-6" style={{ color: "#1F6635" }} />
 <span className="font-medium text-lg" style={{ color: "#1F6635" }}>
 {selectedModel.comments?.length || 0} Comments
 </span>
 </div>

 <ShareMenu
 title={selectedModel.title}
 url={getModelShareUrl(selectedModel.id)}
 description={selectedModel.description?.slice(0, 160)}
 variant="outline"
 size="sm"
 />
 </div>

 {/* Comments Section */}
 <div className="space-y-4">
 <h4 className="font-semibold text-lg">Comments</h4>

 {/* Add Comment */}
 <div className="flex gap-2">
 <Input
 placeholder="Add a comment..."
 value={newComment}
 onChange={(e) => setNewComment(e.target.value)}
 onKeyPress={(e) => {
 if (e.key === "Enter") {
 handleAddComment(selectedModel.id)
 }
 }}
 className="flex-1"
 />
 <Button onClick={() => handleAddComment(selectedModel.id)} disabled={!newComment.trim()} size="sm">
 <Send className="h-4 w-4" />
 </Button>
 </div>

 {/* Comments List */}
 <div className="space-y-3 max-h-60 overflow-y-auto">
 {selectedModel.comments?.map((comment) => (
 <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
 <div className="flex items-center gap-2 mb-1">
 <span className="font-medium text-sm">{comment.user_name}</span>
 <span className="text-xs text-gray-500">
 {new Date(comment.created_at).toLocaleDateString()}
 </span>
 </div>
 <p className="text-gray-700">{comment.comment}</p>
 </div>
 ))}

 {(!selectedModel.comments || selectedModel.comments.length === 0) && (
 <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
 )}
 </div>
 </div>
 </div>
 </div>
 )}
 </DialogContent>
 </Dialog>
 </>
 )
}
