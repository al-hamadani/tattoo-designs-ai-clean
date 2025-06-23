// components/RealSocialSharing.js
import { useState } from 'react'
import { Share2, Instagram, Twitter, Copy, ExternalLink } from 'lucide-react'

export default function RealSocialSharing({ imageUrl, design, onClose }) {
  const [copySuccess, setCopySuccess] = useState(false)

  // Create shareable content
  const shareText = `Check out this amazing ${design.style} tattoo design I created with AI! 🎨✨`
  const hashtags = ['TattooDesign', 'AIArt', 'TattooIdeas', design.style.replace('-', ''), 'InkInspiration']
  const websiteUrl = 'https://tattoodesignsai.com'

  // Instagram - Open Instagram app or web
  const shareToInstagram = () => {
    // Instagram doesn't allow direct posting via URL, so we'll copy text and open Instagram
    copyToClipboard(`${shareText}\n\n#${hashtags.join(' #')}\n\nCreate your own: ${websiteUrl}`)
    
    // Try to open Instagram app first, fallback to web
    const instagramUrl = 'instagram://camera'
    const instagramWebUrl = 'https://www.instagram.com/'
    
    try {
      window.location.href = instagramUrl
      // If Instagram app isn't installed, it will fallback
      setTimeout(() => {
        window.open(instagramWebUrl, '_blank')
      }, 1000)
    } catch {
      window.open(instagramWebUrl, '_blank')
    }
  }

  // Twitter/X - Direct posting
  const shareToTwitter = () => {
    const tweetText = encodeURIComponent(`${shareText}\n\n#${hashtags.join(' #')}\n\nCreate your own: ${websiteUrl}`)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`
    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }

  // Pinterest - Direct pin creation
  const shareToPinterest = () => {
    const description = encodeURIComponent(`${design.prompt} - ${design.style} style tattoo design created with AI`)
    const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(websiteUrl)}&media=${encodeURIComponent(imageUrl)}&description=${description}`
    window.open(pinterestUrl, '_blank', 'width=750,height=320')
  }

  // Facebook - Share with image
  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteUrl)}&quote=${encodeURIComponent(shareText)}`
    window.open(facebookUrl, '_blank', 'width=550,height=420')
  }

  // LinkedIn - Professional sharing
  const shareToLinkedIn = () => {
    const linkedInText = encodeURIComponent(`Amazing AI-generated tattoo design in ${design.style} style. The future of creative design is here!`)
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(websiteUrl)}&summary=${linkedInText}`
    window.open(linkedInUrl, '_blank', 'width=550,height=420')
  }

  // Copy link to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const copyShareLink = () => {
    const shareLink = `${websiteUrl}?design=${encodeURIComponent(design.prompt)}&style=${design.style}`
    copyToClipboard(shareLink)
  }

  // Native Web Share API (mobile)
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my AI tattoo design!',
          text: shareText,
          url: websiteUrl,
        })
      } catch {
        // console.log('Share cancelled or failed')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Share Your Design</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Design Preview */}
        <div className="mb-6 text-center">
          <div className="w-32 h-32 mx-auto mb-3 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt="Tattoo design"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-sm text-gray-600">{design.prompt}</p>
          <p className="text-xs text-gray-500">{design.style} style</p>
        </div>

        {/* Native Share (Mobile) */}
        {navigator.share && (
          <button
            onClick={nativeShare}
            className="w-full mb-4 p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-3"
          >
            <Share2 className="w-5 h-5" />
            Share Everywhere
          </button>
        )}

        {/* Social Platforms */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={shareToInstagram}
            className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
          >
            <Instagram className="w-5 h-5" />
            Instagram
          </button>
          
          <button
            onClick={shareToTwitter}
            className="p-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
          >
            <Twitter className="w-5 h-5" />
            Twitter/X
          </button>
          
          <button
            onClick={shareToPinterest}
            className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
          >
            📌 Pinterest
          </button>
          
          <button
            onClick={shareToFacebook}
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            📘 Facebook
          </button>
        </div>

        {/* Copy Link */}
        <div className="space-y-3">
          <button
            onClick={copyShareLink}
            className={`w-full p-3 border-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              copySuccess 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            {copySuccess ? (
              <>
                ✅ Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Shareable Link
              </>
            )}
          </button>

          <button
            onClick={shareToLinkedIn}
            className="w-full p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Share on LinkedIn
          </button>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Sharing Tips:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Instagram: Text copied! Paste in your story/post</li>
            <li>• Twitter: Opens with pre-filled text</li>
            <li>• Pinterest: Creates pin with your design</li>
            <li>• Copy link to share anywhere else</li>
          </ul>
        </div>
      </div>
    </div>
  )
}