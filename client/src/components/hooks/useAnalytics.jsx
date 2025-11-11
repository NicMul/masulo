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
  
  const url = useMemo(() => {
    if (dateParams) {
      return `/api/analytics/dashboard?start_date=${dateParams.start_date}&end_date=${dateParams.end_date}&_refresh=${refreshKey}`;
    }
    return `/api/analytics/dashboard?_refresh=${refreshKey}`;
  }, [dateParams, refreshKey]);
  
  const { data, loading } = useAPI(url);
  
  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
  }, []);
  
  // Reset isRefreshing when loading completes
  useEffect(() => {
    if (!loading && isRefreshing) {
      setIsRefreshing(false);
    }
  }, [loading, isRefreshing]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    if (!data) return [];
    
    const totalEvents = data.eventTypes?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
    
    const uniqueSessions = data.recentEvents && Array.isArray(data.recentEvents) ? 
      [...new Set(data.recentEvents.map(e => e.sessionId))].length : 0;
    
    const mostEngagedAsset = data.assetTypes && Array.isArray(data.assetTypes) && data.assetTypes.length > 0 ? 
      data.assetTypes.reduce((max, item) => (item.count || 0) > max.count ? item : max, { count: 0, _id: { assetType: 'N/A' } })
      : { count: 0, _id: { assetType: 'N/A' } };
    
    // Get average hover duration from conversionMetrics (calculated from all events)
    const avgHoverDuration = data.conversionMetrics?.avg_hover_duration 
      ? Math.round(data.conversionMetrics.avg_hover_duration)
      : 0;

    return [
      {
        label: 'Total Events',
        value: totalEvents.toLocaleString(),
        icon: 'activity',
        loading: loading || isRefreshing
      },
      {
        label: 'Unique Sessions',
        value: uniqueSessions.toLocaleString(),
        icon: 'users',
        loading: loading || isRefreshing
      },
      {
        label: 'Most Engaged Asset',
        value: mostEngagedAsset._id?.assetType?.replace('Image', '').replace('Video', '') || 'N/A',
        icon: 'star',
        loading: loading || isRefreshing
      },
      {
        label: 'Avg Hover Duration',
        value: `${avgHoverDuration}ms`,
        icon: 'clock',
        loading: loading || isRefreshing
      }
    ];
  }, [data, loading, isRefreshing]);

  const assetPerformanceChart = useMemo(() => {
    if (!data?.assetPerformance || !Array.isArray(data.assetPerformance)) return { labels: [], datasets: [] };
    
    const labels = data.assetPerformance.map(item => 
      item._id?.charAt(0).toUpperCase() + item._id?.slice(1) || 'Unknown'
    );
    
    const datasets = [
      {
        label: 'Total Interactions',
        data: data.assetPerformance.map(item => item.total_interactions || 0),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6'
      },
      {
        label: 'CTR (%)',
        data: data.assetPerformance.map(item => Math.round(item.ctr || 0)),
        backgroundColor: '#10B981',
        borderColor: '#10B981'
      },
      {
        label: 'Video Completion Rate (%)',
        data: data.assetPerformance.map(item => Math.round(item.video_completion_rate || 0)),
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6'
      }
    ];

    return {
      labels,
      datasets
    };
  }, [data]);

  const conversionMetrics = useMemo(() => {
    if (!data?.conversionMetrics) return [];
    
    const metrics = data.conversionMetrics;
    
    return [
      {
        label: 'Click-Through Rate',
        value: `${Math.round(metrics.ctr || 0)}%`,
        icon: 'mouse-pointer-2',
        loading: loading || isRefreshing
      },
      {
        label: 'Hover-to-Click Rate',
        value: `${Math.round(metrics.hover_to_click_rate || 0)}%`,
        icon: 'target',
        loading: loading || isRefreshing
      },
      {
        label: 'Video Completion Rate',
        value: `${Math.round(metrics.video_completion_rate || 0)}%`,
        icon: 'play-circle',
        loading: loading || isRefreshing
      }
    ];
  }, [data, loading, isRefreshing]);

  const engagementQuality = useMemo(() => {
    if (!data?.engagementQuality) return [];
    
    const quality = data.engagementQuality;
    
    return [
      {
        label: 'Session Depth',
        value: Math.round(quality.avg_interactions_per_session || 0).toString(),
        icon: 'layers-3',
        loading: loading || isRefreshing
      },
      {
        label: 'Bounce Rate',
        value: `${Math.round(quality.bounce_rate || 0)}%`,
        icon: 'trending-down',
        loading: loading || isRefreshing
      },
      {
        label: 'Repeat Interaction Rate',
        value: `${Math.round(quality.repeat_interaction_rate || 0)}%`,
        icon: 'repeat-2',
        loading: loading || isRefreshing
      }
    ];
  }, [data, loading, isRefreshing]);

  const realTimeEngagement = useMemo(() => {
    if (!data?.realTimeMetrics) return null;
    
    const realTime = data.realTimeMetrics;
    
    return {
      activeSessions5Min: realTime.active_sessions_5_min_count || 0,
      activeSessions15Min: realTime.active_sessions_15_min_count || 0,
      eventsLast5Min: realTime.events_last_5_min || 0,
      eventsLast15Min: realTime.events_last_15_min || 0,
      loading: loading || isRefreshing
    };
  }, [data, loading, isRefreshing]);

  const videoMetrics = useMemo(() => {
    if (!data?.videoMetrics) return { labels: [], datasets: [] };
    
    const video = data.videoMetrics;
    
    return {
      labels: ['Video Plays', 'Video Pauses', 'Video Ends', 'Video Hovers'],
      datasets: [{
        label: 'Video Events',
        data: [
          video.video_plays || 0,
          video.video_pauses || 0,
          video.video_ends || 0,
          
          video.video_hovers || 0
        ],
        backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6']
      }]
    };
  }, [data]);

  const eventTypesChart = useMemo(() => {
    if (!data?.eventTypes || !Array.isArray(data.eventTypes)) return { labels: [], datasets: [] };
    
    const eventTypes = ['hover', 'click', 'touch', 'video_play', 'video_pause', 'video_ended', 'video_hover'];
    const colors = ['blue', 'red', 'green', 'purple', 'orange', 'purple', 'pink'];
    
    const datasets = eventTypes.map((eventType, index) => {
      const eventData = data.eventTypes.find(item => item._id?.eventType === eventType);
      return {
        label: eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        data: [eventData ? (eventData.count || 0) : 0]
      };
    });

    return {
      labels: ['Event Types'],
      datasets: datasets.filter(ds => ds.data[0] > 0) // Only show event types with data
    };
  }, [data]);

  const assetTypesChart = useMemo(() => {
    if (!data?.assetTypes || !Array.isArray(data.assetTypes)) return { labels: [], datasets: [] };
    
    const labels = data.assetTypes.map(item => 
      item._id?.assetType?.replace('Image', '').replace('Video', '') || 'Unknown'
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

  const topGames = useMemo(() => {
    if (!data?.topGames || !Array.isArray(data.topGames)) return [];

    console.log('Top Games:', data.topGames);
    
    return data.topGames
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 10)
      .map(item => ({
        game_id: item._id || item._id?.gameId || 'Unknown',
        game_name: item.friendlyName || 'Unknown',
        total_events: item.count || 0,
        unique_sessions: item.unique_session_count || 0,
        last_seen: item.last_seen ? new Date(item.last_seen).toLocaleDateString() : 'N/A'
      }));
  }, [data]);

  const recentEvents = useMemo(() => {
    if (!data?.recentEvents || !Array.isArray(data.recentEvents)) return [];
    
    return data.recentEvents.map(event => ({
      event_type: event.eventType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
      asset_type: event.assetType?.replace('Image', '').replace('Video', '') || 'Unknown',
      game_id: event.gameId ? event.gameId.substring(0, 8) + '...' : 'Unknown',
      game_name: event.friendlyName || 'Unknown',
      timestamp: event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'
    }));
  }, [data]);

  return {
    stats,
    eventTypesChart,
    assetTypesChart,
    topGames,
    recentEvents,
    assetPerformanceChart,
    conversionMetrics,
    engagementQuality,
    realTimeEngagement,
    videoMetrics,
    loading: loading || isRefreshing,
    refresh,
    isRefreshing
  };
}