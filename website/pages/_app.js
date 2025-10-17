import Axios from 'axios';
import '../styles/globals.css';

export default function App({ Component, pageProps }){

  Axios.defaults.baseURL = process.env.NEXT_PUBLIC_API;
  return <Component {...pageProps} />

}
