const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;
const { logStep, logError } = require('../utils/logger');

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
  try {
    logStep('📦', 'Creating CDN configuration in database...', { userId: user, accountId: account });

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

    const savedCdn = await newCdn.save();
    logStep('✅', 'CDN configuration saved to database', { cdnId: savedCdn.id });
    return savedCdn;
  } catch (error) {
    logError('Failed to create CDN configuration', error);
    throw error;
  }
};

/*
* cdn.get()
* get CDN configurations for a user (single CDN by id or all CDNs)
*/

exports.get = async function({ id, user, account }){
  try {
    logStep('🔍', 'Getting CDN configuration from database...', { userId: user, accountId: account, cdnId: id });

    const query = { 
      user_id: user,
      account_id: account 
    };
    if (id) query.id = id;

    const data = await Cdn.find(query).sort({ date_created: -1 });

    if (data && data.length > 0) {
      logStep('✅', 'CDN configuration found', { count: data.length });
    } else {
      logStep('ℹ️', 'No CDN configuration found');
    }

    return data;
  } catch (error) {
    logError('Failed to get CDN configuration', error);
    throw error;
  }
};

