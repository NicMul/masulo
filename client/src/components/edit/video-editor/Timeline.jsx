import React, { useRef, useEffect, useState } from 'react';
import { TimeDisplay } from './TimeDisplay';

const Timeline = ({ 
    duration, 
    currentTime, 
    startTime, 
    endTime, 
    onStartChange, 
    onEndChange, 
    onSeek 
}) => {
    const timelineRef = useRef(null);
    const [isDraggingStart, setIsDraggingStart] = useState(false);
    const [isDraggingEnd, setIsDraggingEnd] = useState(false);
    
    const getPositionFromTime = (time) => {
        return (time / duration) * 100;
    };
    
    const getTimeFromPosition = (position) => {
        return (position / 100) * duration;
    };
    
    const handleMouseDown = (isStart) => (e) => {
        e.preventDefault();
        if (isStart) {
            setIsDraggingStart(true);
        } else {
            setIsDraggingEnd(true);
        }
    };
    
    const handleMouseMove = (e) => {
        if (!timelineRef.current) return;
        
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const position = (x / rect.width) * 100;
        const time = getTimeFromPosition(position);
        
        if (isDraggingStart) {
            const newTime = Math.max(0, Math.min(time, endTime - 0.5));
            onStartChange(newTime);
        } else if (isDraggingEnd) {
            const newTime = Math.min(duration, Math.max(time, startTime + 0.5));
            onEndChange(newTime);
        }
    };
    
    const handleMouseUp = () => {
        setIsDraggingStart(false);
        setIsDraggingEnd(false);
    };
    
    useEffect(() => {
        if (isDraggingStart || isDraggingEnd) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDraggingStart, isDraggingEnd, startTime, endTime, duration]);
    
    const startPos = getPositionFromTime(startTime);
    const endPos = getPositionFromTime(endTime);
    const currentPos = getPositionFromTime(currentTime);
    
    const handleTimelineClick = (e) => {
        if (!timelineRef.current) return;
        if (isDraggingStart || isDraggingEnd) return;
        
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const position = (x / rect.width) * 100;
        const time = getTimeFromPosition(position);
        onSeek(Math.max(startTime, Math.min(endTime, time)));
    };
    
    return (
        <div className='w-full space-y-3'>
            <div className='flex items-center justify-between text-xs text-slate-600 dark:text-slate-400'>
                <TimeDisplay label="Start" time={startTime} />
                <TimeDisplay label="End" time={endTime} />
                <TimeDisplay label="Duration" time={endTime - startTime} />
            </div>
            
            <div 
                ref={timelineRef}
                className='relative h-12 bg-slate-200 dark:bg-slate-700 cursor-pointer'
                onClick={handleTimelineClick}
            >
                {/* Full timeline background */}
                <div className='absolute inset-0 rounded-lg' />
                
                {/* Selected region */}
                <div
                    className='absolute top-0 bottom-0 bg-blue-500 opacity-30 rounded-l-md'
                    style={{ left: `${startPos}%`, width: `${endPos - startPos}%` }}
                />
                
                {/* Current time indicator */}
                <div
                    className='absolute top-0 bottom-0 w-0.5 bg-red-500'
                    style={{ left: `${currentPos}%` }}
                />
                
                {/* Start handle */}
                <div
                    className='absolute top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize hover:bg-blue-600 transition-colors rounded-l-sm'
                    style={{ left: `${startPos}%` }}
                    onMouseDown={handleMouseDown(true)}
                />
                
                {/* End handle */}
                <div
                    className='absolute top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize hover:bg-blue-600 transition-colors rounded-r-sm'
                    style={{ left: `${endPos}%` }}
                    onMouseDown={handleMouseDown(false)}
                />
            </div>
        </div>
    );
};

export default Timeline;

