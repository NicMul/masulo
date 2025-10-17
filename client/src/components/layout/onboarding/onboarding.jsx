/***
*
*   ONBOARDING LAYOUT
*   Focused layout for a user to complete the onboarding flow.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/layout
*
*   PROPS
*   children: will be passed from router > view > here (component(s), required)
*
**********/

import { useEffect } from 'react';
import { Animate } from 'components/lib';

export function OnboardingLayout({ children }){

  // set the background color
  useEffect(() => {

    document.body.style.backgroundColor = '#1e293b';
    return () => document.body.style.backgroundColor = '';

  }, []);

  return (
    <main className='flex w-full min-h-screen items-center justify-center overflow-auto py-8 dark:bg-slate-900'>
      <Animate>

        { children }

      </Animate>
    </main>
  );
}