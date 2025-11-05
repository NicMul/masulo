/***
*
*   AB TEST ASSET CREATOR
*   Component for creating variant assets (A and B) for AB testing
*   Takes a selectedGame prop and displays two tabs with MediaPlayer components
*
**********/

import { Tabs, TabsList, TabsTrigger, TabsContent, Grid, Card, Textarea, Button } from 'components/lib';
import MediaPlayer from '../edit/MediaPlayer';
import { Animate } from 'components/lib';
import { useEffect, useState, useCallback } from 'react';

// Reusable Asset Card Component for Original Assets
function AssetCard({ title, assetType, imageUrl, videoUrl, gameId, selectedVariant, onVariantSelect, assetsStatus }) {
    // Check if any assets are available
    const hasAssets = !!(imageUrl || videoUrl);
    
    return (
        <Animate type='pop'>
            <Card 
                className={`relative ${selectedVariant.variant && selectedVariant.assetType === assetType ? 'bg-green-100 border-green-500' : ''}`} 
                title={title} 
                headerAction={assetsStatus(imageUrl, videoUrl)}
            >
                {/* No Assets Overlay */}
                {!hasAssets && (
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                        <div className="text-white bg-orange-400 px-4 border border-orange-500 py-1 rounded-full text-lg">{!gameId ? 'No Game Selected' : 'No Assets'}</div>
                    </div>
                )}
                
                <div className="w-full max-w-[220px] mx-auto">
                    <MediaPlayer
                        gameId={gameId}
                        imageUrl={imageUrl}
                        videoUrl={videoUrl}
                        type="both"
                        readOnly={false}
                        canSelect={false}
                        showPlayIcon={true}
                    />
                </div>
                <div className="flex flex-row gap-2 justify-end">
                    <Button 
                        disabled={!hasAssets}
                        className={`w-full mt-4 ${
                            !hasAssets 
                                ? 'opacity-50 cursor-not-allowed' 
                                : selectedVariant.variant === 'variantA' && selectedVariant.assetType === assetType 
                                    ? '!bg-green-600' 
                                    : 'bg-gray-400'
                        }`} 
                        onClick={() => hasAssets && onVariantSelect({ variant: 'variantA', assetType })}
                    >
                        Set A
                    </Button>
                    <Button 
                        disabled={!hasAssets}
                        className={`w-full mt-4 ${
                            !hasAssets 
                                ? 'opacity-50 cursor-not-allowed' 
                                : selectedVariant.variant === 'variantB' && selectedVariant.assetType === assetType 
                                    ? '!bg-green-600' 
                                    : 'bg-gray-400'
                        }`} 
                        onClick={() => hasAssets && onVariantSelect({ variant: 'variantB', assetType })}
                    >
                        Set B
                    </Button>
                </div>
            </Card>
        </Animate>
    );
}

