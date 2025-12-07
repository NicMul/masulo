import { useState, useEffect, useCallback, useRef } from 'preact/hooks';

export function useDebugData(connectionManager) {
    const [connectionInfo, setConnectionInfo] = useState({
        appId: '-',
        sessionId: '-',
        socketId: '-',
        status: 'Disconnected',
        eventIndex: 0
    });

    const [logs, setLogs] = useState([]);
    const [analyticsLogs, setAnalyticsLogs] = useState([]);
    const [abtestAnalyticsLogs, setABTestAnalyticsLogs] = useState([]);
    const [rooms, setRooms] = useState(new Map());
    const [isVisible, setIsVisible] = useState(true);
    const [activeTab, setActiveTab] = useState('connection');

    const eventIndexRef = useRef(0);
    const logsRef = useRef([]);
    const analyticsLogsRef = useRef([]);
    const abtestAnalyticsLogsRef = useRef([]);
    const roomsRef = useRef(new Map());

    // Helper to add log
    const addLog = useCallback((type, message, data = null) => {
        const time = new Date().toLocaleTimeString();
        const newLog = {
            id: Date.now() + Math.random(),
            time,
            type,
            message,
            data
        };

        logsRef.current = [newLog, ...logsRef.current].slice(0, 500);
        setLogs([...logsRef.current]);
    }, []);

    // Helper to add analytics log
    const addAnalyticsLog = useCallback((type, message, data = null) => {
        const time = new Date().toLocaleTimeString();
        const newLog = {
            id: Date.now() + Math.random(),
            time,
            type,
            message,
            data
        };

        analyticsLogsRef.current = [newLog, ...analyticsLogsRef.current].slice(0, 500);
        setAnalyticsLogs([...analyticsLogsRef.current]);
    }, []);

    // Helper to add AB test analytics log
    const addABTestAnalyticsLog = useCallback((type, message, data = null) => {
        const time = new Date().toLocaleTimeString();
        const newLog = {
            id: Date.now() + Math.random(),
            time,
            type,
            message,
            data
        };

        abtestAnalyticsLogsRef.current = [newLog, ...abtestAnalyticsLogsRef.current].slice(0, 500);
        setABTestAnalyticsLogs([...abtestAnalyticsLogsRef.current]);
    }, []);

    // Update connection info
    const updateConnectionInfo = useCallback(() => {
        if (!connectionManager) return;

        const socket = connectionManager.getSocket();
        let status = 'Disconnected';
        if (socket?.connected) status = 'Connected';
        else if (socket) status = 'Connecting...';

        setConnectionInfo({
            appId: connectionManager.applicationKey || '-',
            sessionId: sessionStorage.getItem('mesulo_session_id') || '-',
            socketId: socket?.id || '-',
            status,
            eventIndex: eventIndexRef.current
        });
    }, [connectionManager]);

    // Request room counts
    const requestRoomCounts = useCallback(() => {
        const socket = connectionManager?.getSocket();
        if (!socket || !socket.connected) return;

        const gameIds = Array.from(roomsRef.current.values()).map(r => r.gameId).filter(Boolean);
        if (gameIds.length === 0) return;

        socket.emit('get-room-counts', { gameIds }, (response) => {
            if (response && response.success && response.roomCounts) {
                updateRoomsFromCounts(response.roomCounts);
            }
        });
    }, [connectionManager]);

    const updateRoomsFromCounts = useCallback((roomCounts) => {
        let changed = false;
        Object.keys(roomCounts).forEach(roomName => {
            const count = roomCounts[roomName];
            if (roomsRef.current.has(roomName)) {
                const room = roomsRef.current.get(roomName);
                if (room.count !== count) {
                    room.count = count;
                    changed = true;
                }
            } else {
                const gameId = roomName.replace('game:', '');
                roomsRef.current.set(roomName, {
                    name: roomName,
                    gameId,
                    gameName: 'Unknown Game',
                    count
                });
                changed = true;
            }
        });

        if (changed) {
            setRooms(new Map(roomsRef.current));
        }
    }, []);

    // Detect games on page
    const detectPageGames = useCallback(() => {
        const gameImages = document.querySelectorAll('img[data-mesulo-game-id]');
        const gameIds = new Set();
        let changed = false;

        gameImages.forEach(img => {
            const gameId = img.getAttribute('data-mesulo-game-id');
            if (gameId) {
                gameIds.add(gameId);
                const roomName = `game:${gameId}`;
                const gameName = img.alt || img.closest('article')?.getAttribute('aria-label') || 'Unknown Game';

                if (!roomsRef.current.has(roomName)) {
                    roomsRef.current.set(roomName, {
                        name: roomName,
                        gameId,
                        gameName,
                        count: 0
                    });
                    changed = true;
                }
            }
        });

        if (changed) {
            setRooms(new Map(roomsRef.current));
            addLog('info', `Detected ${gameIds.size} game(s) on page`);

            // Request counts shortly after detection
            setTimeout(requestRoomCounts, 500);
        }
    }, [addLog, requestRoomCounts]);

    useEffect(() => {
        if (!connectionManager) return;

        const socket = connectionManager.getSocket();
        if (!socket) return;

        // Initial setup
        updateConnectionInfo();
        detectPageGames();
        addLog('info', 'Debug window initialized');
        addAnalyticsLog('info', 'Analytics logging initialized');
        addABTestAnalyticsLog('info', 'AB Test analytics logging initialized');

        // Interval for updates
        const intervalId = setInterval(() => {
            updateConnectionInfo();
            requestRoomCounts();
        }, 2000);

        // Socket event handlers
        const handleSocketEvent = (eventName, data) => {
            eventIndexRef.current++;

            let logType = 'event';
            let message = `Socket: ${eventName}`;

            if (eventName === 'connect') {
                logType = 'success';
                message = 'Socket connected';
                updateConnectionInfo();
                setTimeout(requestRoomCounts, 500);
            } else if (eventName === 'disconnect') {
                logType = 'warning';
                message = `Socket disconnected: ${data || 'Unknown reason'}`;
                updateConnectionInfo();
            } else if (eventName === 'connect_error') {
                logType = 'error';
                message = `Connection error: ${data?.message || data}`;
            } else if (eventName === 'join-game-rooms') {
                logType = 'success';
                message = 'Joined game rooms';
                // Handle room updates if data contains them
                if (data?.roomCounts) updateRoomsFromCounts(data.roomCounts);
            } else if (eventName === 'analytics-event-batch') {
                // This is an emit, usually we listen to incoming, but let's log it if we can intercept or if the server echoes
                // Actually, for outgoing, we might need to hook into the emit function like v1 did, 
                // but for now let's just log incoming events.
            }

            addLog(logType, message, data);
        };

        // List of events to listen to
        const events = [
            'connect', 'disconnect', 'connect_error',
            'games-updated', 'games-response',
            'promotions-response', 'promotions-updated',
            'abtests-response', 'abtests-updated',
            'sdk-event', 'analytics-event',
            'join-game-rooms', 'leave-game-rooms', 'error'
        ];

        events.forEach(event => {
            socket.on(event, (data) => handleSocketEvent(event, data));
        });

        // SDK Event listeners (if connectionManager emits them)
        // We can also hook into the global window.mesuloPreactSDK.on if needed, 
        // but connectionManager is the source of truth for most.

        // Intercept emit for analytics logging (outgoing)
        const originalEmit = socket.emit.bind(socket);
        socket.emit = function (event, data, callback) {
            if (event === 'analytics-event-batch') {
                if (data && data.events) {
                    data.events.forEach(evt => {
                        addAnalyticsLog('event', `Analytics: ${evt.eventType}`, evt);
                    });
                }
            }

            if (event === 'abtest-analytics-batch') {
                if (data && data.events) {
                    data.events.forEach(evt => {
                        addABTestAnalyticsLog('event', `AB Test: ${evt.eventType}`, evt);
                    });
                }
            }

            // Intercept join-game-rooms for room counts
            if (event === 'join-game-rooms' && callback) {
                const wrappedCallback = (response) => {
                    if (response && response.success && response.roomCounts) {
                        updateRoomsFromCounts(response.roomCounts);
                    }
                    if (callback) callback(response);
                };
                return originalEmit(event, data, wrappedCallback);
            }

            return originalEmit(event, data, callback);
        };


        return () => {
            clearInterval(intervalId);
            events.forEach(event => {
                socket.off(event);
            });
            // Restore emit? Might be tricky if multiple instances, but for debug it's okay.
            socket.emit = originalEmit;
        };
    }, [connectionManager, addLog, addAnalyticsLog, addABTestAnalyticsLog, updateConnectionInfo, requestRoomCounts, updateRoomsFromCounts, detectPageGames]);

    return {
        connectionInfo,
        logs,
        analyticsLogs,
        abtestAnalyticsLogs,
        rooms: Array.from(rooms.values()),
        isVisible,
        setIsVisible,
        activeTab,
        setActiveTab,
        clearLogs: () => {
            logsRef.current = [];
            setLogs([]);
            addLog('info', 'Log cleared');
        },
        clearAnalyticsLogs: () => {
            analyticsLogsRef.current = [];
            setAnalyticsLogs([]);
            addAnalyticsLog('info', 'Analytics log cleared');
        },
        clearABTestAnalyticsLogs: () => {
            abtestAnalyticsLogsRef.current = [];
            setABTestAnalyticsLogs([]);
            addABTestAnalyticsLog('info', 'AB Test analytics log cleared');
        }
    };
}
