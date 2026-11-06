// Precompila el JSX de las páginas del POS en el PC, para que el navegador no tenga que correr Babel al abrir la app.
//   fuente:  src/admin.html, src/operador.html   (JSX, <script type="text/babel">, carga babel.min.js)
//   salida:  admin.html, operador.html           (JavaScript listo, <script>, sin babel.min.js)
// Uso:  node tools/build.js            (compila las dos)
//       node tools/build.js admin      (solo una)
// Misma versión de Babel que usaba el navegador (7.23.9). Solo se aplica el preset "react" (JSX → JS);
// la sintaxis moderna (const, arrow, async/await, ?.) queda igual: todos los Chrome/Safari de las tablets la soportan.
const fs = require('fs');
const path = require('path');
const Babel = require(path.join(__dirname, 'babel.min.js'));
const raiz = path.join(__dirname, '..');
const paginas = process.argv.slice(2).length ? process.argv.slice(2) : ['admin', 'operador'];

for (const nombre of paginas) {
  const src = path.join(raiz, 'src', nombre + '.html');
  const out = path.join(raiz, nombre + '.html');
  const html = fs.readFileSync(src, 'utf8');
  const re = /<script type="text\/babel">([\s\S]*?)<\/script>/g;
  const bloques = [...html.matchAll(re)];
  if (bloques.length !== 1) { console.log('ERROR ' + nombre + ': se esperaba 1 bloque text/babel, hay ' + bloques.length); process.exitCode = 1; continue; }
  const m = bloques[0];
  const offset = html.slice(0, m.index).split('\n').length;
  const t0 = Date.now();
  let js;
  try {
    js = Babel.transform(m[1], { presets: ['react'], filename: nombre + '.html', compact: false, retainLines: true, comments: false }).code;
  } catch (e) {
    const ln = e.loc ? (e.loc.line + offset - 1) : '?';
    console.log('ERROR ' + nombre + '.html  linea ' + ln + ': ' + e.message.split('\n')[0]);
    process.exitCode = 1; continue;
  }
  // "</script>" dentro de un string del código cerraría el script: se parte para que el navegador no lo vea como cierre
  js = js.replace(/<\/script/gi, '<\\/script');
  let salida = html.slice(0, m.index) + '<script>\n// COMPILADO por tools/build.js desde src/' + nombre + '.html — NO EDITAR AQUÍ: edita el fuente y vuelve a compilar.\n' + js + '\n</script>' + html.slice(m.index + m[0].length);
  // ya no hace falta cargar Babel en el navegador
  const antes = salida.length;
  salida = salida.replace(/[ \t]*<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/babel-standalone\/[^"]*"[^>]*><\/script>\r?\n?/, '');
  if (salida.length === antes) console.log('AVISO ' + nombre + ': no encontré la etiqueta de babel.min.js para quitarla');
  fs.writeFileSync(out, salida, 'utf8');
  console.log('OK  ' + nombre + '.html  ' + (Date.now() - t0) + ' ms  ' + Math.round(fs.statSync(src).size / 1024) + ' KB → ' + Math.round(salida.length / 1024) + ' KB');
}
