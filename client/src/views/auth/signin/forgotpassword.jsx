/***
*
*   FORGOT PASSWORD
*   Start the password reset process.
*
**********/

import { Form, Link } from 'components/lib';

export function ForgotPassword({ t }){

  return(
    <div>

      <h1>{ t('auth.signin.forgotpassword.title') }</h1>
      <p>{ t('auth.signin.forgotpassword.description') }</p>

      <Form
        inputs={{
          email: {
            label: t('auth.signin.forgotpassword.form.email.label'),
            type: 'email',
            required: true
          }
        }}
        url='/api/auth/password/reset/request'
        method='POST'
        buttonText={ t('auth.signin.forgotpassword.form.button') }
      />

      <Link url='/signin' text={ t('auth.signin.forgotpassword.back_link') }/> 

    </div>
  );
}
