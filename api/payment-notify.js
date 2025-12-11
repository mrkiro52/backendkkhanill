import crypto from "crypto";

console.log("✅ [payment-notify.js] Файл загружен - VERSION: 3.0 с логированием");

function verifyToken(params, password) {
  const data = { ...params, Password: password };
  const sortedKeys = Object.keys(data).sort();
  const concatenated = sortedKeys.map((k) => data[k]).join("");
  return crypto.createHash("sha256").update(concatenated).digest("hex");
}

export default async function handler(req, res) {
  const timestamp = new Date().toISOString();
  console.log(`\n📨 [${timestamp}] НОВЫЙ ПЛАТЕЖНЫЙ КОЛБЭК`);
  console.log(`   Метод: ${req.method}`);
  
  // Установка CORS заголовков ПЕРЕД всем остальным
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Content-Type", "application/json");
  console.log("   ✅ CORS заголовки установлены");

  // Обработка preflight запроса (ВАЖНО: это должно быть первой проверкой)
  if (req.method === "OPTIONS") {
    console.log("   ✅ Preflight запрос обработан");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.error(`   ❌ Неверный метод: ${req.method}`);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PASSWORD = process.env.tbank_password;

  try {
    const callbackData = req.body;
    
    console.log("   💳 Данные платежа получены:");
    console.log(`      OrderId: ${callbackData.OrderId}`);
    console.log(`      PaymentId: ${callbackData.PaymentId}`);
    console.log(`      Status: ${callbackData.Status}`);
    console.log(`      Success: ${callbackData.Success}`);
    console.log(`      Amount: ${callbackData.Amount / 100} RUB`);
    console.log(`      Token присутствует: ${!!callbackData.Token}`);
    
    // Проверяем токен для безопасности
    if (PASSWORD && callbackData.Token) {
      console.log("   🔐 Проверяем подпись токена...");
      const expectedToken = verifyToken(
        {
          TerminalKey: callbackData.TerminalKey,
          OrderId: callbackData.OrderId,
          Success: callbackData.Success,
          Status: callbackData.Status,
          PaymentId: callbackData.PaymentId,
          ErrorCode: callbackData.ErrorCode || "",
          Amount: callbackData.Amount,
        },
        PASSWORD
      );

      if (callbackData.Token !== expectedToken) {
        console.error("   ❌ ОШИБКА: Неверный токен в колбэке!");
        return res.status(401).json({ success: false, message: "Invalid token" });
      }
      console.log("   ✅ Подпись верна");
    }

    // Обработка успешного платежа
    if (callbackData.Success === true && callbackData.Status === "CONFIRMED") {
      console.log(`   ✅ ПЛАТЕЖ ПОДТВЕРЖДЕН: Заказ ${callbackData.OrderId}, Сумма: ${callbackData.Amount / 100} RUB`);
      
      // TODO: Здесь добавить логику сохранения платежа в БД
      // - Сохранить информацию о платеже
      // - Отправить email с доступом к курсу
      // - Создать запись об успешной покупке
      
      return res.status(200).json({ success: true, message: "Payment processed successfully" });
    }

    // Обработка отклоненного платежа
    if (callbackData.Success === false) {
      console.log(`   ⚠️  ПЛАТЕЖ ОТКЛОНЕН: Заказ ${callbackData.OrderId}, Error: ${callbackData.ErrorCode}`);
      return res.status(200).json({ success: false, message: "Payment declined" });
    }

    console.log("   ℹ️ Платеж обработан (неопределенное состояние)");
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("   ❌ ОШИБКА при обработке колбэка:", error.message);
    console.error("   Стек ошибки:", error.stack);
    return res.status(500).json({ error: "Internal server error" });
  }
}
