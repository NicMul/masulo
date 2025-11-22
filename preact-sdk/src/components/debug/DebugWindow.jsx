import { h } from 'preact';
import { useRef, useEffect, useState } from 'preact/hooks';
import { useDebugData } from '../../hooks/useDebugData';
import { DebugConnectionTab } from './tabs/DebugConnectionTab';
import { DebugRoomsTab } from './tabs/DebugRoomsTab';
import { DebugEventsTab } from './tabs/DebugEventsTab';
import { DebugAnalyticsTab } from './tabs/DebugAnalyticsTab';
import { injectDebugStyles } from './debugStyles';

export function DebugWindow({ connectionManager }) {
    const {
        connectionInfo,
        logs,
        analyticsLogs,
        abtestAnalyticsLogs,
        rooms,
        isVisible,
        setIsVisible,
        activeTab,
        setActiveTab,
        clearLogs,
        clearAnalyticsLogs,
        clearABTestAnalyticsLogs
    } = useDebugData(connectionManager);

    useEffect(() => {
        injectDebugStyles();
    }, []);

    const windowRef = useRef(null);
    const headerRef = useRef(null);
    const [isMinimized, setIsMinimized] = useState(false);

    // Drag logic
    useEffect(() => {
        const windowEl = windowRef.current;
        const headerEl = headerRef.current;
        if (!windowEl || !headerEl) return;

        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const onMouseDown = (e) => {
            if (e.target.closest('.mesulo-debug-tab, .mesulo-debug-minimize, .mesulo-debug-close')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = windowEl.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            // Remove bottom/right positioning to allow left/top to take over
            windowEl.style.bottom = 'auto';
            windowEl.style.right = 'auto';
            windowEl.style.left = `${initialLeft}px`;
            windowEl.style.top = `${initialTop}px`;
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            windowEl.style.left = `${initialLeft + dx}px`;
            windowEl.style.top = `${initialTop + dy}px`;
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        headerEl.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () => {
            headerEl.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [isVisible]); // Re-bind if visibility changes (though ref persists)

    if (!isVisible) {
        return (
            <div
                id="mesulo-debug-reopen"
                style={{ display: 'flex' }}
                onClick={() => setIsVisible(true)}
                title="Open Debug Window"
            >
                🔧
            </div>
        );
    }

    return (
        <div
            id="mesulo-debug-window"
            ref={windowRef}
            className={isMinimized ? 'minimized' : ''}
        >
            <div className="mesulo-debug-header" ref={headerRef}>
                <div className="mesulo-debug-tabs">
                    <button
                        className={`mesulo-debug-tab ${activeTab === 'connection' ? 'active' : ''}`}
                        onClick={() => setActiveTab('connection')}
                    >
                        Connection
                    </button>
                    <button
                        className={`mesulo-debug-tab ${activeTab === 'rooms' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rooms')}
                    >
                        Games & Rooms
                    </button>
                    <button
                        className={`mesulo-debug-tab ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        Events
                    </button>
                    <button
                        className={`mesulo-debug-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        Analytics
                    </button>
                    <button
                        className={`mesulo-debug-tab ${activeTab === 'analytics-ab' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics-ab')}
                    >
                        AB
                    </button>
                </div>
                <div className="mesulo-debug-controls">
                    <button
                        className="mesulo-debug-minimize"
                        title={isMinimized ? "Restore" : "Minimize"}
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        {isMinimized ? '+' : '−'}
                    </button>
                    <button
                        className="mesulo-debug-close"
                        title="Close"
                        onClick={() => setIsVisible(false)}
                    >
                        ×
                    </button>
                </div>
            </div>

            <div className="mesulo-debug-body">
                {activeTab === 'connection' && <DebugConnectionTab info={connectionInfo} />}
                {activeTab === 'rooms' && <DebugRoomsTab rooms={rooms} />}
                {activeTab === 'events' && <DebugEventsTab logs={logs} onClear={clearLogs} />}
                {activeTab === 'analytics' && <DebugAnalyticsTab logs={analyticsLogs} onClear={clearAnalyticsLogs} />}
                {activeTab === 'analytics-ab' && <DebugAnalyticsTab logs={abtestAnalyticsLogs} onClear={clearABTestAnalyticsLogs} />}
            </div>

            {!isMinimized && <div className="mesulo-debug-resize-handle"></div>}
        </div>
    );
}
