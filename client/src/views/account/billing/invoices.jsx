/***
*
*   BILLING / INVOICES
*   View and download past invoices
*
**********/

import { Card, Table, useAPI } from 'components/lib';

export function BillingInvoices({ t }){

  const invoices = useAPI('/api/account/invoice')

  return (
    <Card title={ t('account.billing.invoice.title') } loading={ invoices.loading }>

      <Table 
        data={ invoices.data }
        hide={['invoice_pdf']}
        badge={{ col: 'status', color: 'red', condition: [

          { value: 'paid', color: 'green' },

        ]}}
        actions= {[
          { icon: 'download', 
            label: t('global.table.action.download'), 
            action: (data) => { window.open(data.row.invoice_pdf, '_blank', 'noopener')}
          },
        ]}
        translation='account.billing.invoice'
      />
    </Card>
  );
}