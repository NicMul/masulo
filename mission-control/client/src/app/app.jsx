import Axios from 'axios';

// components
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute, AuthProvider } from './auth';
import { View } from 'components/lib';
import { NotFound } from 'views/404';
import Settings from 'settings';

// tailwind css
import '../css/output.css';

// routes 
import AppRoutes from 'routes';
import SetupRoutes from 'routes/setup'

const routes = [

  ...AppRoutes,
  ...SetupRoutes,

]

export default function App(props){

  const user = JSON.parse(localStorage.getItem('user'));
  Axios.defaults.baseURL = Settings[process.env.NODE_ENV].server_url || 'http://localhost:5001';

  if (user){
    if (user.token){

      // add auth token to api header calls
      Axios.defaults.headers.common['Authorization'] = 'Bearer ' + user.token;

    }
   
    // set the color mode
    user.dark_mode ?
      document.getElementById('app').classList.add('dark') :
      document.getElementById('app').classList.remove('dark');

  }

  // render the routes
  return(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          { routes.map(route => {

            return (
              <Route 
                key={ route.path } 
                path={ route.path }
                element={ 
                  
                  route.permission ? 
                    <PrivateRoute permission={ route.permission }>
                      <View display={ route.view } layout={ route.layout } title={ route.title }/>
                    </PrivateRoute> :
                    <View display={ route.view } layout={ route.layout } title={ route.title  }/>

                }
              />
            )
            })}

            { /* 404 */}
            <Route path='*' element={ <View display={ NotFound } layout='home' title='404 Not Found' /> }/>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
