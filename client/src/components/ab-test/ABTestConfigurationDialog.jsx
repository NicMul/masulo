/***
*
*   AB TEST CONFIGURATION DIALOG
*   A combined dialog for creating/editing AB tests with form on left and games selection on right
*   Simplified to delegate state management to the form component
*
**********/

import { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, Button, useAPI } from 'components/lib';
import { ABTestConfigForm } from './ab-test.config-form';
import { ABTestAssetCreator } from './ab-test.asset-creator';

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

export function ABTestConfigurationDialog({ 
  open,
  onClose,
  abTest = null, // null for create, object for edit
  onSubmit
}) {
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
  const formRef = useRef(null);

  // Reset variant assets when dialog closes
  useEffect(() => {
    if (!open) {
      setVariantAssets({
        imageVariantA: '',
        videoVariantA: '',
        imageVariantB: '',
        videoVariantB: ''
      });
      setSelectedGame(null);
      setInitialData(null);
    }
  }, [open]);

  // Fetch groups for backward compatibility conversion
  const groupsRes = useAPI('/api/group');

  // Prepare initial data when abTest changes
  useEffect(() => {
    if (abTest) {
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
      
      // Set the selected game for the asset creator
      if (abTest.selectedGame) {
        setSelectedGame(abTest.selectedGame);
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
        selectedGame: abTest.selectedGame || null
      });
    } else {
      setInitialData(null);
    }
  }, [abTest, groupsRes.data]);

  // Handle validation change from form
  const handleValidationChange = useCallback((isValid) => {
    setIsFormValid(isValid);
  }, []);

  // Handle game change from form
  const handleGameChange = useCallback((game) => {
    setSelectedGame(game);
  }, []);

  // Handle validated form submission
  const handleValidatedSubmit = useCallback((data) => {
    // Merge form data with variant assets
    const completeData = {
      ...data,
      ...variantAssets
    };
    
    // Log to console
    console.log('AB Test Form Data:', completeData);
    
    // Call onSubmit if provided
    if (onSubmit) {
      onSubmit(completeData);
    }
  }, [onSubmit, variantAssets]);

  // Handle submit button click
  const handleSubmit = useCallback(() => {
    if (formRef.current && isFormValid) {
      formRef.current.submit();
    }
  }, [isFormValid]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle dialog close with confirmation
  const handleDialogClose = useCallback(() => {
    const confirmClose = window.confirm('Are you sure you want to close? Any unsaved data will be lost.');
    if (confirmClose) {
      onClose();
    }
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      title={abTest ? 'Edit AB Test' : 'Create AB Test'}
      className="max-w-[90vw] w-full max-h-[90vh] overflow-hidden"
    >
      <div className="flex flex-col h-[80vh]">
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left side - Form */}
          <div className="w-[40%] min-w-0 flex flex-col">
            <ABTestConfigForm
              ref={formRef}
              initialData={initialData}
              onValidatedSubmit={handleValidatedSubmit}
              onValidationChange={handleValidationChange}
              onGameChange={handleGameChange}
              isGenerating={isGenerating}
              variantAssets={variantAssets}
            />
          </div>

          {/* Right side - Asset Creator with Tabs */}
          <div className="w-[60%] flex flex-col min-h-0 overflow-hidden">
            {/* Asset Creator - Always Show Tabs */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ABTestAssetCreator 
                selectedGame={selectedGame} 
                onVariantsChange={setVariantAssets}
                existingVariants={abTest ? {
                  imageVariantA: abTest.imageVariantA,
                  videoVariantA: abTest.videoVariantA,
                  imageVariantB: abTest.imageVariantB,
                  videoVariantB: abTest.videoVariantB
                } : null}
                onGenerating={setIsGenerating}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        </div>
        
        {/* Footer with action buttons */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            color="red"
            text="Cancel"
            onClick={handleCancel}
          />
          <Button
            color="green"
            text={isGenerating ? 'Generating Assets' : (abTest ? 'Save AB Test' : 'Create AB Test')}
            onClick={handleSubmit}
            icon={isGenerating ? undefined : "check"}
            loading={isGenerating}
            disabled={!isFormValid || isGenerating}
            className="whitespace-nowrap"
          />
        </div>
      </div>
    </Dialog>
  );
}

