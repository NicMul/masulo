/***
*
*   HOME NAV
*   Header navigation with pricing, sign-in and sign-up links
*
*   PROPS
*   transparent: remove the background color (boolean, optional)
*
**********/

import { useState } from 'react';
import { Row, Logo, Glass, Button } from 'components/lib';
import Link from 'next/link';
import Style from './nav.tailwind.js';

import Items from 'content/nav';

export function Nav(props){

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <Row color='dark' className={ Style.wrapper }>

      <Logo className={ Style.logo }/>

      { !mobileNavOpen &&
        <Button 
          icon='menu'
          iconColor='light'
          size={ 24 }
          title='Open Nav' 
          position='absolute'
          className={ Style.toggleButtonOpen } 
          action={ () => setMobileNavOpen(true) }
        /> }

        <nav className={ Style.nav }>

          <div className={ Style.desktop }>
            <Links />
          </div>

          { mobileNavOpen &&
            <div className={ Style.mobile }>
              <Glass>

                <Links/>
                <Button 
                  icon='x'
                  iconColor='dark'
                  size={ 24 }
                  title='Open Nav' 
                  position='absolute'
                  className={ Style.toggleButtonClosed } 
                  action={ () => setMobileNavOpen(false) }
                />

              </Glass>
            </div> } 

        </nav>
    </Row>
  )
}

function Links(props){
  
  return (
    <nav className={ Style.links }>
      { Items.map(item => {

        if (item.type === 'text'){
          return (
            <Link 
              href={ item.url }
              key={ item.name } 
              className={ Style.link }>

              { item.name }

            </Link>
          )
        }
        else if (item.type === 'button'){
          return (
            <Button 
              small
              key={ item.name }
              text={ item.name }
              url={ item.url }
              className={ Style.button }
            />
          )
        }
       })}
    </nav>
  )
}