/***
*
*   HELPER
*   Helper bar with help icon and text/link
*
*   PROPS
*   text: text label (string, required)
*   url: link to more info (string, optional)
*
**********/

import { Icon } from 'components/lib';
import Style from './helper.tailwind.js';

export function Helper(props){

  return (
    <div className={ Style.helper }>

      <Icon 
        image={ props.icon || 'help-circle'  }
        color='#73B0F4' 
        size={ 20 } 
        className={ Style.icon }
       />

       { props.url ? 
        <a href={ props.url } className={ Style.link }>
          {  props.text }
        </a> :
        <span>{ props.text }</span>
       }

    </div>
  );
}