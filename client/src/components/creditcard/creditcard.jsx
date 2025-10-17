/***
*
*   CREDIT CARD
*   Displays a visual representation of a credit card.
*   
*   DOCS
*   https://docs.usegravity.app/gravity-web/components/credit-card
*
*   PROPS
*   brand: card provider name (string, required)
*   expires: expiry date (string, required)
*   last_four: last 4 digits of card number (string, required)
*
**********/

import { useTranslation } from 'components/lib';

export function CreditCard({ brand, expires, last_four }){

  const { t } = useTranslation();

  return (
    <div className='relative block w-64 h-36 px-5 py-4 mx-auto mt-2 mb-8 text-white rounded-md bg-gradient-to-b from-blue-400 to-blue-500 drop-shadow-lg'>
      
      <div className='font-semibold uppercase mb-5'>
        { brand }
      </div>

      <div className='text-xl font-semibold mb-3'>
        •••• •••• •••• { last_four }
      </div>

      <div className='float-left mr-4'>

        <div className='font-semibold text-xs'>
          { t('account.billing.card.expires') }
        </div>
        <div className='text-sm'>
          { expires }
        </div>

      </div>

      <div className='float-left mr-4'>

        <div className='font-semibold text-xs'>
          CVV
        </div>
        <div className='text-sm'>
          •••
        </div>
        
      </div>
    </div>
  )
}