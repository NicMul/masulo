const db = require('./knex')();

/*
* event.get()
* return a single event or group of events 
* or a list of events within a group
*/

exports.get = async function({ id, filter }){

  const data = await db('event')
  .select('event.name')
  .leftJoin('user', 'user.id', 'event.user_id')
  .modify(q => {

    filter.name && q.where('event.name', filter.name);

    if (id){

      // get individual event by id
      q.where('event.id', id);
      q.select('event.id', 'metadata', 'time', 'user.email as user_email');

    }

    if (filter.group){
      
      // group the events & search by event name
      q.groupBy(`event.${filter.group}`);
      q.count('event.id as total_triggers');
      filter.search && q.where('event.name', 'like', `%${filter.search}%`);

    }
    else {

      // list all events & search by user email
      q.select('event.id', 'time', 'user.email as user_email');

      filter.offset && q.offset(filter.offset);
      filter.limit && q.limit(filter.limit);
      filter.search && q.where('user.email', 'like', `%${filter.search}%`);
      
    }
  });
  
  // return single event
  if (id)
    return data;

  // return  paginated results
  const total = await db('event')
  .leftJoin('user', 'user.id', 'event.user_id')
  .modify(q => { 
    
    filter.name && q.where('event.name', filter.name); 
    filter.search && q.where('user.email', 'like', `%${filter.search}%`);

  }).count('event.id as total');

  return {

    results: data,
    total: total?.[0]?.total

  }  
}

/*
* event.times()
* return a list of times for a name grouping
* used for charting
*/

exports.times = async function(name){

  const data = await db('event').select(db.raw('date(time) as time')).count('id as total')
  .where('name', name).groupByRaw('date(time)').orderByRaw('date(time) asc');

  // format dates
  data?.forEach(e => e.time = e.time.toISOString().split('T')[0]);
  return data;

}

/*
* event.delete()
* delete an event by id or name
*/

exports.delete = async function({ id, name }){

  if (!id && !name)
    throw { message: 'Please provide an event ID or name' };

  return await db('event').del().modify(q => {

    id && q.whereIn('id', Array.isArray(id) ? id : [id])
    name && q.where('name', name);

  });
}
