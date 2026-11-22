// Monitor das páginas oficiais dos processos: avisa o que mudou desde a última visita.
// Uso: node dados/monitor/monitor.js        → visita, compara e grava estado.json + relatorio.json
// Sinais: texto da página mudou (hash) e, principalmente, links novos de PDF/documento (comunicados, retificações, resultados).
// Não altera dados do painel: quem decide o que entra é quem lê o relatório (com a fonte oficial aberta).
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const AQUI = __dirname, D = p => path.join(AQUI, '..', p);
const ler = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const prog = ler(D('programas.json')).programas;
const ajustes = fs.existsSync(D('ajustes.json')) ? ler(D('ajustes.json')) : {};
const EST = path.join(AQUI, 'estado.json');
const estado = fs.existsSync(EST) ? ler(EST) : {};
const hojeISO = new Date().toISOString().slice(0, 10);

// alvos: página de cada processo (uma por grupo) + extras manuais (ex.: editais que ainda vão sair)
const alvos = new Map();
for (const p of prog) {
  const c = p.ciclo || {};
  const u = [c.link_processo, c.link_edital].find(x => /^https?:\/\//.test(x || ''));
  if (!u) continue;
  const k = p.grupo || p.id;
  if (!alvos.has(u)) alvos.set(u, {url: u, processo: k, programas: []});
  alvos.get(u).programas.push(p.id);
}
(ajustes.monitorar_extra || []).forEach(x => alvos.set(x.url, {url: x.url, processo: x.processo, programas: [], extra: true}));

const texto = h => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim();
const ehDoc = u => /\.(pdf|docx?|xlsx?)(\?|$)|documento\/stream|download|arquivo/i.test(u);
const docs = (h, base) => [...h.matchAll(/href\s*=\s*["']([^"'#]+)["']/gi)].map(m => { try { return new URL(m[1], base).href; } catch { return null; } })
  .filter(u => u && ehDoc(u));
// título de cada documento = texto do link na página oficial
const titulos = (h, base) => { const t = {}; for (const m of h.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) { try { const u = new URL(m[1], base).href; const x = texto(m[2]).slice(0, 160); if (ehDoc(u) && x && !t[u]) t[u] = x; } catch {} } return t; };

async function visita(a) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(a.url, {signal: ctl.signal, redirect: 'follow', headers: {'User-Agent': 'Mozilla/5.0 (painel-residencia; monitor semanal)'}});
    if (!r.ok) return {erro: 'HTTP ' + r.status};
    const tipo = r.headers.get('content-type') || '';
    const buf = Buffer.from(await r.arrayBuffer());
    if (!/html|text/i.test(tipo)) return {hash: crypto.createHash('sha1').update(buf).digest('hex'), docs: [], tipo};
    const h = buf.toString('utf8');
    return {hash: crypto.createHash('sha1').update(texto(h)).digest('hex'), docs: [...new Set(docs(h, r.url))], titulos: titulos(h, r.url), tipo};
  } catch (e) { return {erro: e.name === 'AbortError' ? 'tempo esgotado' : e.message}; }
  finally { clearTimeout(t); }
}

(async () => {
  const rel = {data: hojeISO, visitados: 0, mudaram: [], erros: [], primeira_visita: []};
  const titulosPorUrl = {};
  const lista = [...alvos.values()];
  for (let i = 0; i < lista.length; i += 6) {
    await Promise.all(lista.slice(i, i + 6).map(async a => {
      const v = await visita(a); rel.visitados++;
      const ant = estado[a.url];
      if (v.erro) { rel.erros.push({processo: a.processo, url: a.url, erro: v.erro}); return; }
      titulosPorUrl[a.url] = v.titulos || {};
      if (!ant) rel.primeira_visita.push(a.processo);
      else if (ant.hash !== v.hash) {
        const novos = v.docs.filter(d => !(ant.docs || []).includes(d));
        rel.mudaram.push({processo: a.processo, url: a.url, programas: a.programas, docs_novos: novos, so_texto: !novos.length, visto_antes: ant.visto});
      }
      estado[a.url] = {processo: a.processo, hash: v.hash, docs: v.docs, visto: hojeISO};
    }));
  }
  rel.mudaram.sort((a, b) => b.docs_novos.length - a.docs_novos.length);
  // comunicados: cada documento novo vira um registro com data, processo, título e endereço (guardados por 180 dias)
  const COM = path.join(AQUI, 'comunicados.json');
  let com = fs.existsSync(COM) ? ler(COM) : [];
  for (const m of rel.mudaram) for (const u of m.docs_novos) if (!com.some(c => c.url === u)) com.push({data: hojeISO, processo: m.processo, programas: m.programas, pagina: m.url, url: u, titulo: (titulosPorUrl[m.url] || {})[u] || null});
  const lim = new Date(hojeISO); lim.setDate(lim.getDate() - 180);
  com = com.filter(c => new Date(c.data) >= lim);
  fs.writeFileSync(COM, JSON.stringify(com, null, 1));
  fs.writeFileSync(EST, JSON.stringify(estado, null, 1));
  fs.writeFileSync(path.join(AQUI, 'relatorio.json'), JSON.stringify(rel, null, 1));
  console.log(`visitados ${rel.visitados} · mudaram ${rel.mudaram.length} (com documento novo: ${rel.mudaram.filter(m => m.docs_novos.length).length}) · erros ${rel.erros.length} · primeira visita ${rel.primeira_visita.length}`);
  rel.mudaram.forEach(m => console.log(`- ${m.processo}: ${m.docs_novos.length ? m.docs_novos.length + ' documento(s) novo(s)' : 'só o texto mudou'} · ${m.url}`));
})();
