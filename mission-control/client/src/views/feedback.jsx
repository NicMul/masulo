/***
*
*   FEEDBACK
*   View user feedback for your application
*
**********/


import { Fragment, useContext, useState } from 'react';
import { ViewContext, Card, Table, Grid, Stat, Loader, useAPI } from 'components/lib';

export function Feedback(props){

  // context & state
  const context = useContext(ViewContext);
  const [reload, setReload] = useState(0);
  const feedback = useAPI('/api/feedback');

  if (feedback.loading)
    return <Loader />

  if (!feedback.data)
    return false;

  function deleteFeedback(data, callback){

    const multi = Array.isArray(data);
    const id = multi ? data.map(x => { return x.id }) : data.id;

    context.modal.show({

      title: `Delete Feedback ${multi ? 'Items' : 'Item'}`,
      form: {
        id: {
          type: 'hidden', 
          value: id,
        }
      },
      buttonText: 'Delete ',
      text: `Are you sure you want to delete ${multi ? 'these items' : 'this item'}?`,
      url: '/api/feedback',
      method: 'DELETE',
      destructive: true,

    }, (res) => {

      setReload(reload+1);
      callback();

    });
  }
  
  return (
    <Fragment>

      <Stats reload={ reload } /> 

      <Card>
        <Table 
          search
          selectable
          show={['rating', 'comment']}
          data={ feedback?.data }
          actions={{ 
            
            delete: deleteFeedback,
            email: true 
          
          }}
          bulkActions={{

            delete: deleteFeedback

          }}
        />
      </Card>

    </Fragment>
  )
}

function Stats(props){

  const stats = useAPI(`/api/feedback/metrics?reload=${props.reload}`);

  return (
    <Grid cols='3'>

      <Stat 
        value={ stats?.data?.positive || 0 } 
        icon={ 'smile' }
        label={ 'positive' }
      />
      <Stat 
        value={ stats?.data?.neutral || 0 } 
        icon={ 'meh' }
        label={ 'neutral' }
      />
      <Stat 
        value={ stats?.data?.negative || 0 } 
        icon={ 'frown' }
        label={ 'negative' }
      />

    </Grid>
  )
}