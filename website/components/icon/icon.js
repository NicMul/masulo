/***
*
*   ICON
*   Render an icon from feather icons or fontawesome
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   color: dark/light/grey/green/orange/blue or hex code (string, optional)
*   image: icon image to use (see: https://feathericons.com or https://fontawesome.com)
*   pack: icon pack to use (string, optional, default: feather)
*
**********/

import FeatherIcon from 'feather-icons-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';

export function Icon(props){

  let color;
  
  const packs = {

    fontawesome: FontAwesomeIcon,
    feather: FeatherIcon
  
  }

  switch (props.color){

    case 'light':
    color = '#FFFFFF';
    break;

    case 'dark':
    color = '#17202d';
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

  if (props.pack === 'fontawesome')
    library.add(fab);

  const Icon = packs[props.pack || 'feather'];

  return(
    <Icon
      color={ color }
      icon={ props.image }
      size={ props.size || 16 }
      fill={ props.fill ? color : 'transparent' }  
      className={ props.className }
    />
  )
}

