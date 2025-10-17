/***
*
*   MESSAGE
*   Colored feedback message with an optional call to action button
*
*   PROPS
*   buttonLink - url link for the button (string, optional)
*   buttonText - cta button label (string, optional)
*   children: children to render (react component(s), optional)
*   className: custom styling (SCSS or tailwind style, optional)
*   closable - let the user hide the message (boolean, optional, default: false)
*   text - text label (string, required)
*   title - title (string, optional)
*   type - info/success/warning/error (string, required)
*
**********/

import { useState } from 'react';
import { Button, Icon, ClassHelper } from 'components/lib';
import Style from './message.tailwind.js';

export function Message(props){

  // state
  const [closed, setClosed] = useState(false);
  const type = props.type || 'info';

  if (closed)
    return false;

  const icon = {

    info: 'info',
    success: 'check',
    warning: 'alert-triangle',
    error: 'alert-octagon'

  };

  const color = {

    info: 'blue',
    success: 'green',
    warning: 'orange',
    error: 'red'

  }

  // style
  const messageStyle = ClassHelper(Style, { 
    
    message: true,
    [`${color[type]}Bg`]: true,
    className: props.className, 
  
  });

  const titleStyle = ClassHelper(Style, {

    title: true,
    [`${color[type]}Text`]: true 
    
  });

  return (
    <div className= { messageStyle }>

      <Icon
        className={ Style.icon }
        size={ 30 }
        color={ color[type] }
        image={ icon[type] }
      />

      { props.closable &&
        <Button
          icon='x'
          position='absolute'
          className={ Style.close }
          action={ e => setClosed(true) }
        />
      }

      <section className={ Style.content }>

        { props.title && 
          <h1 className={ titleStyle }>
            { props.title }
          </h1> }
        
        { props.text && 
          <p>{ props.text }</p> }

        { props.children &&
          props.children }

        { (props.buttonLink || props.buttonAction) &&
          <Button
            className={ Style.btn }
            color={ color[type] }
            text={ props.buttonText }
            action={ e => { 
              
              props.buttonLink ? 
                navigate(props.buttonLink) :
                props.buttonAction?.();
            
            }}
          />
        }
     </section>
    </div>
  );
}