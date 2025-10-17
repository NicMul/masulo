/***
*
*   IMAGE
*   Image wrapper - import the image before passing it to the src prop.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/image
*
*   PROPS
*   alt: alt description (string, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   src: imported source (image, required)
*   title: description (string, required)
*
**********/

import { cn } from 'components/lib';

export function Image({ className, src, alt, title }){

  return <img src={ src } alt={ alt } title={ title } className={ cn('max-w-full', className) }/> 
  
}