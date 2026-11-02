import type { ProviderDef } from './types';

/**
 * No key, no network. Scripted replies per built-in mask so you can feel the app
 * (and so the README screenshots are reproducible). Each reply ends with a real cards block,
 * which is how every other provider is expected to answer too.
 */
const SCRIPTS: Record<string, string[]> = {
  laoshi: [
    '很好！你说"我今天很忙"，对吗？\n\n注意第三声：**很 (hěn)** 要先降后升。再试一次：**我今天很忙。** (Wǒ jīntiān hěn máng.)\n\n你忙什么呢？\n\n```cards\n[{"front":"很忙","back":"very busy","hint":"hěn máng — 3rd tone then 2nd","example":"我今天很忙。","tags":["daily life"]},{"front":"今天","back":"today","hint":"jīntiān","example":"今天天气很好。","tags":["time"]}]\n```',
    '对了！"工作"用得很好。\n\n小改一下：中文里时间词放在动词前面 → **我今天在家工作。** (Wǒ jīntiān zài jiā gōngzuò.)\n\n你喜欢在家工作吗？\n\n```cards\n[{"front":"在家工作","back":"to work from home","hint":"zài jiā gōngzuò","example":"我今天在家工作。","tags":["work"]},{"front":"喜欢","back":"to like","hint":"xǐhuan — 3rd + neutral","example":"你喜欢喝茶吗？","tags":["verbs"]}]\n```',
    '哈哈，我也喜欢。那我们明天再聊，好吗？记得练习第三声！\n\n```cards\n[{"front":"明天再聊","back":"let\'s talk again tomorrow","hint":"míngtiān zài liáo","example":"我们明天再聊。","tags":["phrases"]}]\n```',
  ],
  abuela: [
    '¡Ay, mi niño, qué alegría! Pero mira, se dice **"he comido"**, no "he comí". El pasado de hoy es con *haber*.\n\n¿Y qué has comido? Porque tienes cara de hambre…\n\n```cards\n[{"front":"he comido","back":"I have eaten","hint":"pretérito perfecto — haber + participio","example":"Hoy he comido paella.","tags":["grammar","food"]},{"front":"tener cara de hambre","back":"to look hungry","hint":"idiom, literally \'to have a face of hunger\'","example":"Tienes cara de hambre, siéntate.","tags":["idioms"]}]\n```',
    '¡Una tortilla! Bien hecho. Pero en Sevilla decimos **"una tortilla de patatas"**, con *de*, siempre.\n\nMi madre la hacía con cebolla, que no te engañen. ¿Tu familia cocina?\n\n```cards\n[{"front":"tortilla de patatas","back":"Spanish potato omelette","hint":"always with \'de\'","example":"Mi abuela hace la mejor tortilla de patatas.","tags":["food"]},{"front":"que no te engañen","back":"don\'t let them fool you","hint":"subjunctive after \'que\'","example":"Con cebolla, que no te engañen.","tags":["idioms"]}]\n```',
    'Qué bonito. Bueno, ya es tarde. Llévate un poco de pan, anda. ¡Hasta mañana, mi niño!\n\n```cards\n[{"front":"anda","back":"go on / come on (softener)","hint":"very common filler","example":"Llévate pan, anda.","tags":["phrases"]}]\n```',
  ],
  barista: [
    'Un café… *d\'accord*. Petite chose : on dit plutôt **« un café, s\'il vous plaît »** — le *s\'il vous plaît* à la fin, pas au début.\n\nSur place ou à emporter ?\n\n```cards\n[{"front":"un café, s\'il vous plaît","back":"a coffee, please","hint":"ka-FAY, seel voo PLEH","example":"Un café, s\'il vous plaît.","tags":["café"]},{"front":"sur place ou à emporter ?","back":"for here or to go?","hint":"syr plas / a ɑ̃-por-TAY","example":"— Sur place ou à emporter ? — Sur place.","tags":["café"]}]\n```',
    'Sur place. Très bien. Et avec ça, un croissant ? Ils sont encore chauds.\n\nAttention à la liaison : **un croissant** → « un‿croissant » (le *n* se lie).\n\n```cards\n[{"front":"et avec ça ?","back":"anything else? (lit. and with that?)","hint":"ay a-vek SA","example":"Et avec ça ? Un croissant ?","tags":["café"]},{"front":"un croissant","back":"a croissant","hint":"liaison: un‿croissant","example":"Je prends un croissant.","tags":["food"]}]\n```',
    'Deux euros dix. *Bonne journée* — et revenez, on a des pains au chocolat demain.\n\n```cards\n[{"front":"bonne journée","back":"have a good day","hint":"bon zhoor-NAY","example":"Merci, bonne journée !","tags":["phrases"]}]\n```',
  ],
  konbini: [
    'はい、おにぎりですね。こちらは **ツナマヨ** (tsuna mayo) です。\n\n「これください」は正しいです！もっと丁寧に言うと **「これをください」** (kore o kudasai)。\n\n温めますか？\n\n```cards\n[{"front":"これをください","back":"this one, please","hint":"kore o kudasai — polite request","example":"これをください。","tags":["shopping"]},{"front":"温めますか","back":"shall I heat it up?","hint":"atatamemasu ka","example":"お弁当、温めますか？","tags":["konbini"]}]\n```',
    'かしこまりました。袋は **いりますか**？ (fukuro wa irimasu ka)\n\n「いります」= need. 「いりません」= don\'t need. Many customers just say **「大丈夫です」** — it politely means "no thanks".\n\n```cards\n[{"front":"袋はいりますか","back":"do you need a bag?","hint":"fukuro wa irimasu ka","example":"袋はいりますか？— 大丈夫です。","tags":["konbini"]},{"front":"大丈夫です","back":"it\'s fine / no thanks","hint":"daijōbu desu — the polite no","example":"袋は大丈夫です。","tags":["phrases"]}]\n```',
    '二百三十円です。ありがとうございました！またお越しくださいませ。\n\n```cards\n[{"front":"またお越しくださいませ","back":"please come again (very polite)","hint":"mata okoshi kudasaimase","example":"ありがとうございました。またお越しくださいませ。","tags":["keigo"]}]\n```',
  ],
  flatmate: [
    'Ja klar, ich geh. Aber kleiner Hinweis: **zum Späti** — *zu dem* → *zum*, Dativ, weil Späti maskulin ist.\n\nWillst du auch was? Club-Mate?\n\n```cards\n[{"front":"zum Späti gehen","back":"to go to the corner shop","hint":"zu + dem = zum (Dativ)","example":"Ich geh mal zum Späti.","tags":["Berlin"]},{"front":"Willst du auch was?","back":"Do you want something too?","hint":"was = etwas, casual","example":"Ich geh einkaufen, willst du auch was?","tags":["everyday"]}]\n```',
    'Okay, zwei Mate. Übrigens: der Müll. **Das Glas** kommt in den grünen Container, nicht in **die Tonne**. Ja, ich bin *die* Person in dieser WG.\n\n```cards\n[{"front":"der Müll","back":"the rubbish / garbage","hint":"masculine","example":"Wer bringt heute den Müll runter?","tags":["WG"]},{"front":"die Tonne","back":"the bin","hint":"feminine","example":"Das Glas kommt nicht in die Tonne.","tags":["WG"]}]\n```',
    'Haha, **passt schon**. Bis später — und vergiss den Schlüssel nicht!\n\n```cards\n[{"front":"passt schon","back":"it\'s fine / no worries","hint":"very casual, very common","example":"— Sorry! — Passt schon.","tags":["phrases"]}]\n```',
  ],
  nonno: [
    'Bravo! Ma si dice **"ho mangiato"**, non "ho mangiare". Il participio, ragazzo mio! Mangi-ATO.\n\nE cosa hai mangiato? Spero pasta.\n\n```cards\n[{"front":"ho mangiato","back":"I ate / I have eaten","hint":"passato prossimo: avere + participio","example":"Oggi ho mangiato la pasta.","tags":["grammar","food"]},{"front":"ragazzo mio","back":"my boy (affectionate)","hint":"ra-GAT-tso MEE-o","example":"Vieni qui, ragazzo mio.","tags":["phrases"]}]\n```',
    'Pizza… va bene, va bene. Ma la prossima volta: **spaghetti al limone**. I limoni sono i miei, dal giardino.\n\n**Allora**, ti piace il mare?\n\n```cards\n[{"front":"allora","back":"so / well then","hint":"the Italian conversation glue","example":"Allora, cosa facciamo?","tags":["phrases"]},{"front":"il limone","back":"the lemon","hint":"lee-MO-ne","example":"I limoni di Amalfi sono famosi.","tags":["food"]}]\n```',
    'Eh, il mare… Dai, domani ti porto in barca. **A domani**, e mangia!\n\n```cards\n[{"front":"dai","back":"come on","hint":"encouraging interjection","example":"Dai, andiamo!","tags":["phrases"]}]\n```',
  ],
  examiner: [
    'Noted: Spanish, A2. Round 1.\n\n1. Translate: *I have to go to the bank tomorrow.*\n2. Fill the gap: *Ayer ___ (ir, yo) al cine.*\n3. Fix the error: *Me gusta los perros.*\n\nAnswer all three.\n\n```cards\n[{"front":"tener que + infinitivo","back":"to have to (obligation)","hint":"tengo que, tienes que…","example":"Tengo que ir al banco mañana.","tags":["grammar"]},{"front":"me gustan los perros","back":"I like dogs","hint":"gustar agrees with the thing liked","example":"Me gustan los perros, no los gatos.","tags":["grammar"]}]\n```',
    'Scores: 1 → **2/2**. 2 → **1/2** (*fui*, not *fue* — first person). 3 → **2/2**.\n\nRound 2, harder.\n\n1. Translate: *If I had time, I would learn Portuguese.*\n2. Rewrite in the past: *Vivo en Madrid y trabajo en un banco.*\n3. Choose: *Espero que (tienes / tengas) suerte.*\n\n```cards\n[{"front":"fui","back":"I went (ir, pretérito)","hint":"irregular: fui, fuiste, fue…","example":"Ayer fui al cine.","tags":["verbs"]},{"front":"espero que tengas suerte","back":"I hope you\'re lucky","hint":"subjunctive after esperar que","example":"Espero que tengas suerte mañana.","tags":["subjunctive"]}]\n```',
    'Scores: 2/2, 2/2, 1/2. Session total: **10/12**. Good. Next time we start at B1.\n\n```cards\n[]\n```',
  ],
};

