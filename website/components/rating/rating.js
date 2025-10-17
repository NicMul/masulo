/***
*
*   RATING
*   Star ratings for social proof
*
*   PROPS
*   className: custom class (SCSS or tailwind style, optional)
*   stars: number of stars to show (integer, required)
*   site: object with keys: name (site name), url (site, url) (object, required)
*
**********/

import { Icon } from 'components/lib';
import Style from './rating.tailwind.js';

export function Rating(props){

  const stars = new Array(props.stars).fill(true);

  return(
    <div className={ props.className }>
      
      <div className={ Style.stars }>
        { stars.map((x, i) => { 
          
          return (
            <Icon 
              key={ i }
              image='star' 
              size={ 18 }
              color={ props.color }
              fill={ props.color }
              className={ Style.star }
            /> 
          )
        })}
      </div>

      <div className={ Style.label }>

        <span>on</span>
        <a href={ props.site.url }>{ props.site.name }</a>

      </div>
    </div>
  )
}