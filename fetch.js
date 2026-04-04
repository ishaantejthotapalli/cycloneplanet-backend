const https = require('https');
const fs = require('fs');

console.log("🌪️ Fetching cyclone data...");

const sources = [
  "https://www.metoc.navy.mil/jtwc/products/abioweb.txt",
  "https://www.metoc.navy.mil/jtwc/products/abpwweb.txt"
];

let storms = [];

function fetchSource(url) {
  return new Promise(resolve => {

    https.get(url, res => {
      let data = '';

      res.on('data', chunk => data += chunk);

      res.on('end', () => {

        let blocks = data.split("WARNING NR");

        blocks.forEach(block => {

          let nameMatch = block.match(/\b\d{2}[A-Z]\b/);
          if (!nameMatch) return;

          let name = nameMatch[0];

          if (name.startsWith("9")) return;

          let coordMatch = block.match(/NEAR\s+(\d{1,2}\.\d)([NS])\s+(\d{1,3}\.\d)([EW])/);
          if (!coordMatch) return;

          let lat = parseFloat(coordMatch[1]);
          let lon = parseFloat(coordMatch[3]);

          if (coordMatch[2] === "S") lat = -lat;
          if (coordMatch[4] === "W") lon = -lon;

          storms.push({
            name: name,
            lat: lat,
            lon: lon,
            warning: "high",
            type: "cyclone"
          });

        });

        resolve();
      });

    }).on('error', () => resolve());
  });
}

async function run() {
  for (let src of sources) {
    await fetchSource(src);
  }

  let output = {
    lastUpdated: new Date().toISOString(),
    storms: storms
  };

  fs.writeFileSync("data.json", JSON.stringify(output, null, 2));

  console.log("✅ Cyclones found:", storms.length);
}

run();
