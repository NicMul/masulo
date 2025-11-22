import { useEffect } from 'preact/hooks';

/**
 * Hook to track video analytics events (play, pause, complete)
 * @param {string} gameId - The game ID
 * @param {object} videoRef - Ref to the video element
 * @param {string} videoUrl - URL of the video
 */
export function useVideoAnalytics(gameId, videoRef, videoUrl) {
    // Track video play/pause/complete events
    useEffect(() => {
        if (!videoRef?.current || !videoUrl) return;

        const videoEl = videoRef.current;
        const analytics = window.mesuloPreactSDK?.analytics;

        if (!analytics) return;

        const handlePlay = () => {
            analytics.trackEvent('video_play', gameId, 'video', videoUrl, {
                duration: videoEl.duration,
                currentTime: videoEl.currentTime
            });
        };

        const handlePause = () => {
            // Don't track pause if video has ended
            if (!videoEl.ended) {
                analytics.trackEvent('video_pause', gameId, 'video', videoUrl, {
                    duration: videoEl.duration,
                    currentTime: videoEl.currentTime,
                    watchedPercentage: (videoEl.currentTime / videoEl.duration) * 100
                });
            }
        };

        const handleEnded = () => {
            analytics.trackEvent('video_complete', gameId, 'video', videoUrl, {
                duration: videoEl.duration,
                currentTime: videoEl.currentTime
            });
        };

        videoEl.addEventListener('play', handlePlay);
        videoEl.addEventListener('pause', handlePause);
        videoEl.addEventListener('ended', handleEnded);

        return () => {
            videoEl.removeEventListener('play', handlePlay);
            videoEl.removeEventListener('pause', handlePause);
            videoEl.removeEventListener('ended', handleEnded);
        };
    }, [gameId, videoRef, videoUrl]);
}
