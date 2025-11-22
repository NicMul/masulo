import { h } from 'preact';

export function DebugConnectionTab({ info }) {
    return (
        <div className="mesulo-debug-tab-content active">
            <div className="mesulo-debug-section">
                <div className="mesulo-info-grid">
                    <div className="mesulo-info-item">
                        <span className="mesulo-info-label">Application ID:</span>
                        <span className="mesulo-info-value">{info.appId}</span>
                    </div>
                    <div className="mesulo-info-item">
                        <span className="mesulo-info-label">Session ID:</span>
                        <span className="mesulo-info-value">{info.sessionId}</span>
                    </div>
                    <div className="mesulo-info-item">
                        <span className="mesulo-info-label">Socket ID:</span>
                        <span className="mesulo-info-value">{info.socketId}</span>
                    </div>
                    <div className="mesulo-info-item">
                        <span className="mesulo-info-label">Connection Status:</span>
                        <span className={`mesulo-info-value mesulo-status-badge ${info.status.toLowerCase().replace('...', '')}`}>
                            {info.status}
                        </span>
                    </div>
                    <div className="mesulo-info-item">
                        <span className="mesulo-info-label">Event Index:</span>
                        <span className="mesulo-info-value">{info.eventIndex}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
