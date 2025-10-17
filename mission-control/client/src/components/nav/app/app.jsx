/***
*
*   APP NAV
*   Primary navigation used inside the main app
*
*   PROPS
*   items: array of objects containing label, link and icon (array, optional)
*
**********/

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Logo, Button, Icon, ClassHelper } from 'components/lib';
import Style from './app.tailwind.js';

export function AppNav(props){

  // state
  const [open, setOpen] = useState(false); // mobile is open
  const [expanded, setExpanded] = useState(false); // desktop is expanded

  const navStyle = ClassHelper(Style, { nav: true, expanded: expanded })
  const linksStyle = ClassHelper(Style, { links: true, open: open })

  return(
    <nav className={ navStyle }
      onMouseEnter={ e => setExpanded(true)}
      onMouseLeave={ e => setExpanded(false)}>

      <Button
        icon={ open ? 'x' : 'menu' }
        color='dark'
        size={ 16 }
        className={ Style.toggle }
        action={ e => setOpen(!open) }
      />

      <Logo mark className={ Style.logo }/>

      <section className={ linksStyle }>
        { props.items?.map(item => {
          
          if (item.link){
            return (
              <NavLink
                key={ item.label }
                to={ item.link }
                className={({ isActive }) => [Style.link, isActive ? Style.link_active : null].filter(Boolean).join(' ')}
                style={{ width: (100/props.items.length) + '%' }}>

                { item.icon &&
                  <Icon
                    className={ Style.icon }
                    image={ item.icon }
                    size={ open ? 15 : 18 }
                    color={ open ? 'dark' : 'light' }
                  />
                }
                { item.label &&
                  <span className={ Style.label }>
                  { item.label }
                  </span>
                }

              </NavLink>
            );
          }

          return (
            <div key={ item.label } onClick={ item.action } className={ Style.link }>
              
              { item.icon &&
                <Icon
                  className={ Style.icon }
                  image={ item.icon }
                  size={ open ? 15 : 18 }
                  color={ open ? 'dark' : 'light' }
                />
              }
              { item.label &&
                <span className={ Style.label }>
                  { item.label }
                </span>
              }
            </div>
          )
        })}
      </section>
    </nav>
  );
}
