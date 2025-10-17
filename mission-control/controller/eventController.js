const event = require('../model/event');
const chart = require('../helper/chart');
const utility = require('../helper/utility');

/*
* event.get()
* get all events or a single event
*/

exports.get = async function(req, res){

  const list = await event.get({ id: req.params.id, filter: req.query });

  if (req.query.name){

    // create a chart
    let chartData;
    const times = await event.times(req.query.name);

    if (times?.length){
      chartData = times.map(x => {
        return {

          label: x.time,
          value: x.total
          
        }
      });
    }
       
    return res.status(200).send({ data: { 

      list: list,
      chart: chartData ? chart.create(chartData) : null

    }});
  }

  res.status(200).send({ data: list });

}

/*
* event.delete()
* delete an event
*/

exports.delete = async function(req, res){

  const data = req.body;
  utility.validate(data, ['id']);

  await event.delete({ id: data.id });
  res.status(200).send({ message: `${Array.isArray(req.body.id) && req.body.id.length ? 'Events' : 'Event' } deleted` });

}
