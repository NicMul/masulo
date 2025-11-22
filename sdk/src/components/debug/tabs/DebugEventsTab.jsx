import { h } from 'preact';
import { useState } from 'preact/hooks';

function LogEntry({ log }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`mesulo-log-entry mesulo-log-${log.type}`}>
            <div className="mesulo-log-entry-header">
                <span className="mesulo-log-time">{log.time}</span>
                <span className="mesulo-log-type">{log.type.toUpperCase()}</span>
                <span className="mesulo-log-message">{log.message}</span>
            </div>
            {log.data && (
                <>
                    <div
                        className={`mesulo-log-payload-toggle ${!expanded ? 'collapsed' : ''}`}
                        onClick={() => setExpanded(!expanded)}
                    >
                        <span className="mesulo-log-payload-icon">▼</span>
                        <span>{expanded ? 'Hide Payload' : 'Show Payload'}</span>
                    </div>
                    <div className={`mesulo-log-payload ${!expanded ? 'collapsed' : ''}`}>
                        {JSON.stringify(log.data, null, 2)}
                    </div>
                </>
            )}
        </div>
    );
}

export function DebugEventsTab({ logs, onClear }) {
    return (
        <div className="mesulo-debug-tab-content active">
            <div className="mesulo-debug-section">
                <div className="mesulo-events-header">
                    <h4>Socket Events</h4>
                    <button className="mesulo-clear-log-btn" onClick={onClear}>
                        Clear Log
                    </button>
                </div>
                <div className="mesulo-events-log">
                    {logs.map((log) => (
                        <LogEntry key={log.id} log={log} />
                    ))}
                </div>
            </div>
        </div>
    );
}
