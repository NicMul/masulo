import { Badge, ClassHelper, Checkbox, Image } from 'components/lib';
import { RowActions } from './actions';
import Style from './table.tailwind.js';

export function Body(props){

  if (props.data?.length){
    return (
      <tbody className={ Style.body }>
        { props.data.map((row, index) => {

          const selected = props.selected.findIndex(x => x.index === index) > -1 ? true : false;

          return (
            <Row 
              select={ props.select } 
              selected={ selected }
              badge={ props.badge }
              show={ props.show }
              hide={ props.hide }
              actions={ props.actions }
              data={ row } 
              key={ index }
              rowIndex={ index }
              callback={ props.callback }
            />
          )

        })}
      </tbody>
    );
  }

  return (
    <tbody className={ Style.body }>
      <tr>
        <td colSpan='10' className={ Style.empty }>No results found</td>
      </tr>
    </tbody>
  );
}

export function Row(props){

  const row = { ...props.select && { select: true }, ...props.data }
  row.actions = row.actions || props.actions;
  const hasActions = Object.values(row.actions).some(x => (x !== undefined));
  
  return(
    <tr data-id={ props.data.id }>
      { Object.keys(row).map((cell, index) => {

        let value = row[cell];

        const css = ClassHelper(Style, {

          cell: true,
          select: cell === 'select',
          cell_empty: !value,

        })

        // select
        if (cell === 'select'){
          return (
            <td key={ index } className={ css }>
              <Checkbox 
                checked={ props.selected }
                callback={ () => props.select(props.rowIndex, row.id) } 
                className={ Style.checkbox }/>
            </td>
          );
        }
          
        // actions
        if (cell === 'actions')
          return hasActions ? <RowActions row={ row } index={ index } key={ index } callback={ props.callback }/> : false;

        // hide
        if (props.hide?.includes(cell))
          return false;

        // show
        if (props.show && !props.show.includes(cell))
          return false;

        // is date/time
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)){

          const date = new Date(value).toISOString().split('T');
          value = `${date[0]} ${date[1].split('.')[0]}`;

        }

        // has badge
        if (value !== undefined && props.badge && cell === props.badge.col){

          // default color
          let color = props.badge.color;

          // check each condition
          if (props.badge.condition){
            props.badge.condition.forEach(cond => {

              (typeof cond.value === 'string' && typeof value === 'string') ? 
                color = cond.value.toLowerCase() === value.toLowerCase() ? cond.color : color :
                color = cond.value === value ? cond.color : color;

            });
          } 
   
          return (
            <td key={ index } className={ css }>
              <Badge text={ value === true  ? 'Yes' : (value === false ? 'No' : value) } color={ color } className={ Style.badge }/>
            </td>
          );
        }

        // image
        if (/.(jpeg|jpg|png|gif|bmp)$/.test(value) || (cell === 'avatar' && value)){
          return (
            <td key={ index } className={ css }>
              <Image source={ value } className={ Style.image }/>
            </td>
          )
        }

        // standard cell
        return(
          <td key={ index } className={ css }>
            { value === true  ? 'Yes' : (value === false ? 'No' : value) }
          </td>
        );
      })}
    </tr>
  );
}