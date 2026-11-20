# FloriGuesser

Jogo de geografia inspirado no GeoGuessr, focado em **Palhoça, São José, Florianópolis, Biguaçu e Santo Amaro da Imperatriz**. 5 rodadas, até 5.000 pontos por rodada (25.000 no total). HTML + CSS + JS puros, sem build, pronto para o GitHub Pages.

## Como rodar

**Localmente** (precisa de internet para carregar mapas):

```bash
cd geoguessr-floripa
python3 -m http.server 8000
# abra http://localhost:8000
```

Também funciona abrindo `index.html` direto no navegador, mas alguns provedores de imagem (Street View/Mapillary) funcionam melhor via `http://`.

**No GitHub Pages (grátis):**
1. Crie um repositório e envie os 6 arquivos: `index.html`, `style.css`, `config.js`, `locais.js`, `core.js`, `game.js` (e este README).
2. Em *Settings → Pages*, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`.
3. Acesse `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Imagens de rua (o jogo funciona sem isso)

Sem nenhuma chave, o jogo usa **vista de satélite** (Esri) no lugar do panorama, então nunca fica quebrado. Para ter imagens de rua, edite só o `config.js`:

### Opção A — Mapillary (grátis, sem cartão) — recomendada
1. Crie uma conta em https://www.mapillary.com.
2. Acesse https://www.mapillary.com/dashboard/developers → **Register application**.
3. Preencha o nome, marque *Read* nas permissões e salve.
4. Copie o **Client Token** (começa com `MLY|`) e cole em `MAPILLARY_TOKEN` no `config.js`.
5. Atenção: o token ficará visível no código do site. É o comportamento normal de um client token; se quiser, restrinja o uso pelo painel.

A cobertura do Mapillary na região é colaborativa: em ruas sem foto, o jogo tenta outros pontos próximos e, se não achar, cai para o satélite.

### Opção B — Google Street View
1. Crie um projeto em https://console.cloud.google.com e **ative o faturamento** (exige cartão; há cota gratuita mensal).
2. Ative a **Maps JavaScript API**.
3. Crie uma chave em *APIs e serviços → Credenciais*.
4. Restrinja a chave a referenciadores HTTP (ex.: `https://SEU-USUARIO.github.io/*` e `http://localhost:8000/*`) e à Maps JavaScript API.
5. Cole em `GOOGLE_MAPS_API_KEY` no `config.js`.

No menu, "Imagens → Automático" tenta Google, depois Mapillary, depois satélite. Um provedor com erro de autenticação ou 3 falhas seguidas é desativado automaticamente.

## Regras e pontuação

- Distância por haversine. Até 50 m vale 5.000; depois `5000 · e^(-(km-0,05)/8)`. Ex.: 1 km ≈ 4.420; 5 km ≈ 2.850; 20 km ≈ 470.
- A distância é medida até a posição **real** da imagem encontrada.
- Sem locais repetidos na mesma partida e com separação mínima de 600 m entre rodadas.
- Dificuldades: **Fácil** (pontos turísticos, avenidas, praias), **Médio** (bairros e ruas comerciais), **Difícil** (ruas residenciais e estradas secundárias, com sorteio num raio maior), **Misto**.
- Temporizador opcional (60 s, 2 min, 3 min); se acabar sem palpite, vale 0.
- Atalhos: `M` mapa, `Enter` confirmar/avançar, `R` voltar ao ponto inicial.
- O recorde é salvo no navegador (localStorage).

## Adicionar ou editar locais (`locais.js`)

Cada linha usa `p(id, nome, cidade, lat, lng, dificuldade, extra)`:

```js
p("pal-pinheira-orla", "Pinheira (orla)", "Palhoça", -27.8440, -48.6130, "facil"),
p("pal-brejaru-rua",   "Brejaru",         "Palhoça", -27.6450, -48.6720, "dificil", { j: 800, conf: "baixa" }),
```

- `id` único; `dificuldade` = `facil`, `medio` ou `dificil`.
- `j` = raio de sorteio (m) ao redor do ponto; `s` = raio de busca de imagem (m).
- `conf: "baixa"` marca coordenada aproximada.

O banco tem 82 locais (23 fácil, 31 médio, 28 difícil): Palhoça 32, Florianópolis 36, São José 10, Biguaçu 2, Santo Amaro 2.

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | telas (menu, jogo, resultado, final) |
| `style.css` | tema escuro e responsivo |
| `config.js` | chaves e regras |
| `locais.js` | banco de coordenadas |
| `core.js` | distância, pontuação e sorteio (funções puras) |
| `game.js` | provedores de imagem, fluxo do jogo e mapas |

## Limitações conhecidas

- Os provedores ao vivo (Google Street View e Mapillary) e os tiles reais do mapa **não puderam ser testados** no ambiente de desenvolvimento (rede bloqueada); a lógica foi testada com simulações. Teste online antes de divulgar.
- Algumas coordenadas são aproximadas (`conf: "baixa"`); ajuste se alguma cair em local errado.
- Créditos: mapas © OpenStreetMap; imagens Esri, Mapillary (CC BY-SA) e Google.
