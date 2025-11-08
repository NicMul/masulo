/***
*
*   AB TEST ASSET CREATOR
*   Component for creating variant assets (A and B) for AB testing
*   Takes a selectedGame prop and displays two tabs with MediaPlayer components
*
**********/

import { Tabs, TabsList, TabsTrigger, TabsContent, Grid, Card, Textarea, Button, Input, Icon, Badge } from 'components/lib';
import MediaPlayer from '../edit/MediaPlayer';
import { Animate } from 'components/lib';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useMutation } from 'components/hooks/mutation';

// Reusable Asset Card Component for Original Assets
function AssetCard({ title, assetType, imageUrl, videoUrl, gameId, selectedVariant, onVariantSelect, assetsStatus, isGenerating }) {
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
                
                <div className="w-full max-w-[220px] mx-auto relative">
                    <MediaPlayer
                        gameId={gameId}
                        imageUrl={imageUrl}
                        videoUrl={videoUrl}
                        type="both"
                        readOnly={false}
                        canSelect={false}
                        showPlayIcon={true}
                    />
                    {/* Border Glow - Enhanced for generating state */}
                    <div className={`absolute inset-0 rounded-lg transition-opacity duration-300 pointer-events-none z-10 ${
                        isGenerating 
                            ? 'ring-4 ring-purple-500 opacity-100 animate-pulse' 
                            : 'opacity-0'
                    }`} />
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
function VariantMediaCard({ variant, value, title, gameId, imageUrl, videoUrl, descriptionName, placeholder, type, pill, onChange, isGenerating, hasPendingAssets, onAccept, onReject }) {

  

    return (
        <Animate type='pop'>
            <Card title={title} headerAction={pill}>
                {/* No Assets Overlay */}
                {!gameId && (
                    <div className="absolute inset-0 bg-white/30 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                        <div className="text-white bg-orange-400 px-4 border border-orange-500 py-1 rounded-full text-lg">No Game Selected</div>
                    </div>
                )}
                <div className="w-full max-w-[220px] mx-auto relative">
                    <MediaPlayer
                        gameId={gameId}
                        imageUrl={type === 'both' && !videoUrl ? null : imageUrl}
                        videoUrl={videoUrl}
                        type={type}
                        readOnly={false}
                        canSelect={false}
                        showPlayIcon={true}
                    />
                    {/* Border Glow - Enhanced for generating state */}
                    <div className={`absolute inset-0 rounded-lg transition-opacity duration-1000 pointer-events-none z-10 ${
                        isGenerating 
                            ? 'ring-4 ring-purple-500 opacity-100 animate-pulse' 
                            : 'opacity-0'
                    }`} />
                </div>
                
                {/* Accept/Reject Buttons - Show only when there are pending assets */}
                {hasPendingAssets && (
                    <div className="flex gap-2 mt-4">
                        <Button 
                            icon="check"
                            color="green"
                            text="Accept"
                            onClick={onAccept}
                            className="flex-1"
                        />
                        <Button 
                            icon="x"
                            color="red"
                            text="Reject"
                            onClick={onReject}
                            className="flex-1"
                        />
                    </div>
                )}
                
                {/* Hide prompt input when there are pending assets */}
                {!hasPendingAssets && (
                    <Animate type='pop'>
                       <Input
                       
                        name={descriptionName} 
                        placeholder={placeholder} 
                        className="w-full mt-8 bg-gradient-to-br from-slate-200 to-blue-50" 
                        rows={4}
                        value={value}
                        onChange={(e) => onChange(variant, e.target.value)}
                    />
                    </Animate>
                    
                )}
                
            </Card>
        </Animate>
    );
}
export function ABTestAssetCreator({ selectedGame, onVariantsChange, existingVariants, onGenerating, isGenerating }) {
    const generateAssetsMutation = useMutation('/api/ai/process', 'POST');
    const [variantAImagePrompt, setVariantAImagePrompt] = useState('');
    const [variantAVideoPrompt, setVariantAVideoPrompt] = useState('');
    const [variantBImagePrompt, setVariantBImagePrompt] = useState('');
    const [variantBVideoPrompt, setVariantBVideoPrompt] = useState('');
    const [showReferenceImage, setShowReferenceImage] = useState(false);
    const [activeVariant, setActiveVariant] = useState(null); // Track which variant is showing the image
    const [imagePosition, setImagePosition] = useState({ top: 0, left: 0 });
    const badgeRefA = useRef(null);
    const badgeRefB = useRef(null);
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
    const [pendingVariantA, setPendingVariantA] = useState({
        image: null,
        video: null,
        gameId: null
    });
    const [pendingVariantB, setPendingVariantB] = useState({
        image: null,
        video: null,
        gameId: null
    });

    // Initialize existing variants when editing
    useEffect(() => {
        if (existingVariants && selectedGame) {
            if (existingVariants.imageVariantA || existingVariants.videoVariantA) {
                setMasterVariantA({
                    image: existingVariants.imageVariantA || null,
                    video: existingVariants.videoVariantA || null,
                    gameId: selectedGame.id
                });
            }
            if (existingVariants.imageVariantB || existingVariants.videoVariantB) {
                setMasterVariantB({
                    image: existingVariants.imageVariantB || null,
                    video: existingVariants.videoVariantB || null,
                    gameId: selectedGame.id
                });
            }
        }
    }, [existingVariants, selectedGame]);

    const handleAiGenerateVariantA = async () => {
        onGenerating(true);
        const payload = {
            imageUrl: selectedGame?.defaultImage,
            imagePrompt: variantAImagePrompt,
            videoPrompt: variantAVideoPrompt,
            theme: '',
            assetType: 'ab-test',
            gameId: selectedGame?.id,
            generateImage: variantAImagePrompt.length > 0,
            generateVideo: variantAVideoPrompt.length > 0,
            variant: 'variantA'
        }

        try {
            const result = await generateAssetsMutation.execute(payload);

            if (result) {
                setPendingVariantA({
                    image: result.data.imageUrl,
                    video: result.data.videoUrl,
                    gameId: selectedGame?.id
                });
                setSelectedVariant({
                    variant: null,
                    assetType: null
                });
            }
        } catch (error) {
            console.error('error', error);
        }
        onGenerating(false);
    }

    const handleAiGenerateVariantB = async () => {
        onGenerating(true);
        const payload = {
            imageUrl: selectedGame?.defaultImage,
            imagePrompt: variantBImagePrompt,
            videoPrompt: variantBVideoPrompt,
            theme: '',
            assetType: 'ab-test',
            gameId: selectedGame?.id,
            generateImage: variantBImagePrompt.length > 0,
            generateVideo: variantBVideoPrompt.length > 0,
            variant: 'variantB'
        }

        try {
            const result = await generateAssetsMutation.execute(payload);

            if (result) {
                setPendingVariantB({
                    image: result.data.imageUrl,
                    video: result.data.videoUrl,
                    gameId: selectedGame?.id
                });
                setSelectedVariant({
                    variant: null,
                    assetType: null
                });
            }
        } catch (error) {
            console.error('error', error);
        }
        onGenerating(false);
    }

    const handleAcceptVariantA = () => {
        setMasterVariantA(pendingVariantA);
        setPendingVariantA({ image: null, video: null, gameId: null });
    };

    const handleRejectVariantA = () => {
        setPendingVariantA({ image: null, video: null, gameId: null });
    };

    const handleAcceptVariantB = () => {
        setMasterVariantB(pendingVariantB);
        setPendingVariantB({ image: null, video: null, gameId: null });
    };

    const handleRejectVariantB = () => {
        setPendingVariantB({ image: null, video: null, gameId: null });
    };

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
        setPendingVariantA({
            image: null,
            video: null,
            gameId: null
        });
        setPendingVariantB({
            image: null,
            video: null,
            gameId: null
        });

        setSelectedVariant({
            variant: null,
            assetType: null
        });
        setShowReferenceImage(false);
    };

    // Get asset URL based on variant and asset type
    const getAssetUrl = useCallback((variant, mediaType) => {
        // First check if we have pending assets for this variant (highest priority)
        if (variant === 'variantA' && pendingVariantA.image) {
            return mediaType === 'image' ? pendingVariantA.image : pendingVariantA.video;
        }
        if (variant === 'variantB' && pendingVariantB.image) {
            return mediaType === 'image' ? pendingVariantB.image : pendingVariantB.video;
        }

        // Then check if we have accepted/master assets for this variant
        if (variant === 'variantA' && masterVariantA.image) {
            return mediaType === 'image' ? masterVariantA.image : masterVariantA.video;
        } 
        if (variant === 'variantB' && masterVariantB.image) {
            return mediaType === 'image' ? masterVariantB.image : masterVariantB.video;
        }
        
        // Then fall back to selected original assets
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
    }, [selectedGame, selectedVariant, masterVariantA, masterVariantB, pendingVariantA, pendingVariantB]);

    // Notify parent of variant changes
    useEffect(() => {
        if (onVariantsChange) {
            const variantAImage = getAssetUrl('variantA', 'image');
            const variantAVideo = getAssetUrl('variantA', 'video');
            const variantBImage = getAssetUrl('variantB', 'image');
            const variantBVideo = getAssetUrl('variantB', 'video');

            onVariantsChange({
                imageVariantA: variantAImage || '',
                videoVariantA: variantAVideo || '',
                imageVariantB: variantBImage || '',
                videoVariantB: variantBVideo || ''
            });
        }
    }, [masterVariantA, masterVariantB, selectedVariant, selectedGame, onVariantsChange, getAssetUrl]);

    // Reset selections when selectedGame changes
    useEffect(() => {
        setSelectedVariant({
            variant: null,
            assetType: null
        });
    }, [selectedGame?.id]);

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
            <Tabs defaultValue="variantA" className="flex flex-col h-full ">
                <TabsList className="self-end mr-6 w-auto mb-1">
                    <TabsTrigger value="original" disabled={isGenerating}>Original</TabsTrigger>
                    <TabsTrigger value="variantA" disabled={isGenerating}>Variant A</TabsTrigger>
                    <TabsTrigger value="variantB" disabled={isGenerating}>Variant B</TabsTrigger>
                </TabsList>
                <TabsContent value="original" className="p-3 bg-gradient-to-br from-slate-200 to-blue-50 flex-grow">
                    <Tabs defaultValue="generate" className="flex flex-col h-full ">
                        <TabsList  className="self-start ml-3 mb-2">
                            <TabsTrigger value="default" disabled={isGenerating}>Default</TabsTrigger>
                            <TabsTrigger value="generate" disabled={isGenerating}>Generated</TabsTrigger>
                        </TabsList>
                        <TabsContent value="default" className="p-3 bg-gradient-to-br from-slate-200 to-blue-50 flex-grow">
                            <div className="grid grid-cols-3 gap-3">
                                <AssetCard
                                    title="Default"
                                    assetType="default"
                                    imageUrl={selectedGame?.defaultImage}
                                    videoUrl={selectedGame?.defaultVideo}
                                    gameId={selectedGame?.id}
                                    selectedVariant={selectedVariant}
                                    onVariantSelect={setSelectedVariant}
                                    assetsStatus={assetsStatus}
                                    isGenerating={isGenerating}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="generate" className="p-3 bg-gradient-to-br from-slate-200 to-blue-50 flex-grow">
                            <div className="grid grid-cols-3 gap-2">
                            <AssetCard
                            title="Current"
                            assetType="current"
                            imageUrl={selectedGame?.currentImage}
                            videoUrl={selectedGame?.currentVideo}
                            gameId={selectedGame?.id}
                            selectedVariant={selectedVariant}
                            onVariantSelect={setSelectedVariant}
                            assetsStatus={assetsStatus}
                            isGenerating={isGenerating}
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
                            isGenerating={isGenerating}
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
                            isGenerating={isGenerating}
                        />
                            </div>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                <TabsContent value="variantA" className="p-3 bg-gradient-to-br from-slate-200 to-blue-50 flex-grow rounded-md relative">
                    {/* Reference Image - Rendered at TabsContent level to avoid stacking context issues */}
                    {showReferenceImage && activeVariant === 'variantA' && selectedGame?.defaultImage && (
                        <div 
                            className="flex flex-row gap-2 fixed bg-white/25 backdrop-blur-sm rounded-lg p-2 shadow-xl border border-gray-300"
                            style={{
                                top: `${imagePosition.top}px`,
                                left: `${imagePosition.left}px`,
                                zIndex: 99999,
                            }}
                            onMouseEnter={() => {
                                setShowReferenceImage(true);
                                setActiveVariant('variantA');
                            }}
                            onMouseLeave={() => {
                                setShowReferenceImage(false);
                                setActiveVariant(null);
                            }}
                        >
                            <img src={selectedGame.defaultImage} alt="Reference Image" className="w-[180px] h-[240px] object-cover rounded-lg shadow-lg border border-gray-200/50" />
                        </div>
                    )}
                    
                    <div className="flex flex-row gap-2 mb-4 justify-between items-center">
                        <Animate type='pop'>
                            {!selectedVariant.assetType && selectedGame?.id && (
                                <div 
                                    ref={badgeRefA}
                                    className="relative cursor-pointer hover:opacity-80 transition-opacity duration-300"
                                    onMouseEnter={(e) => {
                                        if (selectedGame?.id && badgeRefA.current) {
                                            const rect = badgeRefA.current.getBoundingClientRect();
                                            setImagePosition({ top: rect.bottom + 8, left: rect.left });
                                            setShowReferenceImage(true);
                                            setActiveVariant('variantA');
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setShowReferenceImage(false);
                                        setActiveVariant(null);
                                    }}
                                >
                                    <Badge variant="blue" className={!selectedGame?.id ? 'opacity-50 cursor-not-allowed' : ''}>Show Reference</Badge>
                                </div>
                            )}
                     
                        </Animate>

                        <Animate type='pop'>
                        <div className="flex flex-row gap-2 w-full justify-end">
                        <Button 
                            disabled={!selectedGame?.id || isGenerating}
                            icon="trash"
                            size="sm"
                            color="orange"
                            text="Clear"
                            onClick={handleClear}
                        />
                          
                        
                        <Button 
                            disabled={!selectedGame?.id || (!variantAImagePrompt.length && !variantAVideoPrompt.length) || isGenerating}
                            icon="zap"
                            size="sm"
                            color="primary" 
                            text={isGenerating ? "Generating Assets" : "Ai Generate"}
                            loading={isGenerating}
                            onClick={handleAiGenerateVariantA}
                            className="whitespace-nowrap"
                        />
                        </div>
                        </Animate>
                        
                        
                    </div>
                    <Grid cols={3} >
                        <VariantMediaCard
                            variant="variantA"
                            type="image"
                            title="Variant A Image"
                            pill={<div className="flex text-xs justify-center items-center bg-gray-200 text-green-700 px-2 py-1 rounded-full">{selectedVariant.assetType?.toUpperCase() || 'No Control Selected'}</div>}
                            gameId={selectedGame?.id}
                            imageUrl={getAssetUrl('variantA', 'image')}
                            videoUrl={getAssetUrl('variantA', 'video')}
                            descriptionName="variantA_imageDescription"
                            placeholder="Enter Ai image description"
                            value={variantAImagePrompt}
                            onChange={(variant, value) => variant === 'variantA' && setVariantAImagePrompt(value)}
                            isGenerating={isGenerating}
                            hasPendingAssets={!!(pendingVariantA.image || pendingVariantA.video)}
                            onAccept={handleAcceptVariantA}
                            onReject={handleRejectVariantA}
                        />
                        <VariantMediaCard
                            variant="variantA"
                            type="both"
                            title="Variant A Video"
                            pill={<div className="flex text-xs justify-center items-center bg-gray-200 text-green-700 px-2 py-1 rounded-full">{selectedVariant.assetType?.toUpperCase() || 'No Control Selected'}</div>}
                            gameId={selectedGame?.id}
                            imageUrl={getAssetUrl('variantA', 'image')}
                            videoUrl={getAssetUrl('variantA', 'video')}
                            descriptionName="variantA_videoDescription"
                            placeholder="Enter Ai video description"
                            value={variantAVideoPrompt}
                            onChange={(variant, value) => variant === 'variantA' && setVariantAVideoPrompt(value)}
                            isGenerating={isGenerating}
                            hasPendingAssets={!!(pendingVariantA.image || pendingVariantA.video)}
                            onAccept={handleAcceptVariantA}
                            onReject={handleRejectVariantA}
                        />
                        
                    </Grid>
                </TabsContent>

                <TabsContent value="variantB" className="p-3 bg-gradient-to-br from-slate-200 to-blue-50 flex-grow rounded-md relative">
                    {/* Reference Image - Rendered at TabsContent level to avoid stacking context issues */}
                    {showReferenceImage && activeVariant === 'variantB' && selectedGame?.defaultImage && (
                        <div 
                            className="flex flex-row gap-2 fixed bg-white/25 backdrop-blur-sm rounded-lg p-2 shadow-xl border border-gray-300"
                            style={{
                                top: `${imagePosition.top}px`,
                                left: `${imagePosition.left}px`,
                                zIndex: 99999,
                            }}
                            onMouseEnter={() => {
                                setShowReferenceImage(true);
                                setActiveVariant('variantB');
                            }}
                            onMouseLeave={() => {
                                setShowReferenceImage(false);
                                setActiveVariant(null);
                            }}
                        >
                            <img src={selectedGame.defaultImage} alt="Reference Image" className="w-[180px] h-[240px] object-cover rounded-lg shadow-lg border border-gray-50" />
                        </div>
                    )}
                    
                <div className="flex flex-row gap-2 mb-4 justify-between items-center">
                        <Animate type='pop'>
                            {!selectedVariant.assetType && selectedGame?.id && (
                                <div 
                                    ref={badgeRefB}
                                    className="relative cursor-pointer hover:opacity-80 transition-opacity duration-300"
                                    onMouseEnter={(e) => {
                                        if (selectedGame?.id && badgeRefB.current) {
                                            const rect = badgeRefB.current.getBoundingClientRect();
                                            setImagePosition({ top: rect.bottom + 8, left: rect.left });
                                            setShowReferenceImage(true);
                                            setActiveVariant('variantB');
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setShowReferenceImage(false);
                                        setActiveVariant(null);
                                    }}
                                >
                                    <Badge variant="blue" className={!selectedGame?.id ? 'opacity-50 cursor-not-allowed px-2 py-1' : 'px-2 py-1'}>Show Reference</Badge>
                                </div>
                            )}
                     
                        </Animate>

                        <Animate type='pop'>
                        <div className="flex flex-row gap-2 w-full justify-end">
                        <Button 
                            disabled={!selectedGame?.id || isGenerating || !selectedVariant.variant || !selectedVariant.assetType}
                            icon="trash"
                            size="sm"
                            color="orange"
                            text="Clear"
                            onClick={handleClear}
                        />
                          
                        
                        <Button 
                            disabled={!selectedGame?.id || (!variantBImagePrompt.length && !variantBVideoPrompt.length) || isGenerating}
                            icon="zap"
                            size="sm"
                            color="primary" 
                            text={isGenerating ? "Generating Assets" : "Ai Generate"}
                            loading={isGenerating}
                            onClick={handleAiGenerateVariantB}
                            className="whitespace-nowrap"
                        />
                        </div>
                        </Animate>
                        
                        
                    </div>
                    <Grid cols={2} >
                        <VariantMediaCard
                            variant="variantB"
                            type="image"
                            title="Variant B Image"
                            pill={<div className="flex text-xs justify-center items-center bg-gray-200 text-green-700 px-2 py-1 rounded-full">{selectedVariant.assetType?.toUpperCase() || 'No Control Selected'}</div>}
                            gameId={selectedGame?.id}
                            imageUrl={getAssetUrl('variantB', 'image')}
                            videoUrl={getAssetUrl('variantB', 'video')}
                            descriptionName="variantB_imageDescription"
                            placeholder="Enter Ai image description"
                            value={variantBImagePrompt}
                            onChange={(variant, value) => variant === 'variantB' && setVariantBImagePrompt(value)}
                            isGenerating={isGenerating}
                            hasPendingAssets={!!(pendingVariantB.image || pendingVariantB.video)}
                            onAccept={handleAcceptVariantB}
                            onReject={handleRejectVariantB}
                        />
                        <VariantMediaCard
                            variant="variantB"
                            type="both"
                            title="Variant B Video"
                            pill={<div className="flex text-xs justify-center items-center bg-gray-200 text-green-700 px-2 py-1 rounded-full">{selectedVariant.assetType?.toUpperCase() || 'No Control Selected'}</div>}
                            gameId={selectedGame?.id}
                            imageUrl={getAssetUrl('variantB', 'image')}
                            videoUrl={getAssetUrl('variantB', 'video')}
                            descriptionName="variantB_videoDescription"
                            placeholder="Enter Ai video description"
                            value={variantBVideoPrompt}
                            onChange={(variant, value) => variant === 'variantB' && setVariantBVideoPrompt(value)}
                            isGenerating={isGenerating}
                            hasPendingAssets={!!(pendingVariantB.image || pendingVariantB.video)}
                            onAccept={handleAcceptVariantB}
                            onReject={handleRejectVariantB}
                        />
                    </Grid>
                </TabsContent>
            </Tabs>
        </div>
    );
}

