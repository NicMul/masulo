/***
*
*   BILLING / CARD
*   Update the billing credit card details.
*
**********/

import { useState, useEffect } from 'react';
import { Row, Card, CreditCard, PaymentForm, useAPI } from 'components/lib';

export function BillingCard({ t }){

  const [card, setCard] = useState(null);
  const fetchCard = useAPI('/api/account/card');

  useEffect(() => {

    if (fetchCard.data)
      setCard(fetchCard.data)

  }, [fetchCard.data])

  return (
    <Row width='lg'>
      <Card title={ t('account.billing.card.title') } loading={ fetchCard.loading }>

        { card && 
          <CreditCard 
            brand={ card.brand }
            last_four={ card.last4 }
            expires={ `${card.exp_month}/${card.exp_year}`}
          />
        } 

        <PaymentForm
          className='restrict-width'
          inputs={{
            token: {
              type: 'creditcard',
              required: true
            }
          }}
          url='/api/account/card'
          method='PATCH'
          buttonText={ t('account.billing.card.form.button') }
          callback={ res => setCard(res.data.data) }
        />

      </Card>
    </Row>
  )
}