// Reusable Variant Media Card Component for Variant A/B
function VariantMediaCard({ title, gameId, imageUrl, videoUrl, descriptionName, placeholder, onDelete, onGenerate, type, pill }) {
    return (
        <Animate type='pop'>
            <Card title={title} headerAction={pill}>
                <div className="w-full max-w-[220px] mx-auto">
                    <MediaPlayer
                        gameId={gameId}
                        imageUrl={imageUrl}
                        videoUrl={videoUrl}
                        type={type}
                        readOnly={false}
                        canSelect={false}
                        showPlayIcon={true}
                    />
                </div>
                <Textarea 
                    name={descriptionName} 
                    placeholder={placeholder} 
                    className="w-full mt-8" 
                />
                <div className="flex flex-row gap-2 justify-end">
                    <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={onDelete}
                    >
                        Delete
                    </Button>
                    <Button 
                        color="blue" 
                        className="w-full mt-4"
                        onClick={onGenerate}
                    >
                        Ai Generate
                    </Button>
                </div>
            </Card>
        </Animate>
    );
}
export function ABTestAssetCreator({ selectedGame, onVariantAChange }) {
    const [selectedVariant, setSelectedVariant] = useState({
        variant: null,
        assetType: null
    
    });

    const [masterVariantA, setMasterVariantA] = useState({
        image: null,
        video: null,
        gameId: null
    });
    const [masterVariantB, setMasterVariantB] = useState({
        image: null,
        video: null,
        gameId: null
    });

    const handleClear = () => {
        setMasterVariantA({
            image: null,
            video: null,
            gameId: null
        });
        setMasterVariantB({
            image: null,
            video: null,
            gameId: null
        });

        setSelectedVariant({
            variant: null,
            assetType: null
        });
    };

    // Reset selections when selectedGame changes
    useEffect(() => {
        setSelectedVariant({
            variant: null,
            assetType: null
        });
    }, [selectedGame?.id]);

    const handleVariantChange = useCallback(() => {

        onVariantAChange(selectedVariant);
    }, [selectedVariant, onVariantAChange]);


    // Get asset URL based on variant and asset type
    const getAssetUrl = useCallback((variant, mediaType) => {
        if (!selectedVariant.assetType || selectedVariant.variant !== variant) {
            return null;
        }

        const assetMap = {
            default: {
                image: selectedGame?.defaultImage,
                video: selectedGame?.defaultVideo
            },
            current: {
                image: selectedGame?.currentImage,
                video: selectedGame?.currentVideo
            },
            theme: {
                image: selectedGame?.themeImage,
                video: selectedGame?.themeVideo
            },
            promo: {
                image: selectedGame?.promoImage,
                video: selectedGame?.promoVideo
            }
        };

        return assetMap[selectedVariant.assetType]?.[mediaType] || null;
    }, [selectedGame, selectedVariant]);


    const assetsStatus = useCallback((imageUrl, videoUrl) => {
        const hasImage = !!imageUrl;
        const hasVideo = !!videoUrl;
        return (
            <div className="flex flex-col gap-2">
                {
                    hasImage ? (
                        <div className="flex text-xs justify-center items-center bg-gray-200 text-green-700 px-2 py-1 rounded-full">Image</div>
                    ) : (
                        <div className="flex text-xs justify-center items-center bg-gray-200 text-red-700 px-2 py-1 rounded-full">No Image</div>
                    )
                }
                {
                    hasVideo ? (
                        <div className="flex text-xs justify-center items-center bg-gray-200 text-green-700 px-2 py-1 rounded-full">Video</div>
                    ) : (
                        <div className="flex text-xs justify-center items-center bg-gray-200 text-red-700 px-2 py-1 rounded-full">No Video</div>
                    )
                }
            </div>
        )
    }, [selectedGame]);

    return (
        <div className="flex flex-col h-full min-h-0 bg-white rounded-lg">
            <Tabs defaultValue="variantA" className="flex flex-col h-full">
                <TabsList className="self-start w-auto mb-2">
                    <TabsTrigger value="original">Original</TabsTrigger>
                    <TabsTrigger value="variantA">Variant A</TabsTrigger>
                    <TabsTrigger value="variantB">Variant B</TabsTrigger>
                </TabsList>
                <TabsContent value="original" className="p-3 bg-gradient-to-br from-slate-200 to-blue-50 flex-grow">
                    <div className="grid grid-cols-4 gap-4">
                        <AssetCard
                            title="Default"
                            assetType="default"
                            imageUrl={selectedGame?.defaultImage}
                            videoUrl={selectedGame?.defaultVideo}
                            gameId={selectedGame?.id}
                            selectedVariant={selectedVariant}
                            onVariantSelect={setSelectedVariant}
                            assetsStatus={assetsStatus}
                        />
                        <AssetCard
                            title="Current"
                            assetType="current"
                            imageUrl={selectedGame?.currentImage}
                            videoUrl={selectedGame?.currentVideo}
                            gameId={selectedGame?.id}
                            selectedVariant={selectedVariant}
                            onVariantSelect={setSelectedVariant}
                            assetsStatus={assetsStatus}
                        />
                        <AssetCard
                            title="Theme"
                            assetType="theme"
                            imageUrl={selectedGame?.themeImage}
                            videoUrl={selectedGame?.themeVideo}
                            gameId={selectedGame?.id}
                            selectedVariant={selectedVariant}
                            onVariantSelect={setSelectedVariant}
                            assetsStatus={assetsStatus}
                        />
                        <AssetCard
                            title="Promo"
                            assetType="promo"
                            imageUrl={selectedGame?.promoImage}
                            videoUrl={selectedGame?.promoVideo}
                            gameId={selectedGame?.id}
                            selectedVariant={selectedVariant}
                            onVariantSelect={setSelectedVariant}
                            assetsStatus={assetsStatus}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="variantA" className="p-3 bg-gradient-to-br from-slate-200 to-blue-50 flex-grow rounded-md">
                    <Grid cols={2} >
                        <VariantMediaCard
                            type="image"
                            title="Variant A Image"
                            pill={<div className="flex text-xs justify-center items-center bg-gray-200 text-green-700 px-2 py-1 rounded-full">{selectedVariant.assetType?.toUpperCase() || 'None'}</div>}
                            gameId={selectedGame?.id}
                            imageUrl={getAssetUrl('variantA', 'image')}
                            videoUrl={getAssetUrl('variantA', 'video')}
                            descriptionName="variantA_imageDescription"
                            placeholder="Enter Ai image description"
                            onDelete={handleClear}
                            onGenerate={() => {/* Handle AI generate */}}
                        />
                        <VariantMediaCard
                            type="both"
                            title="Variant A Video"
                            gameId={selectedGame?.id}
                            imageUrl={getAssetUrl('variantA', 'image')}
                            videoUrl={getAssetUrl('variantA', 'video')}
                            descriptionName="variantA_videoDescription"
                            placeholder="Enter Ai video description"
                            onDelete={handleClear}
                            onGenerate={() => {/* Handle AI generate */}}
                        />
                    </Grid>
                </TabsContent>

                <TabsContent value="variantB" className="p-3 bg-gradient-to-br from-slate-200 to-blue-50 flex-grow rounded-md">
                    <Grid cols={2} >
                        <VariantMediaCard
                            type="image"
                            title="Variant B Image"
                            gameId={selectedGame?.id}
                            imageUrl={getAssetUrl('variantB', 'image')}
                            videoUrl={getAssetUrl('variantB', 'video')}
                            descriptionName="variantB_imageDescription"
                            placeholder="Enter Ai image description"
                            onDelete={handleClear}
                            onGenerate={() => {/* Handle AI generate */}}
                        />
                        <VariantMediaCard
                            type="both"
                            title="Variant B Video"
                            gameId={selectedGame?.id}
                            imageUrl={getAssetUrl('variantB', 'image')}
                            videoUrl={getAssetUrl('variantB', 'video')}
                            descriptionName="variantB_videoDescription"
                            placeholder="Enter Ai video description"
                            onDelete={handleClear}
                            onGenerate={() => {/* Handle AI generate */}}
                        />
                    </Grid>
                </TabsContent>
            </Tabs>
        </div>
    );
}

