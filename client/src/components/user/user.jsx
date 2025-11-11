/***
*
*   USER
*   Shows the current user name and avatar.
*   If user belongs to more than one account, they can switch accounts here.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/user
*
**********/

import { Fragment, useContext, useCallback } from 'react';
import Axios from 'axios';
import i18n from 'i18next';

import { AuthContext, Avatar, Button, ViewContext, DropdownMenuSub, DropdownMenuSubTrigger,
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuPortal,
  DropdownMenuSubContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuCheckboxItem } from 'components/lib';

import { GB, ES } from 'country-flag-icons/react/3x2'
import Settings from 'settings.json';

export function User(){

  // context
  const authContext = useContext(AuthContext);
  const viewContext = useContext(ViewContext);

  const flags = { en: GB, es: ES }
  const Locales = Settings[process.env.NODE_ENV].locales;
  const darkMode = authContext.user.dark_mode;

  const changeLocale = useCallback((locale) => {

    Axios.defaults.headers.common['Accept-Language'] = locale;
    i18n.changeLanguage(locale);
    authContext.update({ locale })

  }, [i18n]);

  const toggleDarkMode = useCallback(async () => {

    authContext.update({ dark_mode: !darkMode })

    !darkMode ?
      document.getElementById('app').classList.add('dark') :
      document.getElementById('app').classList.remove('dark');

    await Axios({ 
    
      method: 'patch', 
      url: '/api/user', 
      data: { dark_mode: !darkMode }
    
    });

  }, [darkMode]);

  return (
    <div className='self-end'>

      <DropdownMenu>

        <DropdownMenuTrigger asChild>
          <Avatar 
            src={ authContext.user.avatar } 
            fallback={ authContext.user.name.charAt(0) } 
            className='w-7 h-7 md:w-9 md:h-9 cursor-pointer'
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end'>

          { authContext.user.accounts.length > 1 && 
            <Fragment>
              
              <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
        
              <DropdownMenuGroup>
                { authContext.user.accounts.map(account => {

                  return (
                    <DropdownMenuItem key={ account.id }>
                      <span onClick={ () => { 
                        
                        viewContext.setLoading(true);
                        authContext.switchAccount(account.id);
                        
                      }}>
                      { account.name }
                      </span>
                    </DropdownMenuItem>
                  );
                  
                })}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

            </Fragment>
          }

          <DropdownMenuItem>
            <Button 
              variant='naked' 
              icon='user' 
              text='Edit Account' 
              url='/account/profile'
            />
          </DropdownMenuItem>

          { Locales &&
            <DropdownMenuSub>

                <DropdownMenuSubTrigger>
                  <Button 
                    variant='naked' 
                    icon='globe' 
                    text='Language' 
                  />
              </DropdownMenuSubTrigger>

              <DropdownMenuPortal>
                <DropdownMenuSubContent>

                  { Locales.map(locale => {

                    const Flag = flags[locale.value];

                    return (
                      <DropdownMenuCheckboxItem 
                        key={ locale.value } 
                        checked={ i18n.resolvedLanguage === locale.value }>
                          
                          <Flag className='w-4 self-center mr-2'/>

                          <Button
                            variant='naked'
                            text={ locale.label }
                            action={ () => changeLocale(locale.value) }
                          />

                      </DropdownMenuCheckboxItem>
                    );
                  })}
            
                </DropdownMenuSubContent>
              </DropdownMenuPortal> 
            </DropdownMenuSub> 
          }

          <DropdownMenuItem>
          <Button 
              variant='naked' 
              icon='help-circle' 
              text='Help' 
              url='/help'
            />
          </DropdownMenuItem>

          <DropdownMenuItem>
          <Button 
              variant='naked' 
              text={ darkMode ? 'Light mode' : 'Dark mode' }
              icon={ darkMode ? 'sun' : 'moon' }
              action={ () => toggleDarkMode() }
            />
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <Button 
              text='Signout' 
              icon='log-out' 
              variant='naked' 
              action={ authContext.signout }
            />
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu> 
    </div>
  )
}