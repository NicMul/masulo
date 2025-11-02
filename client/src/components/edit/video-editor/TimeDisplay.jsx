export const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const TimeDisplay = ({ label, time, className = '' }) => {
    return (
        <div className={`flex  items-center ${label ? 'gap-2' : ''} ${className}`}>
            {label && <span className='text-sm font-medium text-slate-600 dark:text-slate-400'>{label}</span>}
            <span className='text-sm font-mono font-semibold text-slate-800 dark:text-slate-200'>{formatTime(time)}</span>
        </div>
    );
};

export default TimeDisplay;

