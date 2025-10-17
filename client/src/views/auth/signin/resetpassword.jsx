/***
*
*   RESET PASSWORD
*   User can reset a new password.
*
**********/

import { useContext } from 'react';
import { AuthContext, Form, useNavigate, useSearchParams } from 'components/lib';

export function ResetPassword({ t }){

  const navigate = useNavigate();

  // context
  const authContext = useContext(AuthContext)

  // state
  const [searchParams] = useSearchParams();

  return(
    <div>

      <h1>{ t('auth.signin.resetpassword.title') }</h1>

      <Form
        inputs={{
          jwt: {
            type: 'hidden',
            value: searchParams.get('token'),
          },
          email: {
            label: t('auth.signin.resetpassword.form.email.label'),
            type: 'email',
            required: true
          },
          password: {
            label: t('auth.signin.resetpassword.form.password.label'),
            type: 'password',
            required: true,
            validation: { complex: true }
          }
        }}
        url='/api/auth/password/reset'
        method='POST'
        buttonText={ t('auth.signin.resetpassword.form.button') }
        callback={ res => {

          res.data['2fa_required'] ? 
            navigate(`/signin/otp?token=${res.data.token}`) : 
            authContext.signin(res);

        }}
      />
    </div>
  );
}
