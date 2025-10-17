/***
*
*   API Keys List
*   View and manage the API keys in the account.
*
**********/

import { Fragment, useContext, useState, useEffect, useCallback } from 'react';
import Axios from 'axios';
import { ViewContext, Animate, Card, Table, Loader, Alert, useAPI } from 'components/lib';

export function APIKeyList({ t }){

  // context
  const viewContext = useContext(ViewContext);

  // state
  const [keys, setKeys] = useState([]);

  // fetch
  const fetch = useAPI('/api/key');

  // init keys
  useEffect(() => {

    if (fetch?.data?.length)
      setKeys(fetch.data);
 
  }, [fetch]);

  const newKey = useCallback(() => {

    // navigate() doesn't work inside a shadcn dropdown
    // so using window.location
    window.location = '/account/apikeys/create';

  }, []);

  const revokeKey = useCallback(({ row, editRowCallback }) => {

    viewContext.dialog.open({
      title: t('account.api_keys.list.revoke.title'),
      description: t('account.api_keys.list.revoke.description'),
      form: {
        inputs: {
          active: {
            type: 'hidden',
            value: false,
          }
        },
        buttonText: t('account.api_keys.list.revoke.button'),
        url: `/api/key/${row.id}`,
        destructive: true,
        method: 'PATCH',
      },
    }, () => {

      row.active = false;
      editRowCallback(row);

    });
  }, [viewContext]);

  const editKey = useCallback(({ row }) => {

    // navigate() doesn't work inside a shadcn dropdown
    // so using window.location
    return window.location = `/account/apikeys/edit?id=${row.id}`;

  }, []);

  const deleteKey = useCallback(({ row, deleteRowCallback }) => {
    
    const id = Array.isArray(row) ? row.map(x => x.id) : [row.id];

    viewContext.dialog.open({
      title: id.length > 1 ? t('account.api_keys.list.delete.title.plural') : t('account.api_keys.list.delete.title.single'),
      description: id.length > 1 ? t('account.api_keys.list.delete.description.plural') : t('account.api_keys.list.delete.description.single'),
      form: { 
        inputs: {
          id: {
            type: 'hidden',
            value: id,
          }
        },
        url: '/api/key',
        destructive: true,
        method: 'DELETE',
        buttonText: t('account.api_keys.list.delete.button'),
      }
    }, () => {

      const newState = deleteRowCallback(row);
      setKeys(newState);

    });
  }, [viewContext]);

  const revealKey = useCallback(async ({ row }) => {

    // reveal the api key
    const res = await Axios.get(`/api/key/${row.id}`)
    const key = res.data?.data?.[0].key;

    setKeys(prev => prev.map(item =>
      item.id === row.id ? { ...item, key } : item));

  }, [keys]);

  return (
    <Fragment>
      { fetch.loading ? 
        <Loader /> :
        <Animate>

          <Card title='Your API Keys'>

            { keys.length ? 
              <Table 
                selectable
                searchable
                data={ keys }
                loading={ fetch.loading }
                translation='account.api_keys.list'
                show={['name', 'key', 'active']}
                actions={[

                  { icon: 'eye', label: t('global.table.action.reveal'), action: revealKey },
                  { icon: 'rotate-ccw', label: t('global.table.action.revoke'), action: revokeKey },
                  { icon: 'edit', label: t('global.table.action.edit'), action: editKey },
                  { icon: 'trash', label: t('global.table.action.delete'), action: deleteKey, global: true, color: 'red' },
                  { icon: 'circle-plus', label: t('global.table.action.new'), action: newKey, color: 'green', global: true, globalOnly: true }

                ]}
                badge={{ col: 'active', color: 'green', condition: [

                  { value: true, color: 'green' },
                  { value: false, color: 'red' }
                
                ]}}
              /> :

              <Alert 
                variant='info'
                title={ t('account.api_keys.list.blank_slate.title') }
                description={ t('account.api_keys.list.blank_slate.description') }
                button={{ 
                  
                  text: t('account.api_keys.list.blank_slate.button'), 
                  url: '/account/apikeys/create' 
                
                }}
              />
            }
          </Card> 
        </Animate> 
      } 
    </Fragment>
  );
}
