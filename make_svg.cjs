const fs = require('fs');
const b64 = fs.readFileSync('src/assets/logo/main_logo.png', 'base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <image href="data:image/png;base64,${b64}" width="1024" height="1024" transform="translate(0, 130) translate(512, 512) scale(1.7) translate(-512, -512)"/>
</svg>`;
fs.writeFileSync('public/favicon.svg', svg);
