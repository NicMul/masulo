/***
*
*   AUTH LAYOUT
*   Layout for the signup/signin pages
*
*   PROPS
*   children: will be passed from router > view > here (component(s), required)
*
**********/

import { AuthNav } from 'components/lib';
import Style from './auth.tailwind.js';

export function AuthLayout(props){

  return (
    <main className={ Style.auth }>
      <AuthNav />
      { <props.children {...props.data }/> }
    </main>
  );
}