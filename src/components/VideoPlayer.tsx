import type React from "react"

interface VideoPlayerProps {
 url: string
 title: string
 description?: string
 className?: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, description, className = "" }) => {
 const getEmbedUrl = (url: string) => {
 // YouTube
 const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
 if (youtubeMatch) {
 return `https://www.youtube.com/embed/${youtubeMatch[1]}`
 }

 // Vimeo
 const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
 if (vimeoMatch) {
 return `https://player.vimeo.com/video/${vimeoMatch[1]}`
 }

 // Direct video file
 if (url.match(/\.(mp4|webm|ogg)$/i)) {
 return url
 }

 return url
 }

 const embedUrl = getEmbedUrl(url)
 const isDirectVideo = url.match(/\.(mp4|webm|ogg)$/i)

 return (
 <div className={`w-full ${className}`}>
 <div className="relative w-full h-64 md:h-full bg-black rounded-lg overflow-hidden">
 {isDirectVideo ? (
 <video controls className="w-full h-full object-cover" title={title}>
 <source src={embedUrl} type="video/mp4" />
 Your browser does not support the video tag.
 </video>
 ) : (
 <iframe
 src={embedUrl}
 title={title}
 className="w-full h-full"
 frameBorder="0"
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 allowFullScreen
 />
 )}
 </div>
 {description && <p className="text-sm text-muted-foreground mt-2 italic">{description}</p>}
 </div>
 )
}

export default VideoPlayer
