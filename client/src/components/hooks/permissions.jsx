/***
*
*   usePermissions hook
*   Fetch, format and return the user permissions.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/hooks/usepermissions
*
**********/

import { useState, useEffect } from 'react';
import { useAPI } from 'components/lib';

export function usePermissions(){

  const [state, setState] = useState({ data: null, loading: false });
  const permissions = useAPI('/api/user/permissions');

  useEffect(() => {

    if (permissions.loading) 
      return setState({ data: null, loading: true });

    // format permissions
    if (permissions.data){

      const perms = Object.keys(permissions.data).map(perm => ({

        value: perm,
        label: perm,

      }));

      setState({ data: { list: perms }, loading: false });

    }
  }, [permissions]);

  return state;

}
