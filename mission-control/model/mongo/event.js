const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./user').schema;

// define schema
const EventSchema = new Schema({

  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  metadata: { type: Object },
  time: { type: Date, required: true },
  user_id: { type: String },
  account_id: { type: String },

});

const Event = mongoose.model('Event', EventSchema, 'event');

/*
* event.get()
* return a single event or group of events 
* or a list of events within a group
*/

exports.get = async function({ id, filter }){

  let data, total = 0;

  // get one
  if (id){

    const data = await Event.findOne({ id:  id }).lean();

    if (data){

      const userData = await User.findOne({ id: data.user_id }).select({ email: 1 });
      data.email = userData?.email;
      delete data._id;
      delete data.__v;
      delete data.user_id;
      return [data];

    }
  }

  if (filter.group){

    // group the events & search by event name
    data = await Event.aggregate([
      
      { $match: { name: { $regex: filter.search, $options: 'i' }}},
      { $group: {
  
        _id: `$${filter.group}`,
        total_triggers: { $sum: 1 }
  
      }}
    ]);

    if (data.length){
      data = data.map(e => {
        return {
          
          name: e._id,
          total_triggers: e.total_triggers

        }
      });
    }
  }
  else {
    
    data = await Event.aggregate([

      { $limit: parseInt(filter.limit) },
      { $skip: parseInt(filter.offset) },
      { $match: { name: filter.name }},
      { $project: { 
        
        id: 1, name: 1, time: 1, email: 1, user: 1, user_id: 1,
      
      }},
      { $lookup: {
          from: 'user',
          as: 'user',
          let: { id: '$user_id' },
          pipeline: [
            { $match: {
                $expr: {
                  $and: [
                    { $eq: ['$id', '$$id'] },
                    { $regexMatch: { input: "$email", regex: filter.search } }
                  ]
                }
              }
            },
          ]
        }
      },
    ]);

    if (data.length){

      // get the total
      total = await Event.countDocuments({ name: filter.name });

      // if searching and lookup didn't match
      if (filter.search)
        data = data.filter(e => e.user?.length);

      // format results
      data = data.map(e => {
        return { 

          id: e.id,
          name: e.name,
          time: e.time,
          user_email: e.user?.[0]?.email || null

        }
      });
    }
  }

  return {

    results: data,
    total: total,

  }  
}

/*
* event.times()
* return a list of times for a name grouping
* used for charting
*/

exports.times = async function(name){

  let data = await Event.aggregate([

    { $match: { name: name }},
    { $group: {
  
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$time' }},
      value: { $sum: 1 }

    }}
  ]);

  if (data.length){

    // sort the groups by date
    data = data.sort((a,b) => new Date(a._id) - new Date(b._id))
    .map(e => {
      return {

        time: e._id,
        total: e.value

      }
    });
  }

  return data;

}

/*
* event.delete()
* delete an event by id or name
*/

exports.delete = async function({ id, name }){

  if (!id && !name)
    throw { message: 'Please provide an event ID or name' };

  await Event.deleteMany({ 
    
    ...id & { id: id },
    ...name && { name: name }, 
  
  });

  return id;

}
