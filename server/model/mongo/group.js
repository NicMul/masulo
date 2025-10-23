const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// define schema
const GroupSchema = new Schema({

  id: { type: String, required: true, unique: true },
  cmsGroupId: { type: String, required: true },
  friendlyName: { type: String, required: true },
  description: { type: String, required: true },
  user_id: { type: String, required: true },
  date_created: Date,
  date_updated: Date

});

const Group = mongoose.model('Group', GroupSchema, 'group');

/*
* group.create()
* create a new group
*/

exports.create = async function({ data, user }){

  const newGroup = Group({

    id: uuidv4(),
    cmsGroupId: data.cmsGroupId,
    friendlyName: data.friendlyName,
    description: data.description,
    user_id: user,
    date_created: new Date(),
    date_updated: new Date()

  });

  return await newGroup.save();

}

/*
* group.get()
* get groups for a user (single group by id or all groups)
*/

exports.get = async function({ id, user }){

  const query = { user_id: user };
  if (id) query.id = id;

  const data = await Group.find(query).sort({ date_created: -1 });

  return data;

}

/*
* group.update()
* update a group by id and user_id
*/

exports.update = async function({ id, user, data }){

  const updateData = {
    ...data,
    date_updated: new Date()
  };

  const result = await Group.findOneAndUpdate(
    { id: id, user_id: user },
    { $set: updateData },
    { new: true }
  );

  return result;

}

/*
* group.delete()
* delete a group by id and user_id
*/

exports.delete = async function({ id, user }){

  return await Group.deleteOne({ id: id, user_id: user });

}
