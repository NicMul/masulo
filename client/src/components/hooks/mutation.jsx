/***
*
*   useMutation hook
*   Make API calls with data (POST, PATCH, PUT, DELETE) and handle errors. Returns loading state and execute function.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/hooks/usemutation
*
*   method: post, patch, put, delete (string, required)
*   baseUrl: base endpoint url (string, required)
*
*   USAGE:
*   const createUser = useMutation('/api/user', 'POST');
*   const updateUser = useMutation('/api/user', 'PATCH');
*   
*   // Execute with data
*   const result = await createUser.execute({ name: 'John', email: 'john@example.com' });
*   
*   // Execute with custom URL (for updates with ID)
*   const result = await updateUser.execute({ name: 'Jane' }, '/api/user/123');
*
**********/

import { useState, useContext, useCallback, useRef } from 'react';
import Axios from 'axios';
import { ViewContext } from 'components/lib';

export function useMutation(baseUrl, method){

  // wrap in useRef to prevent triggering useEffect multiple times  
  const context = useRef(useContext(ViewContext));
  const [state, setState] = useState({ loading: false, data: null, error: null });

  const execute = useCallback(async (data = null, url = null) => {
    try {

      const requestUrl = url || baseUrl;
      
      if (!requestUrl){
        setState({ loading: false, data: null, error: 'No URL provided' });
        return false;
      }

      if (!method){
        setState({ loading: false, data: null, error: 'No method provided' });
        return false;
      }

      setState({ loading: true, data: null, error: null });
      
      const config = {
        url: requestUrl,
        method: method.toLowerCase(),
      };

      // Add data for POST, PATCH, PUT requests
      if (data && ['post', 'patch', 'put'].includes(method.toLowerCase())) {
        config.data = data;
      }

      const res = await Axios(config);

      setState({ loading: false, data: res.data, error: null });
      return res.data;

    }
    catch (err){

      context?.current &&
      context.current.handleError(err);
      
      setState({ loading: false, data: null, error: err });
      return false;

    }
  }, [baseUrl, method, context]);

  return { ...state, execute };

}
