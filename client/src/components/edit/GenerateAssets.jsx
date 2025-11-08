import { Dialog, DialogContent, DialogHeader, Tabs, TabsList, TabsTrigger, TabsContent, Card, Button, Icon, Animate } from 'components/lib';
import { useTranslation } from 'react-i18next';
import MediaPlayer from './MediaPlayer';
import { useState, useMemo, useCallback, useContext } from 'react';
import { DialogFooter } from 'components/dialog/dialog';
import { useMutation } from 'components/hooks/mutation';
import { ViewContext } from 'components/view/context';
import { DescribeChangesDialog } from './dialogs/DescribeChangesDialog';
import { DeleteConfirmationDialog } from './dialogs/DeleteConfirmationDialog';
import { AcceptConfirmationDialog } from './dialogs/AcceptConfirmationDialog';
import { ArchiveConfirmationDialog } from './dialogs/ArchiveConfirmationDialog';
import { getButtonText, getMediaPlayerType, getImageUrl, getVideoUrl, getTestVideoUrl, generateDescriptionPlaceholder } from './utilities';
import { VideoEditor } from './VideoEditor';


const GenerateAssets = ({
    isOpen,
    onClose,
    selectedGame,
    assetType,
    onGameUpdate,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [imagePrompt, setImagePrompt] = useState('');
    const [videoPrompt, setVideoPrompt] = useState('');
    const [showDescribeChangesDialog, setShowDescribeChangesDialog] = useState(false);
    const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState(false);
    const [generateImage, setGenerateImage] = useState();
    const [generateVideo, setGenerateVideo] = useState(true);
    const [testImage, setTestImage] = useState(null);
    const [testVideoUrl, setTestVideoUrl] = useState(null);
    const [reloadTrigger, setReloadTrigger] = useState(0);
    const [showAcceptConfirmationDialog, setShowAcceptConfirmationDialog] = useState(false);
    const [showArchiveConfirmationDialog, setShowArchiveConfirmationDialog] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [madeSelection, setMadeSelection] = useState(false);

    const viewContext = useContext(ViewContext);

    const { t } = useTranslation();
    const generateAssetsMutation = useMutation('/api/ai/process', 'POST');
    const deleteTestAssetsMutation = useMutation(`/api/game/${selectedGame?.id}/test-assets`, 'DELETE');
    const acceptTestAssetsMutation = useMutation(`/api/game/${selectedGame?.id}/test-assets/accept`, 'POST');
    const archiveTestAssetsMutation = useMutation(`/api/game/${selectedGame?.id}/test-assets/archive`, 'POST');


    const handleSelect = (videoUrl) => {
        console.log('Selected video:', videoUrl);
    };

    const mediaPlayerType = useMemo(() => {
        return getMediaPlayerType(selectedGame, testImage, testVideoUrl);
    }, [selectedGame, testImage, testVideoUrl]);

    const buttonText = useMemo(() => {
        return getButtonText(isGenerating, t);
    }, [isGenerating, t]);

    const handleRegenerate = useCallback(async () => {
        console.log('handleRegenerate', selectedGame, testImage, testVideoUrl, assetType, imagePrompt, videoPrompt, generateImage, generateVideo);


        setIsGenerating(true);

        const payload = {
            gameId: selectedGame?.id,
            imageUrl: selectedGame.testImage || testImage ? selectedGame.testImage : selectedGame?.defaultImage,
            assetType: assetType,
            imagePrompt: imagePrompt,
            videoPrompt: videoPrompt,
            theme: selectedGame?.theme,
            generateImage: assetType === 'original' ? false : generateImage,
            generateVideo: generateVideo
        };

        console.log('🎨 Sending prompts to backend:', {
            imagePrompt: imagePrompt || '(empty)',
            videoPrompt: videoPrompt || '(empty)'
        });

        try {


            const result = await generateAssetsMutation.execute(payload);

            if (result) {
                console.log('Result:', result.data);

                // Handle 'original', 'current', 'theme', and 'promo' asset types
                if (result.data.assetType === 'original' || result.data.assetType === 'current' || result.data.assetType === 'theme' || result.data.assetType === 'promo') {
                    setTestImage(result.data.imageUrl);
                    setTestVideoUrl(result.data.videoUrl);

                    // Trigger parent refresh to get updated game data
                    if (onGameUpdate) {
                        onGameUpdate();
                    }

                    setReloadTrigger(reloadTrigger + 1);
                }

                viewContext.notification({
                    description: t('edit.regenerate.dialog.success'),
                    variant: 'success'
                });
                setImagePrompt('');
                setVideoPrompt('');
            }
        } catch (err) {
            console.error('Error generating assets:', err);
            setImagePrompt('');
            setVideoPrompt('');

            // Handle different error types with user-friendly messages
            let errorMessage = t('edit.regenerate.dialog.error');

            if (err?.response?.data?.error) {
                const backendError = err.response.data.error;

                if (backendError.includes('temporarily unavailable')) {
                    errorMessage = t('edit.regenerate.dialog.serviceUnavailable', 'AI service is temporarily unavailable. Please try again in a few minutes.');
                } else if (backendError.includes('Rate limit exceeded')) {
                    errorMessage = t('edit.regenerate.dialog.rateLimit', 'Rate limit exceeded. Please wait a moment and try again.');
                } else if (backendError.includes('AI generation failed')) {
                    errorMessage = t('edit.regenerate.dialog.generationFailed', 'AI generation failed. Please try again with a different image or prompt.');
                } else {
                    errorMessage = backendError;
                }
            } else if (err?.message) {
                errorMessage = err.message;
            }

            viewContext.notification({
                description: errorMessage,
                variant: 'error'
            });
        } finally {
            setIsGenerating(false);
        }
    }, [selectedGame, assetType, imagePrompt, videoPrompt, viewContext, t, generateAssetsMutation, onGameUpdate, generateImage, generateVideo, testImage]);

    const handleDeleteTestAssets = useCallback(async () => {
        try {
            await deleteTestAssetsMutation.execute();

            // Clear local state
            setTestVideoUrl(null);
            setTestImage(null);

            // Trigger parent refresh to get updated game data
            if (onGameUpdate) {
                onGameUpdate();
            }

            // Refresh component data
            setReloadTrigger(reloadTrigger + 1);

            // Close confirmation dialog
            setShowDeleteConfirmationDialog(false);

            viewContext.notification({
                description: t('Test assets deleted successfully'),
                variant: 'success'
            });
        } catch (err) {
            console.error('Error deleting test assets:', err);
            viewContext.notification({
                description: t('Failed to delete test assets'),
                variant: 'error'
            });
        }
    }, [deleteTestAssetsMutation, reloadTrigger, viewContext, t, onGameUpdate]);

    const handleAcceptTestAssets = useCallback(async () => {
        setShowAcceptConfirmationDialog(true);
    }, []);

    const handleArchiveAssets = useCallback(async () => {
        setShowArchiveConfirmationDialog(true);
    }, []);

    const confirmArchiveTestAssets = useCallback(async () => {
        try {
            setIsArchiving(true);
            await archiveTestAssetsMutation.execute({});

            // Clear local state
            setTestVideoUrl(null);
            setTestImage(null);

            // Trigger parent refresh to get updated game data
            if (onGameUpdate) {
                onGameUpdate();
            }

            // Refresh component data
            setReloadTrigger(reloadTrigger + 1);

            // Close confirmation dialog
            setShowArchiveConfirmationDialog(false);

            viewContext.notification({
                description: t('Test assets archived successfully'),
                variant: 'success'
            });
        } catch (err) {
            console.error('Error archiving test assets:', err);
            viewContext.notification({
                description: t('Failed to archive test assets'),
                variant: 'error'
            });
        } finally {
            setIsArchiving(false);
        }
    }, [archiveTestAssetsMutation, reloadTrigger, viewContext, t, onGameUpdate]);

    const confirmAcceptTestAssets = useCallback(async () => {
        try {
            await acceptTestAssetsMutation.execute({
                assetType: assetType
            });

            // Clear local state
            setTestVideoUrl(null);
            setTestImage(null);

            // Trigger parent refresh to get updated game data
            if (onGameUpdate) {
                onGameUpdate();
            }

            // Refresh component data
            setReloadTrigger(reloadTrigger + 1);

            // Close confirmation dialog
            setShowAcceptConfirmationDialog(false);

            viewContext.notification({
                description: t('Test assets accepted successfully'),
                variant: 'success'
            });
        } catch (err) {
            console.error('Error accepting test assets:', err);
            viewContext.notification({
                description: t('Failed to accept test assets'),
                variant: 'error'
            });
        }
    }, [acceptTestAssetsMutation, assetType, reloadTrigger, viewContext, t, onGameUpdate]);

    const handleDeleteClick = useCallback(() => {
        setShowDeleteConfirmationDialog(true);
    }, []);

    const testVideoUrlValue = useMemo(() => {
        return getTestVideoUrl(testVideoUrl, selectedGame);
    }, [testVideoUrl, selectedGame]);

    const descriptionPlaceholder = useMemo(() => {
        return generateDescriptionPlaceholder(assetType, t);
    }, [assetType, t]);

    const imageUrl = useMemo(() => {
        return getImageUrl(assetType, selectedGame);
    }, [assetType, selectedGame]);

    const videoUrl = useMemo(() => {
        return getVideoUrl(assetType, selectedGame);
    }, [assetType, selectedGame]);

    const createTitle = () => {
        if (isGenerating) {
            return t('edit.regenerate.dialog.cards.generatingAssets');
        }
        if (selectedGame?.testImage || selectedGame?.testVideo) {
            return t('edit.regenerate.dialog.cards.latestAssets');
        }
        return t('edit.regenerate.dialog.cards.generateAssets');
    }

    const getGenerateTitle = (assetType, t) => {
        if (assetType === 'original') {
            return {
                image: t('edit.regenerate.dialog.cards.originalImage'),
                video: t('edit.regenerate.dialog.cards.originalVideo')
            }
        }
        if (assetType === 'current') {
            return {
                image: t('edit.regenerate.dialog.cards.aiGeneratedImage'),
                video: t('edit.regenerate.dialog.cards.aiGeneratedVideo')
            }
        }
        if (assetType === 'theme') {
            return {
                image: t('edit.regenerate.dialog.cards.themeImage'),
                video: t('edit.regenerate.dialog.cards.themeVideo')
            }
        }
        if (assetType === 'promo') {
            return {
                image: t('edit.regenerate.dialog.cards.promoImage'),
                video: t('edit.regenerate.dialog.cards.promoVideo')
            }
        }
        // Default fallback
        return {
            image: t('edit.regenerate.dialog.cards.aiGeneratedImage'),
            video: t('edit.regenerate.dialog.cards.aiGeneratedVideo')
        }
    }

    return (
        <div>
            <Dialog open={isOpen} onClose={onClose}>
                <DialogContent className="!w-[80vw] h-[80dvh] !max-w-none">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <h1>Generate Assets</h1>
                        </div>
                    </DialogHeader>
                    <div className='grid grid-cols-2 gap-3'>
                        <Tabs defaultValue="reference">
                            <TabsList>
                                <TabsTrigger value="reference">{t('edit.regenerate.dialog.tabs.original')}</TabsTrigger>
                                <TabsTrigger value="saved">{t('edit.regenerate.dialog.tabs.selectedForEdit')}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="reference">
                                <Animate type='pop'>
                                    <div className='flex justify-center items-center flex-row gap-3 bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>

                                        <Card title={getGenerateTitle(assetType, t).image} className='w-1/2 flex-col gap-3'>
                                            <MediaPlayer
                                                gameId={selectedGame?.id}
                                                imageUrl={selectedGame?.defaultImage}
                                                videoUrl={selectedGame?.defaultVideo}
                                                onSelect={handleSelect}
                                                type="image"
                                                canSelect={false}
                                                showPlayIcon={false}
                                                readOnly={true}
                                                isSelected={false}
                                                isGenerating={false}
                                            />
                                        </Card>


                                    </div>
                                </Animate>
                            </TabsContent>
                            <TabsContent value="saved">
                                <Animate type='pop'>
                                    <div className='flex flex-row gap-3 bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>


                                        <Card
                                            title={getGenerateTitle(assetType, t).image}
                                            className='w-1/2 flex-col gap-3'
                                        >
                                            <MediaPlayer
                                                key={reloadTrigger}
                                                gameId={selectedGame?.id}
                                                imageUrl={imageUrl}
                                                videoUrl={videoUrl}
                                                onSelect={handleSelect}
                                                type="image"
                                                canSelect={false}
                                                showPlayIcon={false}
                                                readOnly={assetType === 'original' && selectedGame?.defaultImage}
                                                isSelected={false}
                                                isGenerating={false}
                                            />
                                        </Card>
                                        <Card title={getGenerateTitle(assetType, t).video} className='w-1/2 flex-col gap-3'>
                                            <MediaPlayer
                                                key={reloadTrigger}
                                                gameId={selectedGame?.id}
                                                imageUrl={imageUrl}
                                                videoUrl={videoUrl}
                                                onSelect={handleSelect}
                                                type="video"
                                                canSelect={false}
                                                showPlayIcon={true}
                                                readOnly={false}
                                                isSelected={false}
                                                isGenerating={false}
                                            />
                                        </Card>

                                    </div>
                                </Animate>
                            </TabsContent>
                        </Tabs>
                        <Tabs defaultValue="generations">
                            <TabsList className="mb-2" >
                                <TabsTrigger value="generations" className="flex-1">{t('edit.regenerate.dialog.tabs.generations')}</TabsTrigger>
                                <TabsTrigger disabled={true} value="archived" className="flex-1">Archived Assets</TabsTrigger>
                            </TabsList>
                            <TabsContent  value="generations" className="m-0">
                                <Animate type='pop'>
                                    <div className='flex justify-center items-center flex-row gap-3 bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>
                                        <Card
                                            title={createTitle()}
                                            className='relative w-1/2 justify-center flex-col gap-3'
                                        >
                                            <MediaPlayer
                                                key={`${reloadTrigger}-${selectedGame?.testImage}-${selectedGame?.testVideo}`}
                                                gameId={selectedGame?.id}
                                                imageUrl={testImage || selectedGame?.testImage}
                                                videoUrl={testVideoUrlValue}
                                                onSelect={handleSelect}
                                                type={mediaPlayerType}
                                                canSelect={false}
                                                showPlayIcon={!testImage && !selectedGame?.testImage}
                                                readOnly={false}
                                                isSelected={false}
                                                isGenerating={isGenerating}
                                            />
                                            {(selectedGame?.testImage || selectedGame?.testVideo || testImage || testVideoUrl) && (
                                                <div className="mt-4 flex justify-between gap-2">
                                                    <Button disabled={isGenerating} color="red" className="w-1/3" onClick={handleDeleteClick}>{t('Delete Last')}</Button>
                                                    <Button disabled={isGenerating} color="green" className="w-1/3" onClick={handleAcceptTestAssets}>
                                                        {t('Accept Last')}
                                                    </Button>
                                                    <Button disabled={isGenerating} onClick={handleArchiveAssets} color="green" className="w-1/3">
                                                        {t('Archive')}
                                                    </Button>
                                                </div>
                                            )}
                                        </Card>
                                    </div>
                                </Animate>
                            </TabsContent>
                            <TabsContent value="archived" className="m-0">
                                <div className='relative flex justify-center items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>
                                    <Animate type='pop'>
                                        <Card title={t('edit.regenerate.dialog.tabs.videoEditor')} className='relative w-full justify-center flex-col gap-3' >
                                            Archived Assets Here

                                        </Card>
                                    </Animate>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <DialogFooter>
                        <Button disabled={isGenerating} color={(imagePrompt || videoPrompt) ? 'green' : 'blue'} onClick={() => setShowDescribeChangesDialog(true)}>{t('Describe Changes')}</Button>
                        <Button
                            color={madeSelection ? 'green' : 'gray'}
                            onClick={handleRegenerate}
                            disabled={isGenerating || !madeSelection}
                        >
                            {isGenerating && (
                                <Icon name="loader-2" size={16} className="mr-2 animate-spin" />
                            )}
                            {buttonText}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <DescribeChangesDialog
                isOpen={showDescribeChangesDialog}
                onClose={() => setShowDescribeChangesDialog(false)}
                imagePrompt={imagePrompt}
                setImagePrompt={setImagePrompt}
                videoPrompt={videoPrompt}
                setVideoPrompt={setVideoPrompt}
                generateImage={generateImage}
                setGenerateImage={setGenerateImage}
                generateVideo={generateVideo}
                setGenerateVideo={setGenerateVideo}
                selectedGame={selectedGame}
                assetType={assetType}
                setMadeSelection={setMadeSelection}
                t={t}
            />
            <DeleteConfirmationDialog
                isOpen={showDeleteConfirmationDialog}
                onClose={() => setShowDeleteConfirmationDialog(false)}
                onConfirm={handleDeleteTestAssets}
                t={t}
            />
            <AcceptConfirmationDialog
                isOpen={showAcceptConfirmationDialog}
                onClose={() => setShowAcceptConfirmationDialog(false)}
                onConfirm={confirmAcceptTestAssets}
                assetType={assetType}
                t={t}
            />
            <ArchiveConfirmationDialog
                isOpen={showArchiveConfirmationDialog}
                onClose={() => setShowArchiveConfirmationDialog(false)}
                onConfirm={confirmArchiveTestAssets}
                isArchiving={isArchiving}
                t={t}
            />
        </div>
    );
};

export { GenerateAssets };