const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// define schema
const CdnSchema = new Schema({

  id: { type: String, required: true, unique: true },
  storageZoneName: { type: String, required: true },
  storageZoneId: { type: String, required: true },
  storageZoneRegion: { type: String, required: true, default: 'DE' },
  pullZoneName: { type: String, required: true },
  pullZoneId: { type: String, required: true },
  cdnUrl: { type: String, required: true },
  storageKey: { type: String, required: true },
  optimization: { type: Boolean, default: true },
  user_id: { type: String, required: true },
  account_id: { type: String, required: true },
  date_created: Date,
  date_updated: Date

});

const Cdn = mongoose.model('Cdn', CdnSchema, 'cdn');

/*
* cdn.create()
* create a new CDN configuration
*/

exports.create = async function({ data, user, account }){

  const newCdn = Cdn({

    id: uuidv4(),
    storageZoneName: data.storageZoneName,
    storageZoneId: data.storageZoneId,
    storageZoneRegion: data.storageZoneRegion || 'DE',
    pullZoneName: data.pullZoneName,
    pullZoneId: data.pullZoneId,
    cdnUrl: data.cdnUrl,
    storageKey: data.storageKey,
    optimization: data.optimization !== undefined ? data.optimization : true,
    user_id: user,
    account_id: account,
    date_created: new Date(),
    date_updated: new Date()

  });

  return await newCdn.save();

}

/*
* cdn.get()
* get CDN configurations for a user (single CDN by id or all CDNs)
*/

exports.get = async function({ id, user, account }){

  const query = { 
    user_id: user,
    account_id: account 
  };
  if (id) query.id = id;

  const data = await Cdn.find(query).sort({ date_created: -1 });

  return data;

}

/*
* cdn.getByIds()
* get CDN configurations by multiple IDs
*/

exports.getByIds = async function(cdnIds){
  
  const data = await Cdn.find({ id: { $in: cdnIds } }).sort({ date_created: -1 });
  
  return data;
  
}

/*
* cdn.update()
* update a CDN configuration by id, user_id, and account_id
*/

exports.update = async function({ id, user, account, data }){

  const updateData = {
    ...data,
    date_updated: new Date()
  };

  const result = await Cdn.findOneAndUpdate(
    { id: id, user_id: user, account_id: account },
    { $set: updateData },
    { new: true }
  );

  return result;

}

/*
* cdn.delete()
* delete a CDN configuration by id, user_id, and account_id
*/

exports.delete = async function({ id, user, account }){

  return await Cdn.deleteOne({ id: id, user_id: user, account_id: account });

}

/*
* cdn.getByStorageZoneId()
* get CDN configuration by storage zone ID
*/

exports.getByStorageZoneId = async function({ storageZoneId, user, account }){

  const data = await Cdn.findOne({ 
    storageZoneId: storageZoneId, 
    user_id: user, 
    account_id: account 
  });

  return data;

}

/*
* cdn.getByPullZoneId()
* get CDN configuration by pull zone ID
*/

exports.getByPullZoneId = async function({ pullZoneId, user, account }){

  const data = await Cdn.findOne({ 
    pullZoneId: pullZoneId, 
    user_id: user, 
    account_id: account 
  });

  return data;

}
