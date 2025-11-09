/***
*
* AB TEST RESULTS DIALOG
* A beautiful dialog to display AB test results and comparison
*
**********/

import { Dialog, DialogContent, DialogHeader, DialogFooter, Button, Badge, useMutation, Chart } from 'components/lib';
import MediaPlayer from 'components/edit/MediaPlayer';
import { PromoteVariantDropdown } from './PromoteVariantDropdown';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

// --- Utility Components ---

// Component to display key metrics for a variant
const VariantData = ({
    t,
    variantName,
    clicks,
    impressions,
    ctr,
    colorClass,
    isWinner
}) => (
    <div className={`bg-white dark:bg-slate-800 rounded-lg p-5 border-2 ${colorClass} shadow-sm relative overflow-hidden h-full flex flex-col justify-center`}>
        {/* Winner Crown Badge */}
        {isWinner && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-lg flex items-center gap-1.5">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-lg font-bold">{t('Winner')}</span>
            </div>
        )}
        
        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4 uppercase tracking-wide">
            {t(`${variantName}`)}
        </h4>
        
        <div className="space-y-3">
            <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">{t('Clicks')}</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{clicks || 'N/A'}</span>
            </div>
            
            <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">{t('Impressions')}</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{impressions || 'N/A'}</span>
            </div>
            
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('CTR')}</span>
                    <span className={`text-3xl font-black ${isWinner ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {ctr || 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    </div>
);

// Winner Comparison Badge
const WinnerBadge = ({ t, improvement }) => (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-1000 ">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl border-4 border-white dark:border-slate-800 flex items-center gap-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="text-center">
                <div className="text-sm font-bold">{improvement}</div>
                <div className="text-xs opacity-90">{t('Improvement')}</div>
            </div>
        </div>
    </div>
);

const ABTestResultsDialog = ({
    isOpen,
    onClose,
    abTest,
    t
}) => {
    if (!abTest) return null;


    const startDate =  new Date(abTest.startDate);
    const endDate = new Date(abTest.endDate);
    const now = new Date();
    const progressPercent = ((now - startDate) / (endDate - startDate)) * 100;

    console.log('progressPercent', now, startDate, endDate, progressPercent);

    const testStatus = useMemo(() => {
        if (progressPercent >= 100) {
            return {
                status: 'Completed',
                progress: Math.round(progressPercent),
                color: 'green'
            };
        } else if (progressPercent >= 0) {
            return {
                status: 'In Progress',
                progress: Math.round(progressPercent),
                color: 'blue'
            };
        } else {
            return {
                status: 'Not Started',
                progress: 0,
                color: 'red'
            };
        }
    }, [progressPercent, startDate, endDate]);

    // State for promotion type selection
    const [variantAPromotion, setVariantAPromotion] = useState('');
    const [variantBPromotion, setVariantBPromotion] = useState('');

    // State for stats data
    const [variantAData, setVariantAData] = useState({
        clicks: 0,
        impressions: 0,
        ctr: 0,
        isWinner: false
    });
    const [variantBData, setVariantBData] = useState({
        clicks: 0,
        impressions: 0,
        ctr: 0,
        isWinner: false
    });
    const [timeSeriesData, setTimeSeriesData] = useState(null);
    const [timeRange, setTimeRange] = useState('hour'); // 'hour', 'day', 'week'
    const [isRefreshing, setIsRefreshing] = useState(false); // Artificial loading state for refresh

    // Use mutation hook for fetching stats
    const fetchStatsMutation = useMutation('/api/ab-test-data/stats', 'GET');
    const fetchTimeSeriesMutation = useMutation('/api/ab-test-data/timeseries', 'GET');
    
    // Track if we've already fetched to prevent infinite loops
    const hasFetchedRef = useRef(false);
    const lastAbTestIdRef = useRef(null);
    const lastTimeRangeRef = useRef(null);

    // Fetch stats data
    const fetchStats = useCallback(async (isRefresh = false) => {
        if (!abTest || !abTest.gameId || !abTest.startDate || !abTest.endDate) {
            return;
        }

        const url = `/api/ab-test-data/stats?gameId=${encodeURIComponent(abTest.gameId)}&startDate=${encodeURIComponent(abTest.startDate)}&endDate=${encodeURIComponent(abTest.endDate)}`;
        const result = await fetchStatsMutation.execute(null, url);
        
        if (result && result.data) {
            const stats = result.data;
            
            // Format data for Variant A
            const variantA = {
                clicks: stats.variantA?.clicks || 0,
                impressions: stats.variantA?.impressions || 0,
                ctr: stats.variantA?.ctr || 0,
                isWinner: false
            };
            
            // Format data for Variant B
            const variantB = {
                clicks: stats.variantB?.clicks || 0,
                impressions: stats.variantB?.impressions || 0,
                ctr: stats.variantB?.ctr || 0,
                isWinner: false
            };

            // Determine winner based on CTR
            if (variantA.ctr > variantB.ctr) {
                variantA.isWinner = true;
            } else if (variantB.ctr > variantA.ctr) {
                variantB.isWinner = true;
            }

            setVariantAData(variantA);
            setVariantBData(variantB);
        }
    }, [abTest?.gameId, abTest?.startDate, abTest?.endDate]);

    // Fetch data when dialog opens - only fetch once per abTest
    useEffect(() => {
        // Reset if abTest changed
        if (abTest?.id !== lastAbTestIdRef.current) {
            hasFetchedRef.current = false;
            lastAbTestIdRef.current = abTest?.id || null;
        }
        
        // Fetch only once when dialog opens and we have an abTest
        if (isOpen && abTest?.id && abTest?.gameId && abTest?.startDate && abTest?.endDate && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            
            // Fetch stats
            const url = `/api/ab-test-data/stats?gameId=${encodeURIComponent(abTest.gameId)}&startDate=${encodeURIComponent(abTest.startDate)}&endDate=${encodeURIComponent(abTest.endDate)}`;
            fetchStatsMutation.execute(null, url).then(result => {
                if (result && result.data) {
                    const stats = result.data;
                    
                    // Format data for Variant A
                    const variantA = {
                        clicks: stats.variantA?.clicks || 0,
                        impressions: stats.variantA?.impressions || 0,
                        ctr: stats.variantA?.ctr || 0,
                        isWinner: false
                    };
                    
                    // Format data for Variant B
                    const variantB = {
                        clicks: stats.variantB?.clicks || 0,
                        impressions: stats.variantB?.impressions || 0,
                        ctr: stats.variantB?.ctr || 0,
                        isWinner: false
                    };

                    // Determine winner based on CTR
                    if (variantA.ctr > variantB.ctr) {
                        variantA.isWinner = true;
                    } else if (variantB.ctr > variantA.ctr) {
                        variantB.isWinner = true;
                    }

                    setVariantAData(variantA);
                    setVariantBData(variantB);
                }
            });

        }
        
        // Reset fetch flag when dialog closes
        if (!isOpen) {
            hasFetchedRef.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, abTest?.id]);

    // Calculate date range based on time range selection
    const getDateRange = useCallback((range) => {
        const now = new Date();
        const endDate = now.toISOString();
        let startDate;

        switch (range) {
            case 'hour':
                startDate = new Date(now.getTime() - 60 * 60 * 1000).toISOString(); // Last hour
                break;
            case 'day':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        }

        return { startDate, endDate };
    }, []);

    // Fetch time series when time range changes or dialog opens
    useEffect(() => {
        if (!isOpen || !abTest?.gameId) {
            return;
        }

        // Check if we need to fetch (timeRange changed or first time)
        if (timeRange !== lastTimeRangeRef.current || lastAbTestIdRef.current !== abTest?.id) {
            lastTimeRangeRef.current = timeRange;
            
            const { startDate, endDate } = getDateRange(timeRange);
            const timeSeriesUrl = `/api/ab-test-data/timeseries?gameId=${encodeURIComponent(abTest.gameId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
            fetchTimeSeriesMutation.execute(null, timeSeriesUrl).then(result => {
                if (result && result.data) {
                    setTimeSeriesData(result.data);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, abTest?.gameId, abTest?.id, timeRange]);

    // Use loading state from mutation
    const loading = fetchStatsMutation.loading;
    const refreshing = isRefreshing || fetchStatsMutation.loading || fetchTimeSeriesMutation.loading;
    const chartLoading = fetchTimeSeriesMutation.loading;

    // Format time series data for chart
    const chartData = useMemo(() => {
        if (!timeSeriesData || !timeSeriesData.labels || timeSeriesData.labels.length === 0) {
            return null;
        }

        // Format dates for display based on time range
        const formattedLabels = timeSeriesData.labels.map(date => {
            // Check if date includes hour (format: YYYY-MM-DDTHH or YYYY-MM-DDTHH:MM or YYYY-MM-DD)
            if (date.includes('T')) {
                const parts = date.split('T');
                if (parts[1] && parts[1].includes(':')) {
                    // Minute-level grouping format: YYYY-MM-DDTHH:MM
                    const [datePart, timePart] = date.split('T');
                    const [hour, minute] = timePart.split(':');
                    return `${hour.padStart(2, '0')}:${minute || '00'}`;
                } else {
                    // Hourly grouping format: YYYY-MM-DDTHH
                    const hour = parts[1] ? parseInt(parts[1], 10) : 0;
                    return `${hour.toString().padStart(2, '0')}:00`;
                }
            } else {
                // Daily grouping format: YYYY-MM-DD
                const d = new Date(date);
                return `${d.getMonth() + 1}/${d.getDate()}`;
            }
        });

        return {
            labels: formattedLabels,
            datasets: [
                {
                    label: 'Variant A - Impressions',
                    data: timeSeriesData.impressions?.variantA?.map(item => item.count) || [],
                    borderColor: 'rgb(59, 130, 246)', // blue
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Variant B - Impressions',
                    data: timeSeriesData.impressions?.variantB?.map(item => item.count) || [],
                    borderColor: 'rgb(168, 85, 247)', // purple
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Variant A - Clicks',
                    data: timeSeriesData.clicks?.variantA?.map(item => item.count) || [],
                    borderColor: 'rgb(34, 197, 94)', // green
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Variant B - Clicks',
                    data: timeSeriesData.clicks?.variantB?.map(item => item.count) || [],
                    borderColor: 'rgb(236, 72, 153)', // pink
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Variant A - Avg Hover Time (s)',
                    data: timeSeriesData.hoverTime?.variantA?.map(item => item.avgDuration) || [],
                    borderColor: 'rgb(251, 146, 60)', // orange
                    backgroundColor: 'rgba(251, 146, 60, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Variant B - Avg Hover Time (s)',
                    data: timeSeriesData.hoverTime?.variantB?.map(item => item.avgDuration) || [],
                    borderColor: 'rgb(249, 115, 22)', // dark orange
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.4
                }
            ]
        };
    }, [timeSeriesData]);

    // Handler for Variant A selection - clears Variant B when selected
    const handleVariantAPromotionChange = (value) => {
        setVariantAPromotion(value);
        if (value) {
            setVariantBPromotion('');
        }
    };

    // Handler for Variant B selection - clears Variant A when selected
    const handleVariantBPromotionChange = (value) => {
        setVariantBPromotion(value);
        if (value) {
            setVariantAPromotion('');
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        if (!abTest || !abTest.gameId || !abTest.startDate || !abTest.endDate) {
            return;
        }

        // Set artificial loading state
        setIsRefreshing(true);

        // Create promises for both API calls
        const statsPromise = fetchStatsMutation.execute(null, `/api/ab-test-data/stats?gameId=${encodeURIComponent(abTest.gameId)}&startDate=${encodeURIComponent(abTest.startDate)}&endDate=${encodeURIComponent(abTest.endDate)}`);
        
        const { startDate, endDate } = getDateRange(timeRange);
        const timeSeriesPromise = fetchTimeSeriesMutation.execute(null, `/api/ab-test-data/timeseries?gameId=${encodeURIComponent(abTest.gameId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);

        // Create a minimum 2-second delay promise
        const minDelayPromise = new Promise(resolve => setTimeout(resolve, 2000));

        // Wait for all promises (API calls + minimum delay)
        Promise.all([statsPromise, timeSeriesPromise, minDelayPromise]).then(([statsResult, timeSeriesResult]) => {
            // Process stats result
            if (statsResult && statsResult.data) {
                const stats = statsResult.data;
                
                const variantA = {
                    clicks: stats.variantA?.clicks || 0,
                    impressions: stats.variantA?.impressions || 0,
                    ctr: stats.variantA?.ctr || 0,
                    isWinner: false
                };
                
                const variantB = {
                    clicks: stats.variantB?.clicks || 0,
                    impressions: stats.variantB?.impressions || 0,
                    ctr: stats.variantB?.ctr || 0,
                    isWinner: false
                };

                if (variantA.ctr > variantB.ctr) {
                    variantA.isWinner = true;
                } else if (variantB.ctr > variantA.ctr) {
                    variantB.isWinner = true;
                }

                setVariantAData(variantA);
                setVariantBData(variantB);
            }

            // Process time series result
            if (timeSeriesResult && timeSeriesResult.data) {
                setTimeSeriesData(timeSeriesResult.data);
            }

            // Clear artificial loading state
            setIsRefreshing(false);
        }).catch(() => {
            // Clear loading state even on error
            setIsRefreshing(false);
        });
    };

    // Handle CSV export
    const handleExportCSV = () => {
        console.log('Export CSV for AB test:', abTest.id);
    };

    // Format numbers for display
    const formatNumber = (num) => {
        if (num === null || num === undefined) return 'N/A';
        return num.toLocaleString();
    };

    const formatCTR = (ctr) => {
        if (ctr === null || ctr === undefined) return 'N/A';
        return `${ctr.toFixed(2)}%`;
    };

    return (
        <>
    
            <Dialog open={isOpen} onClose={onClose}>
                <DialogContent className="w-[70vw] max-w-none max-h-[90dvh] flex flex-col">
                
                {/* Dialog Header */}
                <DialogHeader className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-black text-slate-900 ">
                            {t('AB Test Results')}
                        </h1>
                        <div className="flex items-center gap-2 mr-5">
                            
                            {!!abTest.published ? (
                                <Badge variant="green">Published</Badge>
                            ) : (
                                <Badge variant="red">Not Published</Badge>
                            )}
                            <Badge variant={testStatus.color}>
                                {testStatus.status}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>
                
                {/* Scrollable Body */}
                <div className="py-6 px-6 overflow-y-scroll flex-1 min-h-0">
                    <div className="flex flex-col gap-8 pr-2"> 
                        
                        {/* Test Title Section */}
                        <div className="flex flex-row items-center justify-between">
                            <div className="flex flex-col gap-2">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {abTest.name}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 max-w-3xl ">
                                {abTest.description}
                            </p>
                            </div>
                           
                            <Button
                                color="blue"
                                onClick={handleRefresh}
                                disabled={refreshing || loading || chartLoading}
                                className="flex items-center gap-2"
                            >
                                {(refreshing || chartLoading) ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('Refreshing...')}
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        {t('Refresh')}
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Variant Comparison Section */}
                        <div className="relative grid grid-cols-2 gap-8">
                            
                            {/* Winner Badge Overlay */}
                            {/* <div className="absolute z-1000 top-0 left-0 w-full h-full">
                            {variantAData.isWinner && <WinnerBadge t={t} improvement="+2.6%" />}
                            {variantBData.isWinner && <WinnerBadge t={t} improvement="+2.6%" />}
                            </div> */}
                            
                            
                            {/* Variant A (Control) */}
                            <div className="flex flex-col space-y-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/30 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800 shadow-xl relative overflow-hidden">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-5">
                                    <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-black text-blue-700 dark:text-blue-400">
                                            {t('Variant A')}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <PromoteVariantDropdown
                                                value={variantAPromotion}
                                                onChange={handleVariantAPromotionChange}
                                                highlightColor="blue"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        {/* Media Player */}
                                        <div className="w-2/5 flex-shrink-0">
                                            <div className="rounded-lg overflow-hidden shadow-lg ring-2 ring-blue-200 dark:ring-blue-800">
                                                <MediaPlayer
                                                    gameId={abTest.gameId}
                                                    imageUrl={abTest.imageVariantA}
                                                    videoUrl={abTest.videoVariantA}
                                                    type={abTest.videoVariantA ? 'both' : 'image'}
                                                    readOnly={false}
                                                    showPlayIcon={true}
                                                    canSelect={false}
                                                />
                                            </div>
                                        </div>

                                        {/* Data Section */}
                                        <div className="w-3/5">
                                            {loading ? (
                                                <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border-2 border-blue-200 dark:border-blue-700 shadow-sm h-full flex flex-col justify-center items-center">
                                                    <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t('Loading stats...')}</p>
                                                </div>
                                            ) : (
                                                <VariantData 
                                                    t={t}
                                                    variantName="Variant A"
                                                    clicks={formatNumber(variantAData.clicks)}
                                                    impressions={formatNumber(variantAData.impressions)}
                                                    ctr={formatCTR(variantAData.ctr)}
                                                    colorClass={variantAData.isWinner ? 'border-green-500' : 'border-blue-200 dark:border-blue-700'}
                                                    isWinner={variantAData.isWinner}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Variant B (Test) */}
                            <div className="flex flex-col space-y-4 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/30 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800 shadow-xl relative overflow-hidden">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-5">
                                    <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-black text-purple-700 dark:text-purple-400">
                                            {t('Variant B')}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <PromoteVariantDropdown
                                                value={variantBPromotion}
                                                onChange={handleVariantBPromotionChange}
                                                highlightColor="purple"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        {/* Media Player */}
                                        <div className="w-2/5 flex-shrink-0">
                                            <div className="rounded-lg overflow-hidden shadow-lg ring-2 ring-purple-200 dark:ring-purple-800">
                                                <MediaPlayer
                                                    gameId={abTest.gameId}
                                                    imageUrl={abTest.imageVariantB}
                                                    videoUrl={abTest.videoVariantB}
                                                    type={abTest.videoVariantB ? 'both' : 'image'}
                                                    readOnly={false}
                                                    showPlayIcon={true}
                                                    canSelect={false}
                                                />
                                            </div>
                                        </div>

                                        {/* Data Section */}
                                        <div className="w-3/5">
                                            {loading ? (
                                                <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border-2 border-purple-200 dark:border-purple-700 shadow-sm h-full flex flex-col justify-center items-center">
                                                    <svg className="animate-spin h-8 w-8 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t('Loading stats...')}</p>
                                                </div>
                                            ) : (
                                                <VariantData 
                                                    t={t}
                                                    variantName="Variant B"
                                                    clicks={formatNumber(variantBData.clicks)}
                                                    impressions={formatNumber(variantBData.impressions)}
                                                    ctr={formatCTR(variantBData.ctr)}
                                                    colorClass={variantBData.isWinner ? 'border-green-500' : 'border-purple-200 dark:border-purple-700'}
                                                    isWinner={variantBData.isWinner}
                                                />
                                            )}
                                        </div>
                                        
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Test Information and Analytics Section */}
                        <div className="grid grid-cols-2 gap-6">
                            
                            {/* AB Test Information Card */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        {t('Test Information')}
                                    </h2>
                                </div>

                                {/* Progress Indicator */}
                                <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            {t('Test Progress')}
                                        </span>
                                        <span className={`text-lg font-black ${
                                            testStatus.status === 'Completed' ? 'text-green-600 dark:text-green-400' :
                                            testStatus.status === 'In Progress' ? 'text-blue-600 dark:text-blue-400' :
                                            testStatus.status === 'Not Started' ? 'text-slate-600 dark:text-slate-400' :
                                            'text-red-600 dark:text-red-400'
                                        }`}>
                                            {testStatus.progress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className={`h-3 rounded-full transition-all duration-500 shadow-sm ${
                                                testStatus.status === 'Completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                                testStatus.status === 'In Progress' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                                                testStatus.status === 'Not Started' ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                                                'bg-red-500 dark:bg-red-500'
                                            }`}
                                            style={{ width: `${testStatus.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                            {t('Game')}
                                        </p>
                                        <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                            {abTest.gameName || abTest.gameId || 'N/A'}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                            {t('Group')}
                                        </p>
                                        <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                                            {abTest.group || 'N/A'}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                            {t('Start Date')}
                                        </p>
                                        <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                                            {abTest.startDate}
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                            {t('End Date')}
                                        </p>
                                        <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                                            {abTest.endDate}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Metrics / Analytics Section */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                            {t('Detailed Analytics')}
                                        </h2>
                                    </div>
                                    
                                    {/* Time Range Selector */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            color={timeRange === 'hour' ? 'blue' : 'gray'}
                                            onClick={() => setTimeRange('hour')}
                                            className="text-xs px-3 py-1"
                                            disabled={chartLoading}
                                        >
                                            {t('1 Hour')}
                                        </Button>
                                        <Button
                                            color={timeRange === 'day' ? 'blue' : 'gray'}
                                            onClick={() => setTimeRange('day')}
                                            className="text-xs px-3 py-1"
                                            disabled={chartLoading}
                                        >
                                            {t('1 Day')}
                                        </Button>
                                        <Button
                                            color={timeRange === 'week' ? 'blue' : 'gray'}
                                            onClick={() => setTimeRange('week')}
                                            className="text-xs px-3 py-1"
                                            disabled={chartLoading}
                                        >
                                            {t('1 Week')}
                                        </Button>
                                        <Button
                                            color={timeRange === 'week' ? 'blue' : 'gray'}
                                            onClick={() => setTimeRange('week')}
                                            className="text-xs px-3 py-1"
                                            disabled={chartLoading}
                                        >
                                            {t('All Data')}
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Chart Display */}
                                {chartLoading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-8 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                                        <svg className="animate-spin h-8 w-8 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t('Loading chart data...')}</p>
                                    </div>
                                ) : chartData ? (
                                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                                        <Chart
                                            type="line"
                                            data={chartData}
                                            color={['blue', 'purple', 'green', 'pink']}
                                            showLegend={true}
                                            loading={false}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center py-8 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                                        <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                                            <svg className="w-12 h-12 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                            </svg>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-center text-sm max-w-xs">
                                            {t('No data available for the selected time period')}
                                        </p>
                                        <p className="text-slate-400 dark:text-slate-500 text-center text-xs mt-2">
                                            {t('Charts will appear here once test data is collected')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dialog Footer */}
                <DialogFooter className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            {t('Test ID')}: <span className="font-mono font-semibold">{abTest.id || 'N/A'}</span>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                color="red"
                                onClick={onClose}
                            >
                                {t('Close')}
                            </Button>
                            <Button 
                                color="blue"
                                onClick={handleExportCSV}
                                disabled
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {t('Export CSV')}
                            </Button>
                            
                            {/* Promote Variant Button */}
                            {variantAPromotion && (
                                <Button 
                                    color="green"
                                    onClick={() => console.log('Promoting Variant A to', variantAPromotion)}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                    {t(`Set Variant A to ${variantAPromotion.charAt(0).toUpperCase() + variantAPromotion.slice(1)}`)}
                                </Button>
                            )}
                            
                            {variantBPromotion && (
                                <Button 
                                    color="green"
                                    onClick={() => console.log('Promoting Variant B to', variantBPromotion)}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                    {t(`Set Variant B to ${variantBPromotion.charAt(0).toUpperCase() + variantBPromotion.slice(1)}`)}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
};

export { ABTestResultsDialog };