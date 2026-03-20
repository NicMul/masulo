/***
*
*   DASHBOARD
*   Main dashboard with Analytics and Knowledge Graph tabs.
*
**********/

import { useContext, useEffect, useMemo, useState } from 'react';
import { ViewContext, Card, Stat, Chart, Table, Grid, Row, Animate, Feedback, Button, Select, Tabs, TabsList, TabsTrigger, TabsContent } from 'components/lib';
import { useAnalytics } from 'components/hooks/useAnalytics';
import { KnowledgeGraph } from './knowledge-graph';

export function Dashboard({ t }){

  const viewContext = useContext(ViewContext);

  const [dateRange, setDateRange] = useState('7d');
  const [debouncedDateRange, setDebouncedDateRange] = useState('7d');

  const PAGE_SIZE = 5;
  const [topGamesPage, setTopGamesPage] = useState(1);
  const [recentEventsPage, setRecentEventsPage] = useState(1);

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

  // Reset pagination when fresh analytics data arrives.
  useEffect(() => {
    setTopGamesPage(1);
  }, [topGames]);

  useEffect(() => {
    setRecentEventsPage(1);
  }, [recentEvents]);

  const topGamesTotalPages = useMemo(
    () => Math.max(1, Math.ceil((topGames?.length || 0) / PAGE_SIZE)),
    [topGames]
  );

  const recentEventsTotalPages = useMemo(
    () => Math.max(1, Math.ceil((recentEvents?.length || 0) / PAGE_SIZE)),
    [recentEvents]
  );

  useEffect(() => {
    setTopGamesPage(p => Math.min(Math.max(1, p), topGamesTotalPages));
  }, [topGamesTotalPages]);

  useEffect(() => {
    setRecentEventsPage(p => Math.min(Math.max(1, p), recentEventsTotalPages));
  }, [recentEventsTotalPages]);

  const paginatedTopGames = useMemo(() => {
    const start = (topGamesPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return (topGames || []).slice(start, end);
  }, [topGames, topGamesPage]);

  const paginatedRecentEvents = useMemo(() => {
    const start = (recentEventsPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return (recentEvents || []).slice(start, end);
  }, [recentEvents, recentEventsPage]);

  const renderTablePagination = ({ page, totalPages, onPrev, onNext, onPageSelect }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Page <span className="font-medium text-slate-700 dark:text-slate-200">{page}</span> of{' '}
          <span className="font-medium text-slate-700 dark:text-slate-200">{totalPages}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={page === 1}
            aria-label="Previous page"
            className={`
              px-2.5 py-1 rounded-md border text-xs
              ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-white/5'}
              border-slate-200 bg-transparent text-slate-600 dark:border-white/10 dark:text-slate-300
            `}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => onPageSelect(p)}
              aria-label={`Page ${p}`}
              className={`
                px-2 py-1 rounded-md border text-xs transition-colors
                ${p === page
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200'
                  : 'bg-transparent border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300'}
                ${p !== page ? 'hover:bg-slate-100 dark:hover:bg-white/5' : ''}
              `}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={onNext}
            disabled={page === totalPages}
            aria-label="Next page"
            className={`
              px-2.5 py-1 rounded-md border text-xs
              ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-white/5'}
              border-slate-200 bg-transparent text-slate-600 dark:border-white/10 dark:text-slate-300
            `}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <Animate type='pop'>

      <Tabs defaultValue="analytics">
        <TabsList className="mb-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="knowledge-graph">Knowledge Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              {loading && !isRefreshing && (
                <span className="text-sm text-slate-500 dark:text-slate-400">Updating...</span>
              )}
              {realTimeEngagement && (
                <div className="flex items-center gap-2 ml-4">
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span>{realTimeEngagement.activeSessions5Min} active</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
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
                  <div className="col-span-3 text-center text-slate-500 dark:text-slate-400 py-4">
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
                key={ `top-games-${topGamesPage}` }
                data={ paginatedTopGames }
                loading={ loading }
                show={ ['game_name', 'game_id', 'total_events', 'unique_sessions', 'last_seen'] }
              />
              {renderTablePagination({
                page: topGamesPage,
                totalPages: topGamesTotalPages,
                onPrev: () => setTopGamesPage(p => Math.max(1, p - 1)),
                onNext: () => setTopGamesPage(p => Math.min(topGamesTotalPages, p + 1)),
                onPageSelect: setTopGamesPage
              })}
            </Card>
          </Row>

          <Row>
            <Card title="Recent Events" loading={loading}>
              <Table
                searchable
                key={ `recent-events-${recentEventsPage}` }
                data={ paginatedRecentEvents }
                loading={ loading }
                show={ ['event_type', 'asset_type', 'game_name', 'game_id', 'timestamp'] }
              />
              {renderTablePagination({
                page: recentEventsPage,
                totalPages: recentEventsTotalPages,
                onPrev: () => setRecentEventsPage(p => Math.max(1, p - 1)),
                onNext: () => setRecentEventsPage(p => Math.min(recentEventsTotalPages, p + 1)),
                onPageSelect: setRecentEventsPage
              })}
            </Card>
          </Row>

          <Feedback />
        </TabsContent>

        <TabsContent value="knowledge-graph">
          <KnowledgeGraph />
        </TabsContent>
      </Tabs>

    </Animate>
  );
}
