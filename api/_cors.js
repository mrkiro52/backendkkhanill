// Middleware для обработки CORS для всех API endpoints
export default function handler(req, res) {
  // Установка CORS заголовков
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  // Обработка preflight запроса
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Для других методов продолжаем обработку
  return res.status(404).json({ message: "Not Found" });
}
