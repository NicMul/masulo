/***
*
*   NOTIFICATION
*   Banner notification that appears at the top of the screen.
*   Create a notification anytime using context.notification.show()
*   pass the below params to this method
*
*   PARAMS
*   autoclose - determine if the notification disappears automatically (boolean, optional, default: false)
*   message: message text (string, required)
*   type - success/error/warning/info (string, required)
*
**********/

import { useContext } from 'react';
import { ViewContext, Button, Icon } from 'components/lib';
import { CSSTransition } from 'react-transition-group';
import './notification.scss';

export function Notification(props){

  const context = useContext(ViewContext);
  const data = context.notification.data;
  let _class = 'notification';
  if (props.format) _class += ` ${props.format}`;
  
  return(
    <CSSTransition in appear timeout={ 0 } classNames={ _class }>
      <div className={`notification ${props.type} ${props.format || ''} ${data.icon ? 'with-icon' : ''}`}>

        { data.icon && 
          <Icon 
            size={ 19 }
            color='dark' 
            image={ data.icon } 
         />
        }
        
        <p>{ data.text }</p>
        
        { !data.autoclose &&

          <Button
            className='btn-close-notification'
            icon='x'
            color={ props.format === 'toast' ? 'dark' : 'light' }
            action={ context.notification.hide }
          />
        }

      </div>
    </CSSTransition>
  );
}
