const joi = require('joi');
const abtestData = require('../model/abtest-data');
const utility = require('../helper/utility');

exports.create = async function(req, res){

  // validate
  const data = utility.validate(joi.object({
    
    id: joi.string(),
    gameId: joi.string().required(),
    start: joi.string().required(),
    end: joi.string().required(),
    userId: joi.string(),
    accountId: joi.string(),
    eventType: joi.string().required(),
    variant: joi.string().valid('variantA', 'variantB').required(),
    timestamp: joi.string(),
    distributionWeight: joi.number().required(),
    device: joi.string().valid('mobile', 'desktop').required(),
    data: joi.object().default({})

  }), req, res); 

  const testData = await abtestData.create({ 
    data, 
    user: req.user, 
    account: req.account 
  });
  
  return res.status(200).send({ 
    message: res.__('abtestdata.create.success') || 'AB test data created successfully', 
    data: testData 
  });

}

exports.get = async function(req, res){

  const filters = {
    id: req.params.id,
    gameId: req.query.gameId,
    userId: req.query.userId,
    accountId: req.query.accountId,
    variant: req.query.variant,
    eventType: req.query.eventType,
    device: req.query.device
  };

  const testDataList = await abtestData.get(filters);
  res.status(200).send({ data: testDataList });

}

exports.getById = async function(req, res){

  utility.assert(req.params.id, res.__('abtestdata.get.id_required') || 'ID is required');
  
  const testData = await abtestData.getById(req.params.id);
  
  if (!testData) {
    return res.status(404).send({ 
      message: res.__('abtestdata.get.not_found') || 'AB test data not found' 
    });
  }
  
  res.status(200).send({ data: testData });

}

exports.update = async function(req, res){

  utility.assert(req.params.id, res.__('abtestdata.update.id_required') || 'ID is required');

  // validate
  const data = utility.validate(joi.object({
    
    gameId: joi.string(),
    start: joi.string(),
    end: joi.string(),
    userId: joi.string(),
    accountId: joi.string(),
    eventType: joi.string(),
    variant: joi.string().valid('variantA', 'variantB'),
    timestamp: joi.string(),
    distributionWeight: joi.number(),
    device: joi.string().valid('mobile', 'desktop'),
    data: joi.object()

  }), req, res); 

  const testData = await abtestData.update({ id: req.params.id, data });
  
  if (!testData) {
    return res.status(404).send({ 
      message: res.__('abtestdata.update.not_found') || 'AB test data not found' 
    });
  }

  return res.status(200).send({ 
    message: res.__('abtestdata.update.success') || 'AB test data updated successfully', 
    data: testData 
  });

}

exports.delete = async function(req, res){

  utility.assert(req.params.id, res.__('abtestdata.delete.id_required') || 'ID is required');
  
  const result = await abtestData.delete({ id: req.params.id });
  
  if (result.deletedCount === 0) {
    return res.status(404).send({ 
      message: res.__('abtestdata.delete.not_found') || 'AB test data not found' 
    });
  }

  res.status(200).send({ 
    message: res.__('abtestdata.delete.success') || 'AB test data deleted successfully' 
  });

}

exports.deleteMany = async function(req, res){

  const filters = {
    gameId: req.query.gameId,
    userId: req.query.userId,
    accountId: req.query.accountId
  };

  const result = await abtestData.deleteMany(filters);

  res.status(200).send({ 
    message: res.__('abtestdata.deleteMany.success') || `${result.deletedCount} AB test data entries deleted successfully`,
    count: result.deletedCount 
  });

}

exports.aggregate = async function(req, res){

  // validate pipeline
  const data = utility.validate(joi.object({
    pipeline: joi.array().required()
  }), req, res);

  const results = await abtestData.aggregate(data.pipeline);

  res.status(200).send({ data: results });

}

