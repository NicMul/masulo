/***
*
*   SUB NAV
*   Sub-navigation element.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/nav
*
*   PROPS
*   items:[{ label: string, link: string, icon: string }] (array, required)
*
**********/

import { Fragment, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext, Select, Icon, useLocation, useNavigate, cn } from 'components/lib';

export function SubNav({ items }){

  const location = useLocation();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  // get the root path so the select can be set
  // on nested paths
  const parts = location.pathname.split('/');
  const rootPath = parts.length > 3 ? parts.slice(0, 3).join('/') : location.pathname;

  return(
    <Fragment>

      <div className='sm:hidden mb-4'>
        <Select 
          defaultValue={ rootPath }
          onChange={ e => navigate(e.target.value) }
          options={ items

            .filter(i => !i.permission || authContext.permission[i.permission])
            .map(i => ({ label: i.label, value: i.link }))
          
          }
        />
      </div>

      <nav className='hidden gap-y-2 mb-8 sm:flex md:max-w-[90%] flex-row flex-wrap lg:float-left lg:flex-col lg:flex-nowrap lg:mr-8'>
        { items?.filter(item => !item.permission || authContext.permission[item.permission]).map(item => {
          
          return (
            <NavLink
              key={ item.label }
              to={ item.link }
              className={({ isActive }) => cn('flex p-4 py-2 rounded-md', { ['bg-slate-200 dark:bg-primary dark:bg-opacity-50']: isActive })}>

              <Icon name={ item.icon } className='relative top-[3.5px] mr-3'/>
              <span>{ item.label }</span>

            </NavLink>
          );
        })}
      </nav>
    </Fragment>
  );
}
