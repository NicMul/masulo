const fs = require('fs').promises;

exports.line = {};

// remove a line from a file after str
exports.line.remove = async function({ path, str }){

  let file = await fs.readFile(path, 'utf8');
  file = file.split('\n');

  const index = file.findIndex(x => x.includes(str));
  if (index < 0) throw { message: `${str} is not present in ${path}` }

  file.splice(index, 1);
  file = file.join('\n');
  return await fs.writeFile(path, file, 'utf8');

}

// insert lines in file after a str index
// lines is an array of objects with find/insert keys
// insert value will be inserted one line after the find value
exports.line.insert = async function({ path, lines }){

  let file = await fs.readFile(path, 'utf8')
  file = file.split('\n');

  lines.forEach(line => {

    const index = file.findIndex(x => x.includes(line.find));
    if (index < 0) throw { message: `${line.find} is not present in ${path}` }
    file.splice(index+1, 0, line.insert);

  });

  file = file.join('\n');
  return await fs.writeFile(path, file, 'utf8');

}

// replace a str in a file
exports.replace = async function({ path, find, replace }){

  let file = await fs.readFile(path, 'utf8');
  file = file.replace(find, replace);
  await fs.writeFile(path, file, 'utf8');

} 

// delete a file if it exists
exports.delete = async function(path){

  try {

    await fs.access(path);
    fs.unlink(path);
  
  }
  catch (err){

    // do nothing
    
  }
}