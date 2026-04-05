const https = require('https');
const fs = require('fs');

console.log("🌀 Fetching HurricaneZone tracking data...");

const base = "https://www.hurricanezone.org";

// 🔥 STEP 1: GET HOMEPAGE
https.get(base, (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);

  res.on('end', async () => {

    let trackingLinks = [];

    try {
      // 🔍 Find ALL links containing /tracking/
      let matches = data.match(/href="([^"]*\/tracking\/[^"]*)"/g);

      if (matches) {
        matches.forEach(tag => {
          let link = tag.match(/href="([^"]+)"/)[1];

          // Convert relative → absolute
          if (!link.startsWith("http")) {
            link = base + link;
          }

          trackingLinks.push(link);
        });
      }

    } catch (err) {
      console.log("⚠️ Error finding tracking links");
    }

    // 🔥 Remove duplicates
    trackingLinks = [...new Set(trackingLinks)];

    console.log("🔗 Tracking pages found:", trackingLinks.length);

    let images = [];

    // 🔥 STEP 2: VISIT EACH TRACKING PAGE
    for (let link of trackingLinks) {
      await new Promise(resolve => {

        https.get(link, (res2) => {
          let page = '';

          res2.on('data', chunk => page += chunk);

          res2.on('end', () => {

            try {
              let matches = page.match(/src="([^"]+)"/g);

              if (matches) {
                matches.forEach(tag => {

                  let src = tag.match(/src="([^"]+)"/)[1];

                  // Convert relative → absolute
                  if (!src.startsWith("http")) {
                    src = base + src;
                  }

                  // 🔥 FINAL PERFECT FILTER (YOUR LOGIC + SAFETY)
                  if (
                    src.includes("/tracking/") &&
                    src.match(/\.(png|jpg|gif)$/)
                  ) {
                    images.push(src);
                  }

                });
              }

            } catch (err) {
              console.log("⚠️ Parse error on:", link);
            }

            resolve();
          });

        }).on('error', () => resolve());

      });
    }

    // 🔥 FINAL CLEANUP
    images = [...new Set(images)];

    let output = {
      lastUpdated: new Date().toISOString(),
      images: images
    };

    fs.writeFileSync("Cordsdata.json", JSON.stringify(output, null, 2));

    console.log("✅ Tracking images found:", images.length);

  });

}).on('error', () => {
  console.log("⚠️ Failed to load homepage");

  fs.writeFileSync("Cordsdata.json", JSON.stringify({
    lastUpdated: new Date().toISOString(),
    images: []
  }, null, 2));
});
