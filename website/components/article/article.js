/***
*
*   ARTICLE
*   Wrapper component for rendering text-based articles
*
*   PROPS
*   children: children to render (component(s), required)
*
**********/

import { Content } from 'components/lib';
import Style from './article.module.scss';

export function Article(props){

  return (
    <article className={ Style.article }>
      <Content>

        { props.children }

      </Content>
    </article>
  );
}
