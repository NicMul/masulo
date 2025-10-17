/***
*
*   ROW
*   Row layout with title and description
*
*   PROPS
*   align: left/center (string, required) 
*   children: children to render (component(s), required)
*   desc: description below the title (string, optional)
*   loading: show a loading spinner (boolean, optional)
*   mainTitle: the main title of the row (string, optional)
*   title: the title of the row (string, required)
*
**********/

import { ClassHelper, Loader } from 'components/lib';
import { RowHeader } from './header.js';
import { Content } from './content.js'
import Style from './row.tailwind.js';

export function Row(props){

  const css = ClassHelper(Style, {

    [props.color]: props.color, 
    center: props.align === 'center',
    left: props.align === 'left',
    loading: props.loading,
    className: props.className,
    removeTopPadding: props.removeTopPadding,
    removeBottomPadding: props.removeBottomPadding

  });

  return (
    <section className={ css } id={ props.id }>
      <Content>

        <RowHeader
          title={ props.title }
          desc={ props.desc }
          color={ props.color }
        />

        { props.loading ? 
          <Loader /> : props.children }

      </Content>
    </section>
  )
}