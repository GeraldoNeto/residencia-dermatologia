// Monta painel.html a partir de dados/brutos/*.json (coleta) + dados/ajustes.json (decisões manuais).
// Uso: node build.js            → gera painel.html e dados/programas.json
//      node build.js --relatorio → só imprime o resumo da fusão
const fs = require('fs');
const path = require('path');
const D = p => path.join(__dirname, 'dados', p);
const ler = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const norm = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = s => norm(s).replace(/ /g, '-').slice(0, 60);
const GERADO = process.env.GERADO || new Date().toISOString().slice(0, 10);

// ---------- geografia ----------
const estados = {}; const ufPorCod = {};
fs.readFileSync(D('geo/estados.csv'), 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/).slice(1).forEach(l => {
  const [cod, uf, nome, lat, lon, regiao] = l.split(',');
  estados[uf] = {nome, regiao, lat: +lat, lon: +lon}; ufPorCod[cod] = uf;
});
const cidades = {};
fs.readFileSync(D('geo/municipios.csv'), 'utf8').trim().split(/\r?\n/).slice(1).forEach(l => {
  const c = l.split(','); const uf = ufPorCod[c[5]];
  cidades[norm(c[1]) + '|' + uf] = {lat: +c[2], lon: +c[3], nome: c[1]};
});

// ---------- leitura ----------
const ajustes = fs.existsSync(D('ajustes.json')) ? ler(D('ajustes.json')) : {};
const BR = process.env.BRUTOS || D('brutos');
const brutos = fs.readdirSync(BR).filter(f => f.endsWith('.json')).map(f => ({f, j: ler(path.join(BR, f))}));
const lacunas = []; const fontesExtra = [];
const todos = [];
for (const {f, j} of brutos) {
  (j.lacunas || []).forEach(l => lacunas.push(`[${j.frente || f}] ${typeof l === 'string' ? l : JSON.stringify(l)}`));
  (j.programas || []).forEach(p => todos.push({...p, ciclo: p.ciclo_2027 || p.ciclo || {}, _frente: j.frente || f.replace('.json', '')}));
}

const universo = todos.filter(p => p._frente === 'universo');
const processos = todos.filter(p => p._frente !== 'universo');

// ---------- fusão: universo × processos ----------
const chaveInst = p => norm([p.sigla, p.instituicao, p.hospital].join(' '));
const PARADAS = new Set(['hospital','hospitais','universidade','federal','estadual','municipal','faculdade','faculdades','medicina','medicas','medica','ciencias','clinicas','clinica','das','dos','de','do','da','servico','servicos','dermatologia','universitario','universitaria','centro','instituto','fundacao','santa','casa','sao','servidor','servidores','publico','publica','estado','geral','regional','escola','saude','secretaria','complexo','associacao','misericordia','rio','janeiro','paulo','minas','gerais','grande','sul','norte','federal','nacional']);
const tokens = (s, extra) => new Set(norm(s).split(' ').filter(t => t.length > 2 && !PARADAS.has(t) && !extra.has(t)));
function semelhanca(a, b) {
  if (norm(a.cidade) !== norm(b.cidade) || a.uf !== b.uf) return 0;
  const extra = new Set(norm(a.cidade + ' ' + (estados[a.uf]?.nome || '')).split(' '));
  const ta = tokens(chaveInst(a), extra), tb = tokens(chaveInst(b), extra);
  let n = 0; ta.forEach(t => tb.has(t) && n++);
  const sig = x => new Set(norm(x.sigla).split(' ').filter(t => t.length > 2 && !PARADAS.has(t) && !extra.has(t)));
  const sa = sig(a), sb = sig(b), fa = new Set(norm(chaveInst(a)).split(' ')), fb = new Set(norm(chaveInst(b)).split(' '));
  if ([...sa].some(t => sb.has(t) || fb.has(t)) || [...sb].some(t => fa.has(t))) n += 3;
  return n;
}
const fundir = ajustes.fundir || {};          // { "id-universo": "id-processo" }
const naoFundir = new Set(ajustes.nao_fundir || []); // ids do universo que não casam automaticamente
const saida = [...processos];
const relatorio = {casados: [], soUniverso: []};
// pares candidatos, atribuição gulosa 1:1 (um processo absorve no máximo um registro do universo)
const pares = [];
for (const u of universo) {
  if (fundir[u.id] || naoFundir.has(u.id)) continue;
  for (const p of processos) { const sc = semelhanca(u, p); if (sc >= 2) pares.push({u, p, sc}); }
}
pares.sort((a, b) => b.sc - a.sc);
const alvoDe = new Map(), tomado = new Set();
for (const u of universo) if (fundir[u.id]) { const p = processos.find(x => x.id === fundir[u.id]); if (p) { alvoDe.set(u.id, p); tomado.add(p.id); } }
for (const {u, p} of pares) if (!alvoDe.has(u.id) && !tomado.has(p.id)) { alvoDe.set(u.id, p); tomado.add(p.id); }
for (const u of universo) {
  const vagasCnrm = Number.isFinite(u.ciclo?.vagas) ? u.ciclo.vagas : null;
  const alvo = alvoDe.get(u.id);
  if (alvo) {
    // completa identificação; o universo nunca sobrescreve dado do processo
    for (const k of ['natureza', 'endereco', 'hospital']) if (!alvo[k] && u[k]) alvo[k] = u[k];
    if (alvo.vagas_cnrm == null && vagasCnrm != null) { alvo.vagas_cnrm = vagasCnrm; alvo.vagas_cnrm_fonte = u.ciclo?.fonte || null; }
    if (u.observacoes) alvo._obsUniverso = u.observacoes;
    alvo.fonte_universo = alvo.fonte_universo || [].concat(u.fonte_universo || u.ciclo?.fonte || [])[0] || null;
    relatorio.casados.push(`${u.id} → ${alvo.id}`);
  } else {
    saida.push({...u, processo: null, banca: null, ciclo: {}, vagas_cnrm: vagasCnrm, vagas_cnrm_fonte: u.ciclo?.fonte || null,
      fonte_universo: [].concat(u.fonte_universo || u.ciclo?.fonte || [])[0] || null});
    relatorio.soUniverso.push(u.id);
  }
}

