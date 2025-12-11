import crypto from "crypto";

console.log("✅ [create-payment.js] Файл загружен - VERSION: 4.0 с рабочим CORS");

function generateToken(params, password) {
  const data = { ...params, Password: password };
  const sortedKeys = Object.keys(data).sort();
  const concatenated = sortedKeys.map((k) => data[k]).join("");
  return crypto.createHash("sha256").update(concatenated).digest("hex");
}

export default async function handler(req, res) {
  const allowedOrigins = [
    "https://mrkiro52.github.io",
    "http://localhost:3000",
    "http://localhost:3001",
  ];

  const origin = req.headers.origin || "";
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Content-Type", "application/json");

  // ✅ Preflight OPTIONS
  if (req.method === "OPTIONS") {
    console.log("✅ OPTIONS preflight запрос от:", origin);
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.error("❌ Неверный метод:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const TERMINAL_KEY = process.env.tbank_terminal_key;
  const PASSWORD = process.env.tbank_password;

  if (!TERMINAL_KEY || !PASSWORD) {
    console.error("❌ Отсутствуют переменные окружения!");
    return res.status(400).json({
      error: "Missing required environment variables",
      success: false,
    });
  }

  const { amount, orderId, description, successUrl, failUrl } = req.body || {};

  if (!amount || !orderId) {
    return res.status(400).json({ error: "Missing required fields: amount or orderId" });
  }

  const paymentData = {
    TerminalKey: TERMINAL_KEY,
    Amount: amount * 100, // копейки
    OrderId: orderId,
    Description: description || "Оплата заказа",
    SuccessURL: successUrl,
    FailURL: failUrl,
  };

  paymentData.Token = generateToken(paymentData, PASSWORD);

  console.log("🚀 Отправка запроса в Т-Банк:", JSON.stringify({
    ...paymentData,
    Token: paymentData.Token.substring(0, 10) + "...",
  }));

  try {
    const response = await fetch("https://securepay.tinkoff.ru/v2/Init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    console.log("📤 Ответ от Т-Банка:", data);

    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ Ошибка запроса к Т-Банку:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
