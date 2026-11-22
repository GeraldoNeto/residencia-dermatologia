const map=require('./mapa-ies.json'),med=require('./capes/medicina.json'),d=require('../programas.json');
const norm=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toUpperCase();
const out={};
for(const [id,sgs] of Object.entries(map)){
  const p=d.programas.find(x=>x.id===id); if(!p){console.log('FALTA',id);continue}
  const L=[].concat(sgs);
  const use=med.filter(m=>/^MEDICINA I/.test(m.NM_AREA_AVALIACAO)&&L.includes(m.SG_ENTIDADE_ENSINO)&&norm(m.NM_MUNICIPIO_PROGRAMA_IES)===norm(p.cidade));
  if(!use.length){console.log('SEM',id);continue}
  out[id]={ies:L.join(' + '),nome:[...new Set(use.map(m=>m.NM_ENTIDADE_ENSINO))].join(' + '),melhor_conceito:Math.max(...use.map(m=>+m.CD_CONCEITO_PROGRAMA||0)),n_programas:use.length,
    programas:use.map(m=>({nome:m.NM_PROGRAMA_IES,ies:m.SG_ENTIDADE_ENSINO,grau:m.NM_GRAU_PROGRAMA,conceito:+m.CD_CONCEITO_PROGRAMA||null})).sort((a,b)=>(b.conceito||0)-(a.conceito||0)).slice(0,5),
    ppg_dermatologia:use.filter(m=>/DERMAT/.test(m.NM_PROGRAMA_IES)).map(m=>({nome:m.NM_PROGRAMA_IES,grau:m.NM_GRAU_PROGRAMA,conceito:+m.CD_CONCEITO_PROGRAMA}))};
}
require('fs').writeFileSync('capes.json',JSON.stringify({fonte:'https://dadosabertos.capes.gov.br/dataset/2021-a-2024-programas-da-pos-graduacao-stricto-sensu-no-brasil',base:'CAPES, Programas da Pós-Graduação Stricto Sensu (coleta 2024, dados de 01/12/2025), áreas de avaliação Medicina I, II e III, em funcionamento, no município do programa',dados:out},null,1));
console.log(Object.keys(out).length, out['hcpa-portoalegre'].melhor_conceito);
