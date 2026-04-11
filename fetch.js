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

        let line = lines[i];

        // 🔥 ONLY process WARNING sections (REAL storms)
        if (!line.includes("WARNING NR")) continue;

        let block = lines.slice(i, i + 25).join(" ");

        // 🔍 Extract code (30P, 04W)
        let codeMatch = block.match(/\b\d{2}[A-Z]\b/i);
        let code = codeMatch ? codeMatch[0].toUpperCase() : null;

        // 🔍 Extract real name (MAILA, SINLAKU)
        let nameMatch = block.match(/\(([^)]+)\)/);
        let realName = nameMatch ? nameMatch[1].toUpperCase() : null;

        // 🧠 FINAL NAME LOGIC
        let name = realName || code;

        if (!name) continue;

        // 🔍 Extract coordinates
        let coordMatch = block.match(
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
