import Axios from 'axios';
import i18n from 'i18next';

// components
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute, AuthProvider } from './auth';
import { View } from 'components/lib';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { initReactI18next } from 'react-i18next';

// routes
import SetupRoutes from 'routes/setup';
import AccountRoutes from 'routes/account';
import AppRoutes from 'routes/app';
import AuthRoutes from 'routes/auth';

// locales
import English from 'locales/en/index';
import Spanish from 'locales/es/index'

// views
import { NotFound } from 'views/error/404';

// tailwind css
import '../css/output.css';

// settings
import Settings from 'settings.json';
const StripePromise = loadStripe(Settings[process.env.NODE_ENV].stripe.publishableAPIKey);

const routes = [

  ...SetupRoutes,
  ...AccountRoutes, 
  ...AppRoutes,
  ...AuthRoutes,

]

export default function App(props){

  const user = JSON.parse(localStorage.getItem('user'));
  Axios.defaults.baseURL = Settings[process.env.NODE_ENV].server_url;
  
  if (user){
    if (user.token){
  
      // add auth token to api header calls
      Axios.defaults.headers.common['Authorization'] = 'Bearer ' + user.token;
      Axios.defaults.headers.common['Accept-Language'] = user.locale;

    }
  
    // set the color mode
    user.dark_mode ?
      document.getElementById('app').classList.add('dark') :
      document.getElementById('app').classList.remove('dark');

  }

  // config locale/language
  i18n.use(initReactI18next).init({

    resources: {
      en: English,
      es: Spanish
    },
    lng: user?.locale, 
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

  // render the routes
  return(
    <Elements stripe={ StripePromise }>
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
                    
                      <PrivateRoute { ...route }>
                        <View { ...route }/>
                      </PrivateRoute> :

                      <View {...route }/>

                  }
                />
              )
            })}

            { /* 404 */}
            <Route path='*' element={ <View view={ NotFound } layout='auth' title='404 Not Found' /> }/>

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Elements>
  );
}
