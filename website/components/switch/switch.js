import { useState } from 'react';
import { ClassHelper } from 'components/lib';

import Style from './switch.tailwind.js';

export function Switch(props){

  const [active, setActive] = useState(0);

  const css = ClassHelper(Style, {

    switch: true,
    className: props.className

  });

  function select(){

    const nextState = active === 0 ? 1 : 0;
    setActive(nextState)
    props.callback(props.options[nextState]);

  }

  return (
    <div className={ css }>
      
      { props.options.map((option, i) => {

        const handleCSS = ClassHelper(Style, {

          option: true,
          selected: i === active

        })

        return (
          <div key={ option } className={ handleCSS } onClick={ select }>
            { option }
          </div>
        )

      })}
    </div>
  )

}

