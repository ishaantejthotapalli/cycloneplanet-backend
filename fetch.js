const https = require('https');
const fs = require('fs');

console.log("🌪️ Scraping HurricaneZone...");

const url = "https://www.hurricanezone.org/";

https.get(url, (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);

  res.on('end', () => {

    let storms = [];

    try {

      // 🔥 Match ONLY real cyclone blocks
      let matches = data.match(
        /TROPICAL CYCLONE\s+\d{2}[A-Z]\s+\((.*?)\)[\s\S]*?NEAR\s+\d{1,2}\.\d[NS]\s+\d{1,3}\.\d[EW]/g
      );

      if (matches) {
        matches.forEach(block => {

          // 🌪️ Extract ID
          let idMatch = block.match(/\d{2}[A-Z]/);
          let id = idMatch ? idMatch[0] : "";

          // 🌪️ Extract Name
          let nameMatch = block.match(/\((.*?)\)/);
          let name = nameMatch ? nameMatch[1] : "Unknown";

          // 📍 Extract Coordinates
          let coordMatch = block.match(/(\d{1,2}\.\d)([NS])\s+(\d{1,3}\.\d)([EW])/);

          let lat = parseFloat(coordMatch[1]);
          let lon = parseFloat(coordMatch[3]);

          if (coordMatch[2] === "S") lat = -lat;
          if (coordMatch[4] === "W") lon = -lon;

          // 💨 Extract Wind Speed
          let windMatch = block.match(/WINDS\s*-\s*(\d+)/);
          let wind = windMatch ? parseInt(windMatch[1]) : 0;

          // 🎨 Category logic
          let warning = "low";
          if (wind >= 34) warning = "medium";
          if (wind >= 64) warning = "high";

          storms.push({
            name: `${id} (${name})`,
            lat: lat,
            lon: lon,
            wind: wind,
            warning: warning,
            type: "cyclone"
          });

        });
      }

    } catch (err) {
      console.log("⚠️ Parsing error:", err);
    }

    let output = {
      lastUpdated: new Date().toISOString(),
      storms: storms
    };

    fs.writeFileSync("data.json", JSON.stringify(output, null, 2));

    console.log("✅ Storms found:", storms.length);
  });

}).on('error', (err) => {
  console.log("⚠️ Fetch failed:", err);

  fs.writeFileSync("data.json", JSON.stringify({
    lastUpdated: new Date().toISOString(),
    storms: []
  }, null, 2));
});
