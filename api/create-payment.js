import crypto from "crypto";

function generateToken(params, password) {
  const data = { ...params, Password: password };
  const sortedKeys = Object.keys(data).sort();
  const concatenated = sortedKeys.map((k) => data[k]).join("");
  return crypto.createHash("sha256").update(concatenated).digest("hex");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const TERMINAL_KEY = process.env.tbank_terminal_key;
  const PASSWORD = process.env.tbank_password;

  const { amount, orderId, description, successUrl, failUrl } = req.body;

  if (!TERMINAL_KEY || !PASSWORD) {
    return res.status(400).json({ 
      error: "Missing required environment variables (tbank_terminal_key, tbank_password)" 
    });
  } 

  const paymentData = {
    TerminalKey: TERMINAL_KEY,
    Amount: amount * 100, // копейки
    OrderId: orderId,
    Description: description || "Оплата заказа",
    SuccessURL: successUrl,
    FailURL: failUrl, 
  };
 
  // Добавляем Token
  const token = generateToken(paymentData, PASSWORD); 
  paymentData.Token = token;

  const response = await fetch("https://securepay.tinkoff.ru/v2/Init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });

  const data = await response.json();
  return res.status(200).json(data);
}
