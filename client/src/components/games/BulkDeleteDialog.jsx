/***
*
*   BULK DELETE DIALOG
*   Confirmation dialog for deleting multiple games with game ID chips
*
**********/

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Icon } from 'components/lib';

export function BulkDeleteDialog({ isOpen, onClose, onConfirm, isDeleting, selectedGames, t }) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">{t('games.bulk.delete.action')}</DialogTitle>
          <DialogDescription>
            {t('games.bulk.delete.confirm', { count: selectedGames.length })}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Game ID Chips */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Games to Delete
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              {selectedGames.map((game) => (
                <span
                  key={game.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                >
                  {game.cmsId}
                </span>
              ))}
            </div>
          </div>
          
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <Icon name="alert-triangle" className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Warning
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  This action cannot be undone. All selected games and their associated data will be permanently deleted.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting && (
              <Icon name="loader-2" className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Games
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}