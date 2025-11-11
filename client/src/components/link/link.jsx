/***
*
*   LINK
*   Routes a new view within the application router.
*   Use this instead of <a> to avoid reloading the page.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/link
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
import { cn } from 'components/lib'; 

export function Link({ className, color, url, title, text, children }){

  const colors = {
    white: 'text-white',
    dark: 'text-slate-500 dark:text-slate-50'
  }
    
  if (url?.includes('http')){
    return (
      <a href={ url } title={ title } className={ cn('underline text-primary dark:text-slate-50', colors[color], className) }>
        { children || text }
      </a>
    )
  }

  return(
    <NavLink
      to={ url }
      className={ cn('underline text-primary dark:text-slate-50', colors[color], className) }
      title={ title }
      activeclassname='active'>

      { children || text }

    </NavLink>
  );
}