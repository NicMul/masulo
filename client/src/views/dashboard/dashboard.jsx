/***
*
*   DASHBOARD
*   Template dashboard example demonstrating various components inside a view.
*
**********/

import { useContext, useEffect, useState } from 'react';
import { ViewContext, Card, Stat, Chart, Table, Grid, Row, Animate, Feedback, Button, Select } from 'components/lib';
import { useAnalytics } from 'components/hooks/useAnalytics';

export function Dashboard({ t }){


  const viewContext = useContext(ViewContext);

  const [dateRange, setDateRange] = useState('7d');
  const [debouncedDateRange, setDebouncedDateRange] = useState('7d');

  const { 
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
    loading, 
    refresh, 
    isRefreshing 
  } = useAnalytics(debouncedDateRange);

  useEffect(() => { 
    const timer = setTimeout(() => {
      setDebouncedDateRange(dateRange);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [dateRange]);

  useEffect(() => {
    
    viewContext.notification({ 
      variant: 'success',
      title: 'Welcome to the Mesulo Analytics Dashboard',
      description: 'Track your game relatedasset engagement metrics and improve your casino lobby performance',
    });
  }, []);

  return (
    <Animate type='pop'>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          {loading && !isRefreshing && (
            <span className="text-sm text-gray-500">Updating...</span>
          )}
          {realTimeEngagement && (
            <div className="flex items-center gap-2 ml-4">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{realTimeEngagement.activeSessions5Min} active</span>
              </div>
              <span className="text-xs text-gray-500">
                {realTimeEngagement.eventsLast5Min} events (5m)
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 items-center">
          <Button 
            action={refresh}
            loading={isRefreshing}
            icon="rotate-cw"
            variant="outline"
          >
            Refresh
          </Button>
          
          <Select 
            name="dateRange"
            value={dateRange}
            onValueChange={setDateRange}
            options={[
              { value: '24h', label: 'Last 24 hours' },
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: 'all', label: 'All time' }
            ]}
          />
        </div>
      </div>

      <Grid max={ 4 }>
        { stats.map(stat => (
          <Card key={ stat.label } loading={ stat.loading }>
            <Stat {...stat } />
          </Card>
        ))}
      </Grid>

      <Row>
        <Card title="Event Types Distribution" loading={loading}>
          <Chart
            type='bar'
            showLegend
            loading={ loading }
            data={ eventTypesChart }
            color={['blue', 'red', 'green', 'purple']}
          />
        </Card> 
      </Row>

      <Row>
        <Card title="Asset Type Performance" loading={loading}>
          <Chart
            type='bar'
            showLegend
            loading={ loading }
            data={ assetTypesChart }
            color={['blue', 'red', 'green', 'purple']}
          />
        </Card> 
      </Row>

      {assetPerformanceChart.labels.length > 0 && (
        <Row>
          <Card title="Asset Performance Comparison (Default vs Theme vs Promo vs Current)" loading={loading}>
            <Chart
              type='bar'
              showLegend
              loading={ loading }
              data={ assetPerformanceChart }
              color={['blue', 'green', 'purple']}
            />
          </Card> 
        </Row>
      )}

      {conversionMetrics.length > 0 && (
        <Row>
          <div className="grid grid-cols-3 gap-4">
            {conversionMetrics.map(metric => (
              <Card key={metric.label} loading={metric.loading}>
                <Stat {...metric} />
              </Card>
            ))}
          </div>
        </Row>
      )}

      <Row>
        <Card title="Video Performance" loading={loading}>
          <Chart
            type='doughnut'
            showLegend
            loading={ loading }
            data={ videoMetrics }
            color={['blue', 'green', 'purple']}
          />
        </Card>
        <Card title="Engagement Quality" loading={loading}>
          <div className="grid grid-cols-3 gap-4">
            {engagementQuality.length > 0 ? engagementQuality.map(metric => (
              <Stat key={metric.label} {...metric} />
            )) : (
              <div className="col-span-3 text-center text-gray-500 py-4">
                No engagement quality data available
              </div>
            )}
          </div>
        </Card>
      </Row>

      <Row>
        <Card title="Top Performing Games Assets" loading={loading}>
          <Table
            searchable
            data={ topGames }
            loading={ loading }
            columns={[
              { key: 'game_id', label: 'Game ID' },
              { key: 'total_events', label: 'Total Events' },
              { key: 'unique_sessions', label: 'Sessions' },
              { key: 'last_seen', label: 'Last Seen' }
            ]}
          />
        </Card>
      </Row>

      <Row>
        <Card title="Recent Events" loading={loading}>
          <Table
            searchable
            data={ recentEvents }
            loading={ loading }
            columns={[
              { key: 'event_type', label: 'Event Type' },
              { key: 'asset_type', label: 'Asset Type' },
              { key: 'game_id', label: 'Game ID' },
              { key: 'timestamp', label: 'Timestamp' }
            ]}
          />
        </Card>
      </Row>

      <Feedback />

    </Animate>
  );
}
