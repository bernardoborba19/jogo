/* ==========================================================================
   Banco de locais — Grande Florianópolis
   --------------------------------------------------------------------------
   Campos:
     id      identificador único
     nome    nome da região mostrado no resultado
     cidade  município
     lat,lng ponto central (graus decimais)
     dif     'facil' | 'medio' | 'dificil'
     j       (opcional) raio de sorteio em metros em volta do ponto central
     s       (opcional) raio, em metros, para procurar a imagem mais próxima
     conf    'baixa' = coordenada aproximada; vale conferir jogando

   Como funciona o sorteio: a cada rodada o jogo escolhe um local, sorteia um
   ponto dentro do raio "j" e procura a imagem de rua mais próxima (raio "s").
   A pontuação usa a posição REAL da imagem encontrada, não o ponto central
   daqui. Por isso pequenos erros de coordenada não prejudicam a pontuação.

   Fácil  = pontos conhecidos (raio pequeno).
   Médio  = bairros e ruas comerciais.
   Difícil = zonas amplas: ruas residenciais e estradas secundárias.
   ========================================================================== */
(function () {
  "use strict";
  var p = function (id, nome, cidade, lat, lng, dif, extra) {
    var o = { id: id, nome: nome, cidade: cidade, lat: lat, lng: lng, dif: dif };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  };

  window.LOCAIS = [
    /* ===================== FÁCIL ===================== */
    // Palhoça
    p("palhoca-centro", "Centro de Palhoça", "Palhoça", -27.6453, -48.6678, "facil"),
    p("palhoca-pedra-branca-centro", "Cidade Universitária Pedra Branca", "Palhoça", -27.6280, -48.6850, "facil"),
    p("palhoca-guarda-embau", "Guarda do Embaú", "Palhoça", -27.9045, -48.5880, "facil", { s: 250 }),
    p("palhoca-pinheira-praia", "Pinheira", "Palhoça", -27.8540, -48.6058, "facil", { s: 250 }),
    // São José
    p("sj-centro-historico", "Centro Histórico de São José", "São José", -27.6130, -48.6330, "facil"),
    p("sj-kobrasol", "Kobrasol", "São José", -27.5993, -48.6132, "facil"),
    // Florianópolis
    p("fl-praca-xv", "Centro (Praça XV)", "Florianópolis", -27.5969, -48.5495, "facil"),
    p("fl-ponte-hercilio", "Ponte Hercílio Luz", "Florianópolis", -27.5940, -48.5600, "facil", { s: 200 }),
    p("fl-beira-mar-norte", "Beira-Mar Norte", "Florianópolis", -27.5835, -48.5430, "facil"),
    p("fl-lagoa", "Lagoa da Conceição", "Florianópolis", -27.6040, -48.4650, "facil"),
    p("fl-praia-mole", "Praia Mole", "Florianópolis", -27.6020, -48.4290, "facil", { s: 250 }),
    p("fl-joaquina", "Praia da Joaquina", "Florianópolis", -27.6290, -48.4490, "facil", { s: 250 }),
    p("fl-barra-lagoa", "Barra da Lagoa", "Florianópolis", -27.5740, -48.4260, "facil"),
    p("fl-campeche", "Campeche", "Florianópolis", -27.6680, -48.4770, "facil"),
    p("fl-ingleses", "Ingleses", "Florianópolis", -27.4350, -48.3930, "facil"),
    p("fl-canasvieiras", "Canasvieiras", "Florianópolis", -27.4300, -48.4570, "facil"),
    p("fl-jurere", "Jurerê Internacional", "Florianópolis", -27.4370, -48.5000, "facil"),
    p("fl-santo-antonio", "Santo Antônio de Lisboa", "Florianópolis", -27.5100, -48.5190, "facil"),
    p("fl-ribeirao", "Ribeirão da Ilha", "Florianópolis", -27.7260, -48.5650, "facil"),
    p("fl-ufsc", "UFSC / Trindade", "Florianópolis", -27.6005, -48.5190, "facil"),
    p("fl-aeroporto", "Aeroporto Hercílio Luz", "Florianópolis", -27.6700, -48.5470, "facil", { s: 300 }),
    p("fl-armacao", "Armação do Pântano do Sul", "Florianópolis", -27.7430, -48.5040, "facil"),
    p("fl-pantano-sul", "Pântano do Sul", "Florianópolis", -27.7790, -48.5170, "facil"),

    /* ===================== MÉDIO ===================== */
    // Palhoça
    p("palhoca-ponte-imaruim", "Ponte do Imaruim", "Palhoça", -27.6315, -48.6560, "medio"),
    p("palhoca-pagani", "Pagani", "Palhoça", -27.6320, -48.6700, "medio"),
    p("palhoca-passa-vinte", "Passa Vinte", "Palhoça", -27.6335, -48.6740, "medio"),
    p("palhoca-jardim-eldorado", "Jardim Eldorado", "Palhoça", -27.6250, -48.6580, "medio"),
    p("palhoca-caminho-novo", "Caminho Novo", "Palhoça", -27.6450, -48.6800, "medio"),
    p("palhoca-bela-vista", "Bela Vista", "Palhoça", -27.6640, -48.6900, "medio"),
    p("palhoca-sao-sebastiao", "São Sebastião", "Palhoça", -27.6250, -48.6900, "medio", { conf: "baixa" }),
    p("palhoca-aririu", "Aririú", "Palhoça", -27.6780, -48.6870, "medio"),
    p("palhoca-barra-aririu", "Barra do Aririú", "Palhoça", -27.6790, -48.6480, "medio"),
    p("palhoca-praia-de-fora", "Praia de Fora", "Palhoça", -27.7375, -48.6380, "medio"),
    p("palhoca-enseada-brito", "Enseada de Brito", "Palhoça", -27.7500, -48.6310, "medio", { conf: "baixa" }),
    p("palhoca-guarda-cubatao", "Guarda do Cubatão", "Palhoça", -27.6979, -48.6764, "medio"),
    p("palhoca-ponta-papagaio", "Ponta do Papagaio", "Palhoça", -27.8230, -48.6190, "medio", { conf: "baixa" }),
    // São José
    p("sj-campinas", "Campinas", "São José", -27.5960, -48.6040, "medio"),
    p("sj-barreiros", "Barreiros", "São José", -27.5770, -48.6090, "medio"),
    p("sj-forquilhinhas", "Forquilhinhas", "São José", -27.6040, -48.6450, "medio"),
    p("sj-fazenda-santo-antonio", "Fazenda Santo Antônio", "São José", -27.6180, -48.6400, "medio"),
    // Biguaçu e Santo Amaro
    p("bg-centro", "Centro de Biguaçu", "Biguaçu", -27.4965, -48.6540, "medio"),
    p("sa-centro", "Centro de Santo Amaro da Imperatriz", "Santo Amaro da Imperatriz", -27.6880, -48.7780, "medio"),
    // Florianópolis
    p("fl-estreito", "Estreito", "Florianópolis", -27.5985, -48.5800, "medio"),
    p("fl-coqueiros", "Coqueiros", "Florianópolis", -27.6065, -48.5950, "medio", { conf: "baixa" }),
    p("fl-trindade", "Trindade", "Florianópolis", -27.5890, -48.5190, "medio", { conf: "baixa" }),
    p("fl-itacorubi", "Itacorubi", "Florianópolis", -27.5800, -48.5050, "medio"),
    p("fl-corrego-grande", "Córrego Grande", "Florianópolis", -27.5960, -48.5040, "medio"),
    p("fl-saco-limoes", "Saco dos Limões", "Florianópolis", -27.6150, -48.5450, "medio"),
    p("fl-carianos", "Carianos", "Florianópolis", -27.6620, -48.5450, "medio", { conf: "baixa" }),
    p("fl-rio-tavares", "Rio Tavares", "Florianópolis", -27.6420, -48.4900, "medio", { conf: "baixa" }),
    p("fl-santinho", "Santinho", "Florianópolis", -27.4560, -48.3830, "medio"),
    p("fl-sambaqui", "Sambaqui", "Florianópolis", -27.4880, -48.5320, "medio"),
    p("fl-cachoeira-bom-jesus", "Cachoeira do Bom Jesus", "Florianópolis", -27.4400, -48.4270, "medio"),
    p("fl-agronomica", "Agronômica", "Florianópolis", -27.5830, -48.5380, "medio", { conf: "baixa" }),

    /* ===================== DIFÍCIL ===================== */
    // Palhoça (ruas residenciais, estradas secundárias)
    p("d-palhoca-alto-aririu", "Alto Aririú", "Palhoça", -27.6720, -48.6800, "dificil", { j: 1500 }),
    p("d-palhoca-aririu-formiga", "Aririú da Formiga", "Palhoça", -27.6876, -48.6609, "dificil", { j: 1000 }),
    p("d-palhoca-pachecos", "Pachecos", "Palhoça", -27.6590, -48.6450, "dificil", { j: 1000, conf: "baixa" }),
    p("d-palhoca-brejaru", "Brejaru", "Palhoça", -27.6520, -48.6950, "dificil", { j: 1100, conf: "baixa" }),
    p("d-palhoca-madri", "Madri", "Palhoça", -27.7010, -48.6500, "dificil", { j: 1000, conf: "baixa" }),
    p("d-palhoca-parque-palmeiras", "Parque das Palmeiras", "Palhoça", -27.6850, -48.6680, "dificil", { j: 900, conf: "baixa" }),
    p("d-palhoca-jardim-eldorado", "Jardim Eldorado", "Palhoça", -27.6250, -48.6580, "dificil", { j: 900 }),
    p("d-palhoca-passa-vinte", "Passa Vinte", "Palhoça", -27.6335, -48.6740, "dificil", { j: 900 }),
    p("d-palhoca-pedra-branca-sertao", "Pedra Branca (entorno)", "Palhoça", -27.6280, -48.6900, "dificil", { j: 1500 }),
    p("d-palhoca-bela-vista", "Bela Vista", "Palhoça", -27.6640, -48.6900, "dificil", { j: 1200 }),
    p("d-palhoca-caminho-novo", "Caminho Novo", "Palhoça", -27.6450, -48.6800, "dificil", { j: 900 }),
    p("d-palhoca-barra-aririu", "Barra do Aririú", "Palhoça", -27.6790, -48.6480, "dificil", { j: 1000 }),
    p("d-palhoca-enseada-brito", "Enseada de Brito (interior)", "Palhoça", -27.7500, -48.6310, "dificil", { j: 1500, conf: "baixa" }),
    p("d-palhoca-pinheira", "Pinheira (interior)", "Palhoça", -27.8480, -48.6100, "dificil", { j: 1500 }),
    p("d-palhoca-guarda-cubatao", "Guarda do Cubatão", "Palhoça", -27.6979, -48.6764, "dificil", { j: 1800 }),
    // São José
    p("d-sj-serraria", "Serraria", "São José", -27.5450, -48.6340, "dificil", { j: 1500 }),
    p("d-sj-forquilhas", "Forquilhas", "São José", -27.5780, -48.6680, "dificil", { j: 1500 }),
    p("d-sj-forquilhinhas", "Forquilhinhas", "São José", -27.6040, -48.6450, "dificil", { j: 1000 }),
    p("d-sj-barreiros", "Barreiros", "São José", -27.5770, -48.6090, "dificil", { j: 1100 }),
    // Biguaçu, Santo Amaro
    p("d-bg-interior", "Interior de Biguaçu", "Biguaçu", -27.4800, -48.6600, "dificil", { j: 2500 }),
    p("d-sa-arredores", "Arredores de Santo Amaro da Imperatriz", "Santo Amaro da Imperatriz", -27.6880, -48.7780, "dificil", { j: 2500 }),
    // Florianópolis
    p("d-fl-saco-grande", "Saco Grande", "Florianópolis", -27.5600, -48.5120, "dificil", { j: 1200, conf: "baixa" }),
    p("d-fl-ratones", "Ratones", "Florianópolis", -27.4650, -48.4900, "dificil", { j: 1500, conf: "baixa" }),
    p("d-fl-campeche-sul", "Campeche (sul)", "Florianópolis", -27.6850, -48.4800, "dificil", { j: 1300 }),
    p("d-fl-ribeirao-ilha", "Ribeirão da Ilha (interior)", "Florianópolis", -27.7260, -48.5650, "dificil", { j: 1800 }),
    p("d-fl-tapera", "Tapera", "Florianópolis", -27.7000, -48.5600, "dificil", { j: 1200, conf: "baixa" }),
    p("d-fl-ingleses", "Ingleses (ruas internas)", "Florianópolis", -27.4350, -48.3930, "dificil", { j: 1500 }),
    p("d-fl-canasvieiras", "Canasvieiras (ruas internas)", "Florianópolis", -27.4300, -48.4570, "dificil", { j: 1300 })
  ];
})();
