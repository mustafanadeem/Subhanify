// Quick test of Google Places API response
const apiKey = "AIzaSyD3StMBIHSDntU1u9BACImccFJuUC2TMr8";
const query = "Edinburgh";

const url =
  `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
  `input=${encodeURIComponent(query)}` +
  `&key=${apiKey}` +
  `&components=country:uk` +
  `&language=en`;

console.log("Testing Google Places API...");
console.log("URL:", url.substring(0, 150) + "...");

fetch(url)
  .then((res) => res.json())
  .then((data) => {
    console.log("\n=== FULL RESPONSE ===");
    console.log(JSON.stringify(data, null, 2));

    if (data.predictions && data.predictions.length > 0) {
      console.log("\n=== FIRST PREDICTION ===");
      console.log(JSON.stringify(data.predictions[0], null, 2));

      const p = data.predictions[0];
      console.log("\n=== EXTRACTED VALUES ===");
      console.log("main_text:", p.main_text);
      console.log("secondary_text:", p.secondary_text);
      console.log("description:", p.description);
    }
  })
  .catch((err) => {
    console.error("Error:", err);
  });
