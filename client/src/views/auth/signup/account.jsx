/***
*
*   SIGN UP STEP 1
*   Create the email and password.
*
**********/

import { useContext } from 'react';
import { AuthContext, SocialSignin, Form, Separator, Link } from 'components/lib';

export function Signup({ t }){

  const authContext = useContext(AuthContext);
  
  return(
    <div>

      <h1>{ t('auth.signup.account.title') }</h1>

      <SocialSignin network={['facebook', 'twitter']} signup />
      <Separator label={ t('global.social.or') }/>

      <Form
        inputs={{
          name: {
            label: t('auth.signup.account.form.name.label'),
            type: 'text',
            required: true,
            errorMessage: t('auth.signup.account.form.name.error')
          },
          email: {
            label: t('auth.signup.account.form.email.label'),
            type: 'email',
            required: true,
          },
          password: {
            label: t('auth.signup.account.form.password.label'),
            type: 'password',
            required: true,
            validation: { complex: true }
          },
          confirm_password: {
            type: 'hidden',
            value: null,
          },
        }}
        url='/api/account'
        method='POST'
        buttonText={ t('auth.signup.account.form.button') }
        callback={ authContext.signin }
      />

      <footer>
        { t('auth.signup.account.footer.text') }
        <Link url='/signin' text={ t('auth.signup.account.footer.link_text')  } />
      </footer>

    </div>
  );
}
