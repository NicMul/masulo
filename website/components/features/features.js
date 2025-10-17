/***
*
*   FEATURES
*   Feature list for use on home page
*
*   PROPS
*   list: array of objects with icon, title, text (array, required)
*
**********/

import { Grid, Icon } from 'components/lib';
import Style from './features.tailwind.js';

export function Features(props){

  return(
    <Grid cols={ 4 }>
      { props.list.map((feature, i) => {

        return (
          <div key={ i } className={ Style.feature }>

            <Icon image={ feature.icon } size={ 16 } className={ Style.icon } />
      
            <h3 className={ Style.title }>
              { feature.title }
            </h3>
            
            <p className={ Style.description }>
              { feature.description }
            </p>
    
        </div>
        )
      })}
   </Grid>
  );
}
