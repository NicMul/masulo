const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// define schema
const PromotionSchema = new Schema({

  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  group: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  games: [{
    gameCmsId: { type: String, required: true },
    friendlyName: { type: String, required: true },
    promoImage: { type: String, required: true },
    promoVideo: { type: String, required: true }
  }],
  approvedBy: { type: String }, // User ID who approved the promotion
  published: { type: Boolean, default: false },
  user_id: { type: String, required: true },
  date_created: Date,
  date_updated: Date

});

const Promotion = mongoose.model('Promotion', PromotionSchema, 'promotion');

/*
* promotion.create()
* create a new promotion
*/

exports.create = async function({ data, user }){

  const newPromotion = Promotion({

    id: uuidv4(),
    name: data.name,
    description: data.description,
    group: data.group,
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    games: data.games || [],
    approvedBy: data.approvedBy || null,
    published: data.published || false,
    user_id: user,
    date_created: new Date(),
    date_updated: new Date()

  });

  return await newPromotion.save();

}

/*
* promotion.get()
* get promotions for a user (single promotion by id or all promotions)
*/

exports.get = async function({ id, user }){

  const query = { user_id: user };
  if (id) query.id = id;

  const data = await Promotion.find(query).sort({ date_created: -1 });

  return data;

}

/*
* promotion.update()
* update a promotion by id and user_id
*/

exports.update = async function({ id, user, data }){

  const updateData = {
    ...data,
    date_updated: new Date()
  };

  // Explicitly ensure published field is set correctly when provided
  // This handles the case where published: false needs to be explicitly set
  if ('published' in data) {
    // Convert to boolean explicitly to handle string 'true'/'false' cases
    updateData.published = data.published === true || data.published === 'true';
  }

  const result = await Promotion.findOneAndUpdate(
    { id: id, user_id: user },
    { $set: updateData },
    { new: true }
  );

  return result;

}

/*
* promotion.delete()
* delete a promotion by id and user_id
*/

exports.delete = async function({ id, user }){

  return await Promotion.deleteOne({ id: id, user_id: user });

}
