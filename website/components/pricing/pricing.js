/***
*
*   PRICE PLANS
*   Pricing table for the pricing page
*   Data is fetched from the API on the pricing page
*
**********/

import { useState, useEffect } from 'react';
import { Card, CheckList, Button, Badge, Banner, ClassHelper, Switch, CurrencySelector } from 'components/lib';
import Style from './pricing.tailwind.js';

export function PricePlans(props){

  const [currencies, setCurrencies] = useState([])
  const [currency, setCurrency] = useState(props.plans[0].currency.name);
  const [plans, setPlans] = useState([]);

  // config
  const config = {

    period_selector: true,
    ppp_banner: false, 
    currency_selector: true,

  }

  useEffect(() => {

    if (props.plans.length){

      // get the currencies
      const curList = [];
      props.plans.forEach(plan => {

        if (!curList.includes(plan.currency.name))
          curList.push(plan.currency.name)
        
      })

      config.period_selector ? 
        filterPlans('Monthly') :
        setPlans(props.plans);

      setCurrencies(curList);

    }

  }, [props.plans]);

  function filterPlans(period){

    // filter month/year plans
    const p = props.plans.filter(plan => {
      return plan.interval === (period.includes('Month') ? 'month': 'year')
    })
    
    setPlans(p);

  }

  return (
    <section className={ Style.wrapper }>

      { config.period_selector &&
        <div className={ Style.period_selector }>
          <Switch options={['Monthly', 'Yearly']} callback={ filterPlans }/>
        </div> }

      { config.ppp_banner &&
        <Banner 
          text='🇹🇭 We support purchasing power parity for citizens of Thailand. Use coupon THAI50 at checkout' 
          className={ Style.banner }/> }

      { config.currency_selector &&
        <CurrencySelector 
          selected={ currency }
          currencies={ currencies }
          onChange={ cur => setCurrency(cur) }
          className={ Style.currency_selector }/> }

      <div className={ Style.plans }>

        { plans.map(plan => {

          const css = ClassHelper(Style, { plan: true, highlight: plan.highlight })

          // ignore non-selected currencies
          if (plan.currency.name !== currency)
            return false;

          return (
            <Card key={ plan.id } className={ css }>

              { plan.highlight && 
                <Badge text='Popular' color='blue' className={ Style.badge }/> }

              <header className={ Style.header }>
                <div className={ Style.name }>
                  { plan.name }
                </div>

                { plan.discount &&
                  <div className={ Style.discount }>

                    <span className={ Style.currency }>{ plan?.currency?.symbol }</span>
                    <span className={ Style.original_amount }>{ parseInt(plan.price) }</span>
                    <small>{ plan.interval && '/' }{ plan.interval }</small>
                    
                  </div> }

                <div className={ Style.price }>

                  <span className={ Style.currency }>{ plan?.currency?.symbol }</span>
                  <span className={ Style.amount }>{ plan.discount ? parseInt((plan.price - (plan.price * plan.discount))) : parseInt(plan.price) }</span>
                  <small className={ Style.interval }>{ plan.interval && '/' }{ plan.interval }</small>
               
                </div>

              </header>

              <CheckList 
                items={ plan.features } 
                checkColor='green'
                crossColor='red'
                className={ Style.features }
              />
              
              <Button text='Sign Up' url={ `${process.env.NEXT_PUBLIC_URL}/signup` } fullWidth />

            </Card>
          )
        })} 
      </div>
    </section>
  );
}