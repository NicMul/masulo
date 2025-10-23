import { forwardRef } from 'react';
import { Icon, Checkbox, cn, useTranslation } from 'components/lib';
import { TableRow } from './table.jsx';

const TableHeader = forwardRef(({ className, header, show, row, hide, translation, sort, actions, select, ...props }, ref) => {

  const { t } = useTranslation();

  // use keys from first row if header isn't provided, respecting show order
  header = header || (row ? (show || Object.keys(row)).map(key => key) : []);

  // add actions col (empty)
  if (actions){

    header.push('');
    show?.length && show.push('');

  }

  function format(value){

    if (value){

      if (translation)
        return t(`${translation}.header.${value}`)

      // Replace underscores with spaces
    let formatted = value.replaceAll('_', ' ');
    
    // Convert camelCase to space-separated words
    formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    return formatted;

    }
  }

  return (
    <thead ref={ ref } className={ cn('hidden sm:table-header-group [&_tr]:border-b capitalize', className)} {...props }>
      <TableRow>

        { select && 
          <TableHead className='w-12 [&>*]:mt-[9px]'>
            <Checkbox onChange={ select }/>
          </TableHead> 
        }

        { header.map((col, index) => {

          // ignore hide/show
          if ((show && !show.includes(col)) || (hide && hide.includes(col)))
            return null;

          return (
            <TableHead key={ index } onClick={ () => sort.callback(col) }>

              { format(col) }
              
              { sort.col && col !== 'actions' &&
                <Icon className='inline-block ml-2' name={ sort.col === col ? 
                  (sort.direction === 'asc' ? 'arrow-down-a-z' : 'arrow-up-a-z') : undefined 
                }/> 
              }
          
            </TableHead>
          )
        })}

      </TableRow>
    </thead>
  )
})

TableHeader.displayName = 'TableHeader'

const TableHead = forwardRef(({ className, ...props }, ref) => (

  <th ref={ ref } className={ cn('h-12 px-4 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0 dark:text-slate-400 cursor-pointer items-center space-x-2 whitespace-nowrap', className )}  {...props } />

))

TableHead.displayName = 'TableHead'

export { TableHeader, TableHead }