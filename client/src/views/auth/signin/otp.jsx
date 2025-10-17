/***
*
*   OTP
*   User must enter a OTP here if they have enabled 2FA.
*
**********/

import { useContext, useState, useCallback } from 'react';
import { AuthContext, Form, Button, useSearchParams } from 'components/lib';

export function SigninOTP({ t }){

  // context
  const authContext = useContext(AuthContext);

  // state
  const [searchParams] = useSearchParams();
  const [codeInput, setCodeInput] = useState({

    type: 'otp',
    label: t('auth.signin.otp.form.code.label'),
    required: true

  });

  const useBackupCode = useCallback(() => {
    setCodeInput({
      ...codeInput,
      type: 'text'
    });
  }, []);

  return (
    <div>

      <h1>{ t('auth.signin.otp.title') }</h1>
      <p>{ t('auth.signin.otp.description') }</p>

      <Form 
        method='post'
        url='/api/auth/otp'
        inputs={{
          code: codeInput,
          jwt: {
            type: 'hidden',
            value: searchParams.get('token'),
          } 
        }}
        buttonText={ t('auth.signin.otp.form.code.label') }
        callback={ authContext.signin }
      />

      <footer className='flex flex-col gap-0'>

        <p className='!mb-2'>{ t('auth.signin.otp.footer.text') }</p>

        <Button variant='outline' size='sm' action={ useBackupCode }>
          { t('auth.signin.otp.footer.button') }
        </Button>

      </footer>
    </div>
  )
}