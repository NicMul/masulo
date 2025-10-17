/***
*
*   SIGN IN
*   Sign in form for users, admins and owners.
*
**********/

import { useContext, useState, useEffect } from 'react';
import { AuthContext, ViewContext, Button, Form, Link, Separator,
  SocialSignin, useSearchParams, useNavigate } from 'components/lib';

export function Signin({ t }){

  const navigate = useNavigate();

  // context
  const authContext = useContext(AuthContext);
  const viewContext = useContext(ViewContext);
  
  // state
  const [useMagic, setUseMagic] = useState(false);
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({

    email: {
      label: t('auth.signin.index.form.email.label'),
      type: 'email',
      required: true,
    },
    password: {
      label: t('auth.signin.index.form.password.label'),
      type: 'password',
      required: true,
    }
  });

  useEffect(() => {

    // was an error message passed from the server router?
    const error = searchParams.get('error');

    if (error)
      viewContext.notification({ description: error, variant: 'error' });
  
  }, [searchParams, viewContext]);

  function toggleMagicLink(useMagic){

    const f = {...form };
    f.password.type = useMagic ? null : 'password';
    setForm(f);
    setUseMagic(useMagic);

  }

  return(
    <div>  

      <h1>{ t('auth.signin.index.title') }</h1>

      <SocialSignin network={['facebook', 'twitter']} />
      <Separator label={ t('global.social.or') }/>

      { useMagic ?
        <Button 
          text={ t('auth.signin.index.button.use_password') } 
          icon='shield' 
          size='full'
          variant='outline'
          className='mx-auto mb-5'
          action={ () => { toggleMagicLink(false) }}
        /> :
        <Button 
          text={ t('auth.signin.index.button.use_magic') }
          icon='star' 
          size='full'
          variant='outline'
          className='mx-auto mb-5'
          action={ () => { toggleMagicLink(true) }}
        />
      }

      <Form
        inputs={ form }
        method='POST'
        url={ useMagic ? '/api/auth/magic' : '/api/auth' }
        buttonText={ useMagic ? t('auth.signin.index.form.button.use_magic') : t('auth.signin.index.form.button.use_password') }
        callback={ res => {

          if (useMagic){
            viewContext.notification({ 
            
              title: t('auth.signin.index.message.title'), 
              description: t('auth.signin.index.message.description')
            
            })
          }
          else {

            res.data['2fa_required'] ? 
              navigate(`/signin/otp?token=${res.data.token}`) : 
              navigate(authContext.signin(res));

          }
        }}
      />

      <Link url='/forgotpassword' text={ t('auth.signin.index.form.forgotpassword.text') }/> 

      <footer>
        <span>{ t('auth.signin.index.footer.text') }</span>
        <Link url='/signup' text={ t('auth.signin.index.footer.link') }/>
      </footer>

    </div>
  );
}
