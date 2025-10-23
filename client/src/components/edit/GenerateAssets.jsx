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
    const [testImage, setTestImage] = useState(null);
    const [testVideo, setTestVideo] = useState(null);
    
    const viewContext = useContext(ViewContext);

    const { t } = useTranslation();
    const generateAssetsMutation = useMutation('/api/ai/process', 'POST');


    const handleSelect = (videoUrl) => {
        console.log('Selected video:', videoUrl);
    };

    const mediaPlayerType = useMemo(() => {
        const hasImage = selectedGame?.testImage;
        const hasVideo = selectedGame?.testVideo;
        if (hasImage && hasVideo) return 'both';
        if (hasImage) return 'image';
        if (hasVideo) return 'video';
        return 'both';
    }, [selectedGame]);

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
            //   setGeneratedAssets({
            //     testImage: generateImage ? result[0].testImage : null,
            //     testVideo: generateVideo ? result[0].testVideo : null
            //   });

            console.log('Result:', result);
      
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
                                        title={assetType === 'default' ? t('edit.regenerate.dialog.cards.originalImage') : t('edit.regenerate.dialog.cards.aiGeneratedImage')}
                                        className='w-1/2 flex-col gap-3'
                                    >
                                        <MediaPlayer
                                            gameId={selectedGame?.id}
                                            imageUrl={selectedGame?.currentImage}
                                            videoUrl={selectedGame?.currentVideo}
                                            onSelect={handleSelect}
                                            type="image"
                                            canSelect={false}
                                            showPlayIcon={false}
                                            readOnly={false}
                                            isSelected={false}
                                        />
                                    </Card>
                                    <Card title={t('edit.regenerate.dialog.cards.aiGeneratedVideo')} className='w-1/2 flex-col gap-3'>
                                        <MediaPlayer
                                            gameId={selectedGame?.id}
                                            imageUrl={selectedGame?.currentImage}
                                            videoUrl={selectedGame?.currentVideo}
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
                                    gameId={selectedGame?.id}
                                    imageUrl={selectedGame?.testImage}
                                    videoUrl={selectedGame?.testVideo}
                                    onSelect={handleSelect}
                                    type={mediaPlayerType}
                                    canSelect={false}
                                    showPlayIcon={false}
                                    readOnly={false}
                                    isSelected={false}
                                />
                                 {selectedGame?.testImage || selectedGame?.testVideo && (
                            <div className="mt-4 flex justify-between gap-2">
                            <Button color="red" className="w-1/2" onClick={onClose}>{t('Delete Last')}</Button>
                            <Button color="green" className="w-1/2"  onClick={onClose}>
                                {t('Accept Last')}
                            </Button>
                            </div>
                            
                        )}

                            </Card>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button color="blue" onClick={() => setShowDescribeChangesDialog(true)}>{t('Describe Changes')}</Button>
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
        </div>
    );
};

export { GenerateAssets };