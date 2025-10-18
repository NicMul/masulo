/***
*
*   FILE INPUT
*   File input 
*
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/form
*   https://ui.shadcn.com/docs/components/input
*
*   PROPS
*   accept: accepted file types ['image/png', 'image/jpeg', 'image/jpg'] (array, optional)
*   aria-describedby: id of the element that describes the input in ...props (string, optional)
*   aria-invalid: determines if the input is invalid in ...props (boolean, required)
*   className: custom styling (SCSS or tailwind style, optional)
*   defaultValue: initial value (string, optional)
*   disabled: disable the input (boolean, optional)
*   name: input name (string, required)
*   preview: preview value (string, optional) 
*   placeholder: placeholder value (string, optional)
*   type: input type (string, required, default: text)
*   value: current value (string, optional)
*
**********/

import { forwardRef, useState, useEffect } from 'react';
import { cn, useTranslation, Image } from 'components/lib';

const FileInput = forwardRef(({ className, name, defaultValue, value, type, placeholder, onChange, disabled, accept, preview, ...props }, ref) => {

  const { t } = useTranslation();
  const [previewState, setPreviewState] = useState(preview);

  useEffect(() => {

    setPreviewState(preview);
    
  }, [preview]);

  function onFileChange(e){

    // validate filestypes
    if (accept?.length){
      for (let i = 0; i < e.target.files.length; i++) {

        const file = e.target.files[i];
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        
        // check if file type or extension matches any accepted type
        const isAccepted = accept.some(acceptedType => {
          const accepted = acceptedType.toLowerCase();
          return accepted === fileType || 
                 accepted === fileName.substring(fileName.lastIndexOf('.')) ||
                 (accepted.startsWith('.') && fileName.endsWith(accepted));
        });

        if (!isAccepted){
          
          return onChange({ 

            type: 'error', 
            target: { name },
            errorMessage: t('global.form.file.error.excluded', { type: file.type.split('/')[1] })

          });
        }
      }
    }

    // update preview state
    const file = e.target?.files[0];
    
    if (file && file.type.startsWith('image/')){

      const reader = new FileReader();

      reader.onloadend = () => {
        setPreviewState(reader.result);
      };

      reader.readAsDataURL(file);
      
    }

    // done
    onChange({ 
      type: 'change',
      target: { 
        name: name, 
        value: e.target?.files
      }
    })
  }

  return (
    <div className={ cn('flex flex-col gap-4', previewState && 'border border-slate-200 rounded-md p-4 items-center') }>

      { previewState && (previewState.includes('png') || previewState.includes('jpeg') || previewState.includes('jpg')) &&
        <Image className='max-h-32' src={ previewState } /> 
      }

      <input 
        name={ name }
        ref={ ref } 
        autoComplete={ name }
        disabled={ disabled }
        type={ type || 'text' } 
        accept={ accept?.join(',') }
        placeholder={ placeholder }
        className={ cn('flex items-center h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 dark:color-scheme-dark', className, props['aria-invalid'] && 'border-red-500') } 
        onChange={ onFileChange }
        {...props } 
      />
    </div>
  )
})

FileInput.displayName = 'FileInput'
export { FileInput }