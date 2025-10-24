/***
*
*   GAME EDIT ACTION MENU
*   Dropdown menu with actions for game editing (regenerate, lock, delete, save)
*
**********/

import { useState } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  Button,
  Icon
} from 'components/lib';

export function GameEditActionMenu({ selectedGame, locked, onRegenerate, onLock, onDelete, onSave }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleRegenerate = () => {
    if (locked) return; // Prevent action if locked
    console.log('Regenerate clicked for game:', selectedGame?.id);
    onRegenerate?.();
    setIsOpen(false);
  };

  const handleLock = () => {
    console.log('Lock clicked for game:', selectedGame?.id);
    onLock?.();
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (locked) return; // Prevent action if locked
    console.log('Delete clicked for game:', selectedGame?.id);
    onDelete?.();
    setIsOpen(false);
  };

  const handleSave = () => {
    if (locked) return; // Prevent action if locked
    console.log('Save clicked for game:', selectedGame?.id);
    onSave?.();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
          disabled={!selectedGame}
        >
          <Icon name="more-horizontal" className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={handleRegenerate}
          disabled={locked}
          className={locked ? "opacity-50 cursor-not-allowed" : ""}
        >
          <Icon name="refresh-cw" className="mr-2 h-4 w-4" />
          Regenerate
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleLock}>
          <Icon name="lock" className="mr-2 h-4 w-4" />
          {locked ? "Unlock" : "Lock"}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleDelete} 
          className={`text-red-600 ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={locked}
        >
          <Icon name="trash-2" className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleSave}
          disabled={locked}
          className={locked ? "opacity-50 cursor-not-allowed" : ""}
        >
          <Icon name="save" className="mr-2 h-4 w-4" />
          Save
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
