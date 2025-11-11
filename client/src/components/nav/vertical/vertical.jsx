/***
*
*   VERTICAL NAV
*   Primary desktop navigation used inside the main app.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/nav
*
*   PROPS
*   items:[{ label: string, link: string, icon: string }] (array, required)
*
**********/

import { NavLink } from 'react-router-dom';
import { Logo, Button, Icon, Tooltip, TooltipTrigger, TooltipContent, cn } from 'components/lib';

export function VerticalNav({ items }){

  function renderItem(item){    

    // Handle divider
    if (item.type === 'divider') {
      return (
        <div key={`divider-${item.position}`} className="w-6 h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
      );
    }

    return (
      <Tooltip key={ item.label }>
        <TooltipTrigger asChild>

          <div>
          { item.link ? 
          
            <NavLink to={ item.link } 
              className={({ isActive }) => cn('flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8', { ['bg-accent dark:bg-transparent dark:bg-primary dark:bg-opacity-30']: isActive })}>
                <Icon name={ item.icon } size={ 18 } />
            </NavLink> :

            <Button variant='icon'  icon={ item.icon } action={ item.action }/> 
          }
          </div>

        </TooltipTrigger>
        <TooltipContent side='right'>{ item.label }</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <aside className='fixed pt-4 bg-white inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex dark:bg-slate-900 dark:border-r-slate-800'>

      <Logo mark className='w-6 h-6 mb-4' color='dark'/>

      { /* top items */ }
      <nav className='flex flex-col items-center gap-3 px-2 sm:py-5'>
        { items?.length > 0 &&
          items.map(item => {

            return item.position === 'top' ? renderItem(item) : false;
            
          })
        }
      </nav>

      { /* middle items - campaigns section */ }
      <nav className='flex flex-col items-center gap-3 px-2 sm:py-5'>
        { items?.length > 0 &&
          items.map(item => {

            return item.position === 'middle' ? renderItem(item) : false;
            
          })
        }
      </nav>

      { /* middle2 items - scraper section */ }
      <nav className='flex flex-col items-center gap-3 px-2 sm:py-5'>
        { items?.length > 0 &&
          items.map(item => {

            return item.position === 'middle2' ? renderItem(item) : false;
            
          })
        }
      </nav>

      { /* bottom items */ }
      <nav className={ cn('flex flex-col items-center gap-3 px-2 sm:py-5', 'mt-auto') }>
        { items?.length > 0 &&
          items.map(item => {

            return item.position === 'bottom' ? renderItem(item) : false;
            
          })
        }
      </nav>
    </aside>
  )
}
