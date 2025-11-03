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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  Button,
  Icon
} from 'components/lib';

export function GameEditActionMenu({ selectedGame, locked, onRegenerate, onLock, onDelete, onSave, assetType }) {
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

  const handlePublish = () => {
    if (locked) return; // Prevent action if locked
    console.log('Publish clicked for game:', selectedGame?.id, 'assetType:', assetType);
    // Map "original" to "default" for the API
    const publishType = assetType === 'original' ? 'default' : assetType;
    onSave?.(publishType);
    setIsOpen(false);
  };

  const handleDownloadImage = () => {
    if (locked || !selectedGame) return; // Prevent action if locked or no game
    
    let imageUrl = '';
    switch (assetType) {
      case 'original':
        imageUrl = selectedGame.defaultImage;
        break;
      case 'current':
        imageUrl = selectedGame.currentImage;
        break;
      case 'theme':
        imageUrl = selectedGame.themeImage;
        break;
      case 'promo':
        imageUrl = selectedGame.promoImage;
        break;
      default:
        return;
    }
    
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
    setIsOpen(false);
  };

  const handleDownloadVideo = () => {
    if (locked || !selectedGame) return; // Prevent action if locked or no game
    
    let videoUrl = '';
    switch (assetType) {
      case 'original':
        videoUrl = selectedGame.defaultVideo;
        break;
      case 'current':
        videoUrl = selectedGame.currentVideo;
        break;
      case 'theme':
        videoUrl = selectedGame.themeVideo;
        break;
      case 'promo':
        videoUrl = selectedGame.promoVideo;
        break;
      default:
        return;
    }
    
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
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
        
        <DropdownMenuItem 
          onClick={handlePublish}
          disabled={locked}
          className={locked ? "opacity-50 cursor-not-allowed" : ""}
        >
          <Icon name="save" className="mr-2 h-4 w-4" />
          Save and Publish
        </DropdownMenuItem>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger 
            disabled={locked}
            className={locked ? "opacity-50 cursor-not-allowed" : ""}
          >
            <Icon name="download" className="mr-2 h-4 w-4" />
            Download Assets
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem 
              onClick={handleDownloadImage}
              disabled={locked}
              className={locked ? "opacity-50 cursor-not-allowed" : ""}
            >
              <Icon name="image" className="mr-2 h-4 w-4" />
              Download Image
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDownloadVideo}
              disabled={locked}
              className={locked ? "opacity-50 cursor-not-allowed" : ""}
            >
              <Icon name="play" className="mr-2 h-4 w-4" />
              Download Video
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
