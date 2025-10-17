/***
*
*   TOASTER
*   Toaster component
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/toast
*   https://ui.shadcn.com/docs/components/toast
*
**********/

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast.jsx'
import { Icon } from 'components/lib';
import { useToast } from './useToast.js'

export function Toaster() {

  const { toasts } = useToast();
  const icons = {

    error: 'circle-alert',
    default: 'check-circle',
  }

  return (
    <ToastProvider>

      { toasts.map(({ id, title, description, action, ...props }) =>{
        return (

          <Toast key= {id } { ...props }>
            <div className='flex items-center'>

              <Icon 
                name={ icons[props.variant === 'error' ? 'error' : 'default'] } 
                size={ 20 } 
                className='mr-4 flex-shrink-0 w-5 h-5'
              />
              
              <div>

                { title && 
                  <ToastTitle>{ title }</ToastTitle> 
                }

                { description && 
                  <ToastDescription>{ description }</ToastDescription> 
                }

              </div>
            </div>

            { action}
            <ToastClose />

          </Toast>
        )
      })}

      <ToastViewport/>

    </ToastProvider>
  );
}
