import { Meta, HomeLayout, Row, Card, Grid, Hero, ButtonGroup, Features, Testimonial, Image, Video } from 'components/lib';

import content from 'content/home';

export default function Home(){
  return (
    <HomeLayout transparent>

      <Meta 
        title={'Your Page Title'}
        keywords={['your', 'keywords', 'go', 'here']}
        description='Your page description here'
        card='https://your_social_card_url.jpg'
      />
 
      <Hero {...content.hero } color='dark'/>

      <Row 
        width='large'
        title={ content.testimonials.title }
        desc={ content.testimonials.desc }>

          <Grid cols={ 3 }>
            { content.testimonials.list.map((testimonial, i) => {

              return <Testimonial key={ i } {...testimonial }/>

            })}
          </Grid>
      </Row>

      <Row title={ content.features.title } desc={ content.features.description } color='tint' id='features'>
        <Features list={ content.features.list }/>
      </Row>

      <Row title={ content.how_it_works.title } desc={ content.how_it_works.description }>

        <Grid cols={ 3 }>
          { content.how_it_works.steps.map((step, i) => {

            return (
              <Card key={ i } title={ step.title } number={ i+1 } transparent noPadding>
                { step.description }
              </Card>
            )
          })}
        </Grid>

        <Card noPadding style={{ marginTop: '1em' }}>
          
          { content.how_it_works.image && 
            <Image {...content.how_it_works.image } /> } 

          { content.how_it_works.video && 
            <Video {...content.how_it_works.video } /> }

        </Card>

      </Row>

      <Row title={ content.faqs.title } desc={ content.faqs.description } color='tint' id='faqs'>

        <Grid cols={ 3 }>

          { content.faqs.items.map((item, i) => {

            return (
              <Card key={ i } title={ item.q } number={ i+1 } transparent noPadding>
                { item.a }
              </Card>
            )

          })}

        </Grid>

      </Row>

      <Row title={ content.cta.title } desc={ content.cta.description } align='center' color='dark'>
      
        <ButtonGroup buttons={ content.cta.actions } style={{ marginTop: '-1em' }}/>

      </Row>
  
    </HomeLayout>
  )
}
