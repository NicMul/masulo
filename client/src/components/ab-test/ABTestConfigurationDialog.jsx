/***
*
*   AB TEST CONFIGURATION DIALOG
*   A combined dialog for creating/editing AB tests with form on left and games selection on right
*
**********/

import { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, Button, useAPI } from 'components/lib';
import { ABTestConfigForm } from './ab-test.config-form';
import ABTestGameSelector from './ab-test.game-selector';
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
  games = [], 
  selectedGames = [], 
  setSelectedGames,
  abTest = null, // null for create, object for edit
  t,
  onSubmit
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    approvedBy: '',
    published: false
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [hasMissingAssets, setHasMissingAssets] = useState(false);
  const [gamesWithMissingAssets, setGamesWithMissingAssets] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const formRef = useRef(null);

  // Fetch groups for backward compatibility conversion
  const groupsRes = useAPI('/api/group');

  // Initialize form data when abTest changes
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
      
      setFormData({
        name: abTest.name || '',
        description: abTest.description || '',
        group: groupValue,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        approvedBy: abTest.approvedBy || '',
        published: abTest.published || false
      });
    } else {
      setFormData({
        name: '',
        description: '',
        group: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        approvedBy: '',
        published: false
      });
    }
    // Reset missing assets state when abTest changes
    setHasMissingAssets(false);
    setGamesWithMissingAssets([]);
  }, [abTest, groupsRes.data]);

  // Validate form whenever form data changes
  useEffect(() => {
    const validateForm = () => {
      const { name, description, group, startDate, endDate, startTime, endTime } = formData;
      
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
      
      // Check if at least one game is selected - ensure selectedGames is an array
      const gamesArray = Array.isArray(selectedGames) ? selectedGames : [];
      if (gamesArray.length === 0) {
        return false;
      }
      
      return true;
    };
    
    setIsFormValid(validateForm());
  }, [formData, selectedGames]);

  // Handle form field changes
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle form submission - log to console instead of API call
  const handleSubmit = useCallback(() => {
    if (!isFormValid) {
      return;
    }
    
    // Ensure selectedGames is always an array
    const gamesArray = Array.isArray(selectedGames) ? selectedGames : [];
    
    // Transform selected game IDs to the new format with gameCmsId, friendlyName, promoImage, promoVideo
    const gamesData = gamesArray.map(gameId => {
      const game = games.find(g => g.id === gameId);
      if (!game) {
        // Fallback only if game not found (shouldn't happen in normal flow)
        return {
          gameCmsId: gameId,
          friendlyName: '',
          promoImage: '',
          promoVideo: ''
        };
      }
      return {
        gameCmsId: game.cmsId,
        friendlyName: game.friendlyName,
        promoImage: game.promoImage,
        promoVideo: game.promoVideo
      };
    });
    
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
      games: gamesData,
      approvedBy: formData.approvedBy.trim(),
      published: published
    };
    
    // Log to console instead of API call
    console.log('AB Test Form Data:', formData);
    console.log('Selected Games:', gamesArray);
    console.log('Combined AB Test Data:', data);
    
    // Call onSubmit if provided (for future use)
    if (onSubmit) {
      onSubmit(data);
    }
  }, [formData, selectedGames, games, hasMissingAssets, isFormValid, onSubmit]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      title={abTest ? 'Edit AB Test' : 'Create AB Test'}
      className="max-w-[90vw] w-full max-h-[90vh] overflow-hidden"
    >
      <div className="flex flex-col h-[80vh]">
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left side - Form */}
          <div className="w-[40%] min-w-0 flex flex-col">
            <ABTestConfigForm
              formData={formData}
              onChange={handleFormChange}
              selectedGames={selectedGames}
              games={games}
              t={t}
              formRef={formRef}
              hasMissingAssets={hasMissingAssets}
              onGameSelectionChange={setSelectedGames}
            />
          </div>

          {/* Right side - Asset Creator with Tabs */}
          <div className="w-[60%] flex flex-col min-h-0 overflow-hidden">
            {/* Asset Creator - Always Show Tabs */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ABTestAssetCreator selectedGame={{ id: 'test-game', friendlyName: 'Test Game' }} />
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
            text={abTest ? 'Save AB Test' : 'Create AB Test'}
            onClick={handleSubmit}
            icon="check"
            disabled={!isFormValid}
          />
        </div>
      </div>
    </Dialog>
  );
}

