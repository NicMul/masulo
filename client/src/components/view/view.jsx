/***
*
*   VIEW
*   The view houses global components that are common to all views
*   (notification, dialog), handles errors and renders the layout.
*   The view and it's props are rendered by the router.
* 
*   PROPS
*   display: custom view (component, required)
*   layout: layout component to use (string, required)
*   title: document title (string, required)
*
**********/

import { useState } from 'react';
import { ViewContext, AppLayout, AuthLayout, AccountLayout, OnboardingLayout, Dialog, 
  Toaster, ToastAction, Loader, useNavigate, useTranslation, useToast } from '../lib';

export function View({ title, layout, view, data }){

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // state
  const [dialog, setDialog] = useState({});
  const [loading, setLoading] = useState(false);

  // layouts
  const layouts = {

    app: AppLayout,
    auth: AuthLayout,
    account: AccountLayout,
    onboarding: OnboardingLayout,
 
  }

  // set title & layout
  document.title = t(title);
  let Layout = layout ? layouts[layout] : AppLayout;

  if (!view)
    return false;

  function notification({ title, description, variant, action }){

    action = action ? (
      <ToastAction altText={ action.text } onClick={ action.callback }>
        { action.text }
      </ToastAction>
     ) : false;

    toast({ title, description, variant, action });

  }

  function openDialog(content, callback){

    setDialog({ ...dialog, ...content, open: true, callback });
    
  }

  function closeDialog(canceled, res, data){
    
    // execute callback if user didn't cancel
    // pass data and res to caller function eg. editUser
    if (!canceled && dialog.callback)
      dialog.callback(data, res);

    // reset
    setDialog({

      title: null,
      open: false,
      description: null,
      buttonText: null,
      url: null,
      method: null,

    });
  }

  function handleError(err){

    let message = { 
      
      title: t('global.error.title'), 
      description: err.message || t('global.error.message') 
    
    };

    if (err){

      // error thrown on server
      if (err.response){
        
        if (err.response.data?.message)
          message = err.response.data.message

        if (err.response.status){
          switch (err.response.status){

            case 401:
            navigate('/signin');
            break;

            case 404:
            navigate('/notfound');
            break;

            case 429:
            notification({ description: err.response.data, variant: 'error' });
            break;

            case 402: // payment required
            navigate('/account/upgrade?plan=' + err.response.data.plan);
            break;

            default:
            notification({ title: t('global.error.title'), description: message, variant: 'error' });
            break;

          }
        }
      }
      else {

        // error throw in client
        console.error(message);
        notification({ ...message, ...{ variant: 'error' }});

      }
    }
  }

  const context = {

    notification: notification,
    t: t, // translate
    dialog: {

      open : openDialog,
      close: closeDialog,
      data: dialog,

    },

    setLoading: state => setLoading(state),
    handleError: handleError

  }

  const View = view;

  return (
    <ViewContext.Provider value={ context }>
      
      { loading && 
        <Loader fullScreen /> }

      <Toaster />

      <Dialog {...dialog } onClose={ closeDialog } /> 

      <Layout title={ title } data={ data }>  
        <View t={ t }/>
      </Layout> 

    </ViewContext.Provider>
  );
}
