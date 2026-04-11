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
      // 🔥 Split into lines
      let lines = data.split("\n");

      for (let i = 0; i < lines.length; i++) {

        let line = lines[i].toLowerCase();

        // 🔥 DETECT ALL STORM TYPES
        if (
          line.includes("tropical cyclone") ||
          line.includes("tropical storm") ||
          line.includes("typhoon") ||
          line.includes("hurricane")
        ) {

          let fullText = lines[i];

          // 🔍 Extract storm name (e.g., 04W, 29S)
          let nameMatch = fullText.match(/\b\d{2}[a-z]\b/i);

          if (!nameMatch) continue;

          let name = nameMatch[0].toUpperCase();

          // 🔍 Find coordinates nearby
          let coordsLine = lines.slice(i, i + 10).join(" ");

          let coordMatch = coordsLine.match(/(\d{1,2}\.\d)([NS])\s+(\d{1,3}\.\d)([EW])/i);

          if (!coordMatch) continue;

          let lat = parseFloat(coordMatch[1]);
          let lon = parseFloat(coordMatch[3]);

          if (coordMatch[2] === "S") lat = -lat;
          if (coordMatch[4] === "W") lon = -lon;

          // 🚫 Avoid duplicates
          if (!storms.some(s => s.name === name)) {

            storms.push({
              name: name,
              lat: lat,
              lon: lon,
              wind: 0
            });

            console.log("✅ Found storm:", name);
          }
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
