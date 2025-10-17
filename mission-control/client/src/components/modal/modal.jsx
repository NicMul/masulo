/***
*
*   MODAL
*   Display an overlay modal anywhere in your application by calling
*   context.modal.show() with an object containing the following params
*
*   PARAMS
*   buttonText: submit button text (string, optional)
*   destructive: show a red button (boolean, optional)
*   form: a form object (object, optional)
*   method: HTTP request type (string, optional)
*   text: message to the user (string, optional)
*   title: title (string, required)
*   url: url to send the form to (string, optional)
*
**********/

import { useContext } from 'react';
import { ViewContext, Card, Form } from 'components/lib';
import { CSSTransition } from 'react-transition-group';
import './modal.scss';

export function Modal(props){

  const context = useContext(ViewContext);

  return (
   <CSSTransition in appear timeout={ 0 } classNames='modal'>
      <div className='modal'
        onClick={(e) => e.target === e.currentTarget && context.modal.hide(true)}>

        <div className='modal-content'>
          <Card title={ props.title }>

            { props.text &&
              <p>{ props.text }</p> }

            { props.form &&
              <Form
                method={ props.method }
                url={ props.url }
                inputs={ props.form }
                destructive={ props.destructive }
                buttonText={ props.buttonText }
                cancel={ e => context.modal.hide(true) }
              />
            }
          </Card>
        </div>
      </div>
    </CSSTransition>
  );
}
