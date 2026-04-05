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
      let matches = data.match(/<img[^>]+src="([^">]+)"/g);

      if (matches) {
        matches.forEach(tag => {

          let srcMatch = tag.match(/src="([^"]+)"/);
          if (!srcMatch) return;

          let src = srcMatch[1];

          // 🔥 Convert relative → absolute
          if (!src.startsWith("http")) {
            src = "https://www.hurricanezone.org/" + src;
          }

          // 🔑 ONLY TRACKING IMAGES
          if (src.toLowerCase().includes("tracking")) {
            images.push(src);
          }

        });
      }

    } catch (err) {
      console.log("⚠️ Parse error");
    }

    // 🔥 Remove duplicates
    images = [...new Set(images)];

    let output = {
      lastUpdated: new Date().toISOString(),
      images: images
    };

    fs.writeFileSync("Cordsdata.json", JSON.stringify(output, null, 2));

    console.log("✅ Tracking images found:", images.length);
  });

}).on('error', () => {
  console.log("⚠️ Fetch failed");

  fs.writeFileSync("Cordsdata.json", JSON.stringify({
    lastUpdated: new Date().toISOString(),
    images: []
  }, null, 2));
});
