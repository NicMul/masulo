import { Dialog, DialogContent, DialogHeader, DialogFooter, Button } from 'components/lib';

const AcceptConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    assetType,
    t
}) => {
    const getMessage = () => {
        if (assetType === 'original') {
            return t('Accepting will replace animation for your default image. The image will not be changed.');
        } else if (assetType === 'current') {
            return t('Accepting will replace both your current image and video with the test versions.');
        } else {
            return t('Are you sure you want to accept the test assets? This action cannot be undone.');
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogContent>
                <DialogHeader>
                    <h1>{t('Accept Test Assets')}</h1>
                </DialogHeader>
                <div className="py-4">
                    <p>{getMessage()}</p>
                </div>
                <DialogFooter>
                    <Button color="gray" onClick={onClose}>
                        {t('Cancel')}
                    </Button>
                    <Button color="green" onClick={onConfirm}>
                        {t('Accept')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { AcceptConfirmationDialog };