// ---------- normalização final ----------
const excluir = new Set(ajustes.excluir || []);
const ids = new Set();
const programas = [];
for (const p of saida) {
  if (excluir.has(p.id)) continue;
  const ov = (ajustes.sobrescrever || {})[p.id] || {};
  const q = {...p, ...ov, ciclo: {...(p.ciclo || {}), ...(ov.ciclo || {})}};
  let id = slug(q.id || `${q.sigla || q.instituicao}-${q.cidade}`) || 'programa';
  while (ids.has(id)) id += '-b';
  ids.add(id);
  const uf = String(q.uf || '').toUpperCase().trim();
  const obs = [q.observacoes, q._obsUniverso && q._obsUniverso !== q.observacoes ? q._obsUniverso : null].filter(Boolean).join(' ');
  const linksQ = JSON.stringify(q.ciclo || {});
  const avisos = Object.entries(ajustes.avisos_dominio || {}).filter(([d]) => linksQ.includes(d)).map(([, t]) => 'ATENÇÃO: ' + t);
  const tipo = !q.processo && /MEC N[AÃ]O confirmado|n[aã]o [eé] resid[eê]ncia MEC/i.test(obs) ? 'sbd' : 'mec';
  const geo = (ajustes.coordenadas || {})[id] || cidades[norm(q.cidade) + '|' + uf] || null;
  if (!geo) lacunas.push(`[mapa] ${q.sigla || q.instituicao} (${q.cidade}/${uf}): cidade não localizada na base do IBGE`);
  const c = q.ciclo || {};
  const dataOk = v => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) ? v : null;
  programas.push({
    id, tipo,
    instituicao: q.instituicao || q.sigla || '—', sigla: q.sigla || null, hospital: q.hospital || null,
    cidade: geo?.nome || q.cidade || '—', uf, regiao: estados[uf]?.regiao || null, natureza: q.natureza || null,
    processo: q.processo || null, banca: q.banca || null,
    grupo: (ajustes.grupos || {})[q.processo] || q.processo || null,
    ciclo: {
      vagas: Number.isFinite(c.vagas) ? c.vagas : null,
      inscricao_inicio: dataOk(c.inscricao_inicio), inscricao_fim: dataOk(c.inscricao_fim), prova_1a_fase: dataOk(c.prova_1a_fase),
      outras_etapas: (c.outras_etapas || []).filter(e => e && e.etapa).map(e => ({etapa: e.etapa, data: dataOk(e.data)})),
      resultado_previsto: dataOk(c.resultado_previsto), taxa_reais: Number.isFinite(c.taxa_reais) ? c.taxa_reais : null,
      etapas_descricao: c.etapas_descricao || null,
      link_edital: c.link_edital || null, link_inscricao: c.link_inscricao || null, link_processo: c.link_processo || null,
      fonte: c.fonte || null, selo: c.selo === 'oficial' || c.selo === 'secundaria' ? c.selo : null,
    },
    historico: (q.historico || []).filter(h => h && h.ano_ingresso).map(h => ({
      ano_ingresso: +h.ano_ingresso, vagas: h.vagas ?? null, inscritos: h.inscritos ?? null,
      candidatos_por_vaga: Number.isFinite(h.candidatos_por_vaga) ? h.candidatos_por_vaga : null,
      nota_corte: Number.isFinite(h.nota_corte) ? h.nota_corte : null, nota_corte_escala: h.nota_corte_escala || null, nota_corte_etapa: h.nota_corte_etapa || null,
      fonte: h.fonte || null, selo: h.selo === 'oficial' || h.selo === 'secundaria' ? h.selo : null,
    })),
    observacoes: obs || null, aviso: avisos.join(' ').replace(/^ATENÇÃO: /, '') || null,
    vagas_cnrm: Number.isFinite(q.vagas_cnrm) ? q.vagas_cnrm : null, vagas_cnrm_fonte: q.vagas_cnrm_fonte || null,
    fonte_universo: q.fonte_universo || null,
    lat: geo?.lat ?? null, lon: geo?.lon ?? null,
  });
}
programas.sort((a, b) => (a.uf + a.cidade + (a.sigla || a.instituicao)).localeCompare(b.uf + b.cidade + (b.sigla || b.instituicao), 'pt-BR'));

