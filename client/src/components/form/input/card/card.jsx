/***
*
*   CARD INPUT
*   Stripe CardElement input.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/form
*   https://docs.stripe.com/payments/elements
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   name: input name (string, required)
*   onChange: callback (function, required)
*
**********/

import { forwardRef, useContext } from 'react';
import { CardElement } from '@stripe/react-stripe-js';
import { AuthContext, cn } from 'components/lib';

const CardInput = forwardRef(({ name, onChange, className }, ref) => {

  const authContext = useContext(AuthContext);
  const darkMode = authContext.user.dark_mode;

  return(
    <div className={ cn('flex items-center h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 dark:color-scheme-dark', className) }>
      <CardElement
        className='w-full'
        onChange={ e => onChange({ target: { name, value: e.empty ? null : {} }, type: 'change' }) }
        options={{
          style: {
            base: {
              fontFamily: '"Source Sans Pro", sans-serif',
              fontSize: '13px',
              color: darkMode ? '#fff' : '#334155',
              "::placeholder": {
                color: darkMode ? '#94a3b8' : '#64748b',
              },
            },
          },
        }}
      />
    </div>
  );
})

export { CardInput };