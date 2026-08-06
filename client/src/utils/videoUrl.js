export function cloudinaryToPlayableUrl(src) {
  if (!src || typeof src !== 'string') return src
  if (!/cloudinary\.com/i.test(src)) return src
  if (/\bsignature=/i.test(src)) return src

  const split = src.search(/[?#]/)
  const base = split === -1 ? src : src.slice(0, split)
  const tail = split === -1 ? '' : src.slice(split)

  if (!/\/video\/upload\//.test(base)) return src

  let path = base.replace(/\.m3u8$/i, '')

  path = path.replace(/\/f_(?:auto|hls|dash|hevc|vp5|vp9|av1|h264|m3u8)\b/i, '/f_mp4,vc_h264,q_auto:good')

  if (!/\/f_mp4/i.test(path)) {
    path = path.replace('/video/upload/', '/video/upload/f_mp4,vc_h264,q_auto:good/')
  } else if (!/vc_h264/i.test(path)) {
    path = path.replace(/\/f_mp4/i, '/f_mp4,vc_h264')
  }

  path = path.replace(/\.(mov|avi|mkv|flv|wmv|webm|m4v|3gp|ts)$/i, '.mp4')

  return path + tail
}