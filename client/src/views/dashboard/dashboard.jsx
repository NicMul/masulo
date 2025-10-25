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

  // context
  const viewContext = useContext(ViewContext);
  
  // state
  const [dateRange, setDateRange] = useState('7d');
  const [debouncedDateRange, setDebouncedDateRange] = useState('7d');

  // Use real analytics data with debounced date range
  const { stats, eventTypesChart, assetTypesChart, topGames, recentEvents, loading, refresh, isRefreshing } = useAnalytics(debouncedDateRange);

  // Debounce date range changes to prevent rapid API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDateRange(dateRange);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [dateRange]);

  // show welcome message
  useEffect(() => {
    viewContext.notification({ 
      title: t('dashboard.message.title'),
      description: t('dashboard.message.text'),
    });
  }, []);

  return (
    <Animate type='pop'>

      {/* Date Range Filter */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          {loading && !isRefreshing && (
            <span className="text-sm text-gray-500">Updating...</span>
          )}
        </div>
        
        <div className="flex gap-3 items-center">
          {/* Refresh Button */}
          <Button 
            onClick={refresh}
            loading={isRefreshing}
            icon="refresh"
            variant="outline"
          >
            Refresh
          </Button>
          
          {/* Date Range Selector */}
          <Select 
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

      {/* Stats Cards */}
      <Grid max={ 4 }>
        { stats.map(stat => (
          <Card key={ stat.label } loading={ stat.loading }>
            <Stat {...stat } />
          </Card>
        ))}
      </Grid>

      {/* Charts Row */}
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
            color={['blue', 'red', 'green', 'purple', 'orange']}
          />
        </Card> 
      </Row>

      {/* Tables Row */}
      <Row>
        <Card title="Top Performing Games" loading={loading}>
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
