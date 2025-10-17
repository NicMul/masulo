import { Button, Icon, DropdownMenu, DropdownMenuTrigger, 
  DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from 'components/lib';

const RowActions = ({ actions = [], row, editRowCallback, deleteRowCallback }) => {

  return (
    <DropdownMenu>

      <DropdownMenuTrigger>

        <div className='relative top-[2px] [&_span]:sr-only'>
          <span>Open menu</span>
          <Icon name='more-horizontal'/>
        </div>

      </DropdownMenuTrigger>

      <DropdownMenuContent align='end'>

        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        { actions.filter(a => !a.globalOnly).map((action, index) => {

          const Action = (
            <DropdownMenuItem key={ index }>
              <Button 
                icon={ action.icon } 
                size='full'
                variant='naked' 
                text={ action.label } 
                action={ () => action.action({ row, editRowCallback, deleteRowCallback })}
                className='justify-start'
              />
            </DropdownMenuItem>
          )

          // if no condition, render the action
          if (!action.condition)
            return Action;

          // check if all keys in the condition match the row's corresponding keys
          const matchesCondition = Object.keys(action.condition).every(
            key => row[key] === action.condition[key]
          );

          return matchesCondition ? Action : null;

        })}

      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const GlobalActions = ({ actions, selected, editRowCallback, deleteRowCallback, ...props }) => {

  if (!actions?.length)
    return;

  return (
    <div className='flex gap-x-2'>
      { actions.filter(a => a.global).map((action, index) => {

        if (!action.globalOnly && !selected.length) 
          return;

        return (
          <Button 
            key={ index } 
            icon={ action.icon } 
            text={ action.label } 
            action={ () => action.action({ row: selected, editRowCallback, deleteRowCallback })} 
            color={ action.color }
          />
        )

      })}
    </div>
  )
}

export { RowActions, GlobalActions }