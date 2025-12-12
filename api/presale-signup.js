export default async function handler(req, res) {
  const timestamp = new Date().toISOString();
  
  // ============ УСТАНОВКА CORS ЗАГОЛОВКОВ - ДЕЛАЕТСЯ В ПЕРВУЮ ОЧЕРЕДЬ! ============
  res.setHeader("Access-Control-Allow-Origin", "https://mrkiro52.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Content-Type", "application/json");

  console.log(`\n📨 [${timestamp}] PRESALE SIGNUP REQUEST`);
  console.log(`   Метод: ${req.method}`);
  console.log(`   Origin: ${req.headers.origin}`);
  console.log(`   ✅ CORS заголовки установлены`);

  // ============ ОБРАБОТКА PREFLIGHT ЗАПРОСА - САМОЕ ПЕРВОЕ! ============
  if (req.method === "OPTIONS") {
    console.log("   ✅ Preflight (OPTIONS) запрос - отправляем 200 OK");
    return res.status(200).end();
  }

  // ============ ПРОВЕРКА МЕТОДА ============
  if (req.method !== "POST") {
    console.error(`   ❌ Неверный метод: ${req.method}`);
    return res.status(405).json({ 
      error: "Method not allowed", 
      success: false 
    });
  }

  try {
    const { name, phone, email, telegram } = req.body;

    console.log("   📦 Данные предзаписи:");
    console.log(`      Имя: ${name}`);
    console.log(`      Телефон: ${phone}`);
    console.log(`      Email: ${email}`);
    console.log(`      Telegram: ${telegram || "не указан"}`);

    // ============ ВАЛИДАЦИЯ ДАННЫХ ============
    if (!name || !phone || !email) {
      console.error("   ❌ Ошибка: Не все обязательные поля заполнены");
      return res.status(400).json({
        error: "Missing required fields: name, phone, email",
        success: false,
      });
    }

    // ============ ОТПРАВКА В GOOGLE SHEETS ============
    const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyvIHafKQVkL_EEKz-QXoNnm6zDvAtIQkfzhMWOP-Kiv58QrnuZmN8LQiVgKpz2VpXYfg/exec";
    
    console.log("   🚀 Отправляем данные в Google Sheets...");
    
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
        source: "website",
      }),
    });

    const googleResult = await googleResponse.json();
    
    console.log(`   📊 Ответ от Google Sheets:`);
    console.log(`      Status: ${googleResponse.status}`);
    console.log(`      Result:`, googleResult);

    if (googleResult.success) {
      console.log("   ✅ Данные успешно добавлены в Google Sheets");
    } else {
      console.warn("   ⚠️ Google Sheets вернула:", googleResult);
    }

    // ============ УСПЕШНЫЙ ОТВЕТ ============
    console.log("   ✅ Заявка на предзапись успешно обработана");

    return res.status(200).json({
      success: true,
      message: "Спасибо за заявку! Мы свяжемся с вами в ближайшее время.",
      data: {
        name,
        email,
        phone,
        timestamp,
      },
    });

  } catch (error) {
    console.error("   ❌ Ошибка при обработке запроса:", error.message);
    console.error("      Stack:", error.stack);
    
    return res.status(500).json({
      error: "Internal server error",
      success: false,
      message: error.message,
    });
  }
}
