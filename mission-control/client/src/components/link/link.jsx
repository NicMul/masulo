/***
*
*   LINK
*   Routes a new view within the application router
*   Use this instead of <a> to avoid reloading the page
*
*   PROPS
*   children: children to render (component(s), required)
*   className: custom styling (SCSS or tailwind style, optional)
*   color: dark or light (string, optional, default: blue)
*   text: link text (string, required)
*   title: link title (string, required)
*   url: the destination (string, required)
*
**********/

import { NavLink } from 'react-router-dom';
import { ClassHelper } from 'components/lib'; 
import Style from './link.tailwind.js';

export function Link(props){

  const linkStyle = ClassHelper(Style, { 
    
    white: props.color === 'white',
    dark: props.color === 'dark',
    defaultColor: !props.color, 
    className: props.className 
  
  });

  if (props?.url?.includes('http')){
    return (
      <a href={ props.url } title={ props.title } className={ linkStyle }>
        { props.children || props.text }
      </a>
    )
  }

  return(
    <NavLink
      to={ props.url }
      className={ linkStyle }
      title={ props.title }
      activeclassname='active'>

      { props.children || props.text }

    </NavLink>

  );
}