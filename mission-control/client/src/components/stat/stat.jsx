/***
*
*   STAT
*   Statistic value with optional icon and -/+ change value
*
*   PROPS
*   change: positive/negative number indicating change amount (integer, optional)
*   className: custom styling (SCSS or tailwind style, optional)
*   icon: icon to use (string, optional)
*   label: the value label (string, required)
*   loading: toggle loading animation (boolean, optional)
*   value: numeric value (integer or string, required)
*
**********/

import { Fragment } from 'react';
import { Card, Icon, Loader, ClassHelper } from 'components/lib';
import Style from './stat.tailwind.js';

export function Stat(props){

  const changeUp = props.change?.toString().includes('-') ? false : true;
  const statStyle = ClassHelper(Style, {

    stat: true, 
    className: props.className

  })

  return(
    <Card>
      <div className={ statStyle }>

        { props.loading || props.value === undefined ?
        <Loader /> :
        <Fragment>

          { props.icon &&
            <Icon
              color='dark'
              image={ props.icon }
              size={ 20 }
              className={ Style.icon }
            />
          }

          <div className={ Style.value }>{ props.value }</div>
          <div className={ Style.label }>{ props.label }</div>

          { props.change &&
            <div className={ Style.change }>

              { props.change }

              <Icon   
                color={ changeUp ? 'green' : 'red' }
                image={ changeUp ? 'arrow-up' : 'arrow-down' } 
                className={ Style.changeIcon }
              />

            </div>
          }

        </Fragment> }
      </div>
    </Card>
  );
}