/***
*
*   STAT
*   Statistic value with optional icon and -/+ change value.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/stat
*
*   PROPS
*   change: positive/negative number indicating change amount (integer, optional)
*   className: custom styling (SCSS or tailwind style, optional)
*   icon: icon (string, optional)
*   label: value label (string, required)
*   value: numeric value (integer or string, required)
*
**********/

import { Icon } from 'components/lib';

export function Stat({ value, label, change, icon, className }){

  const changeUp = change?.toString().includes('-') ? false : true;

  return(
    <div className={ className }>

      <header className='flex justify-between items-center'>

        { label && 
          <div className='capitalize text-sm'>
            { label }
          </div> 
        }

        { icon &&
          <Icon name={ icon } size={ 14 } className='dark:text-slate-50' />
        }

      </header>

      <div className='flex justify-between'>

        { value != undefined && 
          <div className='text-3xl font-bold text-slate-700 dark:text-slate-50'>
            { value }
          </div>
        }

        { change && 
          <div className='flex items-center gap-x-1'>

            <Icon   
              size={ 14 }
              color={ changeUp ? 'green' : 'red' }
              name={ changeUp ? 'circle-arrow-up' : 'circle-arrow-down' } 
            />

            <div>
              { change }
            </div>

          </div>
        }
      </div> 
    </div>
  );
}