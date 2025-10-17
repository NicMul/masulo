import { ClassHelper } from 'components/lib';
import Style from './banner.tailwind.js';

export function Banner(props){

  const css = ClassHelper(Style, {

    banner: true,
    className: props.className,

  })

  return (
    <div className={ css }>
      { props.text }
    </div>
  )
}