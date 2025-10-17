import { forwardRef} from 'react';
import { cn } from 'components/lib';

const TableFooter = forwardRef(({ className, row, ...props }, ref) => (

  <tfoot ref={ ref } className={ cn('border-t bg-slate-100/50 font-medium [&>tr]:last:border-b-0 dark:bg-slate-800/50', className) } {...props }>
    <TableRow>

      { row.map((cell, index) => 
        <TableCell colSpan={ cell.span } key={ index }>{ cell.value }</TableCell>
      )}

    </TableRow>
  </tfoot>
))

TableFooter.displayName = 'TableFooter'

export { TableFooter }