"""The Spanish grammar curriculum: one rule per chapter, in teaching order.

`generate_lessons.py` turns each rule into a lesson: teach cards from here, then questions
built from the chapter's own verses (the rule's word is blanked, and the wrong options are
other forms from `forms`).

Each rule has:
  id, title      short name, shown on the cards
  cards          explanation cards: {title, body, examples: [(spanish, english), ...]}
  checks         quick concept questions: {question, answer, distractors}
  forms          word -> (note, wrong options). A word in a verse that is in `forms` is an
                 example of the rule. `match(word, known_words)` can be used instead for patterns.
  example        how the "in this chapter" card explains a found word. Fields: {word} {note} {next}
  fill, find     instructions for the fill-in-the-blank and "find the word" questions
  summary        the reminder shown above the later questions
  skip_next      words that, right after a form, mean it is not an example (el cual, la que: "which")
  pronoun_forms  forms that can also be object pronouns; skipped after a word in `pronoun_prev`
                 or before a word ending like a verb (VERB_ENDINGS), so the example notes stay correct
  verb_next_forms  forms that only count right before a verb (French "leur" = "to them")
  needs_next     True when a form only counts if a word follows it

Each language's file (grammar_es, grammar_fr, grammar_en) has RULES and VERB_ENDINGS.

The text is the Reina-Valera 1909, which uses older spellings (á for a, fué for fue), so the
forms list those spellings too.
"""

# Endings that suggest the next word is a verb, so "la"/"los"/"las" before it is a pronoun.
VERB_ENDINGS = ("ron", "ó", "ba", "ban", "ía", "ían", "mos", "é", "rá", "án")

def match_preterite(word, known):
    """
    habló, respondió, hablaron, respondieron -> (note, wrong options), else None.
    The other form must appear somewhere in the Bible text (`known`), which rules out guesses
    like hició (hicieron is irregular) and envieron (envió comes from enviar, so enviaron).
    """
    if word.endswith("ieron") or word.endswith("aron"):
        stem = word[:-5] if word.endswith("ieron") else word[:-4]
        singular = [f for f in (stem + "ió", stem + "ó") if f in known]
        return ("the “they” ending (-aron / -ieron)", singular[:1]) if singular and len(word) >= 7 else None
    if word.endswith("ó") and len(word) >= 5:
        plural = [f for f in (word[:-2] + "ieron", word[:-1] + "aron") if f in known]
        return ("the “one person” ending (-ó / -ió)", plural[:1]) if plural else None
    return None


def options(table):
    """{word: (note, [wrong, ...])} written compactly as {word: "note | wrong, wrong"}."""
    out = {}
    for word, spec in table.items():
        note, wrong = spec.split(" | ")
        out[word] = (note, [w.strip() for w in wrong.split(",")])
    return out


