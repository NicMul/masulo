/***
*
*   ROW CONTENT
*   Position content within a row
*
*   PROPS
*   children: children to render (component(s), required)
*
**********/

import Style from './content.tailwind.js';

export function Content({ children }){

  return (
    <div className={ Style.content }>
      { children }
    </div>
  );
}