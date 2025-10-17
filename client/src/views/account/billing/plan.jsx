/***
*
*   BILLING / PLAN
*   Change the billing plan.
*
**********/

import { useContext, useState, useEffect } from 'react';
import { AuthContext, Row, Card, Form, Alert, usePlans, useAPI } from 'components/lib';

export function BillingPlan({ t, subscription, onUpdate }){

  // context
  const context = useContext(AuthContext);

  // state
  const [plans, setPlans] = useState(null);
  const [usage, setUsage] = useState(null);
  const [tiered, setTiered] = useState(null);
  const [seats, setSeats] = useState(null);
  const [downgradingToFree, setDowngradingToFree] = useState(false);
  const [scheduledToCancel, setScheduledToCancel] = useState(null);

  // fetch
  const fetchPlans = usePlans();

  useEffect(() => {

    if (fetchPlans.data?.raw?.plans.length){

      const active = fetchPlans.data.raw.plans.find(x => x.id === fetchPlans.data.raw.active);
      setTiered(active.type === 'tiered');
      setPlans(fetchPlans.data);
     
    }
  }, [fetchPlans.data])

  useEffect(() => {

    setScheduledToCancel(subscription?.data?.object?.cancel_at_period_end);

    if (subscription?.data?.object?.seats){
      setSeats({ 
    
        volume: subscription.data.object.seats, 
        price: subscription.data.object.seat_price/100,
        currency: subscription.data.object.currency_symbol,
        interval: subscription.data.object.interval,
        total: ((subscription.data.object.seat_price * subscription.data.object.seats)/100).toFixed(0)
      
      });
    }
  }, [subscription])

  return (
    <Row width='lg'>
      <Card title={ t('account.billing.plan.title') } loading={ fetchPlans.loading || subscription.loading }>

        { tiered &&
          <FetchUsage callback={ u => setUsage(u) } /> 
        }

        { (usage || seats || (downgradingToFree && !scheduledToCancel) || scheduledToCancel) && (
          <Row>

            { usage &&
              <Alert 
                variant='info' 
                icon='pie-chart' 
                description={ `${ t('account.billing.plan.usage_helper') } ${usage}` }
              /> 
            }

            { seats &&
              <Alert 
                variant='info' 
                icon='users' 
                title={ t('account.billing.plan.seats_helper.title', { ...seats })}
                description={ 
                  
                  seats.volume === 1 ?
                    t('account.billing.plan.seats_helper.description_single', { ...seats }) :
                    t('account.billing.plan.seats_helper.description_plural', { ...seats })
    
                }
              /> 
            }

            { downgradingToFree && !scheduledToCancel &&
              <Alert variant='warning' description={ `${ t('account.billing.plan.downgrade_helper', 
                { end: subscription.data.object.current_period_end })}` }/> 
            }

            { scheduledToCancel &&
              <Alert variant='success' description={ `${ t('account.billing.plan.subscription_ends', 
                { end: subscription.data.object.current_period_end })}` }/> 
            }

          </Row>
        )}
        
        { plans &&
          <Form
            inputs={{
              plan: {
                type: 'select',
                required: true,
                defaultValue: plans.active,
                options: plans.list
              }
            }}
            url='/api/account/plan'
            method='PATCH'
            buttonText={ t('account.billing.plan.form.button') }
            onChange={ data => {

              if (data.input === 'plan')
                setDowngradingToFree(data.value === 'free');
      
            }}
            callback={ res => {
              
              // move to free at end of the billing period or move now?
              if (res.data.data.plan === 'free'){

                setScheduledToCancel(true)

              }
              else {

                setScheduledToCancel(false); // clear the scheduled cancel status when upgrading
                setDowngradingToFree(false); // ensure downgradingToFree is reset when upgrading
                context.update({ plan: res.data.data.plan, subscription: 'active' });

              }

              onUpdate();

            }}
          />
        }

        { subscription?.data?.object && 
          <footer className='mt-4'>
            { `${t('account.billing.plan.billing_cycle')} ${subscription.data.object.current_period_start} to 
              ${subscription.data.object.current_period_end}` }
          </footer> }

      </Card>
    </Row>  
  )
} 

function FetchUsage({ callback }){

  const usage = useAPI('/api/account/usage');

  useEffect(() => {

    if (usage.data)
      callback(`${usage.data.total} ${usage.data.label} this ${usage.data.period}`)

  }, [usage.data, callback])

  return null;

}