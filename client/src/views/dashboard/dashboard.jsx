/***
*
*   DASHBOARD
*   Template dashboard example demonstrating various components inside a view.
*
**********/

import { useContext, useEffect } from 'react';
import { ViewContext, Card, Stat, Chart, Table, Grid, Row, Animate, Feedback, useAPI } from 'components/lib';

export function Dashboard({ t }){

  // context
  const viewContext = useContext(ViewContext);

  // show welcome message
  useEffect(() => {
    viewContext.notification({ 
      
      title: t('dashboard.message.title'),
      description: t('dashboard.message.text'),
    
    });
  }, []);

  // fetch
  const res = useAPI('/api/demo');
  const { stats, revenue, users } = res.data || {};

  return (
    <Animate type='pop'>

      <Grid max={ 4 }>

        { stats?.length &&
          stats.map(stat => {

            return (
              <Card key={ stat.label } loading={ stat.loading }>
                <Stat {...stat } />
              </Card>
            );
          })
        }
      </Grid>

      <Row>
        <Card title={ t('dashboard.revenue.title') }>
          <Chart
            type='line'
            showLegend
            loading={ res.loading }
            data={ revenue }
            color={['red', 'blue']}
          />
        </Card> 
      </Row>

      <Card title={ t('dashboard.users.title') }>
        <Table
          searchable
          data={ users }
          loading={ res.loading }
          badge={{ col: 'plan', color: 'blue' }}>
        </Table>
      </Card>

      <Feedback />

    </Animate>
  );
}
