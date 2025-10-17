/***
*
*   ANIMATE
*   Wrapper component to animate children
*
*   PROPS
*   children: children to render (component, required)
*   type: slideup, slidedown, pop (string, optional, default: slideup)
*   timeout: timeout time (integer, optional, default: 300)
*
**********/

import { CSSTransition } from 'react-transition-group';
import './animate.scss';

export function Animate(props){

  const type = props.type || 'slideup';

  return (
    <CSSTransition
      in appear
      timeout={ props.timeout || 300 }
      classNames={ `animate ${type}` }>

        <div className={ `animate ${type}` }>
          { props.children }
        </div>

    </CSSTransition>
  )
}
