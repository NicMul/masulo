/***
*
*   IMPERSONATE
*   Allows a Master account to log into a user account via Mission Control.
*   If there's no valid token a 404 is returned to avoid revealing this URL.
*
**********/

import { useContext, useEffect, useState, useRef, useCallback } from 'react';
import Axios from 'axios';
import { AuthContext, useNavigate, useSearchParams, Loader } from 'components/lib';

export function ImpersonateSignin({ t }){

  const navigate = useNavigate();

  // context
  const authContext = useRef(useContext(AuthContext));

  // state
  const [searchParams] = useSearchParams();
  const [loading] = useState(true);

  const verifyToken = useCallback(async (token) => {
    try {
  
      const res = await Axios.post('/api/auth/impersonate', { token });
      authContext.current.signin(res)
       
    }
    catch (err){

      navigate('/404');

    }
  }, [navigate])

  useEffect(() => {

    // don't reveal this URL if there is no valid token token
    const token = searchParams.get('token');
    token ? verifyToken(token) : navigate('/404');
  
  }, [searchParams, navigate, verifyToken]);

  return (
    <div>

      <h1>{ t('auth.signin.impersonate.message.title') }</h1>

      { loading &&
        <figure>
          <Loader /> 
        </figure> 
      }

    </div>
   )
}
