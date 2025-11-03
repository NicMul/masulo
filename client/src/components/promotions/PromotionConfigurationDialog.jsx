/***
*
*   PROMOTION CONFIGURATION DIALOG
*   A combined dialog for creating/editing promotions with form on left and games selection on right
*
**********/

import { useState, useCallback, useEffect, useRef } from 'react';
import { Table, Dialog, Button, Tabs, TabsList, TabsTrigger, TabsContent, Card, Alert } from 'components/lib';
import { PromotionConfigForm } from './promotion.config-form';
import PromotionGameSelector from './promotion.game-selector';

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

export function PromotionConfigurationDialog({ 
  open,
  onClose,
  games = [], 
  selectedGames = [], 
  setSelectedGames,
  promotion = null, // null for create, object for edit
  t,
  onSubmit
}) {
  const [tableSelected, setTableSelected] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group: '',
    startDate: '',
    endDate: '',
    approvedBy: '',
    published: false
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [hasMissingAssets, setHasMissingAssets] = useState(false);
  const [gamesWithMissingAssets, setGamesWithMissingAssets] = useState([]);
  const formRef = useRef(null);

  // Initialize form data when promotion changes
  useEffect(() => {
    if (promotion) {
      const formattedStartDate = formatDateForInput(promotion.startDate);
      const formattedEndDate = formatDateForInput(promotion.endDate);
      
      setFormData({
        name: promotion.name || '',
        description: promotion.description || '',
        group: promotion.group || '',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        approvedBy: promotion.approvedBy || '',
        published: promotion.published || false
      });
    } else {
      setFormData({
        name: '',
        description: '',
        group: '',
        startDate: '',
        endDate: '',
        approvedBy: '',
        published: false
      });
    }
    // Reset missing assets state when promotion changes
    setHasMissingAssets(false);
    setGamesWithMissingAssets([]);
  }, [promotion]);

  // Initialize table selection when selectedGames changes
  useEffect(() => {
    // Ensure selectedGames is always an array
    const gamesArray = Array.isArray(selectedGames) ? selectedGames : [];
    
    if (gamesArray.length > 0 && games.length > 0) {
      const selectedGameObjects = games.filter(game => gamesArray.includes(game.id));
      setTableSelected(selectedGameObjects);
    } else {
      setTableSelected([]);
    }
  }, [selectedGames, games]);

  // Validate form whenever form data changes
  useEffect(() => {
    const validateForm = () => {
      const { name, description, group, startDate, endDate } = formData;
      
      // Check if required fields are filled
      if (!name || !description || !group || !startDate || !endDate) {
        return false;
      }
      
      // Check if end date is after start date
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
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

  // Handle selection changes from table
  const handleSelectionChange = useCallback((selectedRows) => {
    setTableSelected(selectedRows);
    const selectedGameIds = selectedRows.map(row => row.id);
    setSelectedGames(selectedGameIds);
  }, [setSelectedGames]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (!isFormValid) {
      return;
    }
    
    // Ensure selectedGames is always an array
    const gamesArray = Array.isArray(selectedGames) ? selectedGames : [];
    
    // Force published=false if there are missing assets
    const published = hasMissingAssets ? false : formData.published;
    
    const data = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      group: formData.group.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      games: gamesArray,
      approvedBy: formData.approvedBy.trim(),
      published: published
    };
    
    onSubmit(data);
  }, [formData, selectedGames, hasMissingAssets, isFormValid, onSubmit]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);


  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      title={promotion ? t('promotions.edit_promotion') : t('promotions.create_promotion')}
      className="max-w-[90vw] w-full max-h-[90vh] overflow-hidden"
    >
      <div className="flex flex-col h-[80vh]">
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left side - Form */}
          <div className="w-[40%] min-w-0 flex flex-col">
            <PromotionConfigForm
              formData={formData}
              onChange={handleFormChange}
              selectedGames={selectedGames}
              games={games}
              t={t}
              formRef={formRef}
              hasMissingAssets={hasMissingAssets}
            />
          </div>

          {/* Right side - Games Selection Table */}
          <div className="w-[60%] flex flex-col min-h-0 overflow-hidden">
            <Tabs defaultValue="games" className="flex flex-col h-full">
              <TabsList className="self-start w-auto">
                <TabsTrigger value="games">Select Games</TabsTrigger>
                <TabsTrigger disabled value="assets">Edit Promotion Assets</TabsTrigger>
              </TabsList>
              <TabsContent value="games" className="pt-4 space-y-4 flex-1 overflow-y-auto min-h-0">
                {hasMissingAssets && (
                  <Alert
                    variant="warning"
                    title={t('promotions.missing_assets.title')}
                    description={t('promotions.missing_assets.description', {
                      count: gamesWithMissingAssets.length,
                      games: gamesWithMissingAssets.map(g => g.cmsId).join(', ')
                    })}
                  />
                )}
                <PromotionGameSelector 
                  games={games}
                  selectedGames={selectedGames}
                  onSelectionChange={setSelectedGames}
                  onMissingAssetsChange={(hasMissing, gamesWithMissing) => {
                    setHasMissingAssets(hasMissing);
                    setGamesWithMissingAssets(gamesWithMissing);
                  }}
                  onClose={handleCancel}
                />
              </TabsContent>
              <TabsContent value="assets">
                Coming Soon
              </TabsContent>
            </Tabs>
          </div>
      
          </div>
        {/* Footer with action buttons */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            text={t('promotions.cancel')}
            onClick={handleCancel}
            variant="outline"
          />
          <Button
            text={promotion ? t('promotions.save') : t('promotions.create_promotion')}
            onClick={handleSubmit}
            icon="check"
            disabled={!isFormValid}
          />
        </div>
      </div>
      
    </Dialog>
  );
}
