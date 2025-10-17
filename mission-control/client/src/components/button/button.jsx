/***
*
*   BUTTON
*   Standard button, icon button, text button or with loading animation
*
*   PROPS
*   action: callback function executed on click (function)
*   alignLeft: align the icon left (boolean, optional)
*   alignRight: align the icon right (boolean, optional)
*   big: render a big button (boolean, optional)
*   className: custom class (SCSS or tailwind style, optional)
*   color: red/blue/green (string, default: green)
*   fillIcon: use a solid icon (boolean, optional)
*   fullWidth: extend to full width of parent container (boolean, optional)
*   goto: url to go to instead of using action (string)
*   icon: icon image (string, optional)
*   iconButton: create an icon button (boolean, optional)
*   iconPack: icon pack to use (string, optional, default: feather)
*   iconSize: icon size (integer, optional, default: 18)
*   loading: toggle loading animation (boolean, optional)
*   outline: outline button with no background (boolean, optional)
*   params: object passed to the callback function (object, optional)
*   position: css relative or absolute position (string, optional, default: relative)
*   rounded: pill button (boolean, optional)
*   small: render a small button (boolean, optional)
*   text: button label (string, required)
*   textOnly: render a text-only button (boolean, optional)
*   title: text that appears on hover (string, optional)
*
**********/

import { Fragment } from 'react';
import { Icon, ClassHelper, useNavigate } from 'components/lib';

import ButtonStyle from './button.tailwind.js';
import IconStyle from './icon.tailwind.js';

export function Button(props){

  const navigate = useNavigate();

  const buttonStyle = ClassHelper(ButtonStyle, {...props, ...{

    [props.color]: props.color,  
    [props.position || 'relative']: true,
    text: props.textOnly, 
    iconButton: props.icon && !props.text,
    iconText: props.icon && props.text,
    iconTextOnly: props.textOnly && props.icon && props.text,
    btn: props.iconButton || (!props.textOnly && !props.icon),
    ...!props.color && props.text && !props.color && !props.icon && !props.textOnly && !props.outline && {

      // default color
      green: true

    } 
  }});

  const iconStyle = ClassHelper(IconStyle, {

    fill: props.fillIcon,
    alignLeft: props.alignLeft, 
    alignRight: props.alignRight,
    insideButton: props.iconButton || (!props.textOnly && !props.icon),
    
  })

  return (
    <button
      title={ props.title }
      className={ buttonStyle }
      onClick={ e => {

        e.preventDefault();
        e.stopPropagation();

        props.action && props.action(props.params);
        props.goto && navigate(props.goto);
        if (props.url) window.location = props.url;

      }}>

      { props.icon ?

        <Fragment>
          <Icon
            image={ props.icon }
            pack={ props.iconPack }
            color={ props.iconColor || props.color }
            size={ props.iconSize || props.size || 18 }
            className={ iconStyle }
          />
          { props.text && props.text }
        </Fragment>

        : props.text

      }
    </button>
  );
}

