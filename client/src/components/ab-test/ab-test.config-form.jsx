/***
*
*   AB TEST CONFIGURATION FORM
*   Custom form component for creating/editing AB tests with grouped sections
*   Enhanced with beautiful styling and modern UI design matching GameCreateForm
*   Self-contained with internal state management, validation, and game fetching
*
**********/

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { cn, GroupSelect, Switch, useAPI } from 'components/lib';
import ABTestGameSelector from './ab-test.game-selector';

export const ABTestConfigForm = forwardRef(({ 
  initialData = null,
  onValidatedSubmit,
  onValidationChange,
  onGameChange
}, ref) => {
  // Internal state management
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    approvedBy: '',
    published: false,
    selectedGame: null
  });
  const [hasMissingAssets, setHasMissingAssets] = useState(false);

  // Fetch games internally
  const gamesRes = useAPI('/api/game');
  const games = gamesRes.data || [];

  // Initialize form data from initialData prop
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        group: initialData.group || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        approvedBy: initialData.approvedBy || '',
        published: initialData.published || false,
        selectedGame: initialData.selectedGame || null
      });
    }
  }, [initialData]);

  // Handle form field changes
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle game selection change
  const handleGameSelectionChange = useCallback((gameId) => {
    if (gameId) {
      const game = games.find(g => g.id === gameId);
      handleChange('selectedGame', game || null);
    } else {
      handleChange('selectedGame', null);
    }
  }, [games, handleChange]);

  // Validation helpers
  const hasError = (field) => {
    if (field === 'name') return !formData.name || formData.name.trim() === '';
    if (field === 'description') return !formData.description || formData.description.trim() === '';
    if (field === 'group') return !formData.group || formData.group.trim() === '';
    if (field === 'startDate') return !formData.startDate;
    if (field === 'endDate') {
      if (!formData.endDate) return true;
      if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
        return true;
      }
      return false;
    }
    if (field === 'startTime') return !formData.startTime;
    if (field === 'endTime') {
      if (!formData.endTime) return true;
      // Check if endDateTime is after startDateTime
      if (formData.startDate && formData.endDate && formData.startTime && formData.endTime) {
        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
        if (endDateTime <= startDateTime) {
          return true;
        }
      }
      return false;
    }
    return false;
  };

  const hasGamesError = !formData.selectedGame;

  // Watch for selectedGame changes and notify parent
  useEffect(() => {
    if (onGameChange) {
        console.log('Game changed to:', formData.selectedGame);
      onGameChange(formData.selectedGame);
    }
  }, [formData.selectedGame, onGameChange]);

  // Validate form and notify parent
  useEffect(() => {
    const validateForm = () => {
      const { name, description, group, startDate, endDate, startTime, endTime, selectedGame } = formData;
      
      // Check if required fields are filled
      if (!name || !description || !group || !startDate || !endDate || !startTime || !endTime) {
        return false;
      }
      
      // Check if endDateTime is after startDateTime
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      if (endDateTime <= startDateTime) {
        return false;
      }
      
      // Check if a game is selected
      if (!selectedGame) {
        return false;
      }
      
      return true;
    };
    
    const isValid = validateForm();
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [formData, onValidationChange]);

  // Expose submit method via ref
  useImperativeHandle(ref, () => ({
    submit: () => {
      if (!onValidatedSubmit) return;

      // Prepare game data
      const gameData = formData.selectedGame ? {
        gameCmsId: formData.selectedGame.cmsId,
        friendlyName: formData.selectedGame.friendlyName,
        promoImage: formData.selectedGame.promoImage,
        promoVideo: formData.selectedGame.promoVideo
      } : null;

      // Force published=false if there are missing assets
      const published = hasMissingAssets ? false : formData.published;

      // Combine date and time into DateTime objects
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const data = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        group: formData.group.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        games: gameData ? [gameData] : [],
        approvedBy: formData.approvedBy.trim(),
        published: published,
        selectedGame: formData.selectedGame
      };

      onValidatedSubmit(data);
    }
  }), [formData, hasMissingAssets, onValidatedSubmit]);

  // If hasMissingAssets is true and published is true, set published to false
  useEffect(() => {
    if (hasMissingAssets && formData.published) {
      handleChange('published', false);
    }
  }, [hasMissingAssets, formData.published, handleChange]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-200 to-blue-50 rounded-md">
      {/* Scrollable Content */}
      <div className="relative flex-1 overflow-hidden px-6 py-6">
        <div 
          className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50 hover:scrollbar-thumb-blue-400 pr-2"
        >
          <form className="space-y-6 pb-8">
            
            {/* Basic Information Section - Enhanced Card */}
            <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="bg-[#6363ac] px-6 py-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-bold text-white">AB Test Name & Description</h3>
                  </div>
                  <div className="text-white">
                    <Switch
                      name="published"
                      value={formData.published}
                      label={formData.published ? 'Published' : 'Unpublished'}
                      onChange={(e) => {
                        // Prevent setting published=true when there are missing assets
                        if (hasMissingAssets && e.target.value) {
                          return;
                        }
                        handleChange('published', e.target.value);
                      }}
                      disabled={hasMissingAssets}
                      className="data-[state=checked]:!bg-green-500 dark:data-[state=checked]:!bg-green-600"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <span className="flex items-center">
                        AB Test Name
                        <span className="ml-1 text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                        hasError('name') ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300"
                      )}
                      placeholder="AB Test Name"
                      required
                    />
                    {hasError('name') && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        AB Test name is required
                      </p>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <span className="flex items-center">
                        AB Test Description
                        <span className="ml-1 text-red-500">*</span>
                      </span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={4}
                      className={cn(
                        "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                        hasError('description') ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300"
                      )}
                      placeholder="AB Test Description"
                      required
                    />
                    {hasError('description') && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        AB Test description is required
                      </p>
                    )}
                  </div>
                  
                  {/* Group */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <span className="flex items-center">
                        Group
                        <span className="ml-1 text-red-500">*</span>
                      </span>
                    </label>
                    <GroupSelect
                      name="group"
                      value={formData.group || ''}
                      onChange={(e) => handleChange('group', e.target.value)}
                      error={hasError('group')}
                      valueType="cmsGroupId"
                      className={cn(
                        "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                        hasError('group') ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300"
                      )}
                    />
                    {hasError('group') && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Group is required
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Date Range Section - Enhanced Card */}
            <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="bg-[#6363ac] px-6 py-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-bold text-white">AB Test Dates</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <span className="flex items-center">
                        Start Date
                        <span className="ml-1 text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      name="startDate"
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                        hasError('startDate') ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300"
                      )}
                      required
                    />
                    {hasError('startDate') && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Start date is required
                      </p>
                    )}
                  </div>
                  
                  {/* End Date */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <span className="flex items-center">
                        End Date
                        <span className="ml-1 text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      name="endDate"
                      type="date"
                      value={formData.endDate || ''}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                        hasError('endDate') ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300"
                      )}
                      required
                    />
                    {hasError('endDate') && formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate) && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        End date must be after start date
                      </p>
                    )}
                    {!formData.endDate && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        End date is required
                      </p>
                    )}
                  </div>
                  
                  {/* Start Time */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <span className="flex items-center">
                        Start Time
                        <span className="ml-1 text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      name="startTime"
                      type="time"
                      value={formData.startTime || ''}
                      onChange={(e) => handleChange('startTime', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                        hasError('startTime') ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300"
                      )}
                      required
                    />
                    {hasError('startTime') && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Start time is required
                      </p>
                    )}
                  </div>
                  
                  {/* End Time */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      <span className="flex items-center">
                        End Time
                        <span className="ml-1 text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      name="endTime"
                      type="time"
                      value={formData.endTime || ''}
                      onChange={(e) => handleChange('endTime', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                        hasError('endTime') ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300"
                      )}
                      required
                    />
                    {hasError('endTime') && formData.startDate && formData.endDate && formData.startTime && formData.endTime && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        End time must be after start time
                      </p>
                    )}
                    {!formData.endTime && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        End time is required
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Games Selection Section - Enhanced Card */}
            <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="bg-[#6363ac] px-6 py-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-bold text-white">Game Selection</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700">
                    <span className="flex items-center">
                      Select Game
                      <span className="ml-1 text-red-500">*</span>
                    </span>
                  </label>
                  <div className={cn(
                    "rounded-xl border-2 min-h-[300px] transition-all duration-200",
                    hasGamesError ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                  )}>
                    <div className="p-4 h-full">
                      <ABTestGameSelector
                        games={games}
                        selectedGame={formData.selectedGame}
                        onSelectionChange={handleGameSelectionChange}
                      />
                    </div>
                  </div>
                  {hasGamesError && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      A game selection is required
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Approval Section - Enhanced Card */}
            <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="bg-[#6363ac] px-6 py-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-bold text-white">AB Test Approval</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Approved By */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      Approved By
                    </label>
                    <input
                      name="approvedBy"
                      type="text"
                      value={formData.approvedBy || ''}
                      onChange={(e) => handleChange('approvedBy', e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                        "border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300"
                      )}
                      placeholder="Approved By"
                    />
                  </div>
                  
                  {/* Published Switch */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                      Published
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className={cn('px-4 py-2 rounded-lg border border-blue-200', formData.published ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                        <Switch
                          name="published"
                          value={formData.published}
                          label={formData.published ? 'Published' : 'Unpublished'}
                          onChange={(e) => handleChange('published', e.target.value)}
                          className="data-[state=checked]:!bg-green-500 dark:data-[state=checked]:!bg-green-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

ABTestConfigForm.displayName = 'ABTestConfigForm';