const GENERIC = [
  'Great start! Here is how you would say that naturally: **{greeting}**\n\nI corrected one small thing — notice the word order. Now you try: tell me what you did this morning.\n\n```cards\n[{"front":"good morning","back":"a greeting used before noon","hint":"demo card — real masks teach real words","example":"Good morning! How are you?","tags":["demo"]}]\n```',
  'Nice. One correction: the verb should agree with the subject. Otherwise perfect.\n\nQuestion for you: what is your favourite food, and why?\n\n```cards\n[{"front":"favourite food","back":"the dish you like most","hint":"demo card","example":"My favourite food is noodles.","tags":["demo"]}]\n```',
  'Lovely. That is enough for today — the cards are in your deck. Review them tomorrow and I will quiz you.\n\n```cards\n[]\n```',
];

function pick(maskId: string, turn: number): string {
  const script = SCRIPTS[maskId] ?? GENERIC;
  return script[Math.min(turn, script.length - 1)];
}

export const demoProvider: ProviderDef = {
  id: 'demo',
  label: 'Demo (no key)',
  needsKey: false,
  models: ['scripted'],
  defaultModel: 'scripted',
  async *stream({ messages, maskId, signal }) {
    // The greeting is stored as an assistant message, so skip it when counting turns.
    const turn = Math.max(0, messages.filter((m) => m.role === 'assistant').length - 1);
    const text = pick(maskId ?? '', turn);
    // Stream in small chunks so the UI shows the real streaming path.
    const chunks = text.match(/\S+\s*|\s+/g) ?? [text];
    for (const c of chunks) {
      if (signal.aborted) return;
      await new Promise((r) => setTimeout(r, 18 + Math.random() * 30));
      yield c;
    }
  },
};
