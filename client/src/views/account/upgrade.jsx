/***
*
*   UPGRADE
*   Upgrade from a free to paid plan.
*
**********/

import { useContext, useEffect, useState } from 'react';
import { AuthContext, Row, Card, PaymentForm, useSearchParams, 
  useNavigate, Animate, Event, usePlans } from 'components/lib';

export function Upgrade({ t }){

  const navigate = useNavigate();

  // context
  const context = useContext(AuthContext);

  // state
  const [list, setList] = useState(null);
  const [searchParams] = useSearchParams();

  // fetch
  const plans = usePlans();

  useEffect(() => {

    if (plans?.data?.list?.length){

      // remove free plan and set selected plan
      const l = [...plans.data.list];
      const i = l.findIndex(x => x.value === 'free');
      if (i > -1) l.splice(i, 1);
      setList(l);

    }
  }, [plans]);

  return(
    <Animate>
      <Row width='lg'>
        <Card 
          title={ t('account.upgrade.subtitle') }
          loading={ plans.loading }
          className='upgrade-form'>
            <PaymentForm
              inputs={{
                plan: {
                  label: t('account.upgrade.form.plan.label'),
                  type: 'select',
                  defaultValue: searchParams.get('plan'),
                  options: list,
                },
                token: {
                  label: t('account.upgrade.form.token.label'),
                  type: 'creditcard',
                  required: true,
                }
              }}
              url='/api/account/upgrade'
              method='POST'
              buttonText={ t('account.upgrade.form.button') }
              callback={ res => {

                // update the auth context so user can use features on the new plan
                Event({ name: 'upgraded', metadata: { plan: res.data.data.plan } });
                context.update({ plan: res.data.data.plan, subscription: 'active' });
                setTimeout(() => navigate('/dashboard'), 2500);

              }}
            />
        </Card>
      </Row>
    </Animate>
  );
}
