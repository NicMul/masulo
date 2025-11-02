import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Timeline from './Timeline';
import Controls from './Controls';
import { TimeDisplay } from './TimeDisplay';

const VideoTrimmer = ({ videoUrl, onTrimApplied }) => {
    const { t } = useTranslation();
    const videoRef = useRef(null);
    
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Initialize end time when duration is loaded
    useEffect(() => {
        if (duration > 0 && endTime === 0) {
            setEndTime(duration);
        }
    }, [duration]);
    
    // Update current time
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        
        const updateTime = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => {
            setDuration(video.duration);
            setEndTime(video.duration);
        };
        
        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        
        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [videoRef]);
    
    // Auto-stop when reaching end time
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !isPlaying) return;
        
        if (currentTime >= endTime) {
            video.pause();
            setIsPlaying(false);
            video.currentTime = startTime;
        }
    }, [currentTime, endTime, isPlaying, startTime]);
    
    const handlePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        
        if (currentTime < startTime || currentTime > endTime) {
            video.currentTime = startTime;
        }
        
        video.play();
        setIsPlaying(true);
    };
    
    const handlePause = () => {
        const video = videoRef.current;
        if (!video) return;
        
        video.pause();
        setIsPlaying(false);
    };
    
    const handleSeek = (time) => {
        const video = videoRef.current;
        if (!video) return;
        
        video.currentTime = time;
        setCurrentTime(time);
    };
    
    const handlePlaySelection = () => {
        const video = videoRef.current;
        if (!video) return;
        
        video.currentTime = startTime;
        video.play();
        setIsPlaying(true);
    };
    
    const handleReset = () => {
        setStartTime(0);
        setEndTime(duration);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
    };
    
    const handleApply = () => {
        if (onTrimApplied) {
            onTrimApplied({
                startTime,
                endTime,
                duration: endTime - startTime
            });
        }
    };
    
    if (!videoUrl) {
        return (
            <div className='flex items-center justify-center h-64 text-slate-600 dark:text-slate-400'>
                <p>{t('edit.regenerate.dialog.trim.noVideo') || 'No video available'}</p>
            </div>
        );
    }
    
    return (
        <div className='w-full flex gap-4 h-full'>
            {/* Left Side: Video Player */}
            <div className='flex-1 flex flex-col items-center'>
                <div className='relative w-full' style={{ aspectRatio: '220 / 280' }}>
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className='w-full h-full rounded-lg shadow-lg bg-black object-contain'
                        controls={false}
                    />
                </div>
            </div>
            
            {/* Right Side: Controls */}
            <div className='w-[53%] flex flex-col gap-4 flex-1'>
                {/* Time Display */}
                <div className='flex justify-between gap-2'>
                    <div className='px-3 flex flex-row items-center justify-between w-2/5 py-2 bg-blue-100 dark:bg-blue-900 rounded-md'>
                        <span className='text-xs font-medium text-slate-600 dark:text-slate-400 '>Original: </span>
                        <TimeDisplay time={duration} />
                    </div>
                    <div className='px-3 flex flex-row items-center justify-between w-2/5 py-2 bg-green-100 dark:bg-green-900 rounded-md'>
                        <span className='text-xs font-medium text-slate-600 dark:text-slate-400 block'>Trimmed</span>
                        <TimeDisplay time={endTime - startTime} />
                    </div>
                </div>
                
                {/* Timeline */}
                <Timeline
                    duration={duration}
                    currentTime={currentTime}
                    startTime={startTime}
                    endTime={endTime}
                    onStartChange={setStartTime}
                    onEndChange={setEndTime}
                    onSeek={handleSeek}
                />
                
                {/* Controls */}
                <div className='w-full h-full'>
                    <Controls
                        isPlaying={isPlaying}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onReset={handleReset}
                        onApply={handleApply}
                        onPlaySelection={handlePlaySelection}
                        canApply={duration > 0 && startTime >= 0 && endTime > startTime}
                    />
                </div>
                
            </div>
        </div>
    );
};

export default VideoTrimmer;

