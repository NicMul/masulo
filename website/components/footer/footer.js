/***
*
*   FOOTER (homepage)
*   Static homepage footer
*
**********/

import { Row, Content, Logo, Grid, Button } from 'components/lib'
import Link from 'next/link';
import Style from './footer.tailwind.js';

import content from 'content/footer';

export function Footer(props){

  return (
    <footer className={ Style.footer }>
      <Row>
        <Content>

          <Grid cols={ 4 }>

            <section>

              <Logo image='dark' className={ Style.logo }/>

              <address className={ Style.address }>
                { content.copyright } <br/>
                { content.address }
              </address>

            </section>

            { content.nav.map(nav => {

              return (
                <section key={ nav.title }>

                  <h2 className={ Style.title }>{ nav.title }</h2>

                  <nav>
                    { nav.items.map(item => {

                      return item.icon ? 
                      <Button key={ item.icon } title={ item.icon } url={ item.url } icon={ item.icon } className={ Style.button }/> :
                      <Link key={ item.text } href={ item.url } className={ Style.link }>{ item.text }</Link>

                    })}
                  </nav>
                  
                </section>
              )
            })}
          </Grid>
        </Content>

        <small>
          Built with <a href='https://mesulo.com'>Mesulo</a>
        </small>
      </Row>
    </footer>
  );
}