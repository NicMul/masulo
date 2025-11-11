/***
*
*   TABLE
*   Dynmaic table with sorting, search and actions.
*   Header rows are created dynamically from column names unless specified.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/components/table
*   https://ui.shadcn.com/docs/components/table
*   https://ui.shadcn.com/docs/components/data-table
*
*   PROPS
*   actions: [{ label: string, icon: string, callback: function, global: bool, globalOnly: bool } (array, optional)
*   badge: add a badge to every row col { col: string, color: string, condition: { value, color } (object, optional)
*   data: array of table rows [{ id, email, date_created }] or [{{ label, url }, email, date_created }] (array, required)
*   footer: footer row { span: integer, value: string } (object, optional)
*   header: array of header column names [string, string] (array, optional)
*   hide: column names to hide [string, string] (array, optional)
*   loading: toggle loading spinner (boolean, optional)
*   searchable: show the search field (boolean, optional)
*   selectable: enable the user to select table rows and perform global actions (boolean, optional)
*   show: columns to show [string, string] (array, optional, default: all)
*   translation: reference to a locale object to use for the header translations (string, optional)
*
**********/

import { Fragment, forwardRef, useState, useEffect, useCallback, isValidElement } from 'react';
import { Loader, Search, Icon, cn, useTranslation } from 'components/lib';
import { TableHeader } from './header.jsx';
import { TableBody } from './body.jsx';
import { TableFooter } from './footer.jsx';
import { GlobalActions } from './actions.jsx';

