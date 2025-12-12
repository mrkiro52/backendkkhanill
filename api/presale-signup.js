export default async function handler(req, res) {
  const timestamp = new Date().toISOString();
  
  // Установка CORS заголовков
  res.setHeader("Access-Control-Allow-Origin", "https://mrkiro52.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  console.log(`\n📨 [${timestamp}] PRESALE SIGNUP REQUEST`);
  console.log(`   Метод: ${req.method}`);
  console.log(`   Origin: ${req.headers.origin}`);

  // Обработка preflight запроса
  if (req.method === "OPTIONS") {
    console.log("   ✅ Preflight (OPTIONS) запрос обработан");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.error(`   ❌ Неверный метод: ${req.method}`);
    return res.status(405).json({ error: "Method not allowed", success: false });
  }

  try {
    const { name, phone, email, telegram } = req.body;

    console.log("   📦 Данные предзаписи:");
    console.log(`      name: ${name}`);
    console.log(`      phone: ${phone}`);
    console.log(`      email: ${email}`);
    console.log(`      telegram: ${telegram || "не указан"}`);

    // Валидация
    if (!name || !phone || !email) {
      console.error("   ❌ Не все обязательные поля заполнены");
      return res.status(400).json({
        error: "Missing required fields",
        success: false,
      });
    }

    // Отправляем данные в Google Таблицу
    const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycby3Bp0gkUYovjXN8L0CrpehpiaB63peVeB3fSOx3Yu6mwoEitGAwY9SHhFBMIpmYU8hoA/exec";
    
    console.log("   🚀 Отправляем данные в Google Таблицу...");
    
    const googleResponse = await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        phone,
        email,
        telegram: telegram || "",
        timestamp,
        type: "presale",
      }),
    });

    const googleResult = await googleResponse.json();
    
    if (googleResult.success) {
      console.log("   ✅ Данные успешно добавлены в Google Таблицу");
    } else {
      console.warn("   ⚠️ Google Таблица вернула статус:", googleResult);
    }

    console.log("   ✅ Данные предзаписи успешно обработаны");

    return res.status(200).json({
      success: true,
      message: "Спасибо за заявку! Мы свяжемся с вами в ближайшее время.",
      data: {
        name,
        email,
        timestamp,
      },
    });
  } catch (error) {
    console.error("   ❌ Ошибка при обработке запроса:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      success: false,
      message: error.message,
    });
  }
}
