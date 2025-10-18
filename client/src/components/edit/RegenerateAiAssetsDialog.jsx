/***
*
*   REGENERATE AI ASSETS DIALOG
*   Dialog for regenerating AI assets with custom prompts
*
**********/

import { useState, useCallback, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, 
         Button, Textarea, Icon, Badge, 
         ThemeSelect} from 'components/lib';
import { ViewContext } from 'components/lib';

export function RegenerateAiAssetsDialog({ 
  isOpen, 
  onClose, 
  selectedGame, 
  assetType, // 'current' or 'theme'
  t 
}) {
  const viewContext = useContext(ViewContext);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [currentImagePrompt, setCurrentImagePrompt] = useState('');
  const [currentVideoPrompt, setCurrentVideoPrompt] = useState('');
  const [generatedAssets, setGeneratedAssets] = useState(null);
  const [hoveredAsset, setHoveredAsset] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(selectedGame?.theme || 'default');


  console.log('RegenerateAiAssetsDialog', { selectedGame});


  const handleOpenChange = useCallback((open) => {
    if (!open) {
      setImagePrompt('');
      setVideoPrompt('');
      setCurrentImagePrompt('');
      setCurrentVideoPrompt('');
      setGeneratedAssets(null);
      setHoveredAsset(null);
    } else {
      // Initialize current prompts when dialog opens
      setCurrentImagePrompt(selectedGame?.[`${assetType}ImagePrompt`] || '');
      setCurrentVideoPrompt(selectedGame?.[`${assetType}VideoPrompt`] || '');
    }
    onClose(open);
  }, [onClose, selectedGame, assetType]);


  const generateAssets = useCallback(async () => {
    if (!selectedGame) {
      viewContext.notification({
        description: t('edit.regenerate.noGame'),
        variant: 'error'
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Log generation request to console as requested
      console.log('Generating AI assets:', {
        gameId: selectedGame.id,
        assetType,
        imagePrompt: imagePrompt || 'Default image prompt',
        videoPrompt: videoPrompt || 'Default video prompt'
      });

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock generated assets with proper dimensions
      const mockAssets = {
        image: 'https://via.placeholder.com/180x280/8B5CF6/FFFFFF?text=Generated+Image',
        video: 'https://via.placeholder.com/180x280/8B5CF6/FFFFFF?text=Generated+Video'
      };
      
      setGeneratedAssets(mockAssets);
      
      viewContext.notification({
        description: t('edit.regenerate.dialog.success'),
        variant: 'success'
      });
    } catch (error) {
      console.error('Error generating assets:', error);
      viewContext.notification({
        description: t('edit.regenerate.dialog.error'),
        variant: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedGame, assetType, imagePrompt, videoPrompt, t, viewContext]);

  const acceptAssets = useCallback(async () => {
    if (!generatedAssets || !selectedGame) return;

    try {
      // Log acceptance to console as requested
      console.log('Accepting generated assets:', {
        gameId: selectedGame.id,
        assetType,
        assets: generatedAssets
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      viewContext.notification({
        description: t('edit.regenerate.dialog.acceptResult.success'),
        variant: 'success'
      });
      
      handleOpenChange(false);
    } catch (error) {
      console.error('Error accepting assets:', error);
      viewContext.notification({
        description: t('edit.regenerate.dialog.acceptResult.error'),
        variant: 'error'
      });
    }
  }, [generatedAssets, selectedGame, assetType, t, viewContext, handleOpenChange]);


  const deleteAssets = useCallback(() => {
    setGeneratedAssets(null);
    viewContext.notification({
      description: t('edit.regenerate.dialog.deleteResult.success'),
      variant: 'success'
    });
  }, [t, viewContext]);

  const getAssetTypeTitle = () => {
    return assetType === 'current' ? t('edit.current.title') : t('edit.theme.title');
  };

  const getAssetTypeColor = () => {
    return assetType === 'current' ? 'purple' : 'orange';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="!w-[80vw] !max-w-none">
        <DialogHeader>
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <DialogTitle>{t('edit.regenerate.dialog.title', { assetType: getAssetTypeTitle() })}</DialogTitle>
                    <DialogDescription>{t('edit.regenerate.dialog.description')}</DialogDescription>
                    
                </div>
                <div className="flex items-center mr-6 w-1/6">
                <ThemeSelect
                        value={selectedTheme || selectedGame?.theme}
                        onChange={(e) => setSelectedTheme(e.target.value)}
                    />
                </div>
            </div>
        
        </DialogHeader>

        

        <div className="space-y-6">

          <div className="grid grid-cols-2 gap-6">
 
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t('edit.regenerate.dialog.currentAssets')}
                </h3>
 
                <div className="grid grid-cols-3 gap-3">
                  {/* Default Asset */}
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                      {t('edit.original.image')}
                    </div>
                    {selectedGame?.defaultImage ? (
                      <img
                        src={selectedGame.defaultImage}
                        alt="Default Image"
                        className="w-full aspect-[180/280] object-cover rounded mb-3 mx-auto"
                      />
                    ) : (
                      <div className="text-xs text-slate-600 dark:text-slate-400 py-6">
                        {t('edit.original.defaultImage')}
                      </div>
                    )}
                    <div className="mt-2">
                      <div className="text-xs text-slate-500 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-700 rounded">
                        {t('edit.original.referenceAsset')}
                      </div>
                    </div>
                  </div>

                  {/* Current Image */}
                  <div className={`bg-${getAssetTypeColor()}-100 dark:bg-${getAssetTypeColor()}-900 rounded-lg p-3 text-center`}>
                    <div className={`text-xs font-bold text-${getAssetTypeColor()}-800 dark:text-${getAssetTypeColor()}-200 mb-2`}>
                      {assetType === 'current' ? t('edit.current.image') : t('edit.theme.image')}
                    </div>
                    {selectedGame?.[`${assetType}Image`] ? (
                      <img
                        src={selectedGame[`${assetType}Image`]}
                        alt={`${assetType} Image`}
                        className="w-full aspect-[180/280] object-cover rounded mb-3 mx-auto"
                      />
                    ) : (
                      <div className={`text-xs text-${getAssetTypeColor()}-600 dark:text-${getAssetTypeColor()}-400 py-6`}>
                        {assetType === 'current' ? t('edit.current.aiImage') : t('edit.theme.themeImage')}
                      </div>
                    )}
                    <div className="mt-2">
                      <Textarea
                        name={`${assetType}ImagePrompt`}
                        value={currentImagePrompt}
                        onChange={(e) => setCurrentImagePrompt(e.target.value)}
                        placeholder="Enter image prompt..."
                        className="min-h-[60px] text-xs"
                      />
                    </div>
                  </div>
                  
                  {/* Current Video */}
                  <div className={`bg-${getAssetTypeColor()}-100 dark:bg-${getAssetTypeColor()}-900 rounded-lg p-3 text-center`}>
                    <div className={`text-xs font-bold text-${getAssetTypeColor()}-800 dark:text-${getAssetTypeColor()}-200 mb-2`}>
                      {assetType === 'current' ? t('edit.current.video') : t('edit.theme.video')}
                    </div>
                    {selectedGame?.[`${assetType}Video`] ? (
                      <video
                        src={selectedGame[`${assetType}Video`]}
                        className="w-full aspect-[180/280] object-cover rounded mb-3 mx-auto"
                        controls={true}
                      />
                    ) : (
                      <div className={`text-xs text-${getAssetTypeColor()}-600 dark:text-${getAssetTypeColor()}-400 py-6`}>
                        {assetType === 'current' ? t('edit.current.aiVideo') : t('edit.theme.themeVideo')}
                      </div>
                    )}
                    <div className="mt-2">
                      <Textarea
                        name={`${assetType}VideoPrompt`}
                        value={currentVideoPrompt}
                        onChange={(e) => setCurrentVideoPrompt(e.target.value)}
                        placeholder="Enter video prompt..."
                        className="min-h-[60px] text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

            {/* Right Side - Generated Assets */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {generatedAssets ? t('edit.regenerate.dialog.generatedAssets') : t('edit.regenerate.dialog.noAssetsGenerated')}
              </h3>
              
              {!generatedAssets ? (
                /* Instructions with SVG */
                <div className="space-y-4">
                  <div className="text-center text-slate-600 dark:text-slate-400">
                    <p className="text-sm mb-4">{t('edit.regenerate.dialog.noAssetsGeneratedDescription')}</p>
                  </div>
                  
                  {/* Simple Icon Placeholder */}
                  <div className="flex justify-center items-center py-12">
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                      <Icon name="sparkles" className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>
                </div>
              ) : (
               
                <div className="space-y-4">
            
                  <div className="grid grid-cols-2 gap-3">
                    
                    <div 
                      className="bg-green-100 dark:bg-green-900 rounded-lg p-3 text-center relative"
                      onMouseEnter={() => setHoveredAsset('image')}
                      onMouseLeave={() => setHoveredAsset(null)}
                    >
                      <div className="text-xs font-bold text-green-800 dark:text-green-200 mb-2">
                        {t('edit.regenerate.dialog.generatedImage')}
                      </div>
                      <div className="relative">
                        <img
                          src={generatedAssets.image}
                          alt="Generated Image"
                          className="w-full  aspect-[180/280] object-cover rounded mb-2 mx-auto"
                        />
                        {hoveredAsset === 'image' && generatedAssets.video && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                            <video
                              src={generatedAssets.video}
                              className="w-full aspect-[180/280] object-cover rounded mx-auto"
                              autoPlay
                              muted
                              loop
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
              
                    <div className="bg-green-100 dark:bg-green-900 rounded-lg p-3 text-center">
                      <div className="text-xs font-bold text-green-800 dark:text-green-200 mb-2">
                        {t('edit.regenerate.dialog.generatedVideo')}
                      </div>
                      <video
                        src={generatedAssets.video}
                        className="w-full max-w-[150px] aspect-[180/280] object-cover rounded mb-2 mx-auto"
                        controls={true}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          {!generatedAssets ? (
            <Button
              onClick={generateAssets}
              disabled={isGenerating || !selectedGame}
              className="flex w-1/4"
              color="blue"
            >
              {isGenerating ? (
                <>
                  <Icon name="loader-2" className="w-4 h-4 mr-2 animate-spin" />
                  {t('edit.regenerate.dialog.generating')}
                </>
              ) : (
                <>
                  <Icon name="refresh-cw" className="w-4 h-4 mr-2" />
                  {t('edit.regenerate.dialog.generate', { theme: selectedTheme.toUpperCase() || selectedGame?.theme.toUpperCase() })}
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={acceptAssets}
                className="flex w-1/4"
                color="green"
              >
                <Icon name="check" className="w-4 h-4 mr-2" />
                {t('edit.regenerate.dialog.accept')}
              </Button>
              <Button
                onClick={deleteAssets}
                className="flex w-1/4"
                color="red"
              >
                <Icon name="trash-2" className="w-4 h-4 mr-2" />
                {t('edit.regenerate.dialog.delete')}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
