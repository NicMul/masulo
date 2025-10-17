/***
*
*   LOG/LIST
*   List the application logs (paginated)
*
**********/

import { Fragment, useState, useEffect, useContext } from 'react';
import { ViewContext, Card, Table, Search, Paginate, useAPI } from 'components/lib';

export function Logs(props){

  // show 25 results at a time
  const limit = 25;

  // context
  const context = useContext(ViewContext);

  // state 
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // fetch
  const logs = useAPI(`/api/log?search=${search}&offset=${offset}&limit=${limit}`);

  useEffect(() => {

    if (logs.data?.results?.length)
      setTotal(logs.data.total);

    if (search)
      setOffset(0)

  }, [logs.data])

  function deleteLog(data, callback){

    const multi = Array.isArray(data);
    const id = multi ? data.map(x => { return x.id }) : data.id;
    
    context.modal.show({
      title: `Delete ${multi ? 'Logs' : 'Log'}`,
      form: {
        id: {
          type: 'hidden',
          value: id
        }
      },
      buttonText: 'Delete Log',
      text: `Are you sure you want to delete ${multi ? 'these logs' : 'this log'}?`,
      url: '/api/log/',
      method: 'DELETE',
      destructive: true,

    }, () => {

      callback();
      setTotal(total-1);

    });
  }

  return (
    <Fragment>

      <Search throttle={ 1000 } callback={ x => setSearch(x) }/><br/>

      <Paginate 
        offset={ offset } 
        limit={ limit } 
        total={ total }
        loading={ logs.loading }
        onChange={ x => setOffset(x) }
      />

      <Card>
        <Table  
          selectable
          loading={ logs.loading }
          data={ logs.data?.results }
          show={['time', 'message', 'email', 'method', 'endpoint']}
          actions={{

            delete: deleteLog,
            email: true,
            view: { url: '/logs', col: 'id' }

          }}
          bulkActions={{

            delete: deleteLog

          }}
        />
      </Card>
   </Fragment>
  )
}