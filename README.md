# Residência em Dermatologia · painel dos programas no Brasil

Painel interativo com todos os programas de residência médica em Dermatologia do Brasil para o ingresso em 2027: editais, prazos de inscrição, taxas, datas de prova, vagas, concorrência, notas de corte e mapa. Foi feito para ajudar quem está escolhendo onde prestar a prova a planejar as inscrições sem perder prazo.

**Regra principal:** todo número vem de fonte oficial (edital, resultado, site da instituição ou da banca, MEC/CNRM, SBD). Quando um dado não foi publicado, o painel mostra "não divulgado". Nada é estimado. Quando a única fonte encontrada é um site de cursinho, o dado aparece com o selo "não oficial".

## O que o painel faz

- **Programas:** lista com busca e filtros, e mapa por cidade. Cada programa tem uma ficha com o edital, as datas, a taxa, o histórico de vagas, os candidatos por vaga e as notas de corte.
- **Prazos e provas:** inscrições abertas e as que vão abrir, provas marcadas, provas no mesmo dia ou em dias próximos, e o que mudou nos editais (o valor antigo, o novo, a data e a fonte).
- **Aviso de inscrição terminando:** aparece no topo de todas as páginas.
- **Comparar:** a sua nota contra as notas de corte já publicadas, as notas de corte de cada programa, uma pontuação de estrutura (pós-graduação CAPES, produção científica no OpenAlex, vagas, lista da SBD) com pesos ajustáveis, e até 4 programas lado a lado.
- **Minhas inscrições:** os programas guardados com ★, a etapa de cada inscrição, gastos e lista de documentos de cada edital.
- **Estudar:** quantas questões de cada área caem em cada prova e um plano de estudo até o dia da prova.

Funciona no computador e no celular, tem tema claro e escuro e pode ser usado pelo teclado e por leitor de tela.

## Como abrir

Abra o arquivo `painel.html` no navegador. É um arquivo só, sem servidor. O que a pessoa marca (lista ★, andamento, anotações) fica salvo no próprio navegador.

## Como atualizar os dados

Precisa do [Node.js](https://nodejs.org) 18 ou mais novo.

```
node dados/monitor/monitor.js
node build.js
```

- `monitor.js` visita a página oficial de cada processo seletivo, compara com a visita anterior e lista as páginas que mudaram e os documentos novos (retificações, comunicados).
- `build.js` junta os dados de `dados/`, compara com a versão anterior, registra o que mudou e gera o `painel.html` a partir do `painel.template.html`.

Os dados de cada edital são atualizados à mão, sempre a partir do documento oficial, em `dados/brutos/`, `dados/hist/` e `dados/fase3/`.

## Estrutura

| Caminho | O que é |
|---|---|
| `painel.html` | o painel pronto |
| `painel.template.html` | o código do painel (HTML, CSS e JavaScript) |
| `build.js` | junta os dados e gera o painel |
| `dados/brutos/` | programas e editais do ciclo 2027, por região |
| `dados/hist/` | série histórica: vagas, candidatos por vaga e notas de corte de 2024 a 2027 |
| `dados/fase3/` | perfil de cada prova (questões por área, etapas, provas anteriores) e documentos pedidos |
| `dados/ranking/` | indicadores da pontuação (CAPES, OpenAlex, SBD) |
| `dados/monitor/` | monitoramento das páginas oficiais |
| `dados/ajustes.json` | correções manuais, nomes curtos dos processos e previsões de edital |

## Privacidade

O painel não publica nome de candidato. Listas de aprovados trazem nomes, mas aqui entram só a nota de corte e a posição.

## Autor

Geraldo Brito Neto · [github.com/GeraldoNeto](https://github.com/GeraldoNeto)
