const https = require('https');
const fs = require('fs');

console.log("🌀 Fetching HurricaneZone tcgraphics images...");

const base = "https://www.hurricanezone.org";

// 🔥 STEP 1: FETCH HOMEPAGE
https.get(base, (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);

  res.on('end', () => {

    let images = [];

    try {
      // 🔥 FIND ALL tcgraphics LINKS ANYWHERE
      let matches = data.match(/https:\/\/www\.hurricanezone\.org\/tcgraphics\/[^"]+\.(png|jpg|gif)/gi);

      if (matches) {
        images = [...new Set(matches)];
      }

    } catch (err) {
      console.log("⚠️ Parse error");
    }

    let output = {
      lastUpdated: new Date().toISOString(),
      images: images
    };

    fs.writeFileSync("Cordsdata.json", JSON.stringify(output, null, 2));

    console.log("✅ tcgraphics images found:", images.length);

  });

}).on('error', () => {
  console.log("⚠️ Fetch failed");

  fs.writeFileSync("Cordsdata.json", JSON.stringify({
    lastUpdated: new Date().toISOString(),
    images: []
  }, null, 2));
});
