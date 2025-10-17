/***
*
*   SIGN UP (user)
*   Signup form for child users.
*
**********/

import { useContext } from 'react';
import { AuthContext, Form, Link, SocialSignin, Separator, useSearchParams } from 'components/lib';

export function SignupUser({ t }){

  // contet
  const authContext = useContext(AuthContext);

  // state
  const [searchParams] = useSearchParams();

  return(
    <div>
      
      <h1>{ t('auth.signup.user.title') }</h1>

      <SocialSignin network={['facebook', 'twitter']} invite={ searchParams.get('id') } />
      <Separator label={ t('global.social.or') }/>

      <Form
        inputs={{
          name: {
            label: t('auth.signup.user.form.name.label'),
            value: '',
            type: 'text',
            required: true,
            errorMessage: t('auth.signup.user.form.name.error'),
          },
          email: {
            label: t('auth.signup.user.form.email.label'),
            value: searchParams.get('email'),
            type: 'email',
            required: true,
          },
          password: {
            label: t('auth.signup.user.form.password.label'),
            type: 'password',
            required: true,
            validation: { complex: true }
          },
          confirm_password: {
            type: 'hidden',
            value: null,
          },
          invite_id: {
            type: 'hidden',
            value: searchParams.get('id'),
          },
        }}
        url='/api/user'
        method='POST'
        redirect='/dashboard'
        buttonText={ t('auth.signup.user.form.button') }
        callback={ authContext.signin }
      />

      <footer>
        { t('auth.signup.user.footer.text') }
        <Link url='/signin' text={ t('auth.signup.user.footer.link_text') }/>
      </footer>
        
    </div>
  );
}
