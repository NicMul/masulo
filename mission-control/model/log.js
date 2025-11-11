const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// define schema
const LogSchema = new Schema({

  id: { type: String, required: true, unique: true },
  time: { type: Date, required: true },
  message: { type: String },
  body: { type: String },
  method: { type: String },
  endpoint: { type: String },
  account_id: { type: String },
  user_id: { type: String }

});

const Log = mongoose.model('Log', LogSchema, 'log');

/*
* log.get()
* return single or multiple logs
*/

exports.get = async function({ id, filter }){

  // get one
  if (id){

    const data = await Log.findOne({ id: id }).lean();
    delete data.__v;
    return [data];

  }

  let selector = {};
  
  if (filter?.search){

    const s = { $regex: filter.search, $options: 'i' }
    selector = {
      $or: [
        { message: s },
        { body: s },
        { method: s },
        { endpoint: s },
        { email: s }
      ]
    }
  }

  // get list
  const data = filter.search ? 
    await Log.find(selector) :
    await Log.find(selector).limit(parseInt(filter?.limit)).skip(parseInt(filter?.offset))

  const total = await Log.countDocuments();

  return {

    results: data,
    total: total,

  }  
}

/*
* log.delete()
* delete a log entry
*/

exports.delete = async function(id){

  return await Log.deleteMany({ id: id });

}
