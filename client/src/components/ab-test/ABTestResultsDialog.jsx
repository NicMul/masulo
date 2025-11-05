/***
*
* AB TEST RESULTS DIALOG
* A beautiful dialog to display AB test results and comparison
*
**********/

import { Dialog, DialogContent, DialogHeader, DialogFooter, Button, Badge } from 'components/lib';
import MediaPlayer from 'components/edit/MediaPlayer';
import { PromoteVariantDropdown } from './PromoteVariantDropdown';
import { useState, useMemo } from 'react';

// --- Utility Components ---

// Component to display key metrics for a variant
const VariantData = ({
    t,
    variantName,
    clicks,
    conversions,
    conversionRate,
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
                <span className="text-xs text-slate-500 dark:text-slate-400">{t('Conversions')}</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{conversions || 'N/A'}</span>
            </div>
            
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('Conversion Rate')}</span>
                    <span className={`text-3xl font-black ${isWinner ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {conversionRate || 'N/A'}
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
    const [variantAPromotion, setVariantAPromotion] = useState('current');
    const [variantBPromotion, setVariantBPromotion] = useState('current');

    // Handle CSV export
    const handleExportCSV = () => {
        console.log('Export CSV for AB test:', abTest.id);
    };

    // Placeholder data for variants
    const variantAData = {
        clicks: '1,250',
        conversions: '320',
        conversionRate: '25.6%',
        isWinner: true 
    };

    const variantBData = {
        clicks: '1,300',
        conversions: '299',
        conversionRate: '23.0%',
        isWinner: false
    };

    return (
        <>
            <style>{`
                [data-radix-dialog-overlay] {
                    background-color: rgba(0, 0, 0, 0.3) !important;
                }
            `}</style>
            <Dialog open={isOpen} onClose={onClose}>
                <DialogContent className="w-[70vw] max-w-none max-h-[90dvh] flex flex-col overflow-y-auto">
                
                {/* Dialog Header */}
                <DialogHeader className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                <div className="py-6 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
                    <div className="flex flex-col gap-8"> 
                        
                        {/* Test Title Section */}
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                {abTest.name}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                                {abTest.description}
                            </p>
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
                                                onChange={setVariantAPromotion}
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
                                                    readOnly={true}
                                                    showPlayIcon={true}
                                                    canSelect={false}
                                                />
                                            </div>
                                        </div>

                                        {/* Data Section */}
                                        <div className="w-3/5">
                                            <VariantData 
                                                t={t}
                                                variantName="Variant A"
                                                {...variantAData}
                                                colorClass={variantAData.isWinner ? 'border-green-500' : 'border-blue-200 dark:border-blue-700'}
                                                isWinner={variantAData.isWinner}
                                            />
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
                                                onChange={setVariantBPromotion}
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
                                                    readOnly={true}
                                                    showPlayIcon={true}
                                                    canSelect={false}
                                                />
                                            </div>
                                        </div>

                                        {/* Data Section */}
                                        <div className="w-3/5">
                                            <VariantData 
                                                t={t}
                                                variantName="Variant B"
                                                {...variantBData}
                                                colorClass={variantBData.isWinner ? 'border-green-500' : 'border-purple-200 dark:border-purple-700'}
                                                isWinner={variantBData.isWinner}
                                            />
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
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        {t('Detailed Analytics')}
                                    </h2>
                                </div>
                                
                                {/* Empty State */}
                                <div className="flex-1 flex flex-col items-center justify-center py-8 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                                    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                                        <svg className="w-12 h-12 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-center text-sm max-w-xs">
                                        {t('Detailed performance metrics and event data will be displayed here')}
                                    </p>
                                    <p className="text-slate-400 dark:text-slate-500 text-center text-xs mt-2">
                                        {t('Charts • Graphs • Statistical Analysis')}
                                    </p>
                                </div>
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
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
};

export { ABTestResultsDialog };