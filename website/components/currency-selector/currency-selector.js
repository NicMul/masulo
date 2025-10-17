import { ClassHelper } from 'components/lib';
import { US, GB, EU, CA } from 'country-flag-icons/react/3x2'
import Style from './currency-selector.tailwind.js';

export function CurrencySelector(props){

  const selected = props.selected || props.currencies[0];
  const flags = { usd: US, gbp: GB, eur: EU, cad: CA }
  
  const css = ClassHelper(Style, { 

    selector: true,
    className: props.className

  })

  const Flag = flags[selected];
  
  return(
    <div className={ css }>

      <Flag className={ Style.flag }/>

       <div className={ Style.select }>
         <select value={ selected } onChange={ e => props.onChange(e.target.value)} className={ Style.input }>
          
           { props.currencies.map(cur => {

              return <option key={ cur } value={ cur }>{ cur.toUpperCase() }</option>

           })}
         </select>
      </div> 
     </div>
  )
}