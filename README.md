# Bitbot Trends

Dashboard de tendencias diarias de IA y automatización, curado por Bitbot.

## 🚀 Deploy

Este sitio se despliega automáticamente en Vercel con cada push a `main`.

## 📁 Estructura

```
├── index.html      # Página principal
├── styles.css      # Estilos (dark mode, glassmorphism)
├── app.js          # Lógica de renderizado
├── data.js         # Datos de tendencias (actualizado diariamente)
└── archive/        # Histórico de tendencias
```

## 🔄 Actualización Automática

Un cron job en OpenClaw actualiza `data.js` diariamente a las 06:00 AM (Chile) con las últimas tendencias de IA y automatización.

## 🛠️ Desarrollo Local

```bash
# Servir localmente
npx serve .
```

---

*Powered by OpenClaw & Bitbot* 🤖