const Table = forwardRef(({ className, header, data, footer, caption, show, hide, children, actions, 
  translation, loading, badge, selectable, searchable, onSelectionChange, ...props }, ref) => {

  const { t } = useTranslation();

  // state
  const [rows, setRows] = useState([]); // normal rows
  const [filter, setFilter] = useState(false); // filtered rows
  const [selected, setSelected] = useState([]); // selected rows
  const [sort, setSort] = useState({ col: null, direction: null }); // sort state

  // set row state
  useEffect(() => {

    if (data)
      setRows(data);

  }, [data]);

  // update a row
  const editRowCallback = useCallback((row) => {
    
    // update state
    const updatedRows = rows.map(r => r.id === row.id ? { ...r, ...row } : r);
  
    // update filter
    if (filter?.length)
      setFilter(updatedRows.filter(r => filter.find(f => f.id === r.id)));

    // return the new state for the parent to update its state
    return updatedRows;

  }, [rows, filter]);

  // delete a row
  const deleteRowCallback = useCallback((row) => {
  
    const removeIds = Array.isArray(row) ? row.map(r => r.id) : [row.id];
    const updatedRows = rows.filter(r => !removeIds.includes(r.id));

    // remove selected ids
    const updatedSelected = selected.filter(s => !removeIds.includes(s.id));
    setSelected(updatedSelected); 
    
    // update filter
    if (filter)
      setFilter(updatedRows.filter(r => filter.find(f => f.id === r.id)));

    // return the new state for the parent to update its state
    return updatedRows;

  }, [rows, filter]);

  // sort the rows
  const sortRows = useCallback((column) => {

    const rowsToSort = [...(filter.length ? filter : rows)];
    const direction = sort.col === column && sort.direction === 'asc' ? 'desc' : 'asc';

    rowsToSort.sort((a,b) =>{

      const valA = a[column]?.badge ? a[column].label : a[column];
      const valB = b[column]?.badge ? b[column].label : b[column];

      // handle NULL/undefined values
      const aIsNull = valA == null;
      const bIsNull = valB == null;

      if (aIsNull && bIsNull){

        return 0; // both are NULL, consider them equal

      } 
      else if (aIsNull) {

        // if ascending, NULL should come first
        // if descending, NULL should come last
        return direction === 'asc' ? -1 : 1;

      } 
      else if (bIsNull) {

        // if ascending, NULL should come first -> valB is NULL, so valA > valB -> return 1
        // if descending, NULL should come last
        return direction === 'asc' ? 1 : -1;

      }

      // if neither are NULL, proceed with normal sorting
      if (/^\d{4}-\d{2}-\d{2}$|^\d{1,2} [A-Z][a-z]{2} \d{4}$/.test(valA)){

        // date comparison
        const diff = new Date(valA) - new Date(valB);
        return direction === 'desc' ? -diff : diff;

      } else {

        // string or numeric comparison
        if (direction === 'desc') {

          return valA > valB ? -1 : valA < valB ? 1 : 0;

        } 
        else {

          return valA < valB ? -1 : valA > valB ? 1 : 0;

        }
      }
    });

    filter.length ? setFilter(rowsToSort) : setRows(rowsToSort);
    setSort({ col: column, direction: direction });

  }, [rows, filter, sort]);

  // select an individaul row
  const selectRow = useCallback((index, id) => {

    // toggle the select state of each row (save index, id)
    const s = [...selected];
    const i = s.findIndex(x => x.index === index);
    i > -1 ? s.splice(i, 1) : s.push({ index, id });
    setSelected(s);
    
    // notify parent component of selection change
    if (onSelectionChange) {
      onSelectionChange(s);
    }

  }, [selected, onSelectionChange]);

  // select all rows from header
  const selectAllRows = useCallback(() => {

    // toggle all visible rows
    const newSelection = selected.length ? [] : data.map((x, i) => ({ index: i, id: x.id }));
    setSelected(newSelection);
    
    // notify parent component of selection change
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
    
  }, [data, selected, onSelectionChange]);

  const search = useCallback(term => {

    // filter visible rows based on the search term
    const rowsToShow = rows.filter(row => 
      Object.entries(row).some(([key, cell]) => {
        
        // check if the column is in the `visibleCols` array
        if (!show.includes(key)) return false;
  
        // if the cell is an object with a label, search the label
        if (typeof cell === 'object' && cell !== null && 'label' in cell) {
          return cell.label?.toString().toLowerCase().includes(term.toLowerCase());
        }
  
        // otherwise, search the cell value itself
        return cell?.toString().toLowerCase().includes(term.toLowerCase());
        
      })
    );
  
    setFilter(rowsToShow);
  
  }, [rows]);


  // loading
  if (loading){
    return (
      <div className='relative w-full h-24 flex flex-col items-center justify-center'>
        <Loader />
      </div>
    )
  }

  // empty table
  if (!rows.length){
    return (
      <div className='relative w-full h-24 flex flex-col items-center justify-center'>
        <Icon name='inbox' />
        <span>{ t('global.table.empty') }</span>
      </div>
    )
  }

  return (
    <div>
      <div className='flex flex-row gap-x-2 w-full mb-3'>

        { searchable && 
          <Search callback={ search } /> 
        }

        <GlobalActions 
          actions={ actions } 
          selected={ selected }
          editRowCallback={ editRowCallback }
          deleteRowCallback={ deleteRowCallback } 
        />

      </div>

      <div className='relative w-full overflow-x-auto border rounded dark:border-slate-800'>
        <table ref={ ref } className={ cn('w-full caption-bottom', className)} {...props }>

          { children ||
          <Fragment>

            { caption && 
              <TableCaption>{ caption }</TableCaption> 
            }

            <TableHeader 
              header={ header }
              row={ data[0] } 
              show={ show } 
              hide={ hide }
              select={ selectable && selectAllRows }
              actions={ actions?.length }
              translation={ translation }
              sort={{ ...sort, callback: sortRows }}
            />

            <TableBody 
              show={ show } 
              hide={ hide } 
              badge={ badge } 
              actions={ actions }
              selected={ selected }
              rows={ filter || rows } 
              select={ selectable && selectRow }
              editRowCallback={ editRowCallback }
              deleteRowCallback={ deleteRowCallback }
            />

            { footer &&
              <TableFooter row={ footer } /> 
            }

          </Fragment>
          }
        </table>
      </div>

      { selected.length ?
        <div className='flex-1 text-slate-500 mt-3'>
          { selected.length } of { data.length } { data.length > 1 ? 'rows' : 'row' } selected
        </div> : undefined }

    </div>
  )
});

Table.displayName = 'Table'

const TableRow = forwardRef(({ className, ...props }, ref) => (

  <tr ref={ ref } className={ cn('flex flex-col pt-4 sm:table-row sm:pt-0 border-b transition-colors sm:hover:bg-slate-100/50 data-[state=selected]:bg-slate-100 dark:hover:bg-slate-800/50 dark:data-[state=selected]:bg-slate-800 dark:border-slate-800', className) } {...props }/>

))

TableRow.displayName = 'TableRow'

const TableCell = forwardRef(({ className, label, children, ...props }, ref) => {

  const isImage = isValidElement(children) && children.props.src; // ignore labels on images

  return (
    <td 
      data-label={ label } 
      ref={ ref } 
      className={ cn('sm:before:content-none align-middle px-4 sm:p-4 [&:has([role=checkbox])]:pr-0', 
      !isImage && label && ' before:inline-block before:content-[attr(data-label)] before:w-24 before:mr-4 before:text-sm before:text-slate-400', className) } {...props }>
      { children }
    </td>
  )
})

TableCell.displayName = 'TableCell'

const TableCaption = forwardRef(({ className, ...props }, ref) => (

  <caption ref={ ref } className={ cn('mt-4 text-slate-500 dark:text-slate-400', className) } {...props }/>

))

TableCaption.displayName = 'TableCaption'

export { Table, TableRow, TableCell, TableCaption }
