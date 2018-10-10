/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.resolve(process.cwd(), './.build/goog-usage'), 'utf8').trim();
const usageList = content.split('\n');

const googRefMap = {};
let totalRefs = 0;

usageList.forEach(key => {
  googRefMap[key] = googRefMap[key] || 0;
  googRefMap[key]++;
  totalRefs++;
});

const googRefArray = [];
for (const key in googRefMap) {
  googRefArray.push({
    refName: key,
    refCount: googRefMap[key]
  });
}

// default sort function
const sortValues = (a, b) => a > b ? -1 : a < b ? 1 : 0;

// sort by count then by name
const googCallSort = (a, b) => sortValues(a.refCount, b.refCount) || sortValues(a.refName, b.refName);

const output = `Total references: ${totalRefs}\n\n` + googRefArray.sort(googCallSort)
    .map(obj => `${obj.refCount}: ${obj.refName}`)
    .join('\n');

fs.writeFile('./.build/goog-usage', output, function(err) {
  if (err) return console.log(err);

  console.log('The file was saved!');
});
