/***
*
*   EVENT/LIST
*   List all the events in the group
*
**********/

import { useContext, useState, useEffect } from 'react';
import { ViewContext, Animate, Card, Chart, Table, Search, Breadcrumbs, Paginate, useAPI, useLocation } from 'components/lib';

export function Events(props){

  // show 25 results at a time
  const limit = 25;

  const location = useLocation();
  const path = location?.pathname.split('/');

  // context
  const context = useContext(ViewContext);
  const eventName = path[2];

  // state 
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [chart, setChart] = useState(false);

  const events = useAPI(`/api/event?search=${search}&offset=${offset}&limit=${limit}&name=${eventName}`);

  useEffect(() => {

    if (events.data?.list)
      setTotal(events.data.list.total);

    if (events.data?.chart)
      setChart(events.data.chart);

    if (search)
      setOffset(0)

  }, [events.data])

  function deleteEvent(data, callback){
    
    const multi = Array.isArray(data);
    const id = multi ? data.map(x => { return x.id }) : data.id;

    context.modal.show({
      title: `Delete ${multi ? 'Events' : 'Event'}`,
      form: {
        id: {
          type: 'hidden',
          value: id
        }
      },
      buttonText: 'Delete',
      text: `Are you sure you want to delete ${multi ? 'these events' : 'this event'}?`,
      url: '/api/event/',
      method: 'DELETE',
      destructive: true,

    }, () => {

      callback();
      setTotal(total-1);

    });
  }
  
  return (
    <Animate>

      <Breadcrumbs items={[
        { name: 'groups', url: '/events' },
        { name: eventName, url: `/events/${eventName}` }
      ]}/>

      { chart && 
        <Card title={`${eventName} events by day`}>
          <Chart 
            type='line'
            data={ chart }
          />
        </Card>
      }

      <Search throttle={ 1000 } callback={ x => setSearch(x) } placeholder='Search by email' /><br/>

      <Paginate 
        offset={ offset } 
        limit={ limit } 
        total={ total }
        loading={ events.loading }
        onChange={ x => setOffset(x) }
      />

      <Card>
        <Table  
          selectable
          loading={ events.loading }
          data={ events?.data?.list?.results }
          show={['name', 'time', 'user_email']}
          actions={{

            delete: deleteEvent,
            view: { url: `/events/${eventName}`, col: 'id' }

          }}
          bulkActions={{

            delete: deleteEvent

          }}
        />
      </Card>
   </Animate>
  )
}