// ---------- série histórica (Fase 2): dados/hist/hist-*.json ----------
const processosGerais = [];
const porId = new Map(programas.map(p => [p.id, p]));
const HIST = D('hist');
if (fs.existsSync(HIST)) for (const f of fs.readdirSync(HIST).filter(f => /^hist-.*\.json$/.test(f))) {
  const j = ler(path.join(HIST, f));
  (j.lacunas || []).forEach(l => lacunas.push(`[histórico ${j.frente || f}] ${typeof l === 'string' ? l : JSON.stringify(l)}`));
  (j.processo_geral || []).forEach(g => processosGerais.push(g));
  for (const [id, lst] of Object.entries(j.historico || {})) {
    const p = porId.get(slug(id)) || porId.get(id);
    if (!p) { lacunas.push(`[histórico] id sem programa: ${id}`); continue; }
    for (const h of lst || []) {
      if (!h || !h.ano_ingresso) continue;
      const novo = {
        ano_ingresso: +h.ano_ingresso, vagas: Number.isFinite(h.vagas) ? h.vagas : null, inscritos: Number.isFinite(h.inscritos) ? h.inscritos : null,
        candidatos_por_vaga: Number.isFinite(h.candidatos_por_vaga) ? h.candidatos_por_vaga : null,
        nota_corte: Number.isFinite(h.nota_corte) ? h.nota_corte : null, nota_corte_escala: h.nota_corte_escala || null, nota_corte_etapa: h.nota_corte_etapa || null,
        fonte: h.fonte || null, selo: h.selo === 'oficial' || h.selo === 'secundaria' ? h.selo : null, obs: h.obs || null,
      };
      const ex = p.historico.find(x => x.ano_ingresso === novo.ano_ingresso);
      if (!ex) { p.historico.push(novo); continue; }
      // completa campos vazios; troca um valor secundário por um oficial
      for (const k of ['vagas', 'inscritos', 'candidatos_por_vaga', 'nota_corte', 'nota_corte_escala', 'nota_corte_etapa'])
        if (novo[k] != null && (ex[k] == null || (ex.selo !== 'oficial' && novo.selo === 'oficial'))) { ex[k] = novo[k]; if (k === 'candidatos_por_vaga' || k === 'nota_corte') { ex.fonte = novo.fonte || ex.fonte; ex.selo = novo.selo || ex.selo; } }
      if (novo.obs && !ex.obs) ex.obs = novo.obs;
    }
    p.historico.sort((a, b) => b.ano_ingresso - a.ano_ingresso);
  }
}

