const https = require('https');
const fs = require('fs');

console.log("🌪️ Fetching cyclone news...");

const url = "https://www.sciencedaily.com/rss/earth_climate/hurricanes_and_cyclones.xml";

https.get(url, (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);

  res.on('end', () => {
    try {
      let items = data.split("<item>").slice(1);

      let articles = [];

      items.forEach(item => {
        let titleMatch = item.match(/<title>(.*?)<\/title>/);
        let linkMatch = item.match(/<link>(.*?)<\/link>/);

        if (titleMatch && linkMatch) {
          articles.push({
            title: titleMatch[1],
            link: linkMatch[1]
          });
        }
      });

      let output = {
        lastUpdated: new Date().toISOString().split("T")[0],
        featured: articles.slice(0, 3),
        articles: articles.slice(3, 10)
      };

      fs.writeFileSync("news.json", JSON.stringify(output, null, 2));

      console.log("✅ News updated:", articles.length);

    } catch {
      fs.writeFileSync("news.json", JSON.stringify({
        lastUpdated: new Date().toISOString(),
        featured: [],
        articles: []
      }, null, 2));
    }
  });

}).on('error', () => {
  fs.writeFileSync("news.json", JSON.stringify({
    lastUpdated: new Date().toISOString(),
    featured: [],
    articles: []
  }, null, 2));
});
