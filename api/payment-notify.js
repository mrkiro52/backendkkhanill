import crypto from "crypto";

function verifyToken(params, password) {
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

  const PASSWORD = process.env.TBANK_PASSWORD;

  try {
    const callbackData = req.body;
    
    console.log("Payment callback received:", callbackData);
    
    // Проверяем токен для безопасности
    if (PASSWORD && callbackData.Token) {
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
        console.error("Invalid token in callback");
        return res.status(401).json({ success: false, message: "Invalid token" });
      }
    }

    // Обработка успешного платежа
    if (callbackData.Success === true && callbackData.Status === "CONFIRMED") {
      console.log(`Payment confirmed: Order ${callbackData.OrderId}, Amount: ${callbackData.Amount / 100} RUB`);
      
      // TODO: Здесь добавить логику сохранения платежа в БД
      // - Сохранить информацию о платеже
      // - Отправить email с доступом к курсу
      // - Создать запись об успешной покупке
      
      return res.status(200).json({ success: true, message: "Payment processed successfully" });
    }

    // Обработка отклоненного платежа
    if (callbackData.Success === false) {
      console.log(`Payment declined: Order ${callbackData.OrderId}, Error: ${callbackData.ErrorCode}`);
      return res.status(200).json({ success: false, message: "Payment declined" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing payment callback:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
