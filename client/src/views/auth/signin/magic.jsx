/***
*
*   MAGIC SIGN IN
*   Confirms magic token and redirects to dashboard if successful.
*
**********/

import { useState, useContext, useEffect, useCallback } from 'react';
import Axios from 'axios';
import { AuthContext, Alert, Loader, useNavigate, useSearchParams } from 'components/lib';

export function MagicSignin({ t }){

  const navigate = useNavigate();

  // context
  const authContext = useContext(AuthContext);

  // state
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState();

  const invalidToken = useCallback(() => {

    setLoading(false);

    setAlert({
        
      variant: 'error',
      title: t('auth.signin.magic.message.error.title'),
      button: {
        text: t('auth.signin.magic.message.error.button'),
        url: '/signin'
      }
    });
  }, [t]);

  // verify the token
  const verifyToken = useCallback(async (token) => {
    try {

      const res = await Axios.post('/api/auth/magic/verify', { token });

      res.data['2fa_required'] ? 
        navigate(`/signin/otp?token=${res.data.token}`) :
        authContext.signin(res);
       
    }
    catch (err){

      invalidToken();

    }
  }, [navigate, invalidToken]);

  useEffect(() => {

    const token = searchParams.get('token');
    token ? verifyToken(token) : invalidToken();
  
  }, [searchParams, navigate, verifyToken, invalidToken]);

  return (
    <div>
        
      <h1>{ t('auth.signin.magic.message.success.title') }</h1>

      { loading &&
        <figure>
          <Loader />
        </figure> 
      }
      
      { !loading && alert &&
        <Alert {...alert }/> 
      }

    </div>
   )
}
