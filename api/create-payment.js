import crypto from "crypto";

console.log("✅ [create-payment.js] Файл загружен - VERSION: 3.1 с CORS логированием");

function generateToken(params, password) {
  const data = { ...params, Password: password };
  const sortedKeys = Object.keys(data).sort();
  const concatenated = sortedKeys.map((k) => data[k]).join("");
  return crypto.createHash("sha256").update(concatenated).digest("hex");
}

export default async function handler(req, res) {
  const timestamp = new Date().toISOString();
  console.log(`\n📨 [${timestamp}] НОВЫЙ ЗАПРОС`);
  console.log(`   Метод: ${req.method}`);
  console.log(`   Origin: ${req.headers.origin}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
  
  // Установка CORS заголовков ПЕРЕД всем остальным
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Content-Type", "application/json");
  console.log("   ✅ CORS заголовки установлены");

  // Обработка preflight запроса (ВАЖНО: это должно быть первой проверкой)
  if (req.method === "OPTIONS") {
    console.log("   ✅ Preflight (OPTIONS) запрос - отправляем 200 OK");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.error(`   ❌ Неверный метод: ${req.method}`);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const TERMINAL_KEY = process.env.tbank_terminal_key;
  const PASSWORD = process.env.tbank_password;

  console.log("   🔑 Переменные окружения:");
  console.log(`      TERMINAL_KEY загружен: ${!!TERMINAL_KEY}`);
  console.log(`      PASSWORD загружен: ${!!PASSWORD}`);

  const { amount, orderId, description, successUrl, failUrl } = req.body;
  console.log("   📦 Данные запроса:");
  console.log(`      amount: ${amount}`);
  console.log(`      orderId: ${orderId}`);
  console.log(`      description: ${description}`);

  if (!TERMINAL_KEY || !PASSWORD) {
    console.error("   ❌ ОШИБКА: Отсутствуют переменные окружения");
    return res.status(400).json({ 
      error: "Missing required environment variables (tbank_terminal_key, tbank_password)",
      success: false
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

  console.log("   🚀 Отправляем запрос в Т-Банк (securepay.tinkoff.ru/v2/Init)");
  console.log(`      PaymentData: ${JSON.stringify({ ...paymentData, Token: paymentData.Token.substring(0, 10) + '...' })}`);

  const response = await fetch("https://securepay.tinkoff.ru/v2/Init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });

  const data = await response.json();
  
  console.log(`   📤 Ответ от Т-Банка:`);
  console.log(`      Success: ${data.Success}`);
  console.log(`      ErrorCode: ${data.ErrorCode || 'нет'}`);
  console.log(`      Message: ${data.Message || 'успех'}`);
  if (data.PaymentId) console.log(`      PaymentId: ${data.PaymentId}`);
  
  return res.status(200).json(data);
}
