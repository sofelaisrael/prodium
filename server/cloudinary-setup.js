const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: 'q9gvgpqu',
  api_key: '314678564738245',
  api_secret: 'EoT7mJ0_bAzfNaVp3Q7ajcy1n3w',
})

async function main() {
  // 1. Upload a sample image from Cloudinary's demo
  const uploadResult = await cloudinary.uploader.upload(
    'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    { public_id: 'prodium-sample' },
  )

  console.log('Uploaded!')
  console.log('Secure URL:', uploadResult.secure_url)
  console.log('Public ID:', uploadResult.public_id)
  console.log()

  // 2. Get image details
  const details = await cloudinary.api.resource(uploadResult.public_id)
  console.log('Image details:')
  console.log('  Width:   ' + details.width + 'px')
  console.log('  Height:  ' + details.height + 'px')
  console.log('  Format:  ' + details.format)
  console.log('  Size:    ' + details.bytes + ' bytes')
  console.log()

  // 3. Generate transformed URL
  // f_auto — automatically picks the best format (WebP, AVIF, etc.) for the browser
  // q_auto — automatically adjusts quality to balance file size and visual quality
  const transformedUrl = cloudinary.url(uploadResult.public_id, {
    transformation: [{ width: 400, height: 300, crop: 'fill' }],
    format: 'auto',
    quality: 'auto',
  })

  console.log('Done! Click link below to see optimized version of the image.')
  console.log('Check the size and the format.')
  console.log()
  console.log('Transformed URL:')
  console.log(transformedUrl)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
