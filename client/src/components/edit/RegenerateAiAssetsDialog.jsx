/***
*
*   REGENERATE AI ASSETS DIALOG
*   Dialog for regenerating AI assets with custom prompts
*
**********/

import { useState, useCallback, useContext, useMemo, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader,
  Button, Textarea, Icon, Badge,
  ThemeSelect, Card, Tabs, TabsList, TabsTrigger, TabsContent, Label
} from 'components/lib';
import { ViewContext } from 'components/lib';
import { useMutation } from 'components/hooks/mutation';
import { Tooltip } from 'components/tooltip/tooltip';
import AiPreview from './AiPreview';
import MediaPlayer from './MediaPlayer';
import { DialogFooter } from 'components/dialog/dialog';
import PromptInput from './PromptInput';


export function RegenerateAiAssetsDialog({
  isOpen,
  onClose,
  selectedGame,
  assetType, // 'current' or 'theme'
  onGameUpdate, // callback to trigger game refetch
  t
}) {
  const viewContext = useContext(ViewContext);
  const generateAssetsMutation = useMutation('/api/ai/process', 'POST');
  const updateGameMutation = useMutation('/api/game', 'PATCH');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState(null);
  const [error, setError] = useState(null);

  // Prompt state
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  
  // Selection state
  const [selectedTheme, setSelectedTheme] = useState(selectedGame?.theme || 'default');
  const [generateImage, setGenerateImage] = useState(false);
  const [generateVideo, setGenerateVideo] = useState(false);
  const [imageSelected, setImageSelected] = useState(false);
  const [videoSelected, setVideoSelected] = useState(false);

  // Compute current assets based on asset type
  const currentAssets = useMemo(() => {
    switch (assetType) {
      case 'current':
        return {
          image: selectedGame?.currentImage,
          video: selectedGame?.currentVideo
        };
      case 'theme':
        return {
          image: selectedGame?.themeImage,
          video: selectedGame?.themeVideo
        };
      case 'original':
        return {
          image: selectedGame?.defaultImage,
          video: selectedGame?.defaultVideo
        };
      default:
        return { image: null, video: null };
    }
  }, [selectedGame, assetType]);

  // Determine displayed assets (prioritize generated, fallback to test, then default)
  const displayedAssets = useMemo(() => {
    return {
      image: generatedAssets?.testImage || selectedGame?.testImage || '',
      video: generatedAssets?.testVideo || selectedGame?.testVideo || ''
    };
  }, [generatedAssets, selectedGame]);

  // Determine media player type based on available assets
  const mediaPlayerType = useMemo(() => {
    const hasImage = displayedAssets.image;
    const hasVideo = displayedAssets.video;
    
    // When both exist, prioritize image
    if (hasImage && hasVideo) return 'both';
    if (hasImage) return 'image';
    if (hasVideo) return 'video';
    return 'both';
  }, [displayedAssets]);

  // Check if we have any generated or test assets
  const hasTestAssets = useMemo(() => {
    return Boolean(
      generatedAssets || 
      selectedGame?.testImage || 
      selectedGame?.testVideo
    );
  }, [generatedAssets, selectedGame]);

  // Handle media selection
  const handleSelect = useCallback((gameId, newSelected, type) => {
    if (type === 'image') {
      setImageSelected(newSelected);
      setGenerateImage(newSelected);
    } else if (type === 'video') {
      setVideoSelected(newSelected);
      setGenerateVideo(newSelected);
    }
  }, []);

  // Clear prompts
  const clearPrompts = useCallback(() => {
    setImagePrompt('');
    setVideoPrompt('');
    setError(null);
  }, []);

  // Validate generation request
  const validateGeneration = useCallback(() => {
    if (!generateImage && !generateVideo) {
      return { valid: false, error: null };
    }

    if (assetType === 'original') {
      return { valid: true, error: null };
    }

    if (generateImage && !imagePrompt?.trim()) {
      return { valid: false, error: 'Please enter an image prompt before generating' };
    }

    if (generateVideo && !videoPrompt?.trim()) {
      return { valid: false, error: 'Please enter a video prompt before generating' };
    }

    return { valid: true, error: null };
  }, [generateImage, generateVideo, imagePrompt, videoPrompt, assetType]);

  // Handle regeneration
  const handleRegenerate = async () => {
    const validation = validateGeneration();
    
    if (!validation.valid) {
      if (validation.error) setError(validation.error);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const payload = {
        gameId: selectedGame?.id,
        assetType: assetType,
        generateVideo: generateVideo,
        generateImage: generateImage,
        imagePrompt: imagePrompt?.trim() || null,
        videoPrompt: videoPrompt?.trim() || null,
        theme: selectedTheme || "default"
      };

      console.log('Sending payload to n8n:', payload);
      const result = await generateAssetsMutation.execute(payload);

      if (result) {
        setGeneratedAssets({
          testImage: generateImage ? result[0].testImage : null,
          testVideo: generateVideo ? result[0].testVideo : null
        });

        viewContext.notification({
          description: t('edit.regenerate.dialog.success'),
          variant: 'success'
        });
      }
    } catch (err) {
      console.error('Error generating assets:', err);
      setError(err.message || 'Failed to generate assets');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle accepting new assets
  const handleAcceptAssets = useCallback(async () => {
    if (!selectedGame || !hasTestAssets) return;

    try {
      // Determine which fields to update based on assetType
      const updateData = {};

      if (assetType === 'original') {
        updateData.defaultVideo = generatedAssets?.testVideo || selectedGame?.testVideo;
      }
      
      if (assetType === 'current') {
        // Move test assets to current assets
        if (displayedAssets.image) updateData.currentImage = displayedAssets.image;
        if (displayedAssets.video) updateData.currentVideo = displayedAssets.video;
      } else if (assetType === 'theme') {
        // Move test assets to theme assets
        if (displayedAssets.image) updateData.themeImage = displayedAssets.image;
        if (displayedAssets.video) updateData.themeVideo = displayedAssets.video;
      }
      
      // Clear test assets after moving them
      updateData.testImage = null;
      updateData.testVideo = null;

      // Update the game in the database
      const result = await updateGameMutation.execute(updateData, `/api/game/${selectedGame.id}`);
      
      if (result) {
        // Show success notification
        viewContext.notification({
          description: t('edit.accept.success'),
          variant: 'success'
        });
        
        // Trigger game refetch in parent
        if (onGameUpdate) {
          onGameUpdate();
        }
        
        // Close the dialog
        onClose();
      }
    } catch (err) {
      console.error('Error accepting assets:', err);
      viewContext.notification({
        description: t('edit.accept.error'),
        variant: 'error'
      });
    }
  }, [selectedGame, hasTestAssets, assetType, displayedAssets, updateGameMutation, viewContext, t, onGameUpdate, onClose]);

  // Get button text based on selection
  const getButtonText = useCallback(() => {
    if (isGenerating) return t('edit.regenerate.dialog.generating');
    if (generateImage && generateVideo) return t('edit.regenerate.dialog.buttons.regenerateImageVideo');
    if (generateImage) return t('edit.regenerate.dialog.buttons.regenerateAiImage');
    if (generateVideo) return t('edit.regenerate.dialog.buttons.regenerateAiVideo');
    return t('edit.regenerate.dialog.buttons.makeSelection');
  }, [isGenerating, generateImage, generateVideo, t]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setGeneratedAssets(null);
      setImageSelected(false);
      setVideoSelected(false);
      setGenerateImage(false);
      setGenerateVideo(false);
      setError(null);
    }
  }, [isOpen]);

  console.log(selectedGame);
  console.log(generatedAssets);
  console.log(assetType);
  console.log('------------------------------')

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="!w-[80vw] !max-w-none">
        <DialogHeader>
          <div className="flex items-center justify-between">
            {/* Header content */}
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className='grid grid-cols-2 gap-3'>
          {/* Left Panel - Original and Selected Assets */}
          <Tabs defaultValue="video">
            <TabsList>
              <TabsTrigger value="image">{t('edit.regenerate.dialog.tabs.original')}</TabsTrigger>
              <TabsTrigger value="video">{t('edit.regenerate.dialog.tabs.selectedForEdit')}</TabsTrigger>
            </TabsList>

            {/* Original Assets Tab */}
            <TabsContent value="image">
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
                    isSelected={imageSelected}
                  />
                </Card>
              </div>
            </TabsContent>

            {/* Selected for Edit Tab */}
            <TabsContent value="video">
              <div className='flex flex-row gap-3 bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>
                {/* Image Section */}
                <Card 
                  title={assetType === 'original' ? t('edit.regenerate.dialog.cards.originalImage') : t('edit.regenerate.dialog.cards.aiGeneratedImage')} 
                  className='w-1/2 flex-col gap-3'
                >
                  <MediaPlayer
                    gameId={selectedGame?.id}
                    imageUrl={currentAssets.image}
                    videoUrl={currentAssets.video}
                    onSelect={handleSelect}
                    type="image"
                    canSelect={assetType !== 'original'}
                    showPlayIcon={false}
                    readOnly={assetType === 'original'}
                    isSelected={imageSelected}
                  />

                  {assetType !== 'original' && (
                    <PromptInput
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder={t('edit.regenerate.dialog.placeholders.imagePrompt')}
                      className="w-full mt-4 bg-slate-100 dark:bg-slate-800 rounded-lg p-3"
                      t={t}
                    />
                  )}
                </Card>

                {/* Video Section */}
                <Card title={t('edit.regenerate.dialog.cards.aiGeneratedVideo')} className='w-1/2 flex-col gap-3'>
                  <MediaPlayer
                    gameId={selectedGame?.id}
                    imageUrl={currentAssets.image}
                    videoUrl={currentAssets.video}
                    onSelect={handleSelect}
                    type="video"
                    canSelect={true}
                    showPlayIcon={true}
                    readOnly={false}
                    isSelected={videoSelected}
                  />
                  
                  {assetType !== 'original' && (
                    <PromptInput
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder={t('edit.regenerate.dialog.placeholders.videoPrompt')}
                      className="w-full mt-4 bg-slate-100 dark:bg-slate-800 rounded-lg p-3"
                      t={t}
                    />
                  )}
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Right Panel - Generated Assets Preview */}
          <div className='relative flex justify-center items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-3 text-center'>
            {/* Generation Badges */}
            {generateImage && (
              <div className='absolute top-5 right-3 bg-gradient-to-br from-blue-500 to-purple-600 scale-100 shadow-lg text-white text-sm font-semibold px-2 py-1 rounded-full'>
                {t('edit.regenerate.dialog.badges.generateImage')}
              </div>
            )}

            {generateVideo && (
              <div className={`absolute ${generateImage ? 'top-14' : 'top-5'} right-3 bg-gradient-to-br from-blue-500 to-purple-600 scale-100 shadow-lg text-white text-sm font-semibold px-2 py-1 rounded-full`}>
                {t('edit.regenerate.dialog.badges.generateVideo')}
              </div>
            )}

            <Card
              title={hasTestAssets ? t('edit.regenerate.dialog.cards.latestAssets') : t('edit.regenerate.dialog.cards.generateAssets')}
              className='relative w-1/2 justify-center flex-col gap-3'
            >
              <div className="absolute z-10 top-0 right-0">
                <Tooltip title={t('edit.regenerate.dialog.tooltips.clearPrompts')} />
              </div>
              
              <MediaPlayer
                gameId={selectedGame?.id}
                imageUrl={displayedAssets.image}
                videoUrl={displayedAssets.video}
                onSelect={handleSelect}
                type={mediaPlayerType}
                canSelect={false}
                showPlayIcon={true}
                readOnly={false}
                isSelected={imageSelected || videoSelected}
              />

              {generatedAssets && (
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                  {t('edit.regenerate.dialog.messages.assetsGeneratedSuccessfully')}
                </div>
              )}
            </Card>
          </div>
        </div>

        <DialogFooter>
          {hasTestAssets && (
            <div className="flex gap-2">
              <Button color="green" onClick={handleAcceptAssets}>
                {t('edit.regenerate.dialog.buttons.acceptNewAssets')}
              </Button>
            </div>
          )}

          <Button
            onClick={handleRegenerate}
            disabled={isGenerating || (!generateImage && !generateVideo)}
          >
            {isGenerating && (
              <Icon name="loader-2" size={16} className="mr-2 animate-spin" />
            )}
            {getButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}