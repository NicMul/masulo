/***
*
*   useAPI hook
*   Interact with API calls – handle errors, return loading state and data
*
*   PROPS
*   method: get, post, put (string, required, default: get)
*   url: endpoint url (string, required)
*
**********/

import { useState, useEffect, useCallback } from 'react';
import Axios from 'axios';

export function useAPI(url, method, body){

  // context & state
  const [state, setState] = useState({ data: null, loading: false });

  const fetch = useCallback(async () => {
    try {

      if (!url){

        setState({ data: null, loading: false });
        return false;

      }

      setState({ loading: true });
      const res = await Axios({

        url: url,
        method: method || 'get',
        body: body

      });

      setState({ data: res.data.data, loading: false });

    }
    catch (err){

      console.error(err);

    }
  }, [url, method, body]);

  useEffect(() => {

    fetch();

  }, [fetch]);

  return state

}
