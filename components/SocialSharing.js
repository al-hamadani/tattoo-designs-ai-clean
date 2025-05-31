// components/SocialSharing.js
import { useState } from 'react'
import { Share2, Download, Instagram, Twitter } from 'lucide-react'

export default function SocialSharing({ imageUrl, design, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false)

  const addWatermark = async (imageUrl) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        
        // Draw original image
        ctx.drawImage(img, 0, 0)
        
        // Add watermark
        ctx.font = '20px Arial'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillText('Created with TattooDesignsAI', 20, img.height - 30)
        
        // Convert to blob
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      }
      
      img.src = imageUrl
    })
  }

  const shareToInstagram = async () => {
    setIsProcessing(true)
    try {
      const watermarkedBlob = await addWatermark(imageUrl)
      
      // Create optimized image for Instagram (1080x1080)
      const instagramCanvas = document.createElement('canvas')
      const ctx = instagramCanvas.getContext('2d')
      instagramCanvas.width = 1080
      instagramCanvas.height = 1080
      
      const img = new Image()
      img.onload = () => {
        // Center the image
        const size = Math.min(img.width, img.height)
        const x = (img.width - size) / 2
        const y = (img.height - size) / 2
        
        ctx.drawImage(img, x, y, size, size, 0, 0, 1080, 1080)
        
        instagramCanvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `tattoo-design-instagram-${Date.now()}.jpg`
          link.click()
          URL.revokeObjectURL(url)
        }, 'image/jpeg', 0.9)
      }
      
      img.src = URL.createObjectURL(watermarkedBlob)
    } finally {
      setIsProcessing(false)
    }
  }

  const shareToTwitter = async () => {
    setIsProcessing(true)
    try {
      const watermarkedBlob = await addWatermark(imageUrl)
      const url = URL.createObjectURL(watermarkedBlob)
      
      // Twitter optimal size (1200x675)
      const twitterCanvas = document.createElement('canvas')
      const ctx = twitterCanvas.getContext('2d')
      twitterCanvas.width = 1200
      twitterCanvas.height = 675
      
      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0, 0, 1200, 675)
        
        const scale = Math.min(1200 / img.width, 675 / img.height)
        const width = img.width * scale
        const height = img.height * scale
        const x = (1200 - width) / 2
        const y = (675 - height) / 2
        
        ctx.drawImage(img, x, y, width, height)
        
        twitterCanvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `tattoo-design-twitter-${Date.now()}.jpg`
          link.click()
          URL.revokeObjectURL(url)
        }, 'image/jpeg', 0.9)
      }
      
      img.src = url
    } finally {
      setIsProcessing(false)
    }
  }

  const shareToPinterest = async () => {
    setIsProcessing(true)
    try {
      const watermarkedBlob = await addWatermark(imageUrl)
      
      // Pinterest optimal size (1000x1500)
      const pinterestCanvas = document.createElement('canvas')
      const ctx = pinterestCanvas.getContext('2d')
      pinterestCanvas.width = 1000
      pinterestCanvas.height = 1500
      
      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 1000, 1500)
        
        // Center image in top 2/3
        const targetHeight = 1000
        const scale = Math.min(1000 / img.width, targetHeight / img.height)
        const width = img.width * scale
        const height = img.height * scale
        const x = (1000 - width) / 2
        const y = 50
        
        ctx.drawImage(img, x, y, width, height)
        
        // Add description text
        ctx.font = 'bold 36px Arial'
        ctx.fillStyle = '#333333'
        ctx.textAlign = 'center'
        ctx.fillText(design.prompt, 500, targetHeight + 150)
        
        ctx.font = '24px Arial'
        ctx.fillText(`${design.style} Style Tattoo`, 500, targetHeight + 200)
        
        pinterestCanvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `tattoo-design-pinterest-${Date.now()}.jpg`
          link.click()
          URL.revokeObjectURL(url)
        }, 'image/jpeg', 0.9)
      }
      
      img.src = URL.createObjectURL(watermarkedBlob)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadWithWatermark = async () => {
    setIsProcessing(true)
    try {
      const watermarkedBlob = await addWatermark(imageUrl)
      const url = URL.createObjectURL(watermarkedBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tattoo-design-${design.style}-${Date.now()}.jpg`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Share Your Design</h3>
        
        <div className="space-y-3">
          <button
            onClick={shareToInstagram}
            disabled={isProcessing}
            className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            <Instagram className="w-5 h-5" />
            Download for Instagram (1080x1080)
          </button>
          
          <button
            onClick={shareToTwitter}
            disabled={isProcessing}
            className="w-full flex items-center gap-3 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            <Twitter className="w-5 h-5" />
            Download for Twitter (1200x675)
          </button>
          
          <button
            onClick={shareToPinterest}
            disabled={isProcessing}
            className="w-full flex items-center gap-3 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
          >
            <Share2 className="w-5 h-5" />
            Download for Pinterest (1000x1500)
          </button>
          
          <button
            onClick={downloadWithWatermark}
            disabled={isProcessing}
            className="w-full flex items-center gap-3 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Download with Watermark
          </button>
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
        
        {isProcessing && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Processing your image...
          </div>
        )}
      </div>
    </div>
  )
}