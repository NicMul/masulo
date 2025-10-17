/***
*
*   HEADER
*   Header section with main title
*
*   PROPS
*   children: children to render (component(s), optional)
*   title: title of the view (string, optional)
*
**********/

import { useContext } from 'react';
import { Form, AuthContext } from 'components/lib';
import Style from './header.tailwind.js';

export function Header(props){
    
  const authContext = useContext(AuthContext);

  return (
    <header className={ Style.header }>

      { props.title && 
        <h1 className={ Style.title }>{ props.title }</h1> }

      { props.children }

      <Form 
        method='patch'
        url='/api/user'
        className={ Style.dark_mode_switch }
        updateOnChange
        submitOnChange
        inputs={{
          dark_mode: {
            type: 'switch',
            label: '🌙',
            default: authContext.user.dark_mode
          }
        }}
        onChange={ data => {
          
          authContext.update({ dark_mode: data.value })

          data.value ?
            document.getElementById('app').classList.add('dark') :
            document.getElementById('app').classList.remove('dark');

        }}/>

    </header>
  );
}
