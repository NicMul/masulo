import Style from './glass.tailwind.js';

export function Glass(props){

  return (
    <div className={ Style.glass }>

      <div className={ Style.content }>
        { props.children }
      </div>

    </div>
  )
}