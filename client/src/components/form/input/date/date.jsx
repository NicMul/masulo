/***
*
*   DATE PICKER
*   Date picker input
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/form
*   https://ui.shadcn.com/docs/components/date-picker
*
*   PROPS
*   aria-describedby: id of the element that describes the input in ...props (string, optional)
*   aria-invalid: determines if the input is invalid in ...props (boolean, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   defaultValue: initial value (string, optional)
*   placeholder: placeholder value (string, optional)
*   onChange: callback (function, required)
*   
**********/

import { forwardRef, useState } from 'react';
import { format } from 'date-fns'
import { Calendar, Button, Popover, PopoverContent, PopoverTrigger, cn, useTranslation } from 'components/lib';

const DateInput = forwardRef(({ className, defaultValue, placeholder, onChange, ...props }, ref) => {

  const [date, setDate] = useState(defaultValue ? new Date(defaultValue) : null);
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
    
        <Button
          text={ date ? format(date, 'PPP') : (placeholder || t('global.form.date.placeholder')) }
          icon='calendar'
          variant='outline'
          className={ cn('w-[280px] justify-start text-left font-normal', !date && 'text-muted-foreground') }/>

      </PopoverTrigger>

      <PopoverContent className='w-auto p-0'>
        <Calendar
          initialFocus
          mode='single'
          selected={ date }
          onSelect={ value => {

            // create pure date
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0'); // months are zero-indexed
            const day = String(value.getDate()).padStart(2, '0');
        
            // format the date as 'YYYY-MM-DD' without timezones
            const selectedDate = `${year}-${month}-${day}`;
        
            setDate(value); // update state with the selected date object
            onChange({ target: { name: props.name, value: selectedDate }, type: 'change' }); 

          }}
        />
      </PopoverContent>
    </Popover>
  )
})

DateInput.displayName = 'DateInput'
export { DateInput }
