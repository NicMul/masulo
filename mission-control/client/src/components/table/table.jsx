/***
*
*   TABLE
*   Dynmaic table with sorting, search and row actions
*   Header rows are created dynamically from column names
*
*   PROPS
*   actions: object with edit/delete/custom callback functions (object, optional)
*   badge - column name and color to add badges to column (object, optional)
*   bulkActions: global actions array when using selectable (array, optional)
*   data: array of table rows (array, required)
*   hide - columns (object key names) to hide (array, optional, default: none)
*   loading: toggle loading spinner (boolean, optional)
*   search: show the search field (boolean, optional)
*   selectable: user can select table rows (boolean, optional)
*   show - columns (object key names) to show (array, optional, default: all)
*   naked: remove the styling (boolean, optional)
*   throttle: throttle the search callback in ms (integer, optional)
*
**********/

import { Fragment, useState, useEffect } from 'react';
import { Loader, Search, ClassHelper, Checkbox } from 'components/lib';
import { Header } from './header';
import { Body } from './body';
import { BulkActions } from './actions';
import Style from './table.tailwind.js';

export function Table(props){

  // state
  const [header, setHeader] = useState(null);
  const [body, setBody] = useState(null);
  const [filter, setFilter] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (props.data){

      // create the headers
      let header = props.data.header || [];

      if (!header.length){
        for (let key in props.data[0]){
          header.push({

            name: key,
            title: key.replace('_', ' '),
            sort: key === 'actions' ? false : true

          });
        }
      }

      setBody(props.data.body || props.data);
      setHeader(header);

    }
  }, [props.data]);

  // loading
  if (props.loading){
    return (
      <div className={ Style.loading }>
        <Loader />
      </div>
    );
  }

  // no data
  if (!header && !body)
    return false

  function sort(column, direction){

    const rows = filter.length ? [...filter] : [...body];

    rows.sort(function(a,b){

      if ((a[column] != null) && (b[column] != null)){

        a[column].badge ?
          a = a[column].label : a = a[column];

        b[column].badge ?
          b = b[column].label : b = b[column];

        // compare dates
        if (/^\d{4}-\d{2}-\d{2}$|^\d{1,2} [A-Z][a-z]{2} \d{4}$/.test(a)){

          return direction === 'desc' ? 
            new Date(b).getTime() - new Date(a).getTime() :
            new Date(a).getTime() - new Date(b).getTime();

        }
        else {

          // compare strings and numbers
          if (direction === 'desc'){

            if (a > b) return -1;
            if (a < b) return 1;
            else return 0;

          }
          else {

            if (a < b) return -1;
            if (a > b) return 1;
            else return 0;

          }
        }
      }
      else {

        return false;

      }
    });

    filter ? setFilter(rows) : setBody(rows);

  }

  function search(term){

    // search each cell in each row &
    // update state to show only filtered rows
    let rowsToShow = [];

    body.forEach(row => {
      for (let cell in row){
        if (row[cell]?.toString().toLowerCase().includes(term.toLowerCase())){

          if (!rowsToShow.includes(row))
            rowsToShow.push(row);

        }
      }
    })

    setFilter(rowsToShow);

  }

  function select(index, id){

    // toggle the select state 
    // save the index of selected
    const s = [...selected];
    const i = s.findIndex(x => x.index === index);
    i > -1 ? s.splice(i, 1) : s.push({ index, id });
    return setSelected(s);

  }

  function selectAll(){

    // toggle all visible rows
    setSelected(selected.length ? [] : 
      props.data.map((x, i) => { return { index: i, id: x.id }}));
    
  }

  function editRowCallback(res, row){

    let state = [...body];
    let stateRow = state[state.findIndex(x => x.id === row.id)];
    Object.keys(res).map(key => stateRow[key] = res[key].value);
    setBody(state);

  }

  function deleteRowCallback(row){

    const b = [...body];
    const remove = Array.isArray(row) ? row : [row]; // ensure array

    // remove from body
    remove.forEach(r => { 
      b.splice(b.findIndex(x => x.id === r.id), 1);
    });

    setBody(b);
    setSelected([]); // reset selected items to 0

  }

  const tableStyle = ClassHelper(Style, {

    table: true,

  });

  const showSelectable = props.selectable && props.bulkActions && Object.keys(props.bulkActions).length && selected.length;

  return (
    <Fragment>

      { props.search || showSelectable ?
        <div className={ Style.inputs }>

          { props.search &&
            <Search className={ Style.search } callback={ search } throttle={ props.throttle }/> }

          { showSelectable ?
            <BulkActions 
              actions={ props.bulkActions } 
              selected={ selected }
              delete={ deleteRowCallback }
            /> : undefined }

        </div> : undefined 
      }

      { /* select all for mobile */ }
      { showSelectable ?
        <div className={ Style.select_all }>
          <Checkbox 
            option='Select all' 
            callback={ selectAll }
            checked={ selected.length === props.data?.length }
          /> 
        </div> : undefined
      }
        
      <table className={ !props.naked && tableStyle }>

        { header &&
          <Header
            data={ header }
            callback={ sort }
            show={ props.show }
            hide={ props.hide }
            select={ props.selectable ? selectAll : false }
            hasData={ props.data?.length }
            selectAll={ selected.length === props.data?.length }
            actions={ props.actions }
          />
        }
        { body &&
          <Body
            data={ filter ? filter : body }
            show={ props.show }
            hide={ props.hide }
            badge={ props.badge }
            select={ props.selectable ? select : false }
            selected={ selected }
            actions={{

              edit: props.actions?.edit,
              view: props.actions?.view,
              delete: props.actions?.delete,
              email: props.actions?.email,
              custom: props.actions?.custom

            }}
            callback={{

              edit: editRowCallback,
              delete: deleteRowCallback

            }}
          />
        }
      </table>
    </Fragment>
  );
}