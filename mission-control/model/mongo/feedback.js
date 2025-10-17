const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// define schema
const FeedbackSchema = new Schema({

  id: { type: String, required: true, unique: true },
  rating: { type: String, required: true },
  comment: { type: String,  },
  date_created: Date,
  user_id: { type: String, required: true },

});

const Feedback = mongoose.model('Feedback', FeedbackSchema, 'feedback');

/*
* feedback.get()
* list feedback items
*/

exports.get = async function(id){

  const data = await Feedback.aggregate([
    { $project: {
        id: 1,
        rating: 1,
        user_id: 1, 
        comment: { $ifNull: ["$comment", null] }
      }
    },
    { $lookup: {

      from: 'user',
      localField: 'user_id',
      foreignField: 'id',
      as: 'user_data'
        
     }}
  ]);

  return data.map(f => {
    return {

      id: f.id,
      user_id: f.user_id,
      comment: f.comment,
      email: f.user_data.find(x => x.id === f.user_id)?.email
  
    }
  })
}

/*
* feedback.metrics()
* sum ratings by group
*/

exports.metrics = async function(){

  const data = await Feedback.aggregate([{
    $group: {

      _id: '$rating',
      total: { $sum: 1 }

    }
  }]);

  const res = {};
  data.forEach(x => { res[x._id] = x.total });
  return res;
  
}

/*
* feedback.delete()
* delete a feedback item
*/

exports.delete = async function(id){

  return await Feedback.deleteMany({ id: id });

};
