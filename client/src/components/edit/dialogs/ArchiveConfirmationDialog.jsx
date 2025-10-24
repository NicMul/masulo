import { Dialog, DialogContent, DialogHeader, DialogFooter, Button, Icon } from 'components/lib';

const ArchiveConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    isArchiving,
    t
}) => {
    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogContent>
                <DialogHeader>
                    <h1>{t('Archive Test Assets')}</h1>
                </DialogHeader>
                <div className="py-4">
                    <p>
                        {t('All test assets will be moved to the archive folder and deleted from the test directory. Archived files can be accessed later if needed. This will clear all test assets from this game.')}
                    </p>
                </div>
                <DialogFooter>
                    <Button color="gray" onClick={onClose}>
                        {t('Cancel')}
                    </Button>
                    <Button 
                        color="orange" 
                        onClick={onConfirm}
                        disabled={isArchiving}
                    >
                        {isArchiving && (
                            <Icon name="loader-2" size={16} className="mr-2 animate-spin" />
                        )}
                        {t('Archive')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { ArchiveConfirmationDialog };
