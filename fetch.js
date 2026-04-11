const https = require('https');
const fs = require('fs');

console.log("🌪️ Fetching storms from HurricaneZone...");

const url = "https://www.hurricanezone.org/";

https.get(url, (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);

  res.on('end', () => {

    let storms = [];

    try {
      let lines = data.split("\n");

      for (let i = 0; i < lines.length; i++) {

        let fullText = lines[i];

        // 🔥 STEP 1: DETECT HEADER (TOP BLUE TEXT)
        let headerMatch = fullText.match(
          /(Tropical Cyclone|Tropical Storm|Typhoon|Hurricane)\s+([A-Z0-9]+)/i
        );

        if (!headerMatch) continue;

        let detected = headerMatch[2].toUpperCase();

        // 🚫 Skip junk matches
        if (detected === "WARNING" || detected === "NR") continue;

        let name = detected;

        // 🔍 STEP 2: FIND CODE (30P, 04W, etc.)
        let codeMatch = fullText.match(/\b\d{2}[A-Z]\b/i);
        let code = codeMatch ? codeMatch[0].toUpperCase() : null;

        // 🔍 STEP 3: FIND COORDINATES NEARBY
        let nearby = lines.slice(i, i + 15).join(" ");

        let coordMatch = nearby.match(
          /(\d{1,2}\.\d)([NS])\s+(\d{1,3}\.\d)([EW])/i
        );

        if (!coordMatch) continue;

        let lat = parseFloat(coordMatch[1]);
        let lon = parseFloat(coordMatch[3]);

        if (coordMatch[2] === "S") lat = -lat;
        if (coordMatch[4] === "W") lon = -lon;

        // 🚫 Avoid duplicates
        if (!storms.some(s => s.name === name)) {
          storms.push({
            name: name,
            code: code,
            lat: lat,
            lon: lon,
            wind: 0
          });

          console.log("✅ Found storm:", name);
        }
      }

    } catch (err) {
      console.log("⚠️ Parse error");
    }

    let output = {
      lastUpdated: new Date().toISOString(),
      storms: storms
    };

    fs.writeFileSync("data.json", JSON.stringify(output, null, 2));

    console.log("🌍 Total storms:", storms.length);
  });

}).on('error', () => {
  console.log("⚠️ Fetch failed");

  fs.writeFileSync("data.json", JSON.stringify({
    lastUpdated: new Date().toISOString(),
    storms: []
  }, null, 2));
});
