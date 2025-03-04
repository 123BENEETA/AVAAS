import React, { useState } from 'react';

const SocialSharing = ({ text, audioUrl, platforms }) => {
  const [copySuccess, setCopySuccess] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Helper to encode text for URLs
  const encodeText = (text) => encodeURIComponent(text || '');
  
  // Copy text to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess('Text copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        setCopySuccess('Failed to copy');
      });
  };

  // Generate sharable links
  const getShareLink = (platform) => {
    const encodedText = encodeText(text);
    const encodedUrl = encodeText(window.location.origin + '/share');
    
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return `https://wa.me/?text=${encodedText}`;
      case 'telegram':
        return `https://telegram.me/share/url?url=${encodedUrl}&text=${encodedText}`;
      case 'twitter':
      case 'x':
        return `https://twitter.com/intent/tweet?text=${encodedText}`;
      case 'email':
        return `mailto:?subject=Shared from AVAASS&body=${encodedText}`;
      default:
        return '#';
    }
  };

  // Generate QR code for sharing
  const generateQRCode = async () => {
    try {
      // Using the QR code API to generate a QR code for the text
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeText(text)}`;
      setQrCodeUrl(qrApiUrl);
      setShowQR(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Download audio if available
  const downloadAudio = () => {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = 'avaass_speech.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="social-sharing">
      <div className="sharing-options">
        <div className="text-sharing">
          <button onClick={copyToClipboard} className="copy-btn">
            Copy Text
          </button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>

        {audioUrl && (
          <div className="audio-sharing">
            <button onClick={downloadAudio} className="download-btn">
              Download Audio
            </button>
          </div>
        )}

        <div className="qr-sharing">
          <button onClick={generateQRCode} className="qr-btn">
            Generate QR Code
          </button>
        </div>

        <div className="social-platforms">
          {platforms && platforms.map((platform, index) => (
            <a 
              key={index}
              href={getShareLink(platform)}
              target="_blank"
              rel="noopener noreferrer"
              className={`platform-btn ${platform.toLowerCase()}`}
            >
              Share to {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </a>
          ))}
        </div>
      </div>

      {showQR && qrCodeUrl && (
        <div className="qr-display">
          <img src={qrCodeUrl} alt="QR Code" />
          <button onClick={() => setShowQR(false)} className="close-qr">
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialSharing;
