import React, { useState, useRef, useEffect } from 'react';
import { Button, useMutation } from 'components/lib';

const Trimmer = ({ videoUrl, isOpen, onClose, onSave, gameId, assetType }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [isDraggingEnd, setIsDraggingEnd] = useState(false);
    
    const videoRef = useRef(null);
    const timelineRef = useRef(null);
    
    const trimVideoMutation = useMutation('/api/game/trim-video', 'POST');

    // Clean video URL (remove optimizer query params)
    const cleanVideoUrl = videoUrl ? videoUrl.split('?')[0] : '';

    // Load video metadata and initialize trim end
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !cleanVideoUrl || !isOpen) return;

        const handleLoadedMetadata = () => {
            console.log('Video metadata loaded, duration:', video.duration);
            setDuration(video.duration);
            setTrimEnd(video.duration);
        };
        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);

        // If video already has metadata, initialize immediately
        if (video.duration && video.duration > 0) {
            console.log('Video already has duration:', video.duration);
            setDuration(video.duration);
            setTrimEnd(video.duration);
        } else {
            // Force load the video metadata
            console.log('Loading video metadata...');
            video.load();
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [cleanVideoUrl, isOpen]);

    // Handle trim boundaries during playback
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !isOpen) return;

        const handleTimeUpdate = () => {
            // Loop back to start when reaching trimEnd
            if (isPlaying && video.currentTime >= trimEnd) {
                video.currentTime = 0;
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [isOpen, isPlaying, trimEnd]);

    // Reset when closing
    useEffect(() => {
        if (!isOpen) {
            setIsPlaying(false);
            setDuration(0);
            setTrimEnd(0);
            setCurrentTime(0);
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isOpen]);

    const handlePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;
        
        if (isPlaying) {
            video.pause();
            setIsPlaying(false);
        } else {
            // When starting playback, ensure we start from the beginning or stay within bounds
            if (video.currentTime >= trimEnd) {
                video.currentTime = 0;
            }
            video.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    const handleTimelineClick = (e) => {
        // Don't seek if we're clicking on a handle
        if (e.target !== timelineRef.current && !timelineRef.current?.contains(e.target)) return;
        if (!timelineRef.current || !videoRef.current) return;
        
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const time = percentage * duration;
        
        // Constrain to 0 to trimEnd
        videoRef.current.currentTime = Math.max(0, Math.min(trimEnd, time));
    };

    const handleEndDrag = (e) => {
        e.stopPropagation();
        setIsDraggingEnd(true);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!timelineRef.current || !isDraggingEnd) return;
            
            const rect = timelineRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            const time = percentage * duration;
            
            // Minimum duration of 0.5 seconds
            setTrimEnd(Math.max(0.5, Math.min(time, duration)));
        };

        const handleMouseUp = () => {
            setIsDraggingEnd(false);
        };

        if (isDraggingEnd) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingEnd, duration]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSave = async () => {
        if (!gameId || !cleanVideoUrl) {
            console.error('Missing gameId or videoUrl');
            alert('Error: Missing required information');
            onClose();
            return;
        }

        try {
            // Call API to trim video using useMutation (cleanVideoUrl already has no query params)
            const result = await trimVideoMutation.execute({
                gameId,
                videoUrl: cleanVideoUrl,
                trimEnd,
                assetType
            });

            if (result) {
                console.log('Video trimmed successfully:', result);
                if (onSave) {
                    // Pass trimEnd, updated game data, AND the new video URL
                    onSave(trimEnd, result.data, result.videoUrl);
                }
                onClose();
            }
        } catch (error) {
            console.error('Error trimming video:', error);
            // Error is already handled by useMutation hook via ViewContext
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-slate-900 font-bold text-xl">Trim Video</h3>
                        <Button
                            onClick={onClose}
                            icon="x"
                            size="sm"
                        />
                    </div>

                    {/* Main Content */}
                    <div className="space-y-4">
                        {/* Video Preview */}
                        <div className="flex justify-center">
                            <div className="relative w-full rounded-lg overflow-hidden shadow-lg" style={{ aspectRatio: '180 / 250' }}>
                                <video
                                    ref={videoRef}
                                    src={cleanVideoUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    preload="metadata"
                                />
                                
                                {/* Play overlay on video */}
                                {!isPlaying && (
                                    <button
                                        onClick={handlePlayPause}
                                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                                    >
                                        <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                                            <svg className="w-10 h-10 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                                <span>Timeline</span>
                                <span>{formatTime(currentTime)} / {formatTime(trimEnd)}</span>
                            </div>
                            
                            {duration > 0 ? (
                                <div
                                    ref={timelineRef}
                                    className={`relative h-14 bg-gray-300 rounded-lg cursor-pointer overflow-hidden ${
                                        isDraggingEnd ? 'cursor-ew-resize select-none' : ''
                                    }`}
                                    onClick={handleTimelineClick}
                                >
                                    {/* Trimmed region - from start to end */}
                                    <div
                                        className="absolute top-0 bottom-0 bg-[#3b82f6] opacity-90"
                                        style={{
                                            left: '0%',
                                            width: `${(trimEnd / duration) * 100}%`
                                        }}
                                    />
                                    
                                    {/* Current time indicator */}
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
                                        style={{
                                            left: `${(currentTime / duration) * 100}%`
                                        }}
                                    >
                                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-gray-900" />
                                    </div>

                                    {/* End handle (Red) */}
                                    <div
                                        className="absolute top-0 bottom-0 w-8 cursor-ew-resize z-20 select-none"
                                        style={{
                                            left: `${(trimEnd / duration) * 100}%`,
                                            transform: 'translateX(-50%)'
                                        }}
                                        onMouseDown={handleEndDrag}
                                    >
                                        <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-[#ef4444] transition-colors pointer-events-none ${
                                            isDraggingEnd ? 'bg-[#dc2626]' : 'hover:bg-[#dc2626]'
                                        }`} />
                                        <div className={`absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-5 h-10 bg-[#ef4444] rounded-md flex items-center justify-center shadow-lg border-2 border-[#ef4444]/90 transition-transform pointer-events-none ${
                                            isDraggingEnd ? 'scale-110 bg-[#dc2626]' : 'hover:scale-110'
                                        }`}>
                                            <div className="flex gap-0.5">
                                                <div className="w-0.5 h-4 bg-white/80" />
                                                <div className="w-0.5 h-4 bg-white/80" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative h-14 bg-gray-300 rounded-lg flex items-center justify-center">
                                    <span className="text-slate-500 text-sm">Loading video...</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <svg className="w-3.5 h-3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Drag red handle to trim</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-slate-200">
                        <Button
                            onClick={handlePlayPause}
                            icon={isPlaying ? "pause" : "play"}
                            text={isPlaying ? "Pause" : "Play"}
                            color="blue"
                            className="flex-1"
                        />
                        <Button
                            onClick={onClose}
                            text="Cancel"
                            color="red"
                        />
                        <Button
                            onClick={handleSave}
                            text="Save"
                            color="green"
                            icon="check"
                            loading={trimVideoMutation.loading}
                            disabled={trimVideoMutation.loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Trimmer;

