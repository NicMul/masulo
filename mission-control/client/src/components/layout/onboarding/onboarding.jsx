/***
*
*   ONBOARDING LAYOUT
*   Simple layout to focus on user onboarding actions
*
*   PROPS
*   children: will be passed from router > view > here (component(s), required)
*
**********/

import { useEffect } from 'react';
import Style from './onboarding.tailwind.js';

export function OnboardingLayout(props){

  useEffect(() => {

    document.body.classList.add('color');
    return () => { document.body.classList.remove('color'); }

  }, [])

  return (
    <main className={ Style.onboarding }>

      { <props.children {...props.data }/> }

    </main>
  );
}