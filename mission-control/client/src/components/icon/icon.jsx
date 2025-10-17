/***
*
*   ICON
*   Render an icon from feather icons or fontawesome
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   color: dark/light/grey/green/orange/blue or hex code (string, optional)
*   image: icon image to use (see: https://feathericons.com)
*
**********/

import FeatherIcon from 'feather-icons-react';

export function Icon(props){

  let color;
  
  switch (props.color){

    case 'light':
    color = '#FFFFFF';
    break;

    case 'dark':
    color = '#758197';
    break;

    case 'grey':
    color = '#ccc';
    break;

    case 'green':
    color = '#8CC57D';
    break;

    case 'blue':
    color = '#73B0F4';
    break;
    
    case 'orange':
    color = '#F0AA61'
    break;

    case 'red':
    color = '#d95565';
    break;

    case 'purple':
    color = '#6363AC';
    break;

    default:
    color = props.color;
    break;

  }

  return(
    <FeatherIcon
      color={ color }
      icon={ props.image }
      size={ props.size || 16 }
      className={ props.className }
    />
  )
}