RULES = [
    {
        "id": "articles_definite",
        "title": "Saying “the”: el, la, los, las",
        "cards": [
            {"title": "Every noun has a gender",
             "body": "Spanish nouns are masculine or feminine, and the word for “the” changes to match. "
                     "Masculine nouns take el, feminine nouns take la.",
             "examples": [("el mundo", "the world"), ("el principio", "the beginning"),
                          ("la luz", "the light"), ("la vida", "the life")]},
            {"title": "More than one: los and las",
             "body": "For plural nouns, el becomes los and la becomes las.",
             "examples": [("los hombres", "the men"), ("las tinieblas", "the darkness"),
                          ("las cosas", "the things")]},
        ],
        "checks": [
            {"question": "Luz (light) is feminine. Which word for “the” goes with it?",
             "answer": "la", "distractors": ["el", "los", "las"]},
            {"question": "“the men” is ___ hombres", "answer": "los", "distractors": ["las", "el", "la"]},
        ],
        "forms": options({
            "el": "masculine and singular | la, los, las",
            "la": "feminine and singular | el, los, las",
            "los": "masculine and plural | las, el, la",
            "las": "feminine and plural | los, la, el",
        }),
        "skip_next": ("cual", "cuales", "que"),  # el cual, la que: "which", "the one who"
        "pronoun_forms": ("la", "los", "las"),
        "pronoun_prev": ("no", "se", "me", "te", "nos", "le", "les"),
        "example": "“{word}” is {note}, to match “{next}”.",
        "fill": "Choose the right word for “the”",
        "find": "Which word in this verse means “the”?",
        "summary": "el (masculine), la (feminine), los (masculine plural), las (feminine plural).",
    },
    {
        "id": "articles_indefinite",
        "title": "Saying “a”: un, una",
        "cards": [
            {"title": "“a” or “an” matches the noun too",
             "body": "Use un before a masculine noun and una before a feminine noun.",
             "examples": [("un hombre", "a man"), ("una voz", "a voice"), ("una mujer", "a woman")]},
            {"title": "Plural: unos, unas",
             "body": "In the plural they mean “some”: unos for masculine nouns, unas for feminine nouns.",
             "examples": [("unos días", "some days"), ("unas mujeres", "some women")]},
        ],
        "checks": [
            {"question": "Mujer (woman) is feminine. “a woman” is…", "answer": "una mujer",
             "distractors": ["un mujer", "unos mujer"]},
            {"question": "“a man” is ___ hombre", "answer": "un", "distractors": ["una", "unos", "unas"]},
        ],
        "forms": options({
            "un": "masculine and singular | una, unos, unas",
            "una": "feminine and singular | un, unos, unas",
            "unos": "masculine and plural (“some”) | unas, un, una",
            "unas": "feminine and plural (“some”) | unos, una, un",
        }),
        "example": "“{word}” is {note}, to match “{next}”.",
        "fill": "Choose the right word for “a”",
        "find": "Which word in this verse means “a” (or “some”)?",
        "summary": "un (masculine), una (feminine); unos and unas mean “some”.",
    },
    {
        "id": "ser_present",
        "title": "To be: ser",
        "cards": [
            {"title": "ser means “to be”",
             "body": "Ser says what someone or something is: who they are, where they come from, what they are like. "
                     "Each person has its own form.",
             "examples": [("yo soy", "I am"), ("tú eres", "you are"), ("él es", "he is")]},
            {"title": "The plural forms",
             "body": "Vosotros (you all) is used in Spain and throughout this Bible.",
             "examples": [("nosotros somos", "we are"), ("vosotros sois", "you all are"),
                          ("ellos son", "they are")]},
            {"title": "The pronoun is optional",
             "body": "Each form already shows who is meant, so Spanish often leaves out yo, tú or él. "
                     "“Soy” on its own means “I am”.",
             "examples": [("Yo soy la luz del mundo", "I am the light of the world")]},
        ],
        "checks": [
            {"question": "“we are” is…", "answer": "somos", "distractors": ["son", "sois", "es"]},
            {"question": "Which form goes with ellos (they)?", "answer": "son", "distractors": ["es", "somos", "soy"]},
        ],
        "forms": options({
            "soy": "“I am” | eres, es, somos",
            "eres": "“you are” | soy, es, sois",
            "es": "“he / she / it is” | son, soy, eres",
            "somos": "“we are” | son, sois, soy",
            "sois": "“you all are” | son, somos, eres",
            "son": "“they are” | es, somos, sois",
        }),
        "example": "“{word}” is ser and means {note}.",
        "fill": "Choose the right form of ser",
        "find": "Which word in this verse is a form of ser (to be)?",
        "summary": "soy, eres, es, somos, sois, son: I am, you are, he is, we are, you all are, they are.",
    },
    {
        "id": "contractions",
        "title": "al and del",
        "cards": [
            {"title": "a + el = al, de + el = del",
             "body": "When a (to) or de (of, from) comes right before el, the two words join into one. "
                     "With la, los and las they stay apart.",
             "examples": [("del mundo", "of the world"), ("al Padre", "to the Father"),
                          ("de la luz", "of the light")]},
            {"title": "An older spelling",
             "body": "This Bible (1909) writes the little word a with an accent: “á todo hombre” (to every man). "
                     "Modern Spanish writes a. The meaning is the same.",
             "examples": [("á todo hombre", "to every man")]},
        ],
        "checks": [
            {"question": "de + el becomes…", "answer": "del", "distractors": ["de el", "al", "dela"]},
            {"question": "“to the world” is…", "answer": "al mundo", "distractors": ["a el mundo", "a la mundo", "del mundo"]},
        ],
        "forms": options({
            "del": "de + el (“of / from the”) | de el, al, de la",
            "al": "a + el (“to the”) | a el, del, a la",
        }),
        "skip_next": ("cual", "cuales", "que"),  # del cual / al que, where el is not "the" before a noun
        "example": "“{word}” is {note}, before “{next}”.",
        "fill": "Choose the right combined form",
        "find": "Which word in this verse is a + el or de + el joined together?",
        "summary": "a + el = al, de + el = del. With la, los, las nothing joins.",
    },
    {
        "id": "possessives",
        "title": "my, your, his: mi, tu, su",
        "cards": [
            {"title": "Words for “my”, “your”, “his”",
             "body": "mi means my, tu means your, su means his, her, its or their.",
             "examples": [("mi Padre", "my Father"), ("tu palabra", "your word"), ("su nombre", "his name")]},
            {"title": "They add -s for plural nouns",
             "body": "The word matches the thing owned, not the owner: one thing takes mi / tu / su, "
                     "several things take mis / tus / sus. Nuestro (our) also changes for gender.",
             "examples": [("mis discípulos", "my disciples"), ("sus obras", "his works"),
                          ("nuestro Padre", "our Father")]},
        ],
        "checks": [
            {"question": "“my disciples” is ___ discípulos", "answer": "mis", "distractors": ["mi", "sus", "tu"]},
            {"question": "su nombre can mean…", "answer": "his, her or their name",
             "distractors": ["only his name", "my name", "our name"]},
        ],
        "forms": options({
            "mi": "“my”, for one thing | mis, su, tu",
            "mis": "“my”, for more than one | mi, sus, tus",
            "tu": "“your”, for one thing | tus, mi, su",
            "tus": "“your”, for more than one | tu, mis, sus",
            "su": "“his / her / their”, for one thing | sus, mi, tu",
            "sus": "“his / her / their”, for more than one | su, mis, tus",
            "nuestro": "“our”, masculine | nuestra, nuestros, su",
            "nuestra": "“our”, feminine | nuestro, nuestras, su",
            "nuestros": "“our”, masculine plural | nuestras, nuestro, sus",
            "nuestras": "“our”, feminine plural | nuestros, nuestra, sus",
        }),
        "example": "“{word}” means {note}: “{next}”.",
        "fill": "Choose the right word for “my / your / his”",
        "find": "Which word in this verse means my, your, his or our?",
        "summary": "mi / tu / su for one thing, mis / tus / sus for more. nuestro changes like an adjective.",
    },
    {
        "id": "por_para",
        "title": "Two words for “for”: por and para",
        "cards": [
            {"title": "para points to a goal",
             "body": "Use para for a purpose, a destination, or who something is for. "
                     "para que means “so that”.",
             "examples": [("para que todos creyesen", "so that all might believe"),
                          ("para vosotros", "for you all")]},
            {"title": "por looks at the path or the cause",
             "body": "Use por for through, by, because of, or in exchange for.",
             "examples": [("por él", "through him"), ("fué hecho por él", "was made by him")]},
        ],
        "checks": [
            {"question": "“so that” is…", "answer": "para que", "distractors": ["por que", "por"]},
            {"question": "“the world was made ___ him (by him)”", "answer": "por", "distractors": ["para"]},
        ],
        "forms": options({
            "por": "por: through, by or because of | para",
            "para": "para: a purpose or goal | por",
        }),
        "example": "Here it is {note}.",
        "fill": "por or para?",
        "find": "Which word in this verse is por or para?",
        "summary": "para = purpose, goal, “so that”. por = through, by, because of.",
    },
    {
        "id": "ser_estar",
        "title": "ser or estar?",
        "cards": [
            {"title": "Two verbs for “to be”",
             "body": "ser says what something is: identity and nature. "
                     "estar says where something is, or how it is right now.",
             "examples": [("Dios es amor", "God is love"), ("En el mundo estaba", "He was in the world")]},
            {"title": "The forms of estar",
             "body": "estar has its own set of forms. In the past, era (ser) pairs with estaba (estar).",
             "examples": [("estoy", "I am"), ("está", "he / she is"), ("están", "they are"),
                          ("estaba", "he / she was")]},
        ],
        "checks": [
            {"question": "To say where someone is, use…", "answer": "estar", "distractors": ["ser"]},
            {"question": "“He is in the house”: Él ___ en la casa", "answer": "está", "distractors": ["es"]},
        ],
        "forms": options({
            "es": "ser: what it is | está",
            "está": "estar: where or how it is | es",
            "son": "ser: what they are | están",
            "están": "estar: where or how they are | son",
            "era": "ser, in the past | estaba",
            "estaba": "estar, in the past | era",
            "eran": "ser, in the past | estaban",
            "estaban": "estar, in the past | eran",
            "soy": "ser: what I am | estoy",
            "estoy": "estar: where or how I am | soy",
        }),
        "example": "“{word}” is {note}.",
        "fill": "ser or estar?",
        "find": "Which word in this verse is a form of ser or estar?",
        "summary": "ser = what something is. estar = where it is, or how it is right now.",
    },
    {
        "id": "era_fue",
        "title": "Was: era or fué?",
        "cards": [
            {"title": "Two past tenses",
             "body": "era describes the background: how things were, over time. "
                     "fué marks one event that happened.",
             "examples": [("En el principio era el Verbo", "In the beginning was the Word"),
                          ("Fué un hombre enviado de Dios", "There was a man sent from God")]},
            {"title": "fué also means “went”",
             "body": "ser (to be) and ir (to go) share the same past forms, so fué can mean “was” or “went”. "
                     "Modern Spanish writes it fue, without the accent.",
             "examples": [("fueron", "they were / they went"), ("eran", "they were (background)")]},
        ],
        "checks": [
            {"question": "Describing the background in the past uses…", "answer": "era", "distractors": ["fué"]},
            {"question": "fué can mean…", "answer": "was or went", "distractors": ["is or goes", "will be"]},
        ],
        "forms": options({
            "era": "the background past (“was”) | fué, es",
            "eran": "the background past (“were”) | fueron, son",
            "fué": "one event in the past (“was / went”) | era, es",
            "fue": "one event in the past (“was / went”) | era, es",
            "fueron": "one event in the past (“were / went”) | eran, son",
        }),
        "example": "“{word}” is {note}.",
        "fill": "era or fué?",
        "find": "Which word in this verse is a past form of ser (or ir)?",
        "summary": "era / eran = background. fué / fueron = one event (and also “went”).",
    },
    {
        "id": "decir",
        "title": "To say: decir",
        "cards": [
            {"title": "decir is everywhere in the Gospels",
             "body": "It is irregular: the stem changes from dec- to dic- in the present.",
             "examples": [("digo", "I say"), ("dice", "he / she says"), ("dicen", "they say")]},
            {"title": "Said: dijo, dijeron",
             "body": "In the past the stem becomes dij-. Watch for dijo: it starts most conversations.",
             "examples": [("dije", "I said"), ("dijo", "he / she said"), ("dijeron", "they said")]},
        ],
        "checks": [
            {"question": "“they said” is…", "answer": "dijeron", "distractors": ["dijo", "dicen", "dice"]},
            {"question": "“I say” is…", "answer": "digo", "distractors": ["dice", "dije", "dicen"]},
        ],
        "forms": options({
            "dijo": "“he / she said” | dijeron, dice",
            "dijeron": "“they said” | dijo, dicen",
            "dice": "“he / she says” | dicen, dijo",
            "dicen": "“they say” | dice, dijeron",
            "digo": "“I say” | dice, dije",
            "dije": "“I said” | dijo, digo",
        }),
        "example": "“{word}” means {note}.",
        "fill": "Choose the right form of decir",
        "find": "Which word in this verse is a form of decir (to say)?",
        "summary": "digo, dice, dicen (say) and dije, dijo, dijeron (said).",
    },
    {
        "id": "preterite",
        "title": "Past actions: -ó and -aron",
        "cards": [
            {"title": "He did it: -ó, -ió",
             "body": "A finished action by one person ends in -ó for -ar verbs and -ió for -er and -ir verbs.",
             "examples": [("habló", "he spoke"), ("respondió", "he answered"), ("conoció", "he knew")]},
            {"title": "They did it: -aron, -ieron",
             "body": "For “they”, -ó becomes -aron and -ió becomes -ieron.",
             "examples": [("hablaron", "they spoke"), ("respondieron", "they answered"),
                          ("recibieron", "they received")]},
        ],
        "checks": [
            {"question": "“he answered” is…", "answer": "respondió", "distractors": ["respondieron", "responde"]},
            {"question": "Which ending means “they” did it?", "answer": "-aron / -ieron",
             "distractors": ["-ó / -ió", "-amos"]},
        ],
        "match": match_preterite,
        "example": "“{word}” has {note}.",
        "fill": "One person or “they”? Choose the right ending",
        "find": "Which word in this verse is a past action (-ó, -ió, -aron, -ieron)?",
        "summary": "-ó / -ió: one person did it. -aron / -ieron: they did it.",
    },
    {
        "id": "object_pronouns",
        "title": "him, them, me: le, les, me",
        "cards": [
            {"title": "They go before the verb",
             "body": "The words for “him”, “them” and “me” come before the verb, not after it as in English.",
             "examples": [("no le conoció", "did not know him"), ("le recibieron", "received him"),
                          ("me envió", "sent me")]},
            {"title": "Sometimes stuck to the verb",
             "body": "This Bible often joins the pronoun to the end of the verb: dióles means les dió (he gave them). "
                     "Modern Spanish usually puts it in front.",
             "examples": [("díjole", "he said to him"), ("dióles", "he gave them")]},
        ],
        "checks": [
            {"question": "“they received him” is…", "answer": "le recibieron",
             "distractors": ["recibieron le", "recibieron él"]},
            {"question": "“to them” is…", "answer": "les", "distractors": ["le", "me"]},
        ],
        "forms": options({
            "le": "“him / to him” | les, me",
            "les": "“them / to them” | le, nos",
            "me": "“me” | te, le",
            "te": "“you” | me, le",
            "nos": "“us” | me, les",
            "os": "“you all” | nos, les",
        }),
        "needs_next": True,
        "example": "“{word}” means {note}, placed before “{next}”.",
        "fill": "Choose the right pronoun",
        "find": "Which word in this verse means him, them, me, you or us?",
        "summary": "le (him), les (them), me, te, nos, os: placed before the verb.",
    },
    {
        "id": "negatives",
        "title": "Saying no: no, nada, nadie",
        "cards": [
            {"title": "no goes before the verb",
             "body": "To make a sentence negative, put no right before the verb.",
             "examples": [("no le conoció", "did not know him"), ("No era él la luz", "He was not the light")]},
            {"title": "Double negatives are normal",
             "body": "Spanish keeps no even with nada (nothing), nadie (no one) and nunca (never): “no ... nada”. "
                     "When the negative word comes first, no is left out.",
             "examples": [("nadie le vió jamás", "no one has ever seen him"), ("sin él nada", "without him nothing")]},
        ],
        "checks": [
            {"question": "“did not know” is…", "answer": "no conoció", "distractors": ["conoció no", "nada conoció"]},
            {"question": "“no one” is…", "answer": "nadie", "distractors": ["nada", "nunca"]},
        ],
        "forms": options({
            "no": "“not” | ni, sí",
            "nada": "“nothing” | nadie, nunca",
            "nadie": "“no one” | nada, nunca",
            "nunca": "“never” | nada, nadie",
            "jamás": "“never (ever)” | nada, nadie",
        }),
        "example": "“{word}” means {note}.",
        "fill": "Choose the right negative word",
        "find": "Which word in this verse makes it negative?",
        "summary": "no before the verb; nada, nadie, nunca keep the no when they come after the verb.",
    },
]
