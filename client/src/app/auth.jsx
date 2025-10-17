/***
*
*   AUTHENTICATION
*   Auth provider to manage auth functions throughout
*   the application. <PrivateRoute> component to
*   protect internal application routes from unauthenticated
*   access.
*
**********/

import { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext, useAPI, Event } from 'components/lib';
import { Navigate } from 'react-router-dom';

// auth context
import permissions from './permissions'; 

export function AuthProvider(props){

  const cache = JSON.parse(localStorage.getItem('user'));
  const [user, setUser] = useState(cache);
  const auth = useAPI(user ? '/api/auth' : null);

  useEffect(() => {

    // update the auth status
    if (!auth.loading && auth.data){

      auth.data.authenticated ? 
        update(auth.data) : signout();

    }
  }, [auth]);

  function signin(res){

    if (res.data){

      localStorage.setItem('user', JSON.stringify(res.data));
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.token;
      Event({ name: 'signin' });

      if (!res.data.verified)
        return window.location = '/signup/verify';

      if (!res.data.plan)
        return window.location = '/signup/plan';

      return window.location = res.data.onboarded ? '/dashboard' : '/welcome';

    }
  }

  async function signout(){

    axios({ method: 'delete', url: '/api/auth' });
    localStorage.clear();
    window.location.reload();
    return window.location.replace('/signin');

  }

  async function switchAccount(id){

    const res = await axios({ 
      
      method: 'post', 
      url: '/api/auth/switch',
      data: { account: id }
    
    });

    if (res.data)
      signin(res)

  }

  function update(data){

    if (localStorage.getItem('user')){

      let user = JSON.parse(localStorage.getItem('user'));
      for (let key in data){

        if (Array.isArray(data[key])){
       
          user[key] = data[key]

        }
        else if (typeof data[key] === 'object'){
          for (let innerKey in data[key]){

            user[key][innerKey] = data[key][innerKey]

          }
        }
        else {
          
          user[key] = data[key];

        }
      }

      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

    }
  }

  return (
    <AuthContext.Provider value={{

      user: user,
      signin: signin,
      signout: signout,
      update: update,
      switchAccount: switchAccount,
      permission: permissions[user?.permission]

    }}

    {...props} />
  );
}

// custom route object checks for an auth token before
// rendering the route – redirects if token is not present
export function PrivateRoute(props){

  // check user exists
  const user = JSON.parse(localStorage.getItem('user'));
  const path = window.location.pathname;
  const permittedRoutes = ['/account/billing', '/signup/plan', '/account/upgrade', '/account', '/account/profile']

  if (user?.token){
    if (permissions[user.permission][props.permission]){

      if (user.verified){

        // user has no plan
        if (!user.plan && path !== '/account/profile' && path !== '/signup/plan')
          return <Navigate to='/signup/plan' />;

        // user has no subscription
        if ((user.subscription !== 'active' && user.subscription !== 'trialing') && user.permission !== 'master' && !permittedRoutes.includes(path))
          return <Navigate to='/account/billing' />

        // hide verified view if user is verified
        if (path === '/signup/verify')  
          return <Navigate to='/dashboard' />

      }
      else {

        // user is not verified
        if (path !== '/account/profile' && path !== '/signup/verify')
          return <Navigate to='/signup/verify' />;

      }

      // user is good
      return props.children;

    }
  }

  // user is not authenticated
  return <Navigate to='/signin' />;

}
