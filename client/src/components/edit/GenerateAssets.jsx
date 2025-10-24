import { Dialog, DialogContent, DialogHeader, Tabs, TabsList, TabsTrigger, TabsContent, Card, Button, Icon, Textarea } from 'components/lib';
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
}) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [showDescribeChangesDialog, setShowDescribeChangesDialog] = useState(false);
    const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState(false);
    const [testImage, setTestImage] = useState(null);
    const [testVideoUrl, setTestVideoUrl] = useState(null);
    const [reloadTrigger, setReloadTrigger] = useState(0);
    const [showAcceptConfirmationDialog, setShowAcceptConfirmationDialog] = useState(false);

    const viewContext = useContext(ViewContext);

    const { t } = useTranslation();
    const generateAssetsMutation = useMutation('/api/ai/process', 'POST');
    const deleteTestAssetsMutation = useMutation(`/api/game/${selectedGame?.id}/test-assets`, 'DELETE');
    const acceptTestAssetsMutation = useMutation(`/api/game/${selectedGame?.id}/test-assets/accept`, 'POST');


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
            imageUrl: selectedGame?.defaultImage,
            assetType: assetType,
            prompt: customPrompt,
            theme: selectedGame?.theme
        };

        try {
            
      
            const result = await generateAssetsMutation.execute(payload);
      
            if (result) {
                if (result.data.assetType === 'original') {
                    console.log('Result:', result.data);
                    setTestVideoUrl(result.data.url);
                    setReloadTrigger(reloadTrigger + 1);
                } else {
                    return
                }

            console.log('Result:', result.data);
      
              viewContext.notification({
                description: t('edit.regenerate.dialog.success'),
                variant: 'success'
              });
              setCustomPrompt('');
            }
          } catch (err) {
            console.error('Error generating assets:', err);
            setCustomPrompt('');
          } finally {
            setIsGenerating(false);
          }
    }, [selectedGame, assetType, customPrompt, viewContext, t, generateAssetsMutation]);

    const handleDeleteTestAssets = useCallback(async () => {
        try {
            await deleteTestAssetsMutation.execute();
            
            // Clear local state
            setTestVideoUrl(null);
            setTestImage(null);
            
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
    }, [deleteTestAssetsMutation, reloadTrigger, viewContext, t]);

    const handleAcceptTestAssets = useCallback(async () => {
        setShowAcceptConfirmationDialog(true);
    }, []);

    const confirmAcceptTestAssets = useCallback(async () => {
        try {
            await acceptTestAssetsMutation.execute();
            
            // Clear local state
            setTestVideoUrl(null);
            setTestImage(null);
            
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
    }, [acceptTestAssetsMutation, reloadTrigger, viewContext, t]);

    const handleDeleteClick = useCallback(() => {
        setShowDeleteConfirmationDialog(true);
    }, []);

    const getTestVideoUrl = useCallback(() => {
        if (testVideoUrl) {
            return testVideoUrl;
        }
        return selectedGame?.testVideo;
    },[testVideoUrl, selectedGame?.testVideo])

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
                                            imageUrl={selectedGame?.defaultImage}
                                            videoUrl={selectedGame?.defaultVideo}
                                            onSelect={handleSelect}
                                            type="image"
                                            canSelect={false}
                                            showPlayIcon={false}
                                            readOnly={assetType === 'original' && selectedGame?.defaultImage}
                                            isSelected={false}
                                        />
                                    </Card>
                                    <Card title={t('edit.regenerate.dialog.cards.aiGeneratedVideo')} className='w-1/2 flex-col gap-3'>
                                        <MediaPlayer
                                            key={reloadTrigger}
                                            gameId={selectedGame?.id}
                                            imageUrl={selectedGame?.defaultImage}
                                            videoUrl={selectedGame?.defaultVideo}
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
                                    key={reloadTrigger}
                                    gameId={selectedGame?.id}
                                    imageUrl={selectedGame?.testImage}
                                    videoUrl={getTestVideoUrl()}
                                    onSelect={handleSelect}
                                    type={mediaPlayerType}
                                    canSelect={false}
                                    showPlayIcon={!testImage || !selectedGame?.testImage}
                                    readOnly={false}
                                    isSelected={false}
                                />
                                {(selectedGame?.testImage || selectedGame?.testVideo || testImage || testVideoUrl) && (
                                    <div className="mt-4 flex justify-between gap-2">
                                        <Button color="red" className="w-1/2" onClick={handleDeleteClick}>{t('Delete Last')}</Button>
                                        <Button color="green" className="w-1/2" onClick={handleAcceptTestAssets}>
                                            {t('Accept Last')}
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
                            disabled={isGenerating}
                        >
                            {isGenerating && (
                                <Icon name="loader-2" size={16} className="mr-2 animate-spin" />
                            )}
                            {getButtonText()}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showDescribeChangesDialog} onClose={() => setShowDescribeChangesDialog(false)}>
                <DialogContent >
                    <DialogHeader>
                        <h1>Describe Changes</h1>
                    </DialogHeader>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <MediaPlayer
                                gameId={selectedGame?.id}
                                imageUrl={selectedGame?.defaultImage}
                                videoUrl={selectedGame?.defaultVideo}
                                onSelect={handleSelect}
                                type="image"
                                canSelect={false}
                                showPlayIcon={false}
                                readOnly={false}
                                isSelected={false}
                            />
                        </div>
                        <div className="flex-1 ">
                            <Textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder={t('Describe the reference image changes you want to make to the assets you are generating.')}
                                className="h-full w-[200px] resize-none"
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button color="green" onClick={() => setShowDescribeChangesDialog(false)}>{t('Continue')}</Button>
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
        </div>
    );
};

export { GenerateAssets };