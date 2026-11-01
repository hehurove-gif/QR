@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
  font-family: Inter, 'Segoe UI', sans-serif;
  line-height: 1.5;
  font-weight: 400;
  background: #020817;
  color: #e2e8f0;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html, body, #root {
  margin: 0;
  min-height: 100%;
  min-width: 100%;
}

body {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.16), transparent 28%),
    radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.18), transparent 30%),
    linear-gradient(135deg, #020817 0%, #0f172a 48%, #111827 100%);
}

input,
select,
button {
  font: inherit;
}

* {
  box-sizing: border-box;
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 0 rgba(56, 189, 248, 0.25);
  }
  50% {
    box-shadow: 0 0 28px rgba(56, 189, 248, 0.28);
  }
}

@keyframes floatCard {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-4px);
  }
}

.panel-glass {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 80px rgba(2, 6, 23, 0.45);
}

.preview-shell {
  border: 1px solid rgba(148, 163, 184, 0.12);
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.5)),
    linear-gradient(45deg, rgba(148, 163, 184, 0.04) 25%, transparent 25%, transparent 75%, rgba(148, 163, 184, 0.04) 75%),
    linear-gradient(45deg, rgba(148, 163, 184, 0.04) 25%, transparent 25%, transparent 75%, rgba(148, 163, 184, 0.04) 75%);
  background-size: auto, 28px 28px, 28px 28px;
  background-position: 0 0, 0 0, 14px 14px;
  animation: floatCard 5s ease-in-out infinite;
}

.preview-card {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 560px;
  border-radius: 24px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: radial-gradient(circle at center, rgba(59, 130, 246, 0.14), rgba(15, 23, 42, 0.6));
}

.qr-canvas {
  display: block;
  width: min(100%, 560px);
  height: auto;
  max-height: 100%;
  border-radius: 20px;
  background: white;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.35);
  animation: pulseGlow 5s ease-in-out infinite;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.55);
  padding: 14px 16px;
}

.metric-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #94a3b8;
}

.metric-card strong {
  color: white;
  font-size: 1.1rem;
}

@media (max-width: 640px) {
  .preview-card {
    min-height: 420px;
  }
}
