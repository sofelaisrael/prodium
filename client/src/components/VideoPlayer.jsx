import { VPlayer } from 'vplayer-react'

export default function VideoPlayer({ src, className = '' }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ maxHeight: '80vh' }}>
      <VPlayer
        src={src}
        accentColor="#000000"
        iconColor="#ffffff"
        className="w-fit"
      />
    </div>
  )
}
