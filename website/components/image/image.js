/***
*
*   IMAGE
*   Image wrapper
*   Import the image before passing it to this component's source prop
*
*   PROPS
*   alt: alt description (string, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   source: imported source (image, required)
*   title: description (string, required)
*
**********/

import NextImage from 'next/image';

export function Image(props){

  const data = {...props };
  data.placeholder = 'blur';
  data.blurDataURL = props.src;
  
  return (
    data.url ? 
      <a href={ data.url }>
        <NextImage {...data }/>
      </a> :
      <NextImage {...data }/>
  )
} 