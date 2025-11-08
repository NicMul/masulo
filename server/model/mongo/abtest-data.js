const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

// define schema
const ABTestDataSchema = new Schema({

  id: { type: String, required: true, unique: true },
  gameId: { type: String, required: true },
  userId: { type: String, required: true },
  accountId: { type: String, required: true },
  eventType: { type: String, required: true },
  variant: { 
    type: String, 
    required: true, 
    enum: ['variantA', 'variantB']
  },
  timestamp: { type: String, required: true },
  distributionWeight: { type: Number, required: true },
  device: { 
    type: String, 
    required: true, 
    enum: ['mobile', 'desktop']
  },
  data: { type: Object, default: {} },
  date_created: Date,
  date_updated: Date

});

const ABTestData = mongoose.model('ABTestData', ABTestDataSchema, 'abtestdata');

/*
* abtestdata.create()
* create a new AB test data entry
*/

exports.create = async function({ data, user, account }){

  const newABTestData = ABTestData({

    id: data.id || uuidv4(),
    gameId: data.gameId,
    userId: user || data.userId,
    accountId: account || data.accountId,
    eventType: data.eventType,
    variant: data.variant,
    timestamp: data.timestamp || new Date().toISOString(),
    distributionWeight: data.distributionWeight,
    device: data.device,
    data: data.data || {},
    date_created: new Date(),
    date_updated: new Date()

  });

  return await newABTestData.save();

}

/*
* abtestdata.createMany()
* create multiple AB test data entries (bulk insert)
*/

exports.createMany = async function({ events, user, account }){
  
  if (!events || !Array.isArray(events) || events.length === 0) {
    return { insertedCount: 0 };
  }

  console.log('[ABTestData] createMany called:', {
    eventCount: events.length,
    userId: user,
    accountId: account
  });

  const documents = events.map(data => ({
    id: data.id || uuidv4(),
    gameId: data.gameId,
    userId: user || data.userId,
    accountId: account || data.accountId,
    eventType: data.eventType,
    variant: data.variant,
    timestamp: data.timestamp || new Date().toISOString(),
    distributionWeight: data.distributionWeight,
    device: data.device,
    data: data.data || {},
    date_created: new Date(),
    date_updated: new Date()
  }));

  console.log('[ABTestData] Sample document:', documents[0]);
  console.log('[ABTestData] Document IDs:', documents.map(d => d.id).slice(0, 5));

  try {
    // Use insertMany for bulk insert (much faster than individual saves)
    // ordered: false means continue inserting even if some fail
    const result = await ABTestData.insertMany(documents, { 
      ordered: false
    });
    
    console.log('[ABTestData] Bulk insert result:', {
      resultType: Array.isArray(result) ? 'array' : typeof result,
      insertedCount: Array.isArray(result) ? result.length : (result?.insertedCount || 0),
      totalAttempted: documents.length,
      isArray: Array.isArray(result),
      resultKeys: result && typeof result === 'object' && !Array.isArray(result) ? Object.keys(result) : 'N/A'
    });
    
    // If result is an array, return its length
    // If result is an object (rawResult: true), return insertedCount
    const insertedCount = Array.isArray(result) 
      ? result.length 
      : (result?.insertedCount || result?.insertedIds?.length || 0);
    
    if (insertedCount === 0 && documents.length > 0) {
      console.warn('[ABTestData] Warning: No documents were inserted despite successful operation');
      console.warn('[ABTestData] This might indicate duplicate IDs or validation failures');
      
      // Check if IDs might be duplicates by trying to find existing ones
      const sampleIds = documents.slice(0, 3).map(d => d.id);
      const existing = await ABTestData.find({ id: { $in: sampleIds } }).select('id').lean();
      console.log('[ABTestData] Existing document check:', {
        checkedIds: sampleIds,
        foundExisting: existing.length,
        existingIds: existing.map(d => d.id)
      });
      
      // Try to validate a single document manually
      try {
        const testDoc = new ABTestData(documents[0]);
        const validationError = testDoc.validateSync();
        if (validationError) {
          console.error('[ABTestData] Validation error on sample document:', validationError.errors);
        } else {
          console.log('[ABTestData] Sample document validation passed');
        }
      } catch (validationErr) {
        console.error('[ABTestData] Validation exception:', validationErr.message);
      }
      
      // Try inserting a single document to see the actual error
      try {
        const singleResult = await ABTestData.create(documents[0]);
        console.log('[ABTestData] Single document insert succeeded:', singleResult.id);
      } catch (singleError) {
        console.error('[ABTestData] Single document insert failed:', {
          name: singleError.name,
          message: singleError.message,
          code: singleError.code,
          errors: singleError.errors
        });
      }
    }
    
    return { insertedCount };
  } catch (error) {
    console.error('[ABTestData] Bulk insert error:', error);
    console.error('[ABTestData] Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      writeErrors: error.writeErrors?.length || 0,
      insertedDocs: error.insertedDocs?.length || 0
    });
    
    // If there are writeErrors, log them
    if (error.writeErrors && Array.isArray(error.writeErrors)) {
      console.error('[ABTestData] Write errors (first 3):', error.writeErrors.slice(0, 3).map(e => ({
        index: e.index,
        code: e.code,
        errmsg: e.errmsg
      })));
    }
    
    // Return partial success if some documents were inserted
    if (error.insertedDocs && error.insertedDocs.length > 0) {
      console.log('[ABTestData] Partial success:', {
        insertedCount: error.insertedDocs.length,
        failedCount: error.writeErrors?.length || 0
      });
      return { insertedCount: error.insertedDocs.length };
    }
    
    throw error;
  }
}

/*
* abtestdata.get()
* get AB test data entries (single entry by id, filtered by query, or all entries)
*/

exports.get = async function({ id, gameId, userId, accountId, variant, eventType, device }){

  const query = {};
  
  if (id) query.id = id;
  if (gameId) query.gameId = gameId;
  if (userId) query.userId = userId;
  if (accountId) query.accountId = accountId;
  if (variant) query.variant = variant;
  if (eventType) query.eventType = eventType;
  if (device) query.device = device;

  const data = await ABTestData.find(query).sort({ date_created: -1 });

  return data;

}

/*
* abtestdata.getById()
* get a single AB test data entry by id
*/

exports.getById = async function(id){

  return await ABTestData.findOne({ id: id });

}

/*
* abtestdata.update()
* update an AB test data entry by id
*/

exports.update = async function({ id, data }){

  const updateData = {
    ...data,
    date_updated: new Date()
  };

  const result = await ABTestData.findOneAndUpdate(
    { id: id },
    { $set: updateData },
    { new: true }
  );

  return result;

}

/*
* abtestdata.delete()
* delete an AB test data entry by id
*/

exports.delete = async function({ id }){

  return await ABTestData.deleteOne({ id: id });

}

/*
* abtestdata.deleteMany()
* delete multiple AB test data entries by query
*/

exports.deleteMany = async function({ gameId, userId, accountId }){

  const query = {};
  
  if (gameId) query.gameId = gameId;
  if (userId) query.userId = userId;
  if (accountId) query.accountId = accountId;

  return await ABTestData.deleteMany(query);

}

/*
* abtestdata.aggregate()
* run aggregation queries on AB test data
*/

exports.aggregate = async function(pipeline){

  return await ABTestData.aggregate(pipeline);

}

exports.schema = ABTestDataSchema;
exports.model = ABTestData;


