import { Dialog, DialogContent, DialogHeader, Tabs, TabsList, TabsTrigger, TabsContent, Card, Button, Icon, Textarea, Switch, Label } from 'components/lib';
import { useTranslation } from 'react-i18next';
import MediaPlayer from './MediaPlayer';
import { useState, useMemo, useCallback, useContext } from 'react';
import { DialogFooter } from 'components/dialog/dialog';
import { useMutation } from 'components/hooks/mutation';
import { ViewContext } from 'components/view/context';


const GenerateAssets = ({
    isOpen,
    onClose,
    selectedGame,
    assetType,
    onGameUpdate,
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [showDescribeChangesDialog, setShowDescribeChangesDialog] = useState(false);
    const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState(false);
    const [showAssetSelectionDialog, setShowAssetSelectionDialog] = useState(false);
    const [generateImage, setGenerateImage] = useState();
    const [generateVideo, setGenerateVideo] = useState(true);
    const [testImage, setTestImage] = useState(null);
    const [testVideoUrl, setTestVideoUrl] = useState(null);
    const [reloadTrigger, setReloadTrigger] = useState(0);
    const [showAcceptConfirmationDialog, setShowAcceptConfirmationDialog] = useState(false);
    const [showArchiveConfirmationDialog, setShowArchiveConfirmationDialog] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [madeSelection, setMadeSelection] = useState(false);
    const [reloadTrigger2, setReloadTrigger2] = useState(0);

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

        const hasImage = selectedGame?.testImage || testImage;
        const hasVideo = selectedGame?.testVideo || testVideoUrl;
        if (hasImage && hasVideo) return 'both';
        if (hasImage) return 'image';
        if (hasVideo) return 'video';
        return 'both';
    }, [selectedGame, testImage, testVideoUrl]);

    const getButtonText = useCallback(() => {
        if (isGenerating) return t('edit.regenerate.dialog.generating');
        return t('edit.regenerate.dialog.generateAssets');
    }, [isGenerating]);

    const handleRegenerate = useCallback(async () => {


        setIsGenerating(true);

        const payload = {
            gameId: selectedGame?.id,
            imageUrl: selectedGame.testImage || testImage ? selectedGame.testImage : selectedGame?.defaultImage,
            assetType: assetType,
            prompt: customPrompt,
            theme: selectedGame?.theme,
            generateImage: assetType === 'original' ? false : generateImage,
            generateVideo: generateVideo
        };

        try {


            const result = await generateAssetsMutation.execute(payload);

            if (result) {
                console.log('Result:', result.data);
                
                // Handle both 'original' and 'current' asset types
                if (result.data.assetType === 'original' || result.data.assetType === 'current') {
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
                setCustomPrompt('');
            }
        } catch (err) {
            console.error('Error generating assets:', err);
            setCustomPrompt('');
            
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
    }, [selectedGame, assetType, customPrompt, viewContext, t, generateAssetsMutation, onGameUpdate]);

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

    const getTestVideoUrl = useCallback(() => {
        if (testVideoUrl) {
            return testVideoUrl;
        }
        return selectedGame?.testVideo;
    }, [testVideoUrl, selectedGame?.testVideo])

    const generateDescriptionPlaceholder = useCallback(() => {
        if (assetType === 'original') {
            return t('edit.regenerate.dialog.placeholders.originalImagePrompt');
        }
        return t('edit.regenerate.dialog.placeholders.aiGeneratedImagePrompt');
    }, [assetType]);



    const getImageUrl = useCallback(() => {
      if (assetType === 'original') return selectedGame?.defaultImage;
      if (assetType === 'current') return selectedGame?.currentImage;
      if (assetType === 'theme') return selectedGame?.themeImage;
      return null;
    }, [assetType, selectedGame]);

    const getVideoUrl = useCallback(() => {

      if (assetType === 'original') return selectedGame?.defaultVideo;
      if (assetType === 'current') return selectedGame?.currentVideo;
      if (assetType === 'theme') return selectedGame?.themeVideo;
      return null;
    }, [assetType, selectedGame, generateVideo, generateImage]);



    return (
        <div>
            <Dialog open={isOpen} onClose={onClose}>
                <DialogContent className="!w-[80vw] !max-w-none">
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
                                <div className='flex justify-center items-center flex-row gap-3 bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>
                                    <Card title={t('edit.regenerate.dialog.cards.originalImage')} className='w-1/2 flex-col gap-3'>
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
                                        />
                                    </Card>
                                </div>
                            </TabsContent>
                            <TabsContent value="saved">
                                <div className='flex flex-row gap-3 bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>
                                    <Card
                                        title={assetType === 'original' ? t('edit.regenerate.dialog.cards.originalImage') : t('edit.regenerate.dialog.cards.aiGeneratedImage')}
                                        className='w-1/2 flex-col gap-3'
                                    >
                                        <MediaPlayer
                                            key={reloadTrigger}
                                            gameId={selectedGame?.id}
                                            imageUrl={getImageUrl()}
                                            videoUrl={getVideoUrl()}
                                            onSelect={handleSelect}
                                            type="image"
                                            canSelect={false}
                                            showPlayIcon={false}
                                            readOnly={assetType === 'original' && selectedGame?.defaultImage }
                                            isSelected={false}
                                        />
                                    </Card>
                                    <Card title={t('edit.regenerate.dialog.cards.aiGeneratedVideo')} className='w-1/2 flex-col gap-3'>
                                        <MediaPlayer
                                            key={reloadTrigger}
                                            gameId={selectedGame?.id}
                                            imageUrl={getImageUrl()}
                                            videoUrl={getVideoUrl()}
                                            onSelect={handleSelect}
                                            type="video"
                                            canSelect={false}
                                            showPlayIcon={true}
                                            readOnly={false}
                                            isSelected={false}
                                        />
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                        <div className='relative flex justify-center items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>
                            <Card
                                title={selectedGame?.testImage || selectedGame?.testVideo ? t('edit.regenerate.dialog.cards.latestAssets') : t('edit.regenerate.dialog.cards.generateAssets')}
                                className='relative w-1/2 justify-center flex-col gap-3'
                            >
                                <MediaPlayer
                                    key={`${reloadTrigger}-${selectedGame?.testImage}-${selectedGame?.testVideo}`}
                                    gameId={selectedGame?.id}
                                    imageUrl={testImage || selectedGame?.testImage}
                                    videoUrl={testVideoUrl || selectedGame?.testVideo}
                                    onSelect={handleSelect}
                                    type={mediaPlayerType}
                                    canSelect={false}
                                    showPlayIcon={!testImage && !selectedGame?.testImage}
                                    readOnly={false}
                                    isSelected={false}
                                />
                                {(selectedGame?.testImage || selectedGame?.testVideo || testImage || testVideoUrl) && (
                                    <div className="mt-4 flex justify-between gap-2">
                                        <Button color="red" className="w-1/3" onClick={handleDeleteClick}>{t('Delete Last')}</Button>
                                        <Button color="green" className="w-1/3" onClick={handleAcceptTestAssets}>
                                            {t('Accept Last')}
                                        </Button>
                                        <Button onClick={handleArchiveAssets} color="green" className="w-1/3">
                                            {t('Archive')}
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button color={customPrompt ? 'green' : 'blue'} onClick={() => setShowDescribeChangesDialog(true)}>{t('Describe Changes')}</Button>
                        <Button
                            onClick={handleRegenerate}
                            disabled={isGenerating || !madeSelection}
                        >
                            {isGenerating && (
                                <Icon name="loader-2" size={16} className="mr-2 animate-spin" />
                            )}
                            {getButtonText()}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showDescribeChangesDialog} onClose={() => setShowDescribeChangesDialog(false) }>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <h1 className="text-2xl font-semibold">Describe Changes</h1>
                    </DialogHeader>

                    <div className="flex gap-6 mt-6">
                        {/* Media Player - maintains 220:280 aspect ratio */}
                        <div className="w-2/5 flex-shrink-0">
                            <div className="relative w-full" style={{ aspectRatio: '220/280' }}>
                                <MediaPlayer
                                    key={reloadTrigger2}
                                    gameId={selectedGame?.id}
                                    imageUrl={assetType !== 'original' ?( generateImage ? selectedGame?.defaultImage : selectedGame?.currentImage) : selectedGame?.defaultImage}
                                    videoUrl={assetType !== 'original' ?( generateVideo ? selectedGame?.defaultVideo : selectedGame?.currentVideo) : selectedGame?.defaultVideo}
                                    onSelect={handleSelect}
                                    type="image"
                                    canSelect={false}
                                    showPlayIcon={false}
                                    readOnly={assetType === 'original' ? true : false}
                                    isSelected={false}
                                />
                            </div>
                        </div>

                        {/* Textarea */}
                        <div className="flex-1 flex flex-col">
                            <label className="text-lg font-medium mb-2">
                                Description for the Ai
                            </label>
                            <Textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder={generateDescriptionPlaceholder()}
                                className="flex-1 resize-none min-h-[300px]"
                            />
                        </div>
                    </div>

                    {/* Generation Options */}
                    <div className="flex items-center gap-6 mt-6 p-4 bg-muted/50 rounded-lg justify-end">
                        <span className="text-lg font-medium text-muted-foreground">
                            Generate:
                        </span>
                       
                        <div className="flex items-center gap-2">
                            <Switch
                               disabled={assetType === 'original'}
                                name="generateImage"
                                value={generateImage}
                                onChange={(e) => setGenerateImage(e.target.value)}
                            />
                            <Label className="cursor-pointer">{t('Image')}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                name="generateVideo"
                                value={generateVideo}
                                onChange={(e) => setGenerateVideo(e.target.value)}
                            />
                            <Label className="cursor-pointer">{t('Video')}</Label>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowDescribeChangesDialog(false)}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button
                            disabled={!generateImage && !generateVideo}
                            onClick={() => {
                                setShowDescribeChangesDialog(false);
                                setMadeSelection(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {t('Continue')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showDeleteConfirmationDialog} onClose={() => setShowDeleteConfirmationDialog(false)}>
                <DialogContent>
                    <DialogHeader>
                        <h1>{t('Delete Test Assets')}</h1>
                    </DialogHeader>
                    <div className="py-4">
                        <p>{t('Are you sure you want to delete the test assets? This action cannot be undone.')}</p>
                    </div>
                    <DialogFooter>
                        <Button color="gray" onClick={() => setShowDeleteConfirmationDialog(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button color="red" onClick={handleDeleteTestAssets}>
                            {t('Delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showAcceptConfirmationDialog} onClose={() => setShowAcceptConfirmationDialog(false)}>
                <DialogContent>
                    <DialogHeader>
                        <h1>{t('Accept Test Assets')}</h1>
                    </DialogHeader>
                    <div className="py-4">
                        <p>
                            {assetType === 'original'
                                ? t('Accepting will replace animation for your default image. The image will not be changed.')
                                : assetType === 'current'
                                ? t('Accepting will replace both your current image and video with the test versions.')
                                : t('Are you sure you want to accept the test assets? This action cannot be undone.')
                            }
                        </p>
                    </div>
                    <DialogFooter>
                        <Button color="gray" onClick={() => setShowAcceptConfirmationDialog(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button color="green" onClick={confirmAcceptTestAssets}>
                            {t('Accept')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showArchiveConfirmationDialog} onClose={() => setShowArchiveConfirmationDialog(false)}>
                <DialogContent>
                    <DialogHeader>
                        <h1>{t('Archive Test Assets')}</h1>
                    </DialogHeader>
                    <div className="py-4">
                        <p>
                            {t('All test assets will be moved to the archive folder and deleted from the test directory. Archived files can be accessed later if needed. This will clear all test assets from this game.')}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button color="gray" onClick={() => setShowArchiveConfirmationDialog(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button 
                            color="orange" 
                            onClick={confirmArchiveTestAssets}
                            disabled={isArchiving}
                        >
                            {isArchiving && (
                                <Icon name="loader-2" size={16} className="mr-2 animate-spin" />
                            )}
                            {t('Archive')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export { GenerateAssets };