import { h } from 'preact';

export function DebugRoomsTab({ rooms }) {
    return (
        <div className="mesulo-debug-tab-content active">
            <div className="mesulo-debug-section">
                <h4>
                    Game Rooms <span className="mesulo-room-badge">{rooms.length}</span>
                </h4>
                <div className="mesulo-rooms-container">
                    {rooms.length === 0 ? (
                        <div className="mesulo-no-rooms">No game rooms joined yet</div>
                    ) : (
                        rooms.map((room) => (
                            <div className="mesulo-room-item" key={room.name}>
                                <div>
                                    <div className="mesulo-room-name">{room.name}</div>
                                    {room.gameName && (
                                        <div style={{ color: '#FFD700', fontSize: '0.75rem', marginTop: '4px' }}>
                                            {room.gameName}
                                        </div>
                                    )}
                                    {room.gameId && (
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', marginTop: '2px' }}>
                                            ID: {room.gameId.substring(0, 8)}...
                                        </div>
                                    )}
                                </div>
                                <span className="mesulo-room-count">{room.count || 0}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
