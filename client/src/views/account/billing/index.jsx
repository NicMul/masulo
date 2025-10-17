/***
*
*   BILLING
*   Change subscription, update card details or view past invoices.
*
**********/

import { Fragment, useContext, useState, useEffect } from 'react';
import { AuthContext, Tabs, TabsList, TabsTrigger, TabsContent, Alert, Animate, useAPI } from 'components/lib';

import { BillingPlan } from './plan';
import { BillingCard } from './card';
import { BillingInvoices } from './invoices';

export function Billing({ t, ...props }){
  
  // context
  const authContext = useContext(AuthContext);

  // state
  const [showMessage, setShowMessage] = useState(false);

  // fetch subscription
  const subscription = useAPI('/api/account/subscription');
  const isPaid = authContext.user.plan !== 'free';
  
  useEffect(() => {

    // subscription did load - show message?
    if (subscription.data && !['active', 'trialing'].includes(subscription.data.status)) 
      setShowMessage(true);

  }, [subscription.data])

  return (
    <Animate>

      { showMessage &&
        <Alert 
          variant={ subscription.data.status === 'requires_action' ? 'warning' : 'error' }
          title={ t(`account.billing.message.${subscription.data.status}.title`) }
          description={ t(`account.billing.message.${subscription.data.status}.description`) }
        /> }

      <Tabs defaultValue='plan'>

        <TabsList>

            <TabsTrigger value='plan'>{ t('account.billing.tabs.plan') }</TabsTrigger>

            { isPaid && 
              <Fragment>
                <TabsTrigger value='card'>{ t('account.billing.tabs.card') }</TabsTrigger>
                <TabsTrigger value='invoices'>{ t('account.billing.tabs.invoices') }</TabsTrigger>
              </Fragment> 
            }

        </TabsList>

        <TabsContent value='plan'>
          <BillingPlan 
            {...props }
            t={ t }
            subscription={ subscription } 
            onUpdate={ () => setShowMessage(false) }/>
        </TabsContent>

        { isPaid && 
          <TabsContent value='card'>
            <BillingCard {...props } t={ t }/> 
          </TabsContent> }

        { isPaid && 
          <TabsContent value='invoices'>
            <BillingInvoices {...props } t={ t }/> 
          </TabsContent> } 

      </Tabs>
    </Animate>
  );
}
