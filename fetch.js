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

      // 🔥 Extract cyclone sections
      let blocks = data.split("TROPICAL CYCLONE");

      blocks.forEach(block => {

        // 🌪️ Name (INDUSA)
        let nameMatch = block.match(/\((.*?)\)/);
        if (!nameMatch) return;

        let name = nameMatch[1];

        // 📍 Coordinates
        let coordMatch = block.match(/NEAR\s+(\d{1,2}\.\d)([NS])\s+(\d{1,3}\.\d)([EW])/);
        if (!coordMatch) return;

        let lat = parseFloat(coordMatch[1]);
        let lon = parseFloat(coordMatch[3]);

        if (coordMatch[2] === "S") lat = -lat;
        if (coordMatch[4] === "W") lon = -lon;

        // 💨 Wind speed
        let windMatch = block.match(/WINDS\s*-\s*(\d+)/);
        let wind = windMatch ? parseInt(windMatch[1]) : 0;

        // 🎨 Category
        let warning = "low";
        if (wind >= 34) warning = "medium";
        if (wind >= 64) warning = "high";

        storms.push({
          name,
          lat,
          lon,
          wind,
          warning,
          type: "cyclone"
        });

      });

    } catch (err) {
      console.log("⚠️ Parse error");
    }

    let output = {
      lastUpdated: new Date().toISOString(),
      storms
    };

    fs.writeFileSync("data.json", JSON.stringify(output, null, 2));

    console.log("✅ Storms found:", storms.length);
  });

}).on('error', () => {
  console.log("⚠️ Fetch failed");

  fs.writeFileSync("data.json", JSON.stringify({
    lastUpdated: new Date().toISOString(),
    storms: []
  }, null, 2));
});
