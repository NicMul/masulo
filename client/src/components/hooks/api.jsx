/***
*
*   useAPI hook
*   Make API calls and handle errors. Returns loading state and data.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/hooks/useapi
*
*   method: get, post, put (string, required, default: get)
*   trigger: change the trigger to re-start the call (boolean, optional)
*   url: endpoint url (string, required)
*
**********/

import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Axios from 'axios';
import { ViewContext } from 'components/lib';

export function useAPI(url, method, trigger){

  // wrap in useRef to prevent triggering useEffect multiple times  
  const context = useRef(useContext(ViewContext));
  const [state, setState] = useState({ data: null, loading: false })

  const fetch = useCallback(async () => {
    try {

      if (!url){

        setState(prev => ({ ...prev, loading: true }));
        return false;

      }

      setState({ loading: true });
      const res = await Axios({

        url: url,
        method: method || 'get',
        
      })

      setState({ data: res.data.data, loading: false });

    }
    catch (err){

      context?.current &&
      context.current.handleError(err);
      setState({ data: null, loading: false });


    }
  }, [url, method, context, trigger]);

  useEffect(() => {

    fetch()

  }, [fetch]);

  return state

}
