// Busca a instituição no OpenAlex e conta artigos de Dermatologia (subcampo 2708), 2021–2025.
// Uso (rode dentro de dados/ranking):
//   node openalex.js --pendentes   → consulta só os ids em openalex.json.pendentes e mescla (padrão seguro)
//   node openalex.js --todos       → refaz todos (gasta ~2 chamadas por programa; a cota diária sem chave é pequena)
// Para no primeiro 429 (cota esgotada) e grava o que já tinha, deixando o resto em "pendentes".
const fs = require('fs');
const path = require('path');
process.chdir(__dirname);
const d = require('../programas.json'), capes = require('./capes.json').dados;
const fixo = fs.existsSync('openalex-fixo.json') ? require('./openalex-fixo.json') : {}; // id -> "Ixxxx" | "q:texto" | null
const atual = fs.existsSync('openalex.json') ? require('./openalex.json') : {dados: {}, pendentes: []};
const norm = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));
class Cota extends Error {}
async function j(u) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(u, {headers: {'User-Agent': 'painel-residencia/1.0'}});
    if (r.ok) return r.json();
    if (r.status === 429) throw new Cota(await r.text());
    await sleep(1500);
  }
  throw new Error('falha ' + u);
}
const PAR = new Set(['hospital', 'universidade', 'federal', 'estadual', 'faculdade', 'medicina', 'de', 'da', 'do', 'das', 'dos', 'e', 'fundacao', 'instituto', 'centro', 'universitario', 'sao', 'santa', 'casa']);
const tk = s => new Set(norm(s).split(' ').filter(t => t.length > 2 && !PAR.has(t)));
async function busca(q, estrito) {
  if (!q) return null;
  const r = await j('https://api.openalex.org/institutions?search=' + encodeURIComponent(q) + '&filter=country_code:BR&per-page=3');
  const x = r.results[0]; if (!x) return null;
  if (estrito) { const a = tk(q), b = tk(x.display_name); let n = 0; a.forEach(t => b.has(t) && n++); if (n < 2) return null; }
  return x;
}
const grava = (dados, pendentes) => fs.writeFileSync('openalex.json', JSON.stringify({
  fonte: 'https://openalex.org (API, subcampo Dermatology 2708, publicações 2021–2025)',
  consultado_em: new Date().toISOString().slice(0, 10), pendentes, dados}, null, 1));

(async () => {
  const todos = process.argv.includes('--todos');
  const progs = d.programas.filter(p => p.tipo === 'mec');
  const alvo = todos ? progs.map(p => p.id) : [...(atual.pendentes || [])];
  const dados = todos ? {} : {...atual.dados};
  let pend = [...alvo];
  console.log(`consultando ${alvo.length} programas`);
  for (const id of alvo) {
    const p = progs.find(x => x.id === id); if (!p) { pend = pend.filter(x => x !== id); continue; }
    try {
      let inst = null, via = '';
      if (id in fixo) { if (fixo[id]) { inst = fixo[id].startsWith('q:') ? await busca(fixo[id].slice(2)) : await j('https://api.openalex.org/institutions/' + fixo[id]); via = 'manual'; } }
      else {
        const c = capes[id];
        if (c) { inst = await busca(c.nome.split(' + ').pop() === 'HOSPITAL DE CLÍNICAS DE PORTO ALEGRE' ? 'Hospital de Clínicas de Porto Alegre' : c.nome.split(' + ')[0]); via = 'IES CAPES'; }
        if (!inst) { inst = await busca(p.hospital || p.instituicao, true); via = 'nome do hospital'; }
      }
      if (!inst) { dados[id] = null; console.log(id.padEnd(34), 'não localizado'); }
      else {
        const oid = inst.id.split('/').pop();
        const w = await j(`https://api.openalex.org/works?filter=institutions.id:${oid},primary_topic.subfield.id:2708,publication_year:2021-2025&per-page=1`);
        dados[id] = {openalex: oid, nome: inst.display_name, via, artigos_derm_2021_2025: w.meta.count};
        console.log(id.padEnd(34), String(w.meta.count).padStart(5), via.padEnd(16), inst.display_name);
      }
      pend = pend.filter(x => x !== id);
      grava(dados, pend);
      await sleep(150);
    } catch (e) {
      if (e instanceof Cota) { console.log('COTA ESGOTADA (429). Parei; pendentes:', pend.join(' ')); grava(dados, pend); process.exitCode = 2; return; }
      console.log(id, 'erro:', e.message); // fica pendente
    }
  }
  grava(dados, pend);
  console.log('fim; pendentes:', pend.length ? pend.join(' ') : 'nenhum');
})();
