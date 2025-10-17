/***
*
*   OTP INPUT
*   Renders a one time password input with accessible label.
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/form
*   https://ui.shadcn.com/docs/components/input-otp
*
*   PROPS
*   aria-describedby: id of the element that describes the input in ...props (string, optional)
*   aria-invalid: determines if the input is invalid in ...props (boolean, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   containerClassName: classname of wrapper container (SCSS or tailwind style, optional)
*   
**********/

import { forwardRef, useContext } from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'
import { cn, Icon } from 'components/lib';

const MAX_LENGTH = 6;

const OTP = forwardRef(({ className, containerClassName, field, ...props }, ref) => {

  return (
    <OTPInput 
      ref={ ref }
      {...props }
      maxLength={ MAX_LENGTH }
      containerClassName={ cn('flex items-center gap-2 has-[:disabled]:opacity-50', containerClassName) }
      className={ cn('disabled:cursor-not-allowed', className) }>
    
      <InputOTPGroup>
        <InputOTPSlot index={ 0 }/>
        <InputOTPSlot index={ 1 }/>
        <InputOTPSlot index={ 2 }/>
      </InputOTPGroup>

      <InputOTPSeparator />
      
      <InputOTPGroup>
        <InputOTPSlot index={ 3 }/>
        <InputOTPSlot index={ 4 }/>
        <InputOTPSlot index={ 5 }/>
      </InputOTPGroup>

    </OTPInput>
  )
});

OTP.displayName = 'OTP'

const InputOTPGroup = forwardRef(({ className, ...props }, ref) => (

  <div ref={ ref } className={ cn('flex items-center', className) } {...props } />

))

InputOTPGroup.displayName = 'InputOTPGroup'

const InputOTPSlot = forwardRef(({ index, className, ...props }, ref ) => {

  const inputOTPContext = useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div 
      ref={ ref } 
      className={ cn(`relative flex h-10 w-10 items-center justify-center border-y border-r border-slate-200 transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-slate-900 dark:bg-slate-800 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300`, isActive && `'z-10 ring-2 ring-slate-950 ring-offset-white dark:ring-slate-300 dark:ring-offset-slate-95`, className) }
      {...props }>

      { char }

      { hasFakeCaret && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
          <div className='h-4 w-px animate-caret-blink bg-slate-950 duration-1000 dark:bg-slate-50'/>
        </div>
      )}
    </div>
  );
})

InputOTPSlot.displayName = 'InputOTPSlot'

const InputOTPSeparator = forwardRef(({ ...props }, ref) => (

  <div ref={ ref } role='separator' {...props }>
    <Icon name='dot' />
  </div>
))

InputOTPSeparator.displayName = 'InputOTPSeparator'

export { OTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
