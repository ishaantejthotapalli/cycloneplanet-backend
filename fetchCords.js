const https = require('https');
const fs = require('fs');

console.log("🌀 Fetching HurricaneZone images...");

const url = "https://www.hurricanezone.org/";

https.get(url, (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);

  res.on('end', () => {

    let images = [];

    try {
      // 🔥 Extract all images
      let matches = data.match(/<img[^>]+src="([^">]+)"/g);

      if (matches) {
        matches.forEach(tag => {

          let srcMatch = tag.match(/src="([^"]+)"/);
          if (!srcMatch) return;

          let src = srcMatch[1];

          // 👉 Filter cyclone-related images
          if (src.includes("track") || src.includes("forecast") || src.includes("gif")) {

            if (!src.startsWith("http")) {
              src = "https://www.hurricanezone.org/" + src;
            }

            images.push(src);
          }

        });
      }

    } catch (err) {
      console.log("⚠️ Error parsing images");
    }

    let output = {
      lastUpdated: new Date().toISOString(),
      images: images.slice(0, 10) // limit
    };

    fs.writeFileSync("Cordsdata.json", JSON.stringify(output, null, 2));

    console.log("✅ Images found:", images.length);
  });

}).on('error', () => {
  console.log("⚠️ Failed");

  fs.writeFileSync("Cordsdata.json", JSON.stringify({
    lastUpdated: new Date().toISOString(),
    images: []
  }, null, 2));
});
