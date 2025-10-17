/***
*
*   NOTIFICATIONS
*   Enable 2FA on a user account.
*
**********/


import { Fragment, useState, useEffect, useCallback, memo } from 'react';
import { Animate, Card, Row, Form, Image, Label, Input, Alert, useAPI } from 'components/lib';

export function TwoFA({ t }){

  // state
  const [qrCode, setQrCode] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [backupCode, setBackupCode] = useState(null);

  // fetch
  const user = useAPI('/api/user');

  // 2fa enabled callback
  const enableCallback = useCallback((enabled, qr) => {

    setQrCode(qr);
    setEnabled(enabled);

  }, []);

  // qr callback
  const qrCallback = useCallback((backupCode) => {

    setQrCode(null);
    setBackupCode(backupCode)

  }, []);

  return (      
    <Animate>
      <Row width='lg'>
        <Card title={ t('account.2fa.subtitle') } loading={ user.loading }>
    
          { /* switch to enable 2fa */ }
          <Enable2FA 
            t={ t } 
            enabled={ user.data?.['2fa_enabled'] } // set based on stored user data
            callback={ enableCallback }
          />
      
          { /* show qr code + 2fa input verification */ }
          { qrCode ?
            <QRCode 
              t={ t }
              qrCode={ qrCode } 
              callback={ qrCallback }
            /> : 
            <Fragment>

              { /* if 2fa is enabled show backup code, otherwise show enable 2fa warning message */ }
              { enabled ?
                <Fragment>

                  { backupCode ?
                    <BackupCode t={ t } backupCode={ backupCode }/> : 

                    <Alert 
                      variant='success'
                      title={ t('account.2fa.message.2fa_enabled.title') }
                      description={ t('account.2fa.message.2fa_enabled.text') }
                    /> 
                  }

                </Fragment> :

                <Alert
                  variant='warning'
                  title={ t('account.2fa.message.enable_2fa.title') }
                  description={ t('account.2fa.message.enable_2fa.text') }
                />
              }
            </Fragment>
          }
        </Card>
      </Row>
    </Animate>
  )
}

const Enable2FA = memo(function Enable2FA({ enabled, t, callback }) {

  return (
    <Row>
      <Form 
        url='/api/user/2fa'
        method='put'
        submitOnChange
        inputs={{
          '2fa_enabled': {
            type: 'switch',
            label: t('account.2fa.form.2fa_enabled.label'),
            defaultValue: enabled,
          }
        }}
        callback={ res => {
          
          if (res.data.data['2fa_enabled'] !== enabled) 
            callback(res.data.data['2fa_enabled'], res.data.data.qr_code);
          
        }}
      />
    </Row>
  )
});

function QRCode({ qrCode, t, callback }){

  return (
    <Fragment>
            
      <Row>
        <Alert 
          variant='info'
          title={ t('account.2fa.message.scan_qr_code.title') }
          description={ t('account.2fa.message.scan_qr_code.text') }
        />
      </Row>

      <Row>
        <Image src={ qrCode } alt='2FA QR code'/>
      </Row>

      <Form 
        method='post'
        url='/api/user/2fa/verify'
        buttonText={ t('account.2fa.form.button') }
        inputs={{
          code: {
            label: t('account.2fa.form.code.label'),
            type: 'otp',
            required: true,
          }
        }}
        callback={ res => callback(res.data.data.backup_code) }
      />
      
    </Fragment>
  )
}

function BackupCode({ t, backupCode }){

  return (
    <Fragment>
    
      <Row cols={ 1 }>
        <div>
          <Label>Backup code</Label>
          <Input value={ backupCode }/>
        </div>
      </Row>

      <Alert 
        variant='success'
        title={ t('account.2fa.message.backup_code.title') }
        description={ t('account.2fa.message.backup_code.text') }
      /> 

    </Fragment>
  )
}