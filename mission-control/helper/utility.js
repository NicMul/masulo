// HOF to catch errors
exports.use = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
  
exports.convertToMonthName = function(month){

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May',
  'Jun', 'Jul','Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return monthNames[month-1];

}

exports.validate = function(form, fields){

  // sanitise the input
  Object.keys(form).forEach(f => {

    // sanitise
    if (typeof form[f] === 'string' && form[f]?.includes('<script>')){

      form[f] = form[f].replace('<script>', '');
      form[f] = form[f].replace('</script>', '');

    }
  });

  if (fields?.length){
    fields.forEach((f, i) => {    
      if (!form.hasOwnProperty(f) || !form[f]){

        // field is required
        throw { message: f + ' field is required' };

      }
    });
  }
}

exports.assert = function(data, err, input){

  if (!data)
    throw { message: err, ...input && { inputError: input }};

  return true;

}

exports.currencySymbol = {

  usd: '$',
  gbp: '£',
  eur: '€',
  aud: '$',
  cad: '$'

}