/***
*
*   GAME EDIT FORM
*   Custom form component for editing games with grouped sections
*
**********/

import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'components/hooks/mutation';
import { Button, cn, ThemeSelect, GroupSelect } from 'components/lib';

export function GameEditForm({ game, onSuccess, onCancel, t }) {
  const [loading, setLoading] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef(null);
  
  // Use the useMutation hook for API calls
  const updateGame = useMutation(`/api/game/${game.id}`, 'PATCH');
  
  const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm({
    mode: 'onChange',
    defaultValues: {
      cmsId: game.cmsId || '',
      theme: game.theme || 'default',
      defaultImage: game.defaultImage || '',
      defaultVideo: game.defaultVideo || '',
      currentImage: game.currentImage || '',
      currentVideo: game.currentVideo || '',
      themeImage: game.themeImage || '',
      themeVideo: game.themeVideo || '',
      scrape: game.scrape || false,
      animate: game.animate !== undefined ? game.animate : true,
      hover: game.hover !== undefined ? game.hover : true,
      version: game.version || 1,
      group: game.group || '',
      playerCss: game.playerCss || '',
      touch: game.touch !== undefined ? game.touch : true
    }
  });

  // Watch only required fields to determine if form is valid
  const watchedValues = watch();
  const isFormValid = watchedValues.cmsId && 
                     watchedValues.cmsId.trim() !== '' && 
                     watchedValues.version > 0 && 
                     watchedValues.defaultImage && 
                     watchedValues.defaultImage.trim() !== '';

  const onSubmit = useCallback(async (data) => {
    if (!isFormValid) return;
    
    setLoading(true);
    
    try {
      const result = await updateGame.execute(data);
      
      if (result) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error updating game:', error);
    } finally {
      setLoading(false);
    }
  }, [updateGame, onSuccess, isFormValid]);

  // Check if content is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        const hasScrollableContent = scrollHeight > clientHeight + 10; // Increased buffer
        console.log('Scroll check:', { 
          scrollHeight, 
          clientHeight, 
          difference: scrollHeight - clientHeight,
          hasScrollableContent 
        });
        setShowScrollIndicator(hasScrollableContent);
      }
    };

    // Use multiple timeouts to ensure DOM is fully rendered
    const timer1 = setTimeout(checkScrollable, 100);
    const timer2 = setTimeout(checkScrollable, 500);
    const timer3 = setTimeout(checkScrollable, 1000);
    
    window.addEventListener('resize', checkScrollable);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', checkScrollable);
    };
  }, []);

  // Handle scroll to hide indicator when reaching bottom
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowScrollIndicator(!isAtBottom);
    }
  }, []);

  return (
    <div className="flex flex-col h-full max-h-[80dvh]">
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Edit Game</h2>
        <p className="text-sm text-gray-600 mt-1">Update the game details below</p>
      </div>

      {/* Scrollable Content */}
      <div className="relative flex-1 overflow-hidden px-6 py-6">
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-8">
      
      {/* Basic Information Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="px-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.cmsId.label')} <span className="text-red-500">*</span>
            </label>
            <input
              {...register('cmsId', { 
                required: t('games.form.cmsId.error'),
                minLength: { value: 1, message: t('games.form.cmsId.error') }
              })}
              type="text"
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.cmsId ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.cmsId && (
              <p className="text-red-500 text-xs mt-1">{errors.cmsId.message}</p>
            )}
          </div>
          
          <div className="px-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.theme.label')}
            </label>
            <ThemeSelect
              {...register('theme')}
              error={!!errors.theme}
            />
          </div>
          
          <div className="px-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.version.label')} <span className="text-red-500">*</span>
            </label>
            <input
              {...register('version', { 
                required: t('games.form.version.error'),
                min: { value: 1, message: t('games.form.version.error') },
                valueAsNumber: true 
              })}
              type="number"
              min="1"
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.version ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.version && (
              <p className="text-red-500 text-xs mt-1">{errors.version.message}</p>
            )}
          </div>
          
          <div className="px-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.group.label')}
            </label>
            <GroupSelect
              {...register('group')}
              placeholder={t('games.form.group.placeholder')}
            />
          </div>
        </div>
      </div>

      {/* Media Assets Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Media Assets</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="px-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.defaultImage.label')} <span className="text-red-500">*</span>
            </label>
            <input
              {...register('defaultImage', { 
                required: t('games.form.defaultImage.error'),
                minLength: { value: 1, message: t('games.form.defaultImage.error') }
              })}
              type="text"
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.defaultImage ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.defaultImage && (
              <p className="text-red-500 text-xs mt-1">{errors.defaultImage.message}</p>
            )}
          </div>
          
          <div className="px-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.defaultVideo.label')}
            </label>
            <input
              {...register('defaultVideo')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="px-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.currentImage.label')}
            </label>
            <input
              {...register('currentImage')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="px-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.currentVideo.label')}
            </label>
            <input
              {...register('currentVideo')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="px-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.themeImage.label')}
            </label>
            <input
              {...register('themeImage')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="px-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.themeVideo.label')}
            </label>
            <input
              {...register('themeVideo')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Features & Settings Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Features & Settings</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <input
              {...register('scrape')}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              {t('games.form.scrape.label')}
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              {...register('animate')}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              {t('games.form.animate.label')}
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              {...register('hover')}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              {t('games.form.hover.label')}
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              {...register('touch')}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              {t('games.form.touch.label')}
            </label>
          </div>
        </div>
      </div>

      {/* Additional Settings Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Additional Settings</h3>
        <div className="space-y-4">
          <div className="px-2">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.playerCss.label')}
            </label>
            <textarea
              {...register('playerCss')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('games.form.playerCss.placeholder')}
            />
          </div>
        </div>
      </div>
        </form>
        </div>
        
        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center">
            <div className="flex items-center space-x-1 text-gray-400 text-xs mb-1">
              <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>Scroll for more</span>
            </div>
          </div>
        )}
        
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            text="Cancel"
            onClick={onCancel}
            disabled={loading}
          />
          <Button
            type="submit"
            text={t('games.edit.button')}
            loading={loading}
            disabled={loading || !isFormValid}
            onClick={handleSubmit(onSubmit)}
          />
        </div>
      </div>
    </div>
  );
}
