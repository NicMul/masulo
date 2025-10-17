/***
*
*   SIGN UP STEP 2
*   Verify email address if email verification is enabled on the server
*
**********/

import { useContext, useState, useEffect, useCallback, useRef } from 'react';
import Axios from 'axios';
import { AuthContext, ViewContext, Alert, Link, useSearchParams, useNavigate } from 'components/lib';

export function SignupVerification({ t }){

  const navigate = useNavigate();

  // context
  const authContext = useRef(useContext(AuthContext));
  const viewContext = useContext(ViewContext);
  
  // state
  const [searchParams] = useSearchParams();
  const [alert, setAlert] = useState();

  const resendVerificationEmail = useCallback(async () => {

    setAlert({

      variant: 'info',
      title: t('auth.signup.verify.message.info.title'),
      description: t('auth.signup.verify.message.info.description'),
      button: false,

    })

    await Axios({ method: 'post', url: '/api/user/verify/request' });
    viewContext.notification({ 
      
      title: t('auth.signup.verify.message.resent.title'), 
      description: t('auth.signup.verify.message.resent.description'), 
    
    });
  }, [t, viewContext]);

  const invalidToken = useCallback(() => {
    setAlert({
      
      variant: 'error',
      title: t('auth.signup.verify.message.error.title'),
      description: t('auth.signup.verify.message.error.description'),
      button: {
        text: t('auth.signup.verify.message.error.button'),
        action: resendVerificationEmail
      }
    });
  }, [t, resendVerificationEmail]);

  const verifyToken = useCallback(async (token) => {
      
    try {

      setAlert({

        variant: 'info',
        title: t('auth.signup.verify.message.verifying.title'),
        description: t('auth.signup.verify.message.verifying.description'),
        button: false,

      })

      const res = await Axios.post('/api/user/verify', { token: token });     

      // sign in again incase verification was completed on a different brower
      await authContext.current.signin(res);
    
    }
    catch (err){

      // // token isnt for this account, force signout
      if (err.response?.status === 401)
        return authContext.current.signout();

      invalidToken();

    }
  }, [t, authContext, navigate, invalidToken]);

  useEffect(() => {

    // set initial alert
    setAlert({
      variant: 'info',
      title: t('auth.signup.verify.message.info.title'),
      description: t('auth.signup.verify.message.info.description'),
      button: {
        text: t('auth.signup.verify.message.info.button'),
        action: resendVerificationEmail
      }
    });
    
    const token = searchParams.get('token');
    token && verifyToken(token);

  }, [searchParams, verifyToken, invalidToken]);

  return(
    <div>

      <h1>{ t('auth.signup.verify.title') }</h1>

      <Alert {...alert }/>

      <footer>
        <Link url='/account/profile' text={ t('auth.signup.verify.footer.link_text') } />
      </footer>

    </div>
  );
}