// ---------- indicadores do ranking ----------
const RK = D('ranking');
const capes = fs.existsSync(path.join(RK, 'capes.json')) ? ler(path.join(RK, 'capes.json')) : {dados: {}};
const oalex = fs.existsSync(path.join(RK, 'openalex.json')) ? ler(path.join(RK, 'openalex.json')) : {dados: {}};
for (const p of programas) {
  const c = capes.dados[p.id], o = oalex.dados[p.id];
  p.ind = {
    capes: c ? {ies: c.nome, melhor: c.melhor_conceito, n: c.n_programas, programas: c.programas, derm: c.ppg_dermatologia} : null,
    openalex: o ? {nome: o.nome, id: o.openalex, artigos: o.artigos_derm_2021_2025} : null,
    sbd: /credenciado SBD|SBD lista/i.test(p.observacoes || ''),
    openalex_pendente: (oalex.pendentes || []).includes(p.id),
  };
}
const fontesIndicadores = {capes: capes.fonte || null, capes_base: capes.base || null, openalex: oalex.fonte || null, openalex_data: oalex.consultado_em || null};
(ajustes.lacunas_extra || []).forEach(l => lacunas.push(l));
(ajustes.fontes_extra || []).forEach(u => fontesExtra.push(u));

// nomes de candidatos não vão para o painel (privacidade)
// lista de nomes a esconder: fica fora do repositório (dados/privado), porque ela mesma tem nomes de candidatos
const NOMES_PRIV = D('privado/nomes-omitir.json');
const omitir = [...(ajustes.nomes_omitir || []), ...(fs.existsSync(NOMES_PRIV) ? ler(NOMES_PRIV) : [])].map(n => new RegExp(n.split(' ').join('\\s+'), 'gi'));
const limpa = s => typeof s === 'string' ? omitir.reduce((t, r) => t.replace(r, '[nome omitido]'), s) : s;
for (const p of programas) { p.observacoes = limpa(p.observacoes); p.historico.forEach(h => h.obs = limpa(h.obs)); }
processosGerais.forEach(g => g.obs = limpa(g.obs));
for (let i = 0; i < lacunas.length; i++) lacunas[i] = limpa(lacunas[i]);
// ---------- Fase 3: perfil de prova e documentos por processo (dados/fase3/fase3-*.json) ----------
const F3 = D('fase3'); const perfis = {};
if (fs.existsSync(F3)) for (const f of fs.readdirSync(F3).filter(f => /^fase3-.*\.json$/.test(f))) {
  const j = ler(path.join(F3, f));
  for (const [g, v] of Object.entries(j.processos || {})) { v.obs = limpa(v.obs); perfis[g] = v; }
  (j.lacunas || []).forEach(l => { const t = 'Perfil de prova · ' + limpa(l); if (!lacunas.includes(t)) lacunas.push(t); });
}
const semPerfil = [...new Set(programas.map(p => p.grupo).filter(Boolean))].filter(g => !perfis[g]);

