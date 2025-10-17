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

import { ClassHelper } from 'components/lib';
import Style from './image.tailwind.js';

export function Image(props){

  const imageStyle = ClassHelper(Style, props);

  return(
    <img
      src={ props.source }
      alt={ props.alt }
      title={ props.title }
      className={ imageStyle }
    />
  );
}