// Vercel serverless function: POST /api/lead
// Переменные окружения (Settings → Environment Variables):
//   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
//   TELEGRAM_CHAT_ID   — id чата владельца (узнать: написать боту и открыть /getUpdates)

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const body = req.body || {};
  // Скрытое поле-ловушка для ботов: делаем вид, что всё хорошо
  if (body.website) return res.status(200).json({ ok: true });

  const name = String(body.name || '').trim().slice(0, 80);
  const phone = String(body.phone || '').trim().slice(0, 24);
  const master = String(body.master || '').trim().slice(0, 80);

  if (name.length < 2 || phone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ ok: false, error: 'invalid' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(500).json({ ok: false, error: 'config' });

  const text = [
    '<b>Новая заявка с сайта</b>',
    'Имя: ' + esc(name),
    'Телефон: ' + esc(phone),
    master ? 'Интерес: ' + esc(master) : null,
    'Согласие на обработку данных: дано'
  ].filter(Boolean).join('\n');

  try {
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' })
    });
    if (!r.ok) return res.status(502).json({ ok: false });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false });
  }
}