// ---------- mudanças desde o build anterior (novo / alterado) ----------
// Compara com o programas.json anterior; ignora indicadores (ind) e texto livre. Log acumulado em dados/mudancas.json.
const CAMPOS = ['vagas', 'inscricao_inicio', 'inscricao_fim', 'prova_1a_fase', 'resultado_previsto', 'taxa_reais', 'link_edital'];
const ROTULO = {vagas: 'vagas', inscricao_inicio: 'início das inscrições', inscricao_fim: 'fim das inscrições', prova_1a_fase: 'data da prova', resultado_previsto: 'resultado previsto', taxa_reais: 'taxa', link_edital: 'edital', outras_etapas: 'outras etapas', historico: 'série histórica'};
const LOGM = D('mudancas.json');
let mudancas = fs.existsSync(LOGM) ? ler(LOGM) : [];
if (fs.existsSync(D('programas.json')) && !process.argv.includes('--relatorio')) {
  const ant = Object.fromEntries(ler(D('programas.json')).programas.map(p => [p.id, p]));
  const novas = [];
  for (const p of programas) {
    const a = ant[p.id];
    const fonte = [p.ciclo?.fonte, p.ciclo?.link_edital, p.ciclo?.link_processo].find(u => /^https?:\/\//.test(u || '')) || null;
    if (!a) { novas.push({id: p.id, grupo: p.grupo || null, data: GERADO, tipo: 'novo', campos: [], det: [], fonte}); continue; }
    const c = CAMPOS.filter(k => JSON.stringify(a.ciclo?.[k] ?? null) !== JSON.stringify(p.ciclo?.[k] ?? null));
    if (JSON.stringify((a.ciclo?.outras_etapas || []).map(e => [e.etapa, e.data])) !== JSON.stringify((p.ciclo?.outras_etapas || []).map(e => [e.etapa, e.data]))) c.push('outras_etapas');
    const hs = h => (h || []).map(x => [x.ano_ingresso, x.vagas, x.candidatos_por_vaga, x.nota_corte].join('|')).sort().join(';');
    if (hs(a.historico) !== hs(p.historico)) c.push('historico');
    // o que mudou, com o valor de antes e o de depois
    const det = c.filter(k => CAMPOS.includes(k)).map(k => ({campo: k, antes: a.ciclo?.[k] ?? null, depois: p.ciclo?.[k] ?? null}));
    if (c.includes('outras_etapas')) {
      const sig = l => (l || []).filter(e => e.data).map(e => `${e.etapa} (${e.data})`);
      const A = sig(a.ciclo?.outras_etapas), B = sig(p.ciclo?.outras_etapas);
      det.push({campo: 'outras_etapas', antes: A.filter(x => !B.includes(x)), depois: B.filter(x => !A.includes(x))});
    }
    if (c.length) novas.push({id: p.id, grupo: p.grupo || null, data: GERADO, tipo: 'alterado', campos: c.map(k => ROTULO[k] || k), det, fonte});
  }
  if (novas.length) {
    mudancas = mudancas.filter(m => !(m.data === GERADO && novas.some(n => n.id === m.id))).concat(novas);
    const lim = new Date(GERADO); lim.setDate(lim.getDate() - 90);
    mudancas = mudancas.filter(m => new Date(m.data) >= lim);
    fs.writeFileSync(LOGM, JSON.stringify(mudancas, null, 1));
  }
  console.log('mudanças neste build:', novas.length, novas.slice(0, 12).map(n => `${n.id} (${n.tipo}${n.campos.length ? ': ' + n.campos.join(', ') : ''})`).join('; '));
}

// comunicados novos achados pelo monitor e situação da última verificação das páginas oficiais
const COM = D('monitor/comunicados.json'), REL = D('monitor/relatorio.json');
const comunicados = fs.existsSync(COM) ? ler(COM) : [];
const rel = fs.existsSync(REL) ? ler(REL) : null;
const monitor = rel ? {data: rel.data, visitados: rel.visitados, erros: (rel.erros || []).map(e => e.processo)} : null;
const previstos = ajustes.previstos || [];
const dados = {gerado_em: GERADO, programas, lacunas, perfis, mudancas, comunicados, monitor, previstos, fontes_extra: fontesExtra, processos_gerais: processosGerais, fontes_indicadores: fontesIndicadores, ufs: Object.fromEntries(Object.entries(estados).map(([k, v]) => [k, {nome: v.nome, regiao: v.regiao}]))};

const resumo = {
  programas: programas.length,
  mec: programas.filter(p => p.tipo === 'mec').length, sbd: programas.filter(p => p.tipo === 'sbd').length,
  com_ciclo: programas.filter(p => p.ciclo.prova_1a_fase || p.ciclo.inscricao_fim).length,
  com_vagas: programas.filter(p => p.ciclo.vagas != null).length,
  vagas: programas.reduce((s, p) => s + (p.ciclo.vagas || 0), 0),
  com_cv: programas.filter(p => p.historico.some(h => h.candidatos_por_vaga != null)).length,
  sem_coord: programas.filter(p => p.lat == null).length,
  casados: relatorio.casados.length, so_universo: relatorio.soUniverso.length, lacunas: lacunas.length,
  perfis: Object.keys(perfis).length, sem_perfil: semPerfil,
};
if (process.argv.includes('--relatorio')) { console.log(JSON.stringify({resumo, ...relatorio}, null, 1)); process.exit(0); }

fs.writeFileSync(D('programas.json'), JSON.stringify(dados, null, 1));
const geoUF = fs.readFileSync(D('geo/uf.geojson'), 'utf8');
const leafletCss = fs.readFileSync(D('geo/leaflet.css'), 'utf8');
let html = fs.readFileSync(path.join(__dirname, 'painel.template.html'), 'utf8');
const seguro = s => s.replace(/</g, '\\u003c');
html = html.replace('/*__LEAFLETCSS__*/', () => leafletCss)
  .replace('/*__DADOS__*/null', () => seguro(JSON.stringify(dados)))
  .replace('/*__GEO__*/null', () => seguro(geoUF.trim()));
fs.writeFileSync(path.join(__dirname, 'painel.html'), html);
console.log(JSON.stringify(resumo), (html.length / 1024).toFixed(0) + ' KB');
