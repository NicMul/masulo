import React, { useState, useRef, useEffect } from 'react';

const AiPreview = ({ 
  gameId, 
  testImage, 
  testVideo, 
  defaultImage,
  className = "" 
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !testVideo) return;

    const handleCanPlay = () => setVideoReady(true);
    video.addEventListener('canplay', handleCanPlay);

    return () => video.removeEventListener('canplay', handleCanPlay);
  }, [testVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !testVideo || !videoReady) return;

    if (isHovering) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isHovering, videoReady, testVideo]);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  return (
    <div
      className={`relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-900 cursor-pointer ${className}`}
      style={{ aspectRatio: '180 / 280' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Static Image */}
      <img
        src={defaultImage}
        alt={`Game ${gameId}`}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          isHovering && testVideo ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Video */}
      {testVideo && (
        <video
          ref={videoRef}
          src={testVideo}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            isHovering ? 'opacity-100' : 'opacity-0'
          }`}
          loop
          muted
          playsInline
          preload="metadata"
        />
      )}

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
        isHovering ? 'opacity-100' : 'opacity-0'
      }`} />

      {/* AI Badge */}
      <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
        AI
      </div>

      {/* Play Icon */}
      {testVideo && !isHovering && (
        <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-sm rounded-full px-8 py-4 transition-transform hover:scale-110">
          <span className="text-white text-xl font-bold tracking-wide">
            Play Now
          </span>
        </div>
      </div>
      )}

      {/* Border Glow */}
      <div className={`absolute inset-0 rounded-lg ring-2 ring-purple-500 transition-opacity duration-300 ${
        isHovering ? 'opacity-100' : 'opacity-0'
      }`} />
    </div>
  );
};

export default AiPreview;