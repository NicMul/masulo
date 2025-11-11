/***
*
*   LOADER
*   Infinite spinning animation for loading states.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/loader
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
* 
**********/

import { cn, Icon } from 'components/lib';

export function Loader({ className }){

  return <Icon name='loader-circle' className={ cn('absolute top-1/2 left-1/2 mt-[-11px] ml-[-11px] w-[22px] h-[22px] animate-spin', className) }/>

}