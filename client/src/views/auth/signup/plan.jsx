/***
*
*   SIGN UP STEP 2
*   Select a plan and enter card details.
*
**********/

import { useContext, useState, useEffect } from 'react';
import { AuthContext, PaymentForm, usePlans, Link, Event, useNavigate, useSearchParams } from 'components/lib';

export function SignupPlan({ t }){

  const navigate = useNavigate();
  const plans = usePlans();

  // context
  const authContext = useContext(AuthContext);

  // state
  const [inputs, setInputs] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {

    if (plans.data?.list?.length){
      setInputs({
        plan: {
          label: t('auth.signup.plan.form.plan.label'),
          type: 'select',
          options: plans.data.list,
          defaultValue: searchParams.get('id'),
          required: true,
        },
      })
    }
  }, [plans, t, searchParams])

  return(
    <div>

      <h1>{ t('auth.signup.plan.title') }</h1>

      { inputs && 
        <PaymentForm
          inputs={ inputs }
          url='/api/account/plan'
          method='POST'
          buttonText={ t('auth.signup.plan.form.button') }
          onChange={ data => {

            // hide card input when free plan is selected
            if (data.input === 'plan') {

              inputs.plan.value = data.value;
              setInputs({ ...inputs, token: data.value === 'free' ? { type: null } : cardInput(t) });

            }
          }}
          callback={ res => {

            // save the plan to context, then redirect
            Event({ name: 'selected_plan', metadata: { plan: res.data.plan }});
            authContext.update({ plan: res.data.plan, subscription: res.data.subscription });
            navigate(res.data.onboarded ? '/dashboard' : '/welcome');

          }}
        /> 
      }

      <footer className='mt-4'>
        <Link url='/account/profile' text={ t('auth.signup.plan.footer.link_text') } />
      </footer>
        
    </div>
  );
}

const cardInput = (t) => ({

  label: t('auth.signup.plan.form.token.label'),
  type: 'creditcard',
  required: true,

});