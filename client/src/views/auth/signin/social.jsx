/***
*
*   SOCIAL SIGN IN
*   After social authentication has been completed on the server 
*   the user is redirected back to this view to extract the
*   token and complete the signin flow.
*
**********/

import { useContext, useEffect, useCallback, useState } from 'react';
import Axios from 'axios';
import { AuthContext, Loader, Alert, useNavigate, useSearchParams } from 'components/lib';

export function SocialSignin({ t }){

  const navigate = useNavigate();

  // context - wrap in useRef to prevent triggering useEffect multiple times  
  const authContext = useContext(AuthContext);

  // state
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  const provider = searchParams.get('provider');

  const fetchToken = useCallback(async (token) => {
    try {

      const res = await Axios({ method: 'post', url: '/api/auth', data: { token }});

      res.data['2fa_required'] ? 
        navigate(`/signin/otp?token=${res.data.token}`) : 
        authContext.signin(res);
        
    }
    catch (err){

      setLoading(false);
      setShowAlert(true);

    }
  }, [navigate]);

  useEffect(() => {

    const token = searchParams.get('token');
    
    if (token){

      fetchToken(token);

    }
    else {

      setLoading(false);
      setShowAlert(true);

    }
  }, [searchParams, fetchToken]);

  return(
    <div>
      
      <h1>{ `${ t('auth.signin.social.title') } ${ provider.charAt(0).toUpperCase() + provider.slice(1) }` }</h1>

        { loading && 
          <figure>
            <Loader />
          </figure> 
        }

        { !loading && showAlert &&
          <Alert 
            variant='error'
            title={ t('auth.signin.social.message.title') }
            description={ t('auth.signin.social.message.description') }
            button={{ text: t('auth.signin.social.message.button'), url: '/signin' }}
          />
        }
    
    </div>
  );
}
