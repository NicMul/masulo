/***
*
*   usePermissions hook
*   fetch, format and return the user permissions
*
**********/

import { useState, useEffect } from 'react';
import { useAPI } from 'components/lib';

export function usePermissions(){

  const [state, setState] = useState({ data: null, loading: false });
  const permissions = useAPI('/api/user/permissions');

  useEffect(() => {

    setState({ loading: true });

    // format permissions
    if (permissions.data){

      let perms = [];
      Object.keys(permissions?.data).map(perm => {

        perms.push({ value: perm, label: perm });
        setState({ data: { list: perms }, loading: false });
        return perms;

      });
    }
  }, [permissions]);

  return state;

}
