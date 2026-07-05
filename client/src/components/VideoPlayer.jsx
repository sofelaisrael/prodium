export default function VideoPlayer({ src, className = '' }) {
  return (
    <video
      src={src}
      controls
      className={`w-full max-h-[80vh] object-cover cursor-pointer ${className}`}
      preload="metadata"
    />
  )
}
