import { useEffect, useState } from 'react';
import { Meta, HomeLayout, Row, PricePlans, useAPI } from 'components/lib';

// demo plans remove this when using live plans from server
import demoPlans from 'content/plans';

export default function Pricing(){

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const res = useAPI('/account/plans');

  useEffect(() => {

    if (!res.loading){

      setLoading(false);
      setPlans(res.data?.plans.length ? res.data.plans : demoPlans);

    }
  }, [res.data])

  return (
    <HomeLayout>

      <Meta 
        title='Your Page Title | Pricing'
        keywords={['your', 'keywords', 'go', 'here']}
        description='Your page description here'
        card='https://your_social_card_url.jpg'
      />

      <Row 
        title='Pricing' 
        desc='Join 1000s of customers who saved $100+ each' 
        color='dark' 
        align='center' 
        width='medium'
        removeTopPadding
        loading={ loading }>

        { plans?.length && 
          <PricePlans plans={ plans }/> }

      </Row>
    </HomeLayout>
  )
}
