import React, { useState } from 'react';
import { VideoTrimmer } from './video-editor';

const VideoEditor = ({ selectedGame, testVideoUrl }) => {
    // Priority: currentVideo > testVideo > null
    const videoSource = selectedGame?.currentVideo || testVideoUrl || selectedGame?.testVideo || null;
    
    const [uploadedFile, setUploadedFile] = useState(null);
    const [objectUrl, setObjectUrl] = useState(null);
    const fileInputRef = React.useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setUploadedFile(file);
            // Clean up previous object URL
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
            // Create new object URL
            const url = URL.createObjectURL(file);
            setObjectUrl(url);
        }
    };

    const handleClearUpload = () => {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            setObjectUrl(null);
        }
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleTrimApplied = (trimData) => {
        console.log('Trim applied:', trimData);
        // You can handle the trim data here
        // For now, just log it. In the future, this could send the data to a backend
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [objectUrl]);

    // Use uploaded file URL if available, otherwise use video source
    const displayUrl = objectUrl || videoSource;

    return (
        <div className='w-full h-full flex flex-col items-center'>
            <div className='w-full max-w-4xl flex flex-col'>
                {displayUrl ? (
                    <>
                        {/* Video Trimmer Component */}
                        <VideoTrimmer 
                            videoUrl={displayUrl} 
                            onTrimApplied={handleTrimApplied}
                        />
                        
                        {objectUrl && (
                            <div className='flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg'>
                                <p className='text-sm text-slate-600 dark:text-slate-400'>
                                    Uploaded Video: {uploadedFile?.name}
                                </p>
                                <button
                                    onClick={handleClearUpload}
                                    className='px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors'
                                >
                                    Clear Upload
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className='text-center p-8 bg-slate-100 dark:bg-slate-800 rounded-lg'>
                        <p className='text-slate-600 dark:text-slate-400 mb-4'>
                            No video available. Generate a video first in the Generations tab.
                        </p>
                        <div className='flex items-center justify-center'>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleFileChange}
                                className='hidden'
                                id='video-upload'
                            />
                            <label
                                htmlFor='video-upload'
                                className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer transition-colors'
                            >
                                Upload Video
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export { VideoEditor };
