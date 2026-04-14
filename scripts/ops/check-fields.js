// Destination: scripts/ops/check-fields.js
const path = require('path');
const r = require(path.resolve(__dirname, '../pipeline/2-revised/the-godfather.json'));

function check(obj, p) {
  for (const [k, v] of Object.entries(obj)) {
    const fp = p ? `${p}.${k}` : k;
    if (v === null || v === undefined) continue;
    if (typeof v === 'string' || typeof v === 'boolean') continue;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === 'object') check(item, `${fp}[${i}]`);
        else if (item !== null && typeof item !== 'string')
          console.log(`NON-STRING: ${fp}[${i}] = ${typeof item} = ${JSON.stringify(item)}`);
      });
    } else if (typeof v === 'object') {
      check(v, fp);
    } else {
      console.log(`NON-STRING: ${fp} = ${typeof v} = ${v}`);
    }
  }
}

check(r, '');
console.log('Done');
