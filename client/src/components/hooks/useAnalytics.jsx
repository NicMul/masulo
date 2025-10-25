/***
*
*   useAnalytics Hook
*   Custom hook to fetch and format analytics data for dashboard
*   Optimized with single API call, auto-refresh, and manual refresh
*
**********/

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAPI } from 'components/lib';

export function useAnalytics(dateRange = '7d') {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Calculate date range
  const getDateRange = useCallback((range) => {
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        return null; // All time
      default:
        return null; // All time
    }
    
    return {
      start_date: startDate.toISOString(),
      end_date: now.toISOString()
    };
  }, []);

  const dateParams = useMemo(() => getDateRange(dateRange), [dateRange, getDateRange]);
  
  // Single API call with refresh key for cache busting
  const url = useMemo(() => {
    if (dateParams) {
      return `/api/analytics/dashboard?start_date=${dateParams.start_date}&end_date=${dateParams.end_date}&_refresh=${refreshKey}`;
    }
    return `/api/analytics/dashboard?_refresh=${refreshKey}`;
  }, [dateParams, refreshKey]);
  
  const { data, loading } = useAPI(url);

  console.log('Analytics data:', data, 'loading:', loading);
  
  // Manual refresh function
  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);
  
  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Format stats data
  const stats = useMemo(() => {
    if (!data) return [];
    
    // Fixed: Sum from eventTypes array, not data itself
    const totalEvents = data.eventTypes?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
    
    const uniqueSessions = data.recentEvents && Array.isArray(data.recentEvents) ? 
      [...new Set(data.recentEvents.map(e => e.session_id))].length : 0;
    
    // Find most engaged asset type
    const mostEngagedAsset = data.assetTypes && Array.isArray(data.assetTypes) && data.assetTypes.length > 0 ? 
      data.assetTypes.reduce((max, item) => (item.count || 0) > max.count ? item : max, { count: 0, _id: { asset_type: 'N/A' } })
      : { count: 0, _id: { asset_type: 'N/A' } };
    
    // Calculate average hover duration
    const hoverEvents = data.recentEvents && Array.isArray(data.recentEvents) ? 
      data.recentEvents.filter(e => e.event_type === 'hover' && e.metadata?.hover_duration)
      : [];
    const avgHoverDuration = hoverEvents.length > 0 ? 
      Math.round(hoverEvents.reduce((sum, e) => sum + (e.metadata.hover_duration || 0), 0) / hoverEvents.length)
      : 0;

    return [
      {
        label: 'Total Events',
        value: totalEvents.toLocaleString(),
        icon: 'activity',
        color: 'blue',
        loading: loading || isRefreshing
      },
      {
        label: 'Unique Sessions',
        value: uniqueSessions.toLocaleString(),
        icon: 'users',
        color: 'green',
        loading: loading || isRefreshing
      },
      {
        label: 'Most Engaged Asset',
        value: mostEngagedAsset._id?.asset_type?.replace('Image', '').replace('Video', '') || 'N/A',
        icon: 'star',
        color: 'purple',
        loading: loading || isRefreshing
      },
      {
        label: 'Avg Hover Duration',
        value: `${avgHoverDuration}ms`,
        icon: 'clock',
        color: 'orange',
        loading: loading || isRefreshing
      }
    ];
  }, [data, loading, isRefreshing]);

  // Format event types chart data
  const eventTypesChart = useMemo(() => {
    if (!data?.eventTypes || !Array.isArray(data.eventTypes)) return { labels: [], datasets: [] };
    
    const eventTypes = ['hover', 'click', 'touch', 'video_play', 'video_pause', 'video_ended', 'video_hover'];
    const colors = ['blue', 'red', 'green', 'purple', 'purple', 'purple', 'purple'];
    
    const datasets = eventTypes.map((eventType, index) => {
      const eventData = data.eventTypes.find(item => item._id?.event_type === eventType);
      return {
        label: eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        data: [eventData ? (eventData.count || 0) : 0],
        borderColor: colors[index],
        backgroundColor: colors[index]
      };
    });

    return {
      labels: ['Event Types'],
      datasets: datasets.filter(ds => ds.data[0] > 0) // Only show event types with data
    };
  }, [data]);

  // Format asset types chart data
  const assetTypesChart = useMemo(() => {
    if (!data?.assetTypes || !Array.isArray(data.assetTypes)) return { labels: [], datasets: [] };
    
    const labels = data.assetTypes.map(item => 
      item._id?.asset_type?.replace('Image', '').replace('Video', '') || 'Unknown'
    );
    const dataValues = data.assetTypes.map(item => item.count || 0);

    return {
      labels,
      datasets: [{
        label: 'Total Interactions',
        data: dataValues,
        backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B']
      }]
    };
  }, [data]);

  // Format top games table data
  const topGames = useMemo(() => {
    if (!data?.topGames || !Array.isArray(data.topGames)) return [];
    
    return data.topGames
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 10)
      .map(item => ({
        game_id: item._id?.game_id || 'Unknown',
        total_events: item.count || 0,
        unique_sessions: item.unique_session_count || 0,
        last_seen: item.last_seen ? new Date(item.last_seen).toLocaleDateString() : 'N/A'
      }));
  }, [data]);

  // Format recent events table data
  const recentEvents = useMemo(() => {
    if (!data?.recentEvents || !Array.isArray(data.recentEvents)) return [];
    
    return data.recentEvents.map(event => ({
      event_type: event.event_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
      asset_type: event.asset_type?.replace('Image', '').replace('Video', '') || 'Unknown',
      game_id: event.game_id ? event.game_id.substring(0, 8) + '...' : 'Unknown',
      timestamp: event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'
    }));
  }, [data]);

  return {
    stats,
    eventTypesChart,
    assetTypesChart,
    topGames,
    recentEvents,
    loading: loading || isRefreshing,
    refresh,
    isRefreshing
  };
}