/***
*
*   ANIMATE
*   Wrapper component to animate in children.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/animate
*
*   PROPS
*   children: children to render (component, required)
*   type: slideup/slidedown/pop (string, optional, default: slideup)
*   timeout: timeout time (integer, optional, default: 300)
*
**********/

import { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import './animate.scss';

export function Animate({ type = 'slideup', timeout = 300, children }){

  const nodeRef = useRef(null);

  return (
    <CSSTransition 
      in appear
      nodeRef={ nodeRef }
      timeout={ timeout }
      classNames={ `animate ${type}` }>

        <div ref={ nodeRef } className={ `animate ${type}` }>
          { children }
        </div>

    </CSSTransition>
  )
}
