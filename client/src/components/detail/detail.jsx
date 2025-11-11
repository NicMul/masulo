/***
*
*   DETAIL VIEW
*   Displays an organized summary of key/value data pairs.  
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/detail
*
*   PROPS
*   className: custom styling (SCSS or tailwind style, optional)
*   data: { key, value } (object, required) 
*   show: columns to show [string, string] (array, optional, default: all)
*   translation: reference to a locale object to use for the key translations (string, optional)
*
**********/

import { cn, useTranslation } from 'components/lib';

export function Detail({ data, show, translation, className }){

  const { t }= useTranslation();

  if (!data || !Object.keys(data).length)
    return false;

  return (
    <div className={ cn('border-slate-100 border rounded w-full dark:border-slate-800', className) }>
      <table className='w-full'>
        <tbody>
          { Object.keys(data).map(key => {

              if (!show || show.includes(key)){
                return (
                  <tr className='border-b border-slate-100 last:border-none dark:border-slate-800' key={ key }>

                    <td className='w-32 p-4 font-semibold capitalise text-slate-500 text-sm'>
                      { translation ? t(`${translation}.${key}`) : key.replaceAll('_', ' ') }
                    </td>

                    <td className='p-4'>
                      { data[key] }
                    </td>
                  </tr>
                )
              }
            })}
        </tbody>
      </table>
    </div>
  );
}