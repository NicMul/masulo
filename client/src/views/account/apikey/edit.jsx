/***
*
*   API Key Editor
*   Create or edit and API key.
*
**********/

import { useState, useEffect, useCallback } from 'react';
import Axios from 'axios';
import { Animate, Card, Form, Alert, Breadcrumb, Row, 
  Label, Input, Loader, useNavigate, useSearchParams, useAPI } from 'components/lib';

export function APIKeyEditor({ t }){

  const navigate = useNavigate();

  // state
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(false);
  const [newAPIKey, setNewAPIKey] = useState(false);
  const [searchParams] = useSearchParams();

  // fetch the scopes
  const scopes = useAPI('/api/key/scopes');

  const fetch = useCallback(async (id) => {

    setLoading(true);

    const res = await Axios.get(`/api/key/${id}`);
    
    res.data.data.length ? 
      setData(res.data.data[0]) : 
      navigate('/404');

    setLoading(false);

  }, [location.search, navigate]);

  useEffect(() => {

    // editing existing key?
    const id = searchParams.get('id');
    id && fetch(id);

  }, [fetch, searchParams])

  if (scopes.loading)
    return <Loader />

  return (
    <Animate>

      <Row>
        <Breadcrumb items={[
          { name: t('account.api_keys.edit.breadcrumbs.keys'), url: '/account/apikeys' },
          { name: `${data ? t('account.api_keys.edit.breadcrumbs.edit'): t('account.api_keys.edit.breadcrumbs.create') }`, url: '/account/apikeys/create' }          
          ]}
        />
      </Row>

      { newAPIKey ? 
        <Card title={ t('account.api_keys.edit.message.title') }>

          <Row>
            <Alert 
              variant='warning'
              title={ t('account.api_keys.edit.message.description') }
              button={{ text: t('account.api_keys.edit.message.button'), url: '/account/apikeys' }}
            />
          </Row>

          <div>
            <Label>Your API Key:</Label>
            <Input value={ newAPIKey } />
          </div>
          
        </Card>  : 
 
        <Card title={ `${data ? t('account.api_keys.edit.breadcrumbs.edit') : t('account.api_keys.edit.breadcrumbs.create')} API Key` } loading={ loading }> 
          <Form 
            inputs={{
              name: {
                label: t('account.api_keys.edit.form.name.label'),
                type: 'text',
                required: true,
                value: data.name, 
                errorMessage: t('account.api_keys.edit.form.name.error')
              },
              scope: {
                label: t('account.api_keys.edit.form.scope.label'),
                type: 'checkbox',
                required: true,
                defaultValue: data.scope,
                options: scopes.data,
                errorMessage: t('account.api_keys.edit.form.scope.error')
              }
            }}
            url={ data ? `/api/key/${data.id}` : '/api/key' }
            method={ data ? 'PATCH' : 'POST' }
            buttonText={ t('account.api_keys.edit.form.button') }
            callback={ res => {
              
              data ? 
                navigate('/account/apikeys') : 
                setNewAPIKey(res?.data?.data?.full_key) 
            
            }}
          />
        </Card>
      }
    </Animate>
  )
}