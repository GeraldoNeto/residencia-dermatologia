# Coleta da Fase 3: perfil de prova e documentos por processo seletivo

Painel de residência médica em **Dermatologia** (acesso direto, ingresso em março de 2027). Para cada processo da sua lista (`lista-<frente>.json`), leia o **edital oficial** (campo `link_edital`; também retificações em `link_processo`) e grave os dados num JSON.

## Regras (inegociáveis)
1. **Só fonte oficial** entra com selo `"oficial"`: o edital, os anexos, as retificações, a página da banca ou da instituição. Cursinhos (Medway, MedCof, Estratégia, Sanar) servem só para descobrir onde procurar; se um dado só existir num compilado, use o selo `"secundaria"` e diga isso em `obs`.
2. **Nunca estime nem invente.** Quando não houver o dado, grave `null` e explique em `lacunas`.
3. **Nunca grave nome de candidato** ou qualquer dado pessoal.
4. A distribuição de questões deve ser **a que o edital de 2027 fixa**. Se o edital não fixar, use `null` e diga isso (não copie de anos anteriores sem avisar; se um edital anterior oficial fixava, pode registrar em `distribuicao_obs` com o ano e o link).
5. Para o ENARE 2026/2027, a nota veio do **Enamed 2026** (prova de 13/09/2026, Inep). O perfil de prova é o do Enamed: confira a distribuição por área na matriz ou no edital do Inep e os links oficiais das provas e gabaritos.
6. Processos AMP 2026 (4 grupos) e AMRIGS/ACM (1 grupo, 7 programas) são **uma prova só cada**: grave um registro para cada grupo, mas pode repetir o mesmo conteúdo.
7. Seja objetivo: listas curtas, cada item com até ~15 palavras.

## Saída: `dados/fase3/fase3-<frente>.json`
```json
{
 "processos": {
  "<grupo exatamente como na lista>": {
   "prova": {
    "questoes_total": 100,
    "distribuicao": {"clinica_medica": 20, "cirurgia": 20, "ginecologia_obstetricia": 20, "pediatria": 20, "preventiva_social": 20, "outras": 0},
    "distribuicao_obs": "texto curto ou null (ex.: 'edital fixa 20 por área'; 'saúde mental conta em clínica')",
    "duracao_horas": 4,
    "formato": "objetiva de múltipla escolha, 4 alternativas",
    "etapas": [
     {"etapa": "Prova objetiva", "peso": "90%", "carater": "eliminatória e classificatória"},
     {"etapa": "Análise curricular", "peso": "10%", "carater": "classificatória"}
    ],
    "bonificacao": "PRMGFC/PROVAB: +10% (Res. CNRM 2/2015), conforme item X do edital; ou null",
    "fonte": "url",
    "selo": "oficial"
   },
   "provas_anteriores": [
    {"ano": 2026, "descricao": "Prova R1 acesso direto 2026", "link_prova": "url ou null", "link_gabarito": "url ou null", "selo": "oficial"}
   ],
   "documentos": {
    "inscricao": ["Formulário on-line", "Comprovante de pagamento da taxa"],
    "analise_curricular": ["Currículo padronizado do Anexo II", "Comprovantes"],
    "matricula": ["Diploma ou declaração de conclusão", "CRM ou protocolo", "RG e CPF"],
    "fonte": "url",
    "selo": "oficial"
   },
   "obs": "texto curto ou null"
  }
 },
 "lacunas": ["<grupo>: o que faltou e onde procurou"]
}
```
- `distribuicao`: use só as chaves acima; número de questões (não porcentagem). Quando o edital der porcentagem ou peso por área, converta só se o total for exato, senão `null` e explique.
- `provas_anteriores`: até 3 anos (2024–2026), só links oficiais da banca (cadernos de prova e gabarito definitivo). Se a banca não publicar, lista vazia e lacuna.
- `documentos.analise_curricular`: `[]` quando não há análise curricular.
- Grave o arquivo **a cada 3 processos** concluídos (para não perder trabalho se a sessão cair).

Ao terminar, responda só com: quantos processos ficaram com distribuição por área oficial, quantos com documentos, e as lacunas principais.
