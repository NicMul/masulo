import { forwardRef, isValidElement } from 'react';
import { Badge, Checkbox, Icon, Link, cn, useTranslation } from 'components/lib';
import { TableRow, TableCell } from './table'
import { RowActions } from './actions';

const TableBody = forwardRef(({ className, rows, show, hide, badge, translation, actions, editRowCallback, deleteRowCallback, select, selected, ...props }, ref) => {
  
  const { t } = useTranslation();

  return (
    <>
      <tbody ref={ ref } className={ cn('[&_tr:last-child]:border-0', className)} {...props }>

      { /* map rows if they exist, or show empty row */ }
      { rows.length ? 
        rows.map((row, index) => {

          const cbSelected = selected.findIndex(x => x.index === index) > -1 ? true : false;

          return (
            <TableRow key={ index }>

              { /* select checkbox */ }
              { select && 
                <TableCell className='w-12 [&>*]:mt-[9px]'>
                  <Checkbox onChange={ () => select(index, row.id) } checked={ cbSelected }/>
                </TableCell> 
              }

              { (show || Object.keys(row)).filter(col => col !== '').map((col, index) => {

                let value = row[col];
                let cellContent = value;
                
                { /* ignore actions and hide/show */ }
                if (col === 'actions' || (show && !show.includes(col)) || hide?.includes(col))
                  return null;

                { /* cell is datetime */ }
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)){

                  const date = new Date(value).toISOString().split('T');
                  value = `${date[0]} ${date[1].split('.')[0]}`;

                }

                { /* cell is a badge */ }
                if (badge){

                  const badges = Array.isArray(badge) ? badge : [badge];

                  badges.forEach(badge => {                      
                    
                    // check if the current cell matches the badge column
                    if (value !== undefined && col === badge.col) {

                      // check each condition
                      badge.condition?.forEach(cond => {

                        if ((typeof cond.value === 'string' && typeof value === 'string' && cond.value.toLowerCase() === value.toLowerCase()) 
                          || (typeof cond.value === 'boolean' && typeof value === 'boolean' && cond.value === value)) {
                          badge.color = cond.color;
                        }
                      });

                      cellContent = (
                        <Badge variant={ badge.color }>
                          { value === true  ? t('global.table.label.yes') : 
                          (value === false ? t('global.table.label.no') : value) }
                        </Badge>
                      )
                    }
                  })          
                }

                { /* cell contains image URL - show preview */ }
                if (typeof value === 'string' && value && col.toLowerCase().includes('image') && 
                    (value.startsWith('http') || value.startsWith('https') || value.startsWith('/')) &&
                    (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png') || 
                     value.includes('.gif') || value.includes('.webp') || value.includes('.svg'))) {
                  
                  cellContent = (
                    <div className="flex items-center gap-2">
                      <img 
                        src={ value } 
                        alt={ col }
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'inline';
                        }}
                      />
                      <span className="text-xs text-gray-500 hidden">{ value }</span>
                    </div>
                  );
                }

                { /* can render text or a link if cell is an object */ }
                return (
                  <TableCell key={ index } label={ translation ? t(`${translation}.header.${col}`) : col }>

                    { /* link or static content */ }
                    { cellContent && typeof cellContent === 'object' && !isValidElement(cellContent) ? 
                      <Link url={ cellContent.url }>{ cellContent.label }</Link> :
                      cellContent
                    }
    
                  </TableCell>
                )
              })}    
        
              { /* add the actions */ }
              { (row.actions || actions) && 
                <TableCell className='text-left my-2 sm:text-right'>
                  <RowActions 
                    row={ row }
                    actions={ row.actions || actions }
                    editRowCallback={ editRowCallback }
                    deleteRowCallback={ deleteRowCallback }
                  />
                </TableCell>
              }

            </TableRow>
         )
        }) : 

        <TableRow>
          <TableCell colSpan='100%'>

            <div class='flex !text-left gap-x-2 items-center'>
              <Icon name='search'/>
              <span>{ t('global.table.empty') }</span>
            </div>

          </TableCell>
        </TableRow>
      }
    </tbody>
    </>
  )
})

TableBody.displayName = 'TableBody'

export { TableBody }