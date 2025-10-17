// import modules
const modules = import.meta.glob('./**/*.json', { eager: true });

const locale = {
  translation: {}
}

for (const path in modules) {

  const parts = path.split('/').slice(1);
  let currentLevel = locale.translation;

  parts.forEach((part, index) => {

    const isFile = part.endsWith('.json');
    const key = isFile ? part.replace(/.._/, '').replace('.json', '') : part;

    if (isFile) {

      currentLevel[key] = modules[path].default;

    } else {

      if (!currentLevel[key]) 
        currentLevel[key] = {};

      currentLevel = currentLevel[key];
  
    }
  });
}

export default locale; 