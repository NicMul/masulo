/***
*
*   GAME CREATE FORM
*   Custom form component for creating new games with grouped sections
*
**********/

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'components/hooks/mutation';
import { Button, cn, ThemeSelect } from 'components/lib';

export function GameCreateForm({ onSuccess, onCancel, t }) {
  const [loading, setLoading] = useState(false);
  
  // Use the useMutation hook for API calls
  const createGame = useMutation('/api/game', 'POST');
  
  const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm({
    mode: 'onChange',
    defaultValues: {
      cmsId: '',
      theme: 'default',
      defaultImage: '',
      defaultVideo: '',
      currentImage: '',
      currentVideo: '',
      themeImage: '',
      themeVideo: '',
      scrape: false,
      animate: false,
      hover: false,
      version: 1
    }
  });

  // Watch all form values to determine if form is valid
  const watchedValues = watch();
  const isFormValid = Object.values(watchedValues).every(value => {
    if (typeof value === 'boolean') return true; // checkboxes/switches are always valid
    if (typeof value === 'number') return value > 0; // version must be > 0
    return value && value.toString().trim() !== ''; // strings must not be empty
  });

  const onSubmit = useCallback(async (data) => {
    if (!isFormValid) return;
    
    setLoading(true);
    
    try {
      const result = await createGame.execute(data);
      
      if (result) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setLoading(false);
    }
  }, [createGame, onSuccess, isFormValid]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* Basic Information Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.cmsId.label')} *
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
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.theme.label')} *
            </label>
            <ThemeSelect
              {...register('theme', { required: t('games.form.theme.error') })}
              error={!!errors.theme}
            />
            {errors.theme && (
              <p className="text-red-500 text-xs mt-1">{errors.theme.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.version.label')} *
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
        </div>
      </div>

      {/* Media Assets Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Media Assets</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.defaultImage.label')} *
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
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.defaultVideo.label')} *
            </label>
            <input
              {...register('defaultVideo', { 
                required: t('games.form.defaultVideo.error'),
                minLength: { value: 1, message: t('games.form.defaultVideo.error') }
              })}
              type="text"
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.defaultVideo ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.defaultVideo && (
              <p className="text-red-500 text-xs mt-1">{errors.defaultVideo.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.currentImage.label')} *
            </label>
            <input
              {...register('currentImage', { 
                required: t('games.form.currentImage.error'),
                minLength: { value: 1, message: t('games.form.currentImage.error') }
              })}
              type="text"
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.currentImage ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.currentImage && (
              <p className="text-red-500 text-xs mt-1">{errors.currentImage.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.currentVideo.label')} *
            </label>
            <input
              {...register('currentVideo', { 
                required: t('games.form.currentVideo.error'),
                minLength: { value: 1, message: t('games.form.currentVideo.error') }
              })}
              type="text"
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.currentVideo ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.currentVideo && (
              <p className="text-red-500 text-xs mt-1">{errors.currentVideo.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.themeImage.label')} *
            </label>
            <input
              {...register('themeImage', { 
                required: t('games.form.themeImage.error'),
                minLength: { value: 1, message: t('games.form.themeImage.error') }
              })}
              type="text"
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.themeImage ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.themeImage && (
              <p className="text-red-500 text-xs mt-1">{errors.themeImage.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {t('games.form.themeVideo.label')} *
            </label>
            <input
              {...register('themeVideo', { 
                required: t('games.form.themeVideo.error'),
                minLength: { value: 1, message: t('games.form.themeVideo.error') }
              })}
              type="text"
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.themeVideo ? "border-red-300" : "border-gray-300"
              )}
            />
            {errors.themeVideo && (
              <p className="text-red-500 text-xs mt-1">{errors.themeVideo.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Features & Settings Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Features & Settings</h3>
        <div className="grid grid-cols-3 gap-4">
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
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          text="Cancel"
          onClick={onCancel}
          disabled={loading}
        />
        <Button
          type="submit"
          text={t('games.create.button')}
          loading={loading}
          disabled={loading || !isFormValid}
        />
      </div>
    </form>
  );
}
