/***
*
*   usePlans hook
*   Fetch, format and return the price plans.
*
*   DOCS
*   https://docs.mesulo.com/mesulo-web/hooks/useplans
*
**********/

import { useState, useEffect } from 'react';
import { useAPI } from 'components/lib';

export function usePlans(){

  const [state, setState] = useState({ data: null, loading: true });
  const plans = useAPI('/api/account/plans');

  useEffect(() => {

    if (plans.loading){

      return setState({ data: null, loading: true });

    }
    else if (plans?.data?.plans){

      // format the plans
      const formatted = plans.data.plans.map(plan => {

        const label = `${plan.name} (${plan.currency.symbol}${plan.price}${plan.interval ? `/${plan.interval}` : ''})`;
        return { value: plan.id, label };
      
      });

      setState({ 
        data: {  
          list: formatted, 
          active: plans.data.active, 
          raw: plans.data 
        }, 
        loading: false, 
      });
    }
    else {

      setState({ data: null, loading: false });

    }
  }, [plans]);

  return state;

}
