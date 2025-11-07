/***
*
*   AB TEST EDIT VIEW
*   Full-page view for editing existing AB tests
*
**********/

import { useState, useCallback, useEffect, useRef, useContext, useMemo } from 'react';
import { useNavigate, useParams, ViewContext, Animate, Button, useAPI, useMutation, Card } from 'components/lib';
import { ABTestConfigForm } from 'components/ab-test/ab-test.config-form';
import { ABTestAssetCreator } from 'components/ab-test/ab-test.asset-creator';

// UTILITY: Function to format dates for HTML input type="date" (YYYY-MM-DD format)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    // Handle DD/MM/YYYY format from backend
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // Handle standard ISO date format
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Invalid date string provided:", dateString);
    return '';
  }
};

// UTILITY: Function to format time for HTML input type="time" (HH:mm format)
const formatTimeForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    console.error("Invalid time string provided:", dateString);
    return '';
  }
};

export function ABTestEdit({ t }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const viewContext = useContext(ViewContext);
  const updateABTestMutation = useMutation('/api/ab-test', 'PATCH');
  const hasInitialized = useRef(false);
  
  // Reset initialization flag when id changes
  useEffect(() => {
    hasInitialized.current = false;
  }, [id]);

  // Fetch AB test data
  const abTestRes = useAPI(id ? `/api/ab-test/${id}` : null);
  // The API returns an array even for single ID queries, so get the first element
  // Memoize to prevent infinite re-renders
  const abTest = useMemo(() => {
    return Array.isArray(abTestRes.data) ? abTestRes.data[0] : abTestRes.data;
  }, [abTestRes.data]);

  // Memoize existing variants data to prevent unnecessary re-renders
  const existingVariantsData = useMemo(() => {
    if (!abTest) return null;
    return {
      imageVariantA: abTest.imageVariantA,
      videoVariantA: abTest.videoVariantA,
      imageVariantB: abTest.imageVariantB,
      videoVariantB: abTest.videoVariantB
    };
  }, [abTest?.imageVariantA, abTest?.videoVariantA, abTest?.imageVariantB, abTest?.videoVariantB]);

  // Fetch games data to map gameId to game object
  const gamesRes = useAPI('/api/game');

  // Fetch groups for backward compatibility conversion
  const groupsRes = useAPI('/api/group');

  const [isFormValid, setIsFormValid] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [variantAssets, setVariantAssets] = useState({
    imageVariantA: '',
    videoVariantA: '',
    imageVariantB: '',
    videoVariantB: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(null);

  // Prepare initial data when abTest and games data load (only once)
  useEffect(() => {
    if (abTest && gamesRes.data && groupsRes.data && !hasInitialized.current) {
      hasInitialized.current = true;
      const formattedStartDate = formatDateForInput(abTest.startDate);
      const formattedEndDate = formatDateForInput(abTest.endDate);
      // Format times from Date objects, default to '00:00' if not present (backward compatibility)
      const formattedStartTime = abTest.startTime ? formatTimeForInput(abTest.startTime) : '00:00';
      const formattedEndTime = abTest.endTime ? formatTimeForInput(abTest.endTime) : '00:00';
      
      // Handle backward compatibility: convert friendlyName to cmsGroupId if needed
      let groupValue = abTest.group || '';
      if (groupValue && groupsRes.data && groupsRes.data.length > 0) {
        // Check if the stored value is a friendlyName (backward compatibility)
        const groupByFriendlyName = groupsRes.data.find(g => g.friendlyName === groupValue);
        if (groupByFriendlyName) {
          // Convert friendlyName to cmsGroupId
          groupValue = groupByFriendlyName.cmsGroupId;
        }
        // If it's already a cmsGroupId, it will remain unchanged
      }
      
      // Find the full game object from gamesRes
      const gameObject = gamesRes.data.find(game => game.id === abTest.gameId);
      
      // Set the selected game for the asset creator
      if (gameObject) {
        setSelectedGame(gameObject);
      }

      // Pre-populate variant assets if editing
      setVariantAssets({
        imageVariantA: abTest.imageVariantA || '',
        videoVariantA: abTest.videoVariantA || '',
        imageVariantB: abTest.imageVariantB || '',
        videoVariantB: abTest.videoVariantB || ''
      });
      
      setInitialData({
        name: abTest.name || '',
        description: abTest.description || '',
        group: groupValue,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        approvedBy: abTest.approvedBy || '',
        published: abTest.published || false,
        selectedGame: gameObject || null
      });
    }
  }, [abTest, gamesRes.data, groupsRes.data]);

  // Handle validation change from form
  const handleValidationChange = useCallback((isValid) => {
    setIsFormValid(isValid);
  }, []);

  // Handle game change from form
  const handleGameChange = useCallback((game) => {
    setSelectedGame(game);
  }, []);

  // Handle validated form submission
  const handleValidatedSubmit = useCallback(async (data) => {
    if (!abTest || !abTest.id) {
      viewContext.notification({
        description: 'AB Test data not loaded',
        variant: 'error'
      });
      return;
    }

    try {
      setIsLoading(true);

      // Merge form data with variant assets
      const completeData = {
        ...data,
        ...variantAssets
      };

      // Transform form data to match API expectations
      const payload = {
        name: completeData.name,
        description: completeData.description,
        group: completeData.group,
        startDate: completeData.startDate,
        endDate: completeData.endDate,
        startTime: completeData.startTime,
        endTime: completeData.endTime,
        gameId: completeData.selectedGame?.id || '',
        approvedBy: completeData.approvedBy || '',
        published: completeData.published || false,
        analyticsId: abTest.analyticsId || '',
        imageVariantA: completeData.imageVariantA || '',
        videoVariantA: completeData.videoVariantA || '',
        imageVariantB: completeData.imageVariantB || '',
        videoVariantB: completeData.videoVariantB || ''
      };

      console.log('Updating AB Test with payload:', payload);

      const result = await updateABTestMutation.execute(payload, `/api/ab-test/${abTest.id}`);

      if (result) {
        // Show success notification
        viewContext.notification({
          description: result.message || 'AB Test updated successfully',
          variant: 'success'
        });

   
        navigate('/experiments');
      } else {
        // Show error notification
        viewContext.notification({
          description: 'Failed to update AB Test',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating AB test:', error);
      viewContext.notification({
        description: 'An error occurred while updating the AB Test',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [viewContext, updateABTestMutation, variantAssets, navigate, abTest]);

  // Handle submit button click
  const handleSubmit = useCallback(() => {
    if (formRef.current && isFormValid) {
      formRef.current.submit();
    }
  }, [isFormValid]);

  // Handle cancel - navigate back


  // Show loading state while fetching AB test data
  if (abTestRes.loading || gamesRes.loading || groupsRes.loading) {
    return (
      <Animate type='pop'>
        <div className='flex items-center justify-center h-full'>
          <div className='text-slate-600 dark:text-slate-400'>Loading AB Test...</div>
        </div>
      </Animate>
    );
  }

  // Show error if AB test not found
  if (abTestRes.error || !abTest || (Array.isArray(abTestRes.data) && abTestRes.data.length === 0)) {
    return (
      <Animate type='pop'>
        <div className='space-y-6'>
          <div className='text-red-600 dark:text-red-400'>
            {abTestRes.error ? 'Error loading AB Test' : 'AB Test not found'}
          </div>
          <Button
            color="blue"
            text="Back to AB Tests"
            url="/experiments"
          />
        </div>
      </Animate>
    );
  }

  return (
    <Animate type='pop'>
      <div className='space-y-6 h-full flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div/>
          <div className='flex gap-2'>
            <Button
              color="red"
              text="Cancel"
              url="/experiments"
              disabled={isLoading || isGenerating}
            />
            <Button
              color="green"
              text={isGenerating ? 'Generating Assets' : 'Save AB Test'}
              onClick={handleSubmit}
              icon={isGenerating ? undefined : "check"}
              loading={isLoading || isGenerating}
              disabled={!isFormValid || isGenerating || isLoading}
              className="whitespace-nowrap"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left side - Form */}
          <div className="w-[40%] min-w-0 flex flex-col">
            <div className="relative">
              <Card className="max-h-[78dvh] overflow-y-auto">
                <ABTestConfigForm
                  ref={formRef}
                  initialData={initialData}
                  onValidatedSubmit={handleValidatedSubmit}
                  onValidationChange={handleValidationChange}
                  onGameChange={handleGameChange}
                  isGenerating={isGenerating}
                  variantAssets={variantAssets}
                />
              </Card>
              {/* Fade overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 dark:from-slate-900 dark:via-slate-900/80 to-transparent pointer-events-none rounded-b-lg" />
            </div>
          </div>

          {/* Right side - Asset Creator with Tabs */}
          <div className="w-[60%] flex flex-col min-h-0 ">
              <Card>
              <ABTestAssetCreator 
                selectedGame={selectedGame} 
                onVariantsChange={setVariantAssets}
                existingVariants={existingVariantsData}
                onGenerating={setIsGenerating}
                isGenerating={isGenerating}
              />
              </Card>
          </div>
        </div>
      </div>
    </Animate>
  );
}