exports.getStats = async function(req, res){

  // validate query parameters
  const schema = joi.object({
    gameId: joi.string().required(),
    startDate: joi.string().required(),
    endDate: joi.string().required()
  });

  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });

  if (error) {
    const messages = error.details.map(err => err.message).join(', ');
    return res.status(400).send({ 
      message: messages || 'Invalid query parameters' 
    });
  }

  const { gameId, startDate, endDate } = value;

  // Convert dates to ISO strings for comparison (timestamp is stored as ISO string)
  const startDateISO = new Date(startDate).toISOString();
  const endDateISO = new Date(endDate).toISOString();

  // Build aggregation pipeline
  const pipeline = [
    {
      $match: {
        gameId: gameId,
        timestamp: {
          $gte: startDateISO,
          $lte: endDateISO
        }
      }
    },
    {
      $facet: {
        impressions: [
          {
            $match: {
              eventType: 'impression'
            }
          },
          {
            $group: {
              _id: '$variant',
              count: { $sum: 1 }
            }
          }
        ],
        clicks: [
          {
            $match: {
              eventType: { $in: ['video_click', 'button_click'] }
            }
          },
          {
            $group: {
              _id: '$variant',
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ];

  const results = await abtestData.aggregate(pipeline);

  // Transform results to the desired format
  const stats = {
    variantA: {
      impressions: 0,
      clicks: 0,
      ctr: 0
    },
    variantB: {
      impressions: 0,
      clicks: 0,
      ctr: 0
    }
  };

  if (results && results.length > 0) {
    const result = results[0];
    
    // Process impressions
    if (result.impressions && Array.isArray(result.impressions)) {
      result.impressions.forEach(item => {
        if (item._id === 'variantA') {
          stats.variantA.impressions = item.count;
        } else if (item._id === 'variantB') {
          stats.variantB.impressions = item.count;
        }
      });
    }

    // Process clicks
    if (result.clicks && Array.isArray(result.clicks)) {
      result.clicks.forEach(item => {
        if (item._id === 'variantA') {
          stats.variantA.clicks = item.count;
        } else if (item._id === 'variantB') {
          stats.variantB.clicks = item.count;
        }
      });
    }

    // Calculate CTR
    if (stats.variantA.impressions > 0) {
      stats.variantA.ctr = (stats.variantA.clicks / stats.variantA.impressions) * 100;
    }
    if (stats.variantB.impressions > 0) {
      stats.variantB.ctr = (stats.variantB.clicks / stats.variantB.impressions) * 100;
    }
  }

  res.status(200).send({ data: stats });

}

exports.getTimeSeries = async function(req, res){

  // validate query parameters
  const schema = joi.object({
    gameId: joi.string().required(),
    startDate: joi.string().required(),
    endDate: joi.string().required()
  });

  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });

  if (error) {
    const messages = error.details.map(err => err.message).join(', ');
    return res.status(400).send({ 
      message: messages || 'Invalid query parameters' 
    });
  }

  const { gameId, startDate, endDate } = value;

  // Convert dates to ISO strings for comparison (timestamp is stored as ISO string)
  const startDateISO = new Date(startDate).toISOString();
  const endDateISO = new Date(endDate).toISOString();

  // Determine grouping granularity based on time range
  const timeDiff = new Date(endDateISO).getTime() - new Date(startDateISO).getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  const minutesDiff = timeDiff / (1000 * 60);
  
  // Group by minute if less than 2 hours, by hour if less than 48 hours, otherwise by day
  let dateGroupField;
  if (minutesDiff <= 120) {
    // Group by 10-minute intervals for very short ranges (1 hour)
    // Extract YYYY-MM-DDTHH:MM format
    dateGroupField = {
      date: {
        $substr: ['$timestamp', 0, 16]
      }
    };
  } else if (hoursDiff <= 48) {
    // Group by hour: YYYY-MM-DDTHH format
    dateGroupField = {
      date: {
        $substr: ['$timestamp', 0, 13]
      }
    };
  } else {
    // Group by day: YYYY-MM-DD format
    dateGroupField = {
      date: {
        $substr: ['$timestamp', 0, 10]
      }
    };
  }

  // Build aggregation pipeline for time series data
  const pipeline = [
    {
      $match: {
        gameId: gameId,
        timestamp: {
          $gte: startDateISO,
          $lte: endDateISO
        }
      }
    },
    {
      $addFields: dateGroupField
    },
    {
      $facet: {
        impressions: [
          {
            $match: {
              eventType: 'impression'
            }
          },
          {
            $group: {
              _id: {
                date: '$date',
                variant: '$variant'
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.date': 1 }
          }
        ],
        clicks: [
          {
            $match: {
              eventType: { $in: ['video_click', 'button_click'] }
            }
          },
          {
            $group: {
              _id: {
                date: '$date',
                variant: '$variant'
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.date': 1 }
          }
        ],
        hoverTime: [
          {
            $match: {
              eventType: 'hover_end',
              'data.duration': { $exists: true, $ne: null }
            }
          },
          {
            $group: {
              _id: {
                date: '$date',
                variant: '$variant'
              },
              avgDuration: { $avg: '$data.duration' },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.date': 1 }
          }
        ]
      }
    }
  ];

  const results = await abtestData.aggregate(pipeline);

  // Transform results to time series format
  const timeSeries = {
    impressions: {
      variantA: [],
      variantB: []
    },
    clicks: {
      variantA: [],
      variantB: []
    },
    hoverTime: {
      variantA: [],
      variantB: []
    },
    labels: []
  };

  if (results && results.length > 0) {
    const result = results[0];
    
    // Get all unique dates
    const dates = new Set();
    
    // Process impressions
    if (result.impressions && Array.isArray(result.impressions)) {
      result.impressions.forEach(item => {
        dates.add(item._id.date);
        if (item._id.variant === 'variantA') {
          timeSeries.impressions.variantA.push({ date: item._id.date, count: item.count });
        } else if (item._id.variant === 'variantB') {
          timeSeries.impressions.variantB.push({ date: item._id.date, count: item.count });
        }
      });
    }

    // Process clicks
    if (result.clicks && Array.isArray(result.clicks)) {
      result.clicks.forEach(item => {
        dates.add(item._id.date);
        if (item._id.variant === 'variantA') {
          timeSeries.clicks.variantA.push({ date: item._id.date, count: item.count });
        } else if (item._id.variant === 'variantB') {
          timeSeries.clicks.variantB.push({ date: item._id.date, count: item.count });
        }
      });
    }

    // Process hover time
    if (result.hoverTime && Array.isArray(result.hoverTime)) {
      result.hoverTime.forEach(item => {
        dates.add(item._id.date);
        if (item._id.variant === 'variantA') {
          // Convert milliseconds to seconds for display
          timeSeries.hoverTime.variantA.push({ 
            date: item._id.date, 
            avgDuration: item.avgDuration ? (item.avgDuration / 1000) : 0 
          });
        } else if (item._id.variant === 'variantB') {
          timeSeries.hoverTime.variantB.push({ 
            date: item._id.date, 
            avgDuration: item.avgDuration ? (item.avgDuration / 1000) : 0 
          });
        }
      });
    }

    // Sort dates and create labels
    const sortedDates = Array.from(dates).sort();
    timeSeries.labels = sortedDates;

    // Fill in missing dates with 0
    sortedDates.forEach(date => {
      // Check impressions
      if (!timeSeries.impressions.variantA.find(d => d.date === date)) {
        timeSeries.impressions.variantA.push({ date, count: 0 });
      }
      if (!timeSeries.impressions.variantB.find(d => d.date === date)) {
        timeSeries.impressions.variantB.push({ date, count: 0 });
      }
      // Check clicks
      if (!timeSeries.clicks.variantA.find(d => d.date === date)) {
        timeSeries.clicks.variantA.push({ date, count: 0 });
      }
      if (!timeSeries.clicks.variantB.find(d => d.date === date)) {
        timeSeries.clicks.variantB.push({ date, count: 0 });
      }
      // Check hover time
      if (!timeSeries.hoverTime.variantA.find(d => d.date === date)) {
        timeSeries.hoverTime.variantA.push({ date, avgDuration: 0 });
      }
      if (!timeSeries.hoverTime.variantB.find(d => d.date === date)) {
        timeSeries.hoverTime.variantB.push({ date, avgDuration: 0 });
      }
    });

    // Sort each array by date
    timeSeries.impressions.variantA.sort((a, b) => a.date.localeCompare(b.date));
    timeSeries.impressions.variantB.sort((a, b) => a.date.localeCompare(b.date));
    timeSeries.clicks.variantA.sort((a, b) => a.date.localeCompare(b.date));
    timeSeries.clicks.variantB.sort((a, b) => a.date.localeCompare(b.date));
    timeSeries.hoverTime.variantA.sort((a, b) => a.date.localeCompare(b.date));
    timeSeries.hoverTime.variantB.sort((a, b) => a.date.localeCompare(b.date));
  }

  res.status(200).send({ data: timeSeries });

}


