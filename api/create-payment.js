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

  const TERMINAL_KEY = process.env.TBANK_TERMINAL_KEY;
  const PASSWORD = process.env.TBANK_PASSWORD;

  const { amount, orderId } = req.body;

  const paymentData = {
    TerminalKey: TERMINAL_KEY,
    Amount: amount * 100, // копейки
    OrderId: orderId,
    Description: "Оплата заказа",
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
