import fs from "fs";

async function fetchData() {
  try {
    const apiKey = process.env.CENSUS_API_KEY; // from GitHub Actions secret
    const response = await fetch("https://api.census.gov/data", {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Save data locally
    fs.writeFileSync("src/data/apiData.json", JSON.stringify(data, null, 2));
    console.log("✅ Data fetched and saved to src/data/apiData.json");
  } catch (err) {
    console.error("❌ Fetch failed:", err);
    process.exit(1);
  }
}

fetchData();