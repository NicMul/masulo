/***
*
*   GAME EDIT FORM
*   Custom form component for editing games with grouped sections
*   Enhanced with beautiful styling and modern UI design
*
**********/

import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'components/hooks/mutation';
import { Button, cn, ThemeSelect, GroupSelect, ViewContext, Switch } from 'components/lib';

export function GameEditForm({ game, onSuccess, onCancel, t }) {
  const viewContext = useContext(ViewContext);
  const [loading, setLoading] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef(null);
  
  // Use the useMutation hook for API calls
  const updateGame = useMutation(`/api/game/${game.id}`, 'PATCH');
  
  const { register, handleSubmit, formState: { errors, isValid }, watch, setValue } = useForm({
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
      touch: game.touch !== undefined ? game.touch : true,
      analytics: game.analytics !== undefined ? game.analytics : false,
      published: game.published !== undefined ? game.published : false,
      publishedType: game.publishedType || 'default'
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
      // we auto increment the version number when the game is updated
      data.version = data.version + 1;
      const result = await updateGame.execute(data);
      
      if (result) {
        onSuccess(result.data);
      }
    } catch (error) {
      console.error('Error updating game:', error);
      viewContext.notification({
        description: t('games.error_saving'),
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [updateGame, onSuccess, isFormValid, viewContext, t]);

  // Check if content is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        const hasScrollableContent = scrollHeight > clientHeight + 10;
        setShowScrollIndicator(hasScrollableContent);
      }
    };

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
    <div className="flex flex-col h-full max-h-[80dvh] bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Fixed Header - Enhanced Design */}
      <div className="flex-shrink-0 px-6 pt-6 pb-5 bg-white border-b-2 border-blue-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Edit Game</h2>
              <p className="text-sm text-gray-500 mt-0.5">Update game configuration and settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <Switch
                name="published"
                value={watchedValues.published}
                label={t('games.form.published.label')}
                onChange={(e) => setValue('published', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="relative flex-1 overflow-hidden px-6 py-6">
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50 hover:scrollbar-thumb-blue-400 pr-2"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-8">
      
            {/* Basic Information Section - Enhanced Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-bold text-white">Basic Information</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <span className="flex items-center">
                        {t('games.form.cmsId.label')}
                        <span className="ml-1 text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      {...register('cmsId', { 
                        required: t('games.form.cmsId.error'),
                        minLength: { value: 1, message: t('games.form.cmsId.error') }
                      })}
                      type="text"
                      className={cn(
                        "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                        errors.cmsId ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300"
                      )}
                      placeholder="Enter CMS ID"
                    />
                    {errors.cmsId && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {errors.cmsId.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t('games.form.theme.label')}
                    </label>
                    <div className="relative">
                      <ThemeSelect
                        name="theme"
                        value={watchedValues.theme}
                        onChange={(e) => setValue('theme', e.target.value)}
                        error={!!errors.theme}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <span className="flex items-center">
                        {t('games.form.version.label')}
                        <span className="ml-1 text-red-500">*</span>
                      </span>
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
                        "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                        errors.version ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300"
                      )}
                      placeholder="1"
                    />
                    {errors.version && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {errors.version.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t('games.form.group.label')}
                    </label>
                    <GroupSelect
                      name="group"
                      value={watchedValues.group}
                      onChange={(e) => setValue('group', e.target.value)}
                      placeholder={t('games.form.group.placeholder')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Media Assets Section - Enhanced Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-bold text-white">Media Assets</h3>
                </div>
                <p className="text-purple-100 text-sm mt-1">Configure images and videos for your game</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t('games.form.defaultImage.label')}
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      {...register('defaultImage', { 
                        required: t('games.form.defaultImage.error'),
                        minLength: { value: 1, message: t('games.form.defaultImage.error') }
                      })}
                      type="text"
                      className={cn(
                        "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200",
                        errors.defaultImage ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-purple-300"
                      )}
                      placeholder="https://example.com/image.jpg"
                    />
                    {errors.defaultImage && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {errors.defaultImage.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {t('games.form.defaultVideo.label')}
                    </label>
                    <input
                      {...register('defaultVideo')}
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-white hover:border-purple-300 transition-all duration-200"
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t('games.form.currentImage.label')}
                    </label>
                    <input
                      {...register('currentImage')}
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-white hover:border-purple-300 transition-all duration-200"
                      placeholder="https://example.com/current.jpg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {t('games.form.currentVideo.label')}
                    </label>
                    <input
                      {...register('currentVideo')}
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-white hover:border-purple-300 transition-all duration-200"
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      {t('games.form.themeImage.label')}
                    </label>
                    <input
                      {...register('themeImage')}
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-white hover:border-purple-300 transition-all duration-200"
                      placeholder="https://example.com/theme.jpg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {t('games.form.themeVideo.label')}
                    </label>
                    <input
                      {...register('themeVideo')}
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:bg-white hover:border-purple-300 transition-all duration-200"
                      placeholder="https://example.com/theme-video.mp4"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Features & Settings Section - Enhanced Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <h3 className="text-lg font-bold text-white">Features & Settings</h3>
                </div>
                <p className="text-emerald-100 text-sm mt-1">Toggle game behavior and interactions</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="group">
                    <label className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 cursor-pointer">
                      <input
                        {...register('scrape')}
                        type="checkbox"
                        className="w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700">
                        {t('games.form.scrape.label')}
                      </span>
                    </label>
                  </div>
                  
                  <div className="group">
                    <label className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 cursor-pointer">
                      <input
                        {...register('animate')}
                        type="checkbox"
                        className="w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700">
                        {t('games.form.animate.label')}
                      </span>
                    </label>
                  </div>
                  
                  <div className="group">
                    <label className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 cursor-pointer">
                      <input
                        {...register('hover')}
                        type="checkbox"
                        className="w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700">
                        {t('games.form.hover.label')}
                      </span>
                    </label>
                  </div>
                  
                  <div className="group">
                    <label className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 cursor-pointer">
                      <input
                        {...register('touch')}
                        type="checkbox"
                        className="w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700">
                        {t('games.form.touch.label')}
                      </span>
                    </label>
                  </div>
                  
                  <div className="group">
                    <label className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 cursor-pointer">
                      <input
                        {...register('analytics')}
                        type="checkbox"
                        className="w-5 h-5 rounded-md border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700">
                        {t('games.form.analytics.label')}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Publishing Settings Section - Enhanced Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-bold text-white">Publishing Settings</h3>
                </div>
                <p className="text-orange-100 text-sm mt-1">Control game visibility and publishing options</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      {t('games.form.publishedLive.label')}
                    </label>
                    <div className="p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-orange-50 to-red-50 hover:border-orange-300 transition-all duration-200">
                      
                      <Switch
                        name="published"
                        value={watchedValues.published}
                        label={t('games.form.published.label')}
                        onChange={(e) => setValue('published', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      {t('games.form.publishedType.label')}
                    </label>
                    <select
                      {...register('publishedType')}
                      className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:bg-white hover:border-orange-300 transition-all duration-200 font-medium text-gray-700"
                    >
                      <option value="default">{t('games.form.publishedType.options.default')}</option>
                      <option value="current">{t('games.form.publishedType.options.current')}</option>
                      <option value="theme">{t('games.form.publishedType.options.theme')}</option>
                      <option value="promo">{t('games.form.publishedType.options.promo')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Settings Section - Enhanced Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <h3 className="text-lg font-bold text-white">Additional Settings</h3>
                </div>
                <p className="text-violet-100 text-sm mt-1">Custom CSS and advanced configurations</p>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    {t('games.form.playerCss.label')}
                  </label>
                  <textarea
                    {...register('playerCss')}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent hover:bg-white hover:border-violet-300 transition-all duration-200 font-mono text-sm"
                    placeholder={t('games.form.playerCss.placeholder')}
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Add custom CSS to style the game player
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        {/* Scroll Indicator - Enhanced */}
        {showScrollIndicator && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-100 via-slate-50 to-transparent pointer-events-none flex items-end justify-center">
            <div className="flex items-center space-x-2 text-blue-500 text-sm font-medium mb-2 bg-white px-4 py-2 rounded-full shadow-lg">
              <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>Scroll for more</span>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Footer - Enhanced */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t-2 border-gray-100 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {isFormValid ? (
              <span className="flex items-center text-green-600 font-medium">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Form is valid
              </span>
            ) : (
              <span className="flex items-center text-amber-600 font-medium">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please fill required fields
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              text="Cancel"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2.5 border-2 border-gray-300 hover:border-gray-400 rounded-xl font-semibold transition-all duration-200"
            />
            <Button
              type="submit"
              text={t('games.edit.button')}
              loading={loading}
              disabled={loading || !isFormValid}
              onClick={handleSubmit(onSubmit)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}