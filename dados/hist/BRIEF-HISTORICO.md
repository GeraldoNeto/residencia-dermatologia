# Coleta da série histórica — Residência em Dermatologia (Fase 2)

Data de referência: 2026-11-21. Objetivo: para cada programa da sua lista, levantar **por ano de ingresso 2024, 2025 e 2026** (e 2027 se já houver concorrência publicada e o programa ainda não tiver):
- vagas oferecidas no edital daquele ano
- inscritos e candidatos por vaga de **Dermatologia daquele programa**
- **nota de corte**: a nota do último aprovado/convocado dentro do número de vagas na lista oficial de classificação/resultado final (ou nota de corte oficial). Diga a escala (ex.: "0-100", "0-1000", "pontos de 0 a 120") e a etapa ("1ª fase objetiva", "nota final com currículo", "nota final com bônus").

## Regras inegociáveis
1. **Nunca estimar nem inventar.** Sem fonte, não grave o campo (`null`). Lista de classificação sem nota visível = nota `null`.
2. **Fonte primária antes de agregador.** Cursinhos (Medway, MedCof, Estratégia MED, Sanar, Aristo, MedCel, IPM) servem para achar o relatório ou a lista. Número só com `selo: "oficial"` se conferido no documento da banca/instituição. Se só o agregador traz, `selo: "secundaria"` com a URL do agregador.
3. Concorrência: use exatamente o publicado. Se a fonte oficial dá inscritos e vagas, pode calcular inscritos ÷ vagas e dizer "calculado" em `obs`.
4. Processos unificados (SUS-SP, AMRIGS, AMP, PSU-MG etc.): só grave c/v por programa se a fonte publicar por instituição; se só houver número da especialidade no processo, grave no registro `processo_geral` (ver formato) e não repita em cada programa.
5. Não gaste mais de ~6 minutos por programa. Programas pequenos sem nada publicado: registre a lacuna e siga.
6. Não toque em arquivos fora do seu arquivo de saída. Não registre nada no cofre Obsidian.

## Saída
UM arquivo JSON (UTF-8, válido) no caminho indicado no pedido:

```json
{
  "frente": "nome",
  "coletado_em": "2026-11-21",
  "historico": {
    "<id do programa, exatamente como na lista>": [
      {"ano_ingresso": 2026, "vagas": 6, "inscritos": 280, "candidatos_por_vaga": 46.67, "nota_corte": 78.5, "nota_corte_escala": "0-100", "nota_corte_etapa": "nota final (objetiva 90% + currículo 10%)", "fonte": "URL", "selo": "oficial", "obs": "c/v calculado = 280/6"}
    ]
  },
  "processo_geral": [
    {"processo": "SUS-SP", "ano_ingresso": 2026, "vagas": 24, "inscritos": 1500, "candidatos_por_vaga": 62.5, "fonte": "URL", "selo": "oficial", "obs": ""}
  ],
  "lacunas": ["id X: lista de classificação 2025 sem notas", "..."]
}
```

Ao terminar, responda só com: caminho do arquivo, quantos programas ganharam algum dado, quantos com nota de corte oficial, e as 5 lacunas mais importantes.
