import { Button, Icon } from 'components/lib';
import { useTranslation } from 'react-i18next';

const Controls = ({ isPlaying, onPlay, onPause, onReset, onApply, onPlaySelection, canApply = true }) => {
    const { t } = useTranslation();
    
    return (
        <div className='flex gap-2 h-full flex-col'>
            <div className='flex gap-2 flex-wrap'>
            <Button
                onClick={isPlaying ? onPause : onPlay}
                variant='outline'
                size='sm'
            >
                <Icon name={isPlaying ? 'pause' : 'play'} size={16} className='mr-2' />
                {isPlaying ? t('edit.regenerate.dialog.trim.pause') : t('edit.regenerate.dialog.trim.play')}
            </Button>
            
            {/* <Button
                onClick={onPlaySelection}
                variant='outline'
                size='sm'
            >
                <Icon name='play' size={16} className='mr-2' />
                {t('edit.regenerate.dialog.trim.playSelection')}
            </Button> */}
            
            <Button
                onClick={onReset}
                variant='outline'
                size='sm'
            >
                <Icon name='rotate-ccw' size={16} className='mr-2' />
                {t('edit.regenerate.dialog.trim.resetTrim')}
            </Button>
            </div>
            
            <div className='flex gap-2 flex-wrap'>
            <Button
                className='w-full'
                onClick={onApply}
                disabled={!canApply}
                color='green'
                size='sm'
            >
                <Icon name='check' size={16} className='mr-2' />
                {t('edit.regenerate.dialog.trim.applyTrim')}
            </Button>
            </div>
            
        </div>
    );
};

export default Controls;

