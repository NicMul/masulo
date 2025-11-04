/***
*
*   GAME MEDIA VIEW DIALOG
*   Dialog component that displays all game assets (default, current, theme, promo)
*   side-by-side with MediaPlayer components and edit buttons
*
**********/

import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from 'components/lib';
import { useNavigate } from 'components/lib';
import MediaPlayer from '../edit/MediaPlayer';

export function GameMediaViewDialog({ isOpen, onClose, game, t }) {
  const navigate = useNavigate();

  const handleEditGame = () => {
    navigate(`/edit/${game.id}`);
    onClose();
  };

  if (!game) return null;

  const assetTypes = [
    {
      key: 'default',
      title: t('games.view.dialog.default'),
      imageUrl: game.defaultImage,
      videoUrl: game.defaultVideo
    },
    {
      key: 'current',
      title: t('games.view.dialog.current'),
      imageUrl: game.currentImage,
      videoUrl: game.currentVideo
    },
    {
      key: 'theme',
      title: t('games.view.dialog.theme'),
      imageUrl: game.themeImage,
      videoUrl: game.themeVideo
    },
    {
      key: 'promotion',
      title: t('games.view.dialog.promotion'),
      imageUrl: game.promoImage,
      videoUrl: game.promoVideo
    }
  ];

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t('games.view.dialog.title')} : {game.friendlyName}</DialogTitle>
            <Button onClick={handleEditGame} className="mr-6" color="primary" icon="edit" text={t('Edit Assets')} />
          </div>
          
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-1 mt-6 mb-6">
          {assetTypes.map((assetType) => (
            <div key={assetType.key} className="flex flex-col items-center space-y-4">
              {/* Heading */}
              <h3 className="text-lg font-semibold text-center text-slate-900 dark:text-slate-100">
                {assetType.title}
              </h3>
              
              {/* MediaPlayer */}
              <div className="w-full max-w-[220px]">
                <MediaPlayer
                  gameId={game.id}
                  imageUrl={assetType.imageUrl}
                  videoUrl={assetType.videoUrl}
                  type="both"
                  readOnly={false}
                  isGenerating={false}
                  canSelect={false}
                  showPlayIcon={true}
                />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
