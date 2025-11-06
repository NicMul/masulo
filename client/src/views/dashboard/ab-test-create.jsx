/***
*
*   AB TEST CREATE VIEW
*   Full-page view for creating new AB tests
*
**********/

import { useState, useCallback, useRef, useContext } from 'react';
import { useNavigate, ViewContext, Animate, Button, useAPI, useMutation, Card } from 'components/lib';
import { ABTestConfigForm } from 'components/ab-test/ab-test.config-form';
import { ABTestAssetCreator } from 'components/ab-test/ab-test.asset-creator';

export function ABTestCreate({ t }) {
  const navigate = useNavigate();
  const viewContext = useContext(ViewContext);
  const createABTestMutation = useMutation('/api/ab-test', 'POST');

  const [isFormValid, setIsFormValid] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [variantAssets, setVariantAssets] = useState({
    imageVariantA: '',
    videoVariantA: '',
    imageVariantB: '',
    videoVariantB: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(null);

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
        analyticsId: '',
        imageVariantA: completeData.imageVariantA || '',
        videoVariantA: completeData.videoVariantA || '',
        imageVariantB: completeData.imageVariantB || '',
        videoVariantB: completeData.videoVariantB || ''
      };

      console.log('Creating AB Test with payload:', payload);

      const result = await createABTestMutation.execute(payload);

      if (result) {
        // Show success notification
        viewContext.notification({
          description: result.message || 'AB Test created successfully',
          variant: 'success'
        });

        // Navigate back to AB testing list
        navigate('/ab-testing');
      } else {
        // Show error notification
        viewContext.notification({
          description: 'Failed to create AB Test',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error creating AB test:', error);
      viewContext.notification({
        description: 'An error occurred while creating the AB Test',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [viewContext, createABTestMutation, variantAssets, navigate]);

  // Handle submit button click
  const handleSubmit = useCallback(() => {
    if (formRef.current && isFormValid) {
      formRef.current.submit();
    }
  }, [isFormValid]);

  // Handle cancel - navigate back
  const handleCancel = useCallback(() => {
    navigate('/ab-testing');
  }, [navigate]);

  return (
    <Animate type='pop'>
      <div className='space-y-6 h-full flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div />
          <div className='flex gap-2'>
            <Button
              color="red"
              text="Cancel"
              onClick={handleCancel}
              disabled={isLoading || isGenerating}
            />
            <Button
              color="green"
              text={isGenerating ? 'Generating Assets' : 'Create AB Test'}
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
                  initialData={null}
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
          <div className="w-[60%] flex flex-col min-h-0">
          <Card>
          <ABTestAssetCreator 
                selectedGame={selectedGame} 
                onVariantsChange={setVariantAssets}
                existingVariants={null}
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

