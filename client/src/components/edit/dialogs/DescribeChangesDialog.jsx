import { Dialog, DialogContent, DialogHeader, DialogFooter, Button, Textarea, Switch, Label } from 'components/lib';
import MediaPlayer from '../MediaPlayer';

const DescribeChangesDialog = ({
    isOpen,
    onClose,
    imagePrompt,
    setImagePrompt,
    videoPrompt,
    setVideoPrompt,
    generateImage,
    setGenerateImage,
    generateVideo,
    setGenerateVideo,
    selectedGame,
    assetType,
    setMadeSelection,
    t
}) => {
    const handleSelect = (videoUrl) => {
        console.log('Selected video:', videoUrl);
    };

    const getImageUrl = () => {
        if (assetType === 'original') {
            return selectedGame?.defaultImage;
        }

        if (!generateImage && !generateVideo) {
            return selectedGame?.defaultImage;
        }

        if (generateImage && !generateVideo) {
            setGenerateVideo(true);
        }
        
        // For non-original asset types, use default image if generating, otherwise current image
        return generateImage ? selectedGame?.defaultImage : selectedGame?.currentImage;
    };

    const getVideoUrl = () => {
        if (assetType === 'original') {
            return selectedGame?.defaultVideo;
        }
        
        // For non-original asset types, use default video if generating, otherwise current video
        return generateVideo ? selectedGame?.defaultVideo : selectedGame?.currentVideo;
    };

    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <h1 className="text-2xl font-semibold">Describe Changes</h1>
                </DialogHeader>

                <div className="flex gap-6 mt-6">
                    {/* Media Player - maintains 220:280 aspect ratio */}
                    <div className="w-2/5 flex-shrink-0">
                        <div className="relative w-full" style={{ aspectRatio: '220/280' }}>
                            <MediaPlayer
                                gameId={selectedGame?.id}
                                imageUrl={getImageUrl()}
                                videoUrl={getVideoUrl()}
                                onSelect={handleSelect}
                                type="image"
                                canSelect={false}
                                showPlayIcon={false}
                                readOnly={assetType === 'original' ? true : false}
                                isSelected={false}
                            />
                        </div>
                    </div>

                    {/* Conditional Textareas */}
                    <div className="flex-1 flex flex-col gap-4">
                        {generateImage && !(assetType === 'original') && (
                            <div className="flex flex-col">
                                <label className="text-lg font-medium mb-2">
                                    Image Description
                                </label>
                                <Textarea
                                    value={imagePrompt}
                                    onChange={(e) => setImagePrompt(e.target.value)}
                                    placeholder={t('edit.regenerate.dialog.placeholders.aiGeneratedImagePrompt')}
                                    className="flex-1 resize-none min-h-[140px]"
                                />
                            </div>
                        )}
                        
                        {generateVideo && (
                            <div className="flex flex-col">
                                <label className="text-lg font-medium mb-2">
                                    Video Description
                                </label>
                                <Textarea
                                    value={videoPrompt}
                                    onChange={(e) => setVideoPrompt(e.target.value)}
                                    placeholder={assetType === 'original' 
                                        ? t('edit.regenerate.dialog.placeholders.originalImagePrompt')
                                        : t('edit.regenerate.dialog.placeholders.aiGeneratedImagePrompt')
                                    }
                                    className="flex-1 resize-none min-h-[140px]"
                                />
                            </div>
                        )}
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
                        onClick={() => {
                            onClose();
                            setMadeSelection(false);
                            setGenerateImage(false);
                            setGenerateVideo(false);
                            setImagePrompt('');
                            setVideoPrompt('');
                        }}
                    >
                        {t('Cancel')}
                    </Button>
                    <Button
                        disabled={!generateImage && !generateVideo}
                        onClick={() => {
                            onClose();
                            setMadeSelection(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {t('Continue')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { DescribeChangesDialog };
