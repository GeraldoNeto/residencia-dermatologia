const d=require('../programas.json'), med=require('./capes/medicina.json');
const norm=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toUpperCase();
const out={};
for(const p of d.programas.filter(p=>p.tipo==='mec')){
  const txt=norm([p.sigla,p.instituicao,p.hospital,p.processo,p.observacoes&&p.observacoes.slice(0,200)].join(' '));
  const cands=med.filter(m=>m.SG_UF_PROGRAMA===p.uf);
  const ies=[...new Map(cands.map(m=>[m.SG_ENTIDADE_ENSINO,m])).values()];
  const hit=ies.filter(m=>{const sg=norm(m.SG_ENTIDADE_ENSINO);return new RegExp('(^|[^A-Z])'+sg.replace(/[^A-Z0-9]/g,'.?')+'([^A-Z]|$)').test(txt)||txt.includes(norm(m.NM_ENTIDADE_ENSINO));});
  out[p.id]={prog:`${p.sigla||''} | ${p.instituicao} | ${p.cidade}/${p.uf}`,ies:hit.map(m=>m.SG_ENTIDADE_ENSINO)};
}
for(const [k,v] of Object.entries(out)) console.log(k.padEnd(34),v.ies.join(',').padEnd(18),v.prog.slice(0,90));
