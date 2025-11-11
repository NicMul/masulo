/***
*
*   SOCIAL SIGN IN BUTTONS
*   Sign up/in with Facebook, Google, Twitter or 500+ networks supported by passport.js.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/social
*     
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   invite: user is invited as a child (boolean, optional)
*   network: array of social network names [string, string] (array, required)
*   showOr: show an or separator under the buttons (boolean, optional)
*   signup: user is signing up (boolean, optional)
* 
**********/

import { useState } from 'react';
import { Button, cn, useTranslation } from 'components/lib';
import settings from 'settings';

export function SocialSignin({ className, network, invite, signup, showOr }){

  const { t } = useTranslation();
  const [loading, setLoading] = useState(network?.map(x => { return { [x]: false }}));
  const serverURL = settings[process.env.NODE_ENV].server_url;

  // construct query string
  let qs = '';
  if (invite) qs = `?invite=${invite}`;
  if (signup) qs = '?signup=1'

  return (
    <div className={ cn('text-center', className) }>

      <div className='flex gap-x-2'>
        { network?.map(n => {
          
          return (
            <Button  
              key={ n }
              icon={ n }
              iconColor={ !loading[n] && 'transparent' }
              iconFill={ !loading[n] && 'white' }
              loading={ loading[n] }
              className={ cn({
                '!bg-[#3b5998] hover:!bg-[#314F8E] !text-white': n === 'facebook',
                '!bg-[#55acee] hover:!bg-[#4BA2E4] !text-white': n === 'twitter',
                '!bg-[#0e76a8] hover:!bg-[#036FA7] !text-white': n === 'linkedin',
                '!bg-emerald-500 hover:!bg-emerald-600': n === 'mail',
                'flex-1': true,
              })}
              action={ () => setLoading({ [n]: true }) }
              url={ `${serverURL}/auth/${n}${qs}` }
              text={ `${t('global.social.use')} ${n.charAt(0).toUpperCase() + n.slice(1)}` }
            />
          )
        })}
      </div>
    </div>
  );
}
