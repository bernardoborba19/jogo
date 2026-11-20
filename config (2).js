/* ==========================================================================
   FloriGuesser — configuração
   Edite apenas este arquivo para ligar as imagens de rua reais.

   Sem nenhuma chave o jogo funciona em "modo satélite" (imagens aéreas).
   Para ter imagens de rua (panorâmicas), preencha UMA das chaves abaixo
   (ou as duas). Veja o README.md para o passo a passo.
   ========================================================================== */
window.GEO_CONFIG = {
  // Google Street View (Maps JavaScript API).
  // Exige projeto no Google Cloud com faturamento ativo (cartão), mas tem cota gratuita.
  GOOGLE_MAPS_API_KEY: "",

  // Mapillary (imagens de rua colaborativas). GRATUITO e sem cartão.
  // Cole aqui o "Client Token" do seu aplicativo (começa com MLY|).
  MAPILLARY_TOKEN: "MLY|29711008588493221|d9e5c375ddc5a0af6419bcbe06a06071",

  // ---- Regras do jogo (não precisa mexer) -------------------------------
  ROUNDS: 5,                 // rodadas por partida
  MAX_SCORE: 5000,           // pontos máximos por rodada (5 x 5000 = 25000)
  PERFECT_RADIUS_M: 50,      // até esta distância (metros) vale a pontuação máxima
  SCORE_DECAY_KM: 8,         // quanto menor, mais rápido a pontuação cai com a distância
  STEP_IMAGES: 8,            // quadros percorridos a cada clique em "Avançar" (maior = anda mais)
  MAX_ATTEMPTS: 14,          // locais tentados por rodada até achar cobertura de imagens
  MIN_SEPARATION_KM: 0.6     // distância mínima entre os pontos de rodadas da mesma partida
};
