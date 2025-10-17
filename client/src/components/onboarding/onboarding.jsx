/***
*
*   ONBOARDING
*   Flow to help users set up the app. Accepts multiple views. 
*   On finish/cancel the user will be marked as onboarded when save is true.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/onboarding
*
*   PROPS
*   onFinish: url to navigate to when finished (string, optional, default: /dashboard)
*   save: set onboarded column in user database table to true when completed (boolean, optional) 
*   views: array of child views [{ name: string, description: string, component: component }] (array, required)
*
**********/

import { Fragment, useState, useEffect } from 'react';
import Axios from 'axios';
import { CheckList, Button, Logo, useNavigate, Event, Pagination, useTranslation, useSearchParams } from 'components/lib';

export function Onboarding({ views, onFinish, save }){

  const { t } = useTranslation();
  const navigate = useNavigate();

  // state
  const [activeChildView, setActiveChildView] = useState(0);
  const [searchParams] = useSearchParams();

  useEffect(() => {

    // hash changed - update the child view index
    setActiveChildView((searchParams.get('page') || 1) -1);

  }, [searchParams]);

  const view = views[activeChildView];

  async function finish(){


    if (save)
      await Axios.patch('/api/user', { onboarded: true });
      
    window.location = onFinish || '/dashboard';
  
  }

  return (
    <div className='w-[95%] max-w-2xl mx-auto rounded-md shadow-lg md:min-h-96 md:flex md:flex-row dark:drop-shadow-sm'>

      { /* sidebar */ } 
      <aside className='flex flex-col gap-y-4 p-6 rounded-tl-md rounded-tr-md md:rounded-tr-none md:rounded-bl-md border-r bg-slate-50 text-slate-700 md:min-w-48 dark:bg-slate-800 dark:border-r-slate-700'>

        <Logo className='ml-0 mt-0 w-28' color='dark'/>

        <CheckList 
          className='mt-auto self-start' 
          items={ views.map((view, i) => { 

            return {

              name: view.name, 
              color: i <= activeChildView ? 'green' : 'dark',
              checked: true,
              callback: () => { navigate(`?page=${i+1}`) }

            }
          })}
        />

        <Button 
          icon='arrow-right-circle'
          iconSize={ 16 }
          variant='outline'
          text={ t('onboarding.button.skip') }
          className='mt-auto' 
          action={ () => {
          
            Event({ name: 'cancelled_onboarding' });
            finish();
        
          }}
        /> 

      </aside>

      { /* main */ }
      <section className='flex flex-col w-full gap-y-6 bg-white px-6 pt-6 pb-4 rounded-b-md md:rounded-b-none md:rounded-r-lg dark:bg-slate-800'>

        { activeChildView < views.length ?
          <Fragment>
      
            <header className='w-full pb-4 border-b border-dotted border-slate-200 dark:border-slate-700'>

              { view.name && 
                <h2 className='capitalize text-xl font-semibold'>
                  { view.name }
                </h2> 
              }

              { view.description && 
                <span className='text-sm text-slate-400'>
                  { view.description }
                </span> 
              }
                
            </header> 

            <article className='[&_p]:mb-2'>
              { view.component }
            </article>

            <Pagination total={ views.length } limit={ 1 } className='mt-auto'/>

          </Fragment> :

          <div>
            Nothing to show
          </div> 
        
        }
      </section> 
    </div>
  );
}