export default async function handler(req, res) {
  // ======= CORS =======
  res.setHeader("Access-Control-Allow-Origin", "https://mrkiro52.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    // preflight запроса не трогаем body
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, phone, email, telegram } = req.body;
    
    if (!name || !phone || !email) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // отправка в Google Sheets
    const googleResponse = await fetch(
      "https://script.google.com/macros/s/…/exec",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, telegram }),
      }
    );

    const result = await googleResponse.json();

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
