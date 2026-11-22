# Coleta de dados — Residência em Dermatologia (Fase 1)

Data de referência: 2026-11-21. Ciclo atual = processos seletivos para ingresso em março de 2027 (editais publicados entre jul e nov de 2026, provas entre out/2026 e fev/2027).

## Regras inegociáveis
1. **Nunca estimar nem inventar números ou datas.** Se não achou em fonte, grave `null` e descreva a lacuna em `lacunas`.
2. **Fonte primária antes de agregador.** Blogs de cursinho (Medway, MedCof, Estratégia MED, Sanar, IPM Educação, MedCel, Aristo) servem para DESCOBRIR o edital. O número só entra com `selo: "oficial"` se você conferiu no edital/resultado/site da instituição ou da banca (gov.br, .edu.br, site da banca: Vunesp, FUVEST, FGV, Fundação Carlos Chagas, Consulplan, IBFC, AOCP, Cebraspe, AMRIGS, AMP, IADES, Fundatec etc.). Se só o agregador traz o número, grave com `selo: "secundaria"` e a URL do agregador.
3. Toda informação com URL de fonte. Prefira o link direto do PDF do edital.
4. Só o programa de **Dermatologia** (acesso direto, 3 anos). Ignore anos opcionais/áreas de atuação (ex.: cirurgia dermatológica R4, cosmiatria) — se encontrar, cite em `observacoes`.
5. Datas em ISO `AAAA-MM-DD`. Valores em reais como número.
6. Concorrência: use "candidatos por vaga" exatamente como publicado (ou inscritos ÷ vagas só se a fonte oficial der os dois números — nesse caso diga em `observacoes` que foi calculado).
7. Nota de corte: só se publicada (nota do último aprovado/convocado na lista oficial, ou nota de corte oficial). Informe a escala e a etapa.

## Saída
Grave UM arquivo JSON (UTF-8, válido, sem comentários) no caminho indicado no seu pedido, com este formato:

```json
{
  "frente": "nome da frente",
  "coletado_em": "2026-11-21",
  "programas": [
    {
      "id": "slug-curto-unico (ex.: hcfmusp-sp)",
      "instituicao": "nome oficial",
      "sigla": "ex.: HC-FMUSP",
      "hospital": "hospital/serviço onde ocorre o programa",
      "cidade": "São Paulo",
      "uf": "SP",
      "endereco": "endereço do hospital/serviço, se achar",
      "natureza": "federal | estadual | municipal | filantropica | privada | null",
      "processo": "nome do processo seletivo (ex.: SUS-SP 2027, ENARE 2026/2027, FUVEST HC-FMUSP 2027)",
      "banca": "organizadora da prova",
      "ciclo_2027": {
        "vagas": 4,
        "inscricao_inicio": "2026-10-01",
        "inscricao_fim": "2026-10-20",
        "prova_1a_fase": "2026-11-30",
        "outras_etapas": [{"etapa": "2ª fase / análise curricular / entrevista / prova prática", "data": "2027-01-10 ou null"}],
        "resultado_previsto": "2027-02-10 ou null",
        "taxa_reais": 450,
        "etapas_descricao": "Ex.: 1ª fase objetiva 100 questões (peso 90%) + análise curricular (10%)",
        "link_edital": "URL",
        "link_inscricao": "URL",
        "link_processo": "URL da página oficial do processo",
        "fonte": "URL principal usada",
        "selo": "oficial | secundaria"
      },
      "historico": [
        {"ano_ingresso": 2026, "vagas": 4, "inscritos": null, "candidatos_por_vaga": 80.5, "nota_corte": null, "nota_corte_escala": null, "nota_corte_etapa": null, "fonte": "URL", "selo": "oficial | secundaria"}
      ],
      "observacoes": ""
    }
  ],
  "lacunas": ["Programa X: edital 2027 não localizado", "..."]
}
```

- Se o ciclo 2027 do programa não foi localizado, mantenha o programa com `ciclo_2027` cheio de `null` e explique em `lacunas`.
- `historico`: inclua ingresso 2026 e 2025 quando houver dado oficial fácil de achar (relatório de concorrência da banca, lista de classificação). Não gaste muito tempo nisso; o ciclo 2027 é a prioridade.
- Um programa que entra por mais de um processo (ex.: ENARE e processo próprio) vira um registro por processo, com o mesmo `instituicao` e `id` diferente.

Ao terminar, responda só com: caminho do arquivo, número de programas, quantos com ciclo 2027 oficial, e as 5 lacunas mais importantes.
