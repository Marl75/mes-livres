// ===== RECOMMANDATIONS PAR CLAUDE =====
// Logique indépendante de Firebase (testable en local) : nettoie la collection envoyée
// par l'appli, demande des recommandations à Claude, puis retire celles déjà présentes.
import Anthropic from '@anthropic-ai/sdk';

const TYPES = ['livre', 'film', 'serie', 'jeu'];
const CATS = ['lu', 'en-cours', 'a-lire', 'abandonne', 'wishlist'];
const MAX_ITEMS = 400;
const COUNT = 6;

const clip = (s, n) => (typeof s === 'string' ? s.trim().slice(0, n) : '');

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

// Ne garde que les champs utiles, avec des longueurs bornées : l'appel est payant
// et le contenu vient du navigateur.
export function cleanInput(data) {
  const items = (Array.isArray(data && data.items) ? data.items : []).slice(0, MAX_ITEMS).map(b => {
    const it = {
      titre: clip(b.titre, 150),
      type: TYPES.includes(b.type) ? b.type : 'livre',
      categorie: CATS.includes(b.categorie) ? b.categorie : 'lu',
    };
    const auteur = clip(b.auteur, 100);
    if (auteur) it.auteur = auteur;
    const note = Number(b.note);
    if (note >= 1 && note <= 5) it.note = Math.round(note);
    const avis = clip(b.avis, 300);
    if (avis) it.avis = avis;
    const tags = (Array.isArray(b.tags) ? b.tags : []).map(x => clip(x, 30)).filter(Boolean).slice(0, 5);
    if (tags.length) it.tags = tags;
    return it;
  }).filter(it => it.titre);
  return {
    items,
    type: TYPES.includes(data && data.type) ? data.type : 'tout',
    demande: clip(data && data.demande, 300),
    refuses: (Array.isArray(data && data.refuses) ? data.refuses : []).map(x => clip(x, 150)).filter(Boolean).slice(0, 100),
    lang: data && data.lang === 'en' ? 'en' : 'fr',
  };
}

const SYSTEM = `Tu es le moteur de recommandations de « Ma Collection », une appli où chacun suit les livres, films, séries et jeux vidéo qu'il lit, regarde et joue.

La collection t'est donnée en JSON. Catégories : « lu » = terminé, « en-cours », « a-lire » = envie pas encore commencée, « abandonne » = abandonné, « wishlist » = à acheter ou à découvrir. Les notes vont de 1 à 5.

Déduis ses goûts : les œuvres notées 4 ou 5 et leurs avis disent ce qu'il ou elle aime et pourquoi ; les notes basses et les abandons disent ce qu'il faut éviter ; les catégories « a-lire » et « wishlist » montrent ses envies du moment.

Règles :
- Propose exactement ${COUNT} œuvres réelles et existantes. N'invente rien : en cas de doute sur un titre, un auteur ou une année, choisis une autre œuvre.
- Ne propose jamais une œuvre déjà présente dans la collection (quelle que soit la catégorie) ni une œuvre de la liste « déjà refusées ».
- Donne le titre tel qu'il est publié dans la langue de réponse quand une traduction existe.
- Varie les créateurs, et au moins une proposition doit sortir de ses habitudes (champ « audacieux »).
- « pourquoi » : une ou deux phrases personnelles, qui parlent de ses goûts à elle ou lui, pas un résumé générique.
- « base_sur » : les titres exacts de sa collection qui justifient la recommandation.
- Si la collection est presque vide, propose des valeurs sûres et variées et dis-le dans le profil.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['profil', 'recommandations'],
  properties: {
    profil: { type: 'string', description: 'Ses goûts en deux phrases, en le ou la tutoyant' },
    recommandations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['titre', 'type', 'createur', 'annee', 'pourquoi', 'base_sur', 'audacieux'],
        properties: {
          titre: { type: 'string' },
          type: { type: 'string', enum: TYPES },
          createur: { type: 'string', description: 'Auteur, réalisateur, créateur de la série ou studio du jeu' },
          annee: { type: 'integer' },
          pourquoi: { type: 'string' },
          base_sur: { type: 'array', items: { type: 'string' } },
          audacieux: { type: 'boolean' },
        },
      },
    },
  },
};

const TYPE_NAMES = { livre: 'des livres', film: 'des films', serie: 'des séries', jeu: 'des jeux vidéo' };

export async function recommend(input, apiKey) {
  const { items, type, demande, refuses, lang } = input;
  const consignes = [
    type === 'tout' ? 'Mélange les types (livres, films, séries, jeux) selon ses goûts.' : `Propose uniquement ${TYPE_NAMES[type]}.`,
    demande ? `Son envie du moment : « ${demande} »` : '',
    refuses.length ? `Déjà refusées (ne plus les proposer) : ${JSON.stringify(refuses)}` : '',
    lang === 'en' ? 'Answer in English.' : 'Réponds en français.',
  ].filter(Boolean).join('\n');

  const client = new Anthropic({ apiKey });
  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    // Si le modèle décline la demande, l'API la relance sur un modèle de secours
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    messages: [{ role: 'user', content: `Ma collection :\n${JSON.stringify(items)}\n\n${consignes}` }],
  });

  if (response.stop_reason === 'refusal') throw new Error('refusal');
  const text = response.content.find(b => b.type === 'text');
  if (!text) throw new Error('empty response');
  const result = JSON.parse(text.text);

  // Filet de sécurité : retire ce qui est déjà dans la collection ou a été refusé
  const known = new Set([...items.map(b => normalize(b.titre)), ...refuses.map(normalize)]);
  const recommandations = result.recommandations
    .filter(r => r.titre && !known.has(normalize(r.titre)))
    .filter(r => type === 'tout' || r.type === type);

  return {
    profil: result.profil,
    recommandations,
    usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  };
}
