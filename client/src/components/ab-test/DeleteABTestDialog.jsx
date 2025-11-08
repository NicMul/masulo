import { Dialog, DialogContent, DialogHeader, DialogFooter, Button } from 'components/lib';

const DeleteABTestDialog = ({
    isOpen,
    onClose,
    onConfirm,
    abTestName,
    t
}) => {
    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogContent>
                <DialogHeader>
                    <h1>{t('Delete AB Test')}</h1>
                </DialogHeader>
                <div className="py-4">
                    <p>
                        {t('Are you sure you want to delete')} <strong>"{abTestName}"</strong>? 
                        {' '}{t('This action cannot be undone.')}
                    </p>
                </div>
                <DialogFooter>
                    <Button color="gray" onClick={onClose}>
                        {t('Cancel')}
                    </Button>
                    <Button color="red" onClick={onConfirm}>
                        {t('Delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { DeleteABTestDialog };

