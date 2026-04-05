const https = require('https');
const fs = require('fs');

console.log("🌀 Fetching HurricaneZone tracking data...");

const base = "https://www.hurricanezone.org";

// 🔥 STEP 1: FETCH HOMEPAGE
https.get(base, (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);

  res.on('end', async () => {

    let trackingLinks = [];

    try {
      // 🔍 FIND ALL /tracking/ LINKS
      let matches = data.match(/href="([^"]*\/tracking\/[^"]*)"/g);

      if (matches) {
        matches.forEach(tag => {
          let link = tag.match(/href="([^"]+)"/)[1];

          if (!link.startsWith("http")) {
            link = base + link;
          }

          trackingLinks.push(link);
        });
      }

    } catch (err) {
      console.log("⚠️ Error finding tracking links");
    }

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

              // 🌀 1. GET <img src="">
              let imgMatches = page.match(/src="([^"]+)"/g);

              if (imgMatches) {
                imgMatches.forEach(tag => {
                  let src = tag.match(/src="([^"]+)"/)[1];

                  if (!src.startsWith("http")) {
                    src = base + src;
                  }

                  if (
                    src.includes("/tracking/") &&
                    src.match(/\.(png|jpg|gif)$/)
                  ) {
                    images.push(src);
                  }
                });
              }

              // 🌀 2. GET <a href="">
              let linkMatches = page.match(/href="([^"]+)"/g);

              if (linkMatches) {
                linkMatches.forEach(tag => {
                  let href = tag.match(/href="([^"]+)"/)[1];

                  if (!href.startsWith("http")) {
                    href = base + href;
                  }

                  if (
                    href.includes("/tracking/") &&
                    href.match(/\.(png|jpg|gif)$/)
                  ) {
                    images.push(href);
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

    console.log("✅ FINAL tracking images:", images.length);

  });

}).on('error', () => {
  console.log("⚠️ Failed to load homepage");

  fs.writeFileSync("Cordsdata.json", JSON.stringify({
    lastUpdated: new Date().toISOString(),
    images: []
  }, null, 2));
});
