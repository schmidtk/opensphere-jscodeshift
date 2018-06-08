const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.resolve(process.cwd(), './.build/goog-usage'), 'utf8').trim();
const usageList = content.split('\n');

const map = {};
usageList.forEach(key => {
  map[key] = map[key] || 0;
  map[key]++;
});

const arr = [];
for (const key in map) {
  arr.push({
    key: key,
    value: map[key]
  });
}

const output = arr.sort((a, b) => a.value > b.value ? -1 : a.value < b.value ? 1 : 0)
    .map(obj => `${obj.value}: ${obj.key}`)
    .join('\n');

fs.writeFile('./.build/goog-usage', output, function(err) {
  if(err) {
    return console.log(err);
  }

  console.log("The file was saved!");
});
