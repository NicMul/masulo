import { Button } from 'components/lib';
import Style from './table.tailwind.js';

export function RowActions(props){

  const row = props.row;

  return (
    <td key={ props.index } className={ Style.row_actions }>

      { row.actions?.custom?.map((action, i) => {

        if (action.condition){

          return row[action.condition.col] === action.condition.value ? 
            <Button key={ i } icon={ action.icon } action={ () => action.action(row) } className={ Style.row_actions_button }/> : false;

        }

        return <Button key={ i } icon={ action.icon } action={ () => action.action(row) } className={ Style.row_actions_button }/>

      })}

      { row.actions.edit &&
      <Button icon='edit' action={ () => row.actions.edit(row, (res) => props.callback.edit(res, row) )} className={ Style.row_actions_button }/>}

      { row.actions.download &&
      <Button icon='download' url={ row.actions.download } className={ Style.row_actions_button }/>}

      { row.actions.view &&
      <Button icon='eye' url={ `${row.actions.view.url}/${row[row.actions.view.col]}` } className={ Style.row_actions_button }/>}

      { row.actions.email &&
      <Button icon='mail' action={ () => window.location = `mailto:${row.email}` } className={ Style.row_actions_button }/>}

      { row.actions.invite &&
      <Button icon='mail' action={ e => row.actions.invite(row) } className={ Style.row_actions_button } /> }
                        
      { row.actions.delete &&
      <Button icon='trash' action={ () => row.actions.delete(row, (res) => props.callback.delete(row)) } className={ Style.row_actions_button }/>}

    </td>
  )
}

export function BulkActions(props){

  return (
    <div className={ Style.bulk_actions }>

      { props.actions.delete && 
         <Button
          key='delete' 
          text='Delete Selected'
          color='red'
          action={ () => {
            
            props.actions.delete(props.selected, res => props.delete(props.selected));
          
          }}
          className={ Style.bulk_actions_button }
        /> }
        
      { props.actions.custom?.length ? 
        props.actions.custom.map(action => {
        
        return (
          <Button 
            key={ action.text }
            text={ action.text }
            color={ action.color }
            action={ () => action.action(props.selected) }
            className={ Style.bulk_actions_button }
          />
        )
      }) : undefined }
    </div>
  )
}