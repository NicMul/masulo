import { t } from 'i18next';
import React, { useState, useRef, useEffect, useMemo } from 'react';

const MediaPlayer = ({
    gameId,
    imageUrl,
    videoUrl,
    className = "",
    onSelect,
    type,
    readOnly = false,
    showPlayIcon = true,
    canSelect = true,
    isSelected: externalIsSelected
}) => {
    const [isHovering, setIsHovering] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [isSelected, setIsSelected] = useState(externalIsSelected || false);
    const videoRef = useRef(null);

    // Update internal state when external prop changes
    useEffect(() => {
        setIsSelected(externalIsSelected || false);
    }, [externalIsSelected]);

    // Default placeholder image (data URI for a simple gray placeholder)
    const defaultImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='280'%3E%3Crect width='180' height='280' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23d1d5db' text-anchor='middle' dy='.3em'%3ENO ASSETS%3C/text%3E%3C/svg%3E`;
    
    const finalImageUrl = `${imageUrl}?optimizer=1&aspect_ratio=220:280` || `${defaultImage}?optimizer=1&aspect_ratio=220:280`;
    const finalVideoUrl = `${videoUrl}?optimizer=1&aspect_ratio=220:280` || "";
    
    const hasVideo = type === 'video' || type === 'both';

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !hasVideo || !finalVideoUrl) return;

        const handleCanPlay = () => setVideoReady(true);
        video.addEventListener('canplay', handleCanPlay);

        return () => video.removeEventListener('canplay', handleCanPlay);
    }, [hasVideo, finalVideoUrl]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !hasVideo || !videoReady || !finalVideoUrl) return;

        if (isHovering) {
            video.currentTime = 0;
            video.play().catch(() => { });
        } else {
            video.pause();
            video.currentTime = 0;
        }
    }, [isHovering, videoReady, hasVideo, finalVideoUrl]);

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    const handleSelect = () => {
        const newSelected = !isSelected;
        setIsSelected(newSelected);
        if (onSelect) {
            onSelect(gameId, newSelected, type);
        }
    };

    const mediaContent = useMemo(() => {
        if (type === 'image') {
            return (
                <img
                    src={finalImageUrl}
                    alt={`Game ${gameId}`}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            );
        }

        if (type === 'video') {
            return (
                <video
                    ref={videoRef}
                    src={finalVideoUrl || undefined}
                    poster={finalImageUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    loop
                    muted
                    playsInline
                    preload="metadata"
                />
            );
        }

        if (type === 'both') {
            return (
                <>
                    <img
                        src={finalImageUrl}
                        alt={`Game ${gameId}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                            isHovering ? 'opacity-0' : 'opacity-100'
                        }`}
                    />
                    <video
                        ref={videoRef}
                        src={finalVideoUrl || undefined}
                        poster={finalImageUrl}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                            isHovering ? 'opacity-100' : 'opacity-0'
                        }`}
                        loop
                        muted
                        playsInline
                        preload="metadata"
                    />
                </>
            );
        }
    }, [type, finalImageUrl, finalVideoUrl, gameId, isHovering]);

    return (
        <div
            className={`relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-900 cursor-pointer ${className}`}
            style={{ aspectRatio: '220 / 280' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleSelect}
        >
            {readOnly && (
                <div className="absolute top-2 left-2 flex items-center justify-center z-10">
                    <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 transition-transform hover:scale-110">
                        <span className="text-white text-sm font-semibold tracking-wide">
                            Default / No Edit
                        </span>
                    </div>
                </div>
            )}
            {mediaContent}

            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
                isHovering ? 'opacity-100' : 'opacity-0'
            }`} />

            {/* Checkbox */}
            {canSelect && (
            <div className="absolute top-2 left-2 z-10">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSelected
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 scale-100 shadow-lg shadow-purple-500/50'
                        : 'bg-white/20 backdrop-blur-sm scale-90 hover:scale-100'
                }`}>
                    <svg
                        className={`w-5 h-5 text-white transition-all duration-300 ${
                            isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                        }`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                  </div>
              </div>
            )}

            {/* Play Icon */}
            {showPlayIcon && hasVideo && videoUrl && !isHovering && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-2 transition-transform hover:scale-110">
                        <span className="text-white text-xl font-semibold tracking-tighter">
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

export default MediaPlayer;