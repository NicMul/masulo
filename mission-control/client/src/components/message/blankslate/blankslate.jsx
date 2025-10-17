/***
*
*   BlANKSLATE MESSAGE
*   Message with a call to action – use when there is no data to display
*
*   PROPS
*   action: callback executed on button click (function, optional)
*   buttonText: button label (string, optional)
*   marginLeft: offset the left margin (string, optional)
*   marginTop: offset the top margin (string, optional)
*   text: message text (string, optional)
*   title: title (string, optional)
*
**********/

import { Button } from 'components/lib';
import Style from './blankslate.tailwind.js';

export function BlankSlateMessage(props){

  const offset = {

    ...props.marginTop && { marginTop: props.marginTop },
    ...props.marginLeft && { marginLeft: props.marginLeft }

  }

  return (
    <div className={ Style.blankslate } style={ offset }>

     { props.title &&
       <h2 className={ Style.title }>
         { props.title }
       </h2>
     }

     { props.text &&
       <p className={ Style.text }>
        { props.text }</p>
     }

     { props.action &&
       <Button 
        text={ props.buttonText } 
        action={ props.action }
        color='green' 
        className='inline-block mt-6'
      /> }

    </div>
  );
}