"""The French grammar curriculum: one rule per chapter, in teaching order.

Same shape as grammar_es.py (see its docstring for every field). The text is the Louis Segond
1910, which tells the story in the passé simple (il dit, il répondit, il fut) and often says
"ne ... point" where modern French says "ne ... pas". Apostrophes in the text are ’ (l’homme),
so elided words (l’, d’, n’, qu’) stay part of the next word and are never used as examples.
"""
from app.grammar_es import options

# Endings that suggest the next word is a verb, so "le" / "la" / "les" before it is a pronoun
# (il le dit, ils la virent) and "leur" before it means "to them" (Jésus leur dit).
VERB_ENDINGS = ("ait", "aient", "èrent", "irent", "urent", "it", "ez", "ons", "ent", "ra", "rai")

# Subject words after which le / la / les is an object pronoun, not "the".
PRONOUN_PREV = ("je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles", "ne", "se", "me", "te")


def match_passe_simple(word, known):
    """
    parla, répondit, fut -> their plural (parlèrent, répondirent, furent) and back again.
    The other form must appear somewhere in the Bible text (`known`), which rules out guesses.
    """
    plural = {"èrent": "a", "irent": "it", "urent": "ut"}
    for p_end, s_end in plural.items():
        if word.endswith(p_end) and len(word) >= len(p_end) + 2:
            single = word[: -len(p_end)] + s_end
            return ("the “they” ending (-èrent / -irent / -urent)", [single]) if single in known else None
    for p_end, s_end in plural.items():
        if word.endswith(s_end) and len(word) >= len(s_end) + 3:
            many = word[: -len(s_end)] + p_end
            return ("the “one person” ending (-a / -it / -ut)", [many]) if many in known else None
    return None


RULES = [
    {
        "id": "articles_definite",
        "title": "Saying “the”: le, la, les",
        "cards": [
            {"title": "Every noun has a gender",
             "body": "French nouns are masculine or feminine, and the word for “the” changes to match. "
                     "Masculine nouns take le, feminine nouns take la. Before a vowel both become l’ (l’homme).",
             "examples": [("le monde", "the world"), ("le Fils", "the Son"),
                          ("la lumière", "the light"), ("la vie", "the life")]},
            {"title": "More than one: les",
             "body": "In the plural there is only one word for “the”: les, for masculine and feminine nouns alike.",
             "examples": [("les hommes", "the men"), ("les ténèbres", "the darkness"),
                          ("les disciples", "the disciples")]},
        ],
        "checks": [
            {"question": "Lumière (light) is feminine. Which word for “the” goes with it?",
             "answer": "la", "distractors": ["le", "les"]},
            {"question": "“the men” is ___ hommes", "answer": "les", "distractors": ["le", "la"]},
        ],
        "forms": options({
            "le": "masculine and singular | la, les",
            "la": "feminine and singular | le, les",
            "les": "plural | le, la",
        }),
        "skip_next": ("quel", "quelle", "quels", "quelles"),  # lequel, laquelle: "which"
        "pronoun_forms": ("le", "la", "les"),
        "pronoun_prev": PRONOUN_PREV,
        "example": "“{word}” is {note}, to match “{next}”.",
        "fill": "Choose the right word for “the”",
        "find": "Which word in this verse means “the”?",
        "summary": "le (masculine), la (feminine), les (plural), l’ before a vowel.",
    },
    {
        "id": "articles_indefinite",
        "title": "Saying “a”: un, une",
        "cards": [
            {"title": "“a” matches the noun too",
             "body": "Use un before a masculine noun and une before a feminine noun.",
             "examples": [("un homme", "a man"), ("une voix", "a voice"), ("une femme", "a woman")]},
            {"title": "Some: des",
             "body": "In the plural, “some” is des: des hommes (some men), des femmes (some women).",
             "examples": [("des disciples", "some disciples")]},
        ],
        "checks": [
            {"question": "Femme (woman) is feminine. “a woman” is…", "answer": "une femme",
             "distractors": ["un femme", "des femme"]},
            {"question": "“a man” is ___ homme", "answer": "un", "distractors": ["une"]},
        ],
        "forms": options({
            "un": "masculine | une",
            "une": "feminine | un",
        }),
        "example": "“{word}” is {note}, to match “{next}”.",
        "fill": "un or une?",
        "find": "Which word in this verse means “a”?",
        "summary": "un for masculine nouns, une for feminine nouns, des for “some”.",
    },
    {
        "id": "etre_present",
        "title": "To be: être",
        "cards": [
            {"title": "être means “to be”",
             "body": "It is the most used verb in French, and it is irregular: every person has its own form.",
             "examples": [("je suis", "I am"), ("tu es", "you are"), ("il est", "he is")]},
            {"title": "The plural forms",
             "body": "Vous êtes is also the polite way to say “you are” to one person.",
             "examples": [("nous sommes", "we are"), ("vous êtes", "you (all) are"), ("ils sont", "they are")]},
            {"title": "C’est",
             "body": "Ce + est becomes c’est: “it is” or “this is”. You will see it everywhere.",
             "examples": [("c’est moi", "it is I"), ("Je suis la lumière du monde", "I am the light of the world")]},
        ],
        "checks": [
            {"question": "“we are” is…", "answer": "nous sommes", "distractors": ["nous sont", "nous êtes"]},
            {"question": "Which form goes with ils (they)?", "answer": "sont", "distractors": ["est", "sommes"]},
        ],
        "forms": options({
            "suis": "“I am” | es, est",
            "es": "“you are” | suis, est",
            "est": "“he / she / it is” | sont, es",
            "sommes": "“we are” | sont, êtes",
            "êtes": "“you (all) are” | sont, sommes",
            "sont": "“they are” | est, sommes",
        }),
        "example": "“{word}” is être and means {note}.",
        "fill": "Choose the right form of être",
        "find": "Which word in this verse is a form of être (to be)?",
        "summary": "je suis, tu es, il est, nous sommes, vous êtes, ils sont.",
    },
    {
        "id": "avoir_present",
        "title": "To have: avoir",
        "cards": [
            {"title": "avoir means “to have”",
             "body": "Like être, avoir changes for every person.",
             "examples": [("j’ai", "I have"), ("tu as", "you have"), ("il a", "he has")]},
            {"title": "a or à?",
             "body": "a (no accent) is “has”. à (with an accent) is a small word meaning “to” or “at”. "
                     "Il a un fils: he has a son. Il va à Jérusalem: he goes to Jerusalem.",
             "examples": [("nous avons", "we have"), ("vous avez", "you (all) have"), ("ils ont", "they have")]},
        ],
        "checks": [
            {"question": "“he has” is il ___", "answer": "a", "distractors": ["à", "ont"]},
            {"question": "“they have” is…", "answer": "ils ont", "distractors": ["ils sont", "ils a"]},
        ],
        "forms": options({
            "ai": "“I have” | as, a",
            "as": "“you have” | ai, a",
            "a": "“he / she / it has” (no accent) | à, ont",
            "avons": "“we have” | avez, ont",
            "avez": "“you (all) have” | avons, ont",
            "ont": "“they have” | a, sont",
        }),
        "example": "“{word}” is avoir and means {note}.",
        "fill": "Choose the right form of avoir",
        "find": "Which word in this verse is a form of avoir (to have)?",
        "summary": "j’ai, tu as, il a, nous avons, vous avez, ils ont. a = has, à = to / at.",
    },
    {
        "id": "contractions",
        "title": "au, aux, du, des",
        "cards": [
            {"title": "à and de join with le and les",
             "body": "à + le becomes au, à + les becomes aux. de + le becomes du, de + les becomes des. "
                     "With la and l’ nothing joins: à la, de la, à l’, de l’.",
             "examples": [("au commencement", "in the beginning"), ("du ciel", "from heaven"),
                          ("aux disciples", "to the disciples"), ("de la lumière", "of the light")]},
        ],
        "checks": [
            {"question": "de + le becomes…", "answer": "du", "distractors": ["de le", "des"]},
            {"question": "“to the disciples” is ___ disciples", "answer": "aux", "distractors": ["à les", "au"]},
        ],
        "forms": options({
            "du": "de + le (“of / from the”) | de le, de la",
            "au": "à + le (“to / at / in the”) | à le, à la",
            "aux": "à + les (“to the”, plural) | à les, au",
        }),
        "skip_next": ("quel", "quels"),  # auquel, duquel are written as one word anyway
        "example": "“{word}” is {note}, before “{next}”.",
        "fill": "Choose the right combined form",
        "find": "Which word in this verse is à or de joined with “the”?",
        "summary": "à + le = au, à + les = aux, de + le = du, de + les = des.",
    },
    {
        "id": "possessives",
        "title": "my, your, his: mon, ton, son",
        "cards": [
            {"title": "They match the thing owned",
             "body": "mon / ma / mes (my), ton / ta / tes (your), son / sa / ses (his or her). "
                     "Masculine things take mon, feminine take ma, plural take mes.",
             "examples": [("mon Père", "my Father"), ("sa mère", "his mother"), ("ses disciples", "his disciples")]},
            {"title": "His or her? Same word",
             "body": "son, sa, ses agree with the thing, not the owner: sa mère is “his mother” or “her mother”. "
                     "notre / nos (our) and votre / vos (your) only change for plural.",
             "examples": [("notre Père", "our Father"), ("vos péchés", "your sins")]},
        ],
        "checks": [
            {"question": "“his disciples” is ___ disciples", "answer": "ses", "distractors": ["son", "sa"]},
            {"question": "sa mère can mean…", "answer": "his mother or her mother",
             "distractors": ["only her mother", "their mother"]},
        ],
        "forms": options({
            "mon": "“my”, masculine | ma, mes",
            "ma": "“my”, feminine | mon, mes",
            "mes": "“my”, plural | mon, ma",
            "ton": "“your”, masculine | ta, tes",
            "ta": "“your”, feminine | ton, tes",
            "tes": "“your”, plural | ton, ta",
            "son": "“his / her”, masculine | sa, ses",
            "sa": "“his / her”, feminine | son, ses",
            "ses": "“his / her”, plural | son, sa",
            "notre": "“our”, one thing | nos, votre",
            "nos": "“our”, plural | notre, vos",
            "votre": "“your”, one thing | vos, notre",
            "vos": "“your”, plural | votre, nos",
        }),
        "example": "“{word}” means {note}: “{next}”.",
        "fill": "Choose the right word for “my / your / his”",
        "find": "Which word in this verse means my, your, his or our?",
        "summary": "mon / ma / mes, ton / ta / tes, son / sa / ses, notre / nos, votre / vos.",
    },
    {
        "id": "demonstratives",
        "title": "this, these: ce, cette, ces",
        "cards": [
            {"title": "“this” and “that”",
             "body": "ce goes with masculine nouns, cette with feminine nouns, ces with plural nouns. "
                     "Before a masculine noun starting with a vowel, ce becomes cet (cet homme).",
             "examples": [("ce monde", "this world"), ("cette parole", "this word"),
                          ("ces choses", "these things"), ("cet homme", "this man")]},
        ],
        "checks": [
            {"question": "Parole (word) is feminine. “this word” is…", "answer": "cette parole",
             "distractors": ["ce parole", "ces parole"]},
            {"question": "“these things” is ___ choses", "answer": "ces", "distractors": ["ce", "cette"]},
        ],
        "forms": options({
            "ce": "masculine | cette, ces",
            "cet": "masculine, before a vowel | ce, cette",
            "cette": "feminine | ce, ces",
            "ces": "plural | ce, cette",
        }),
        "skip_next": ("qui", "que", "qu’il", "qu’ils", "dont"),  # ce qui, ce que: "what"
        "example": "“{word}” is {note}, to match “{next}”.",
        "fill": "ce, cette or ces?",
        "find": "Which word in this verse means “this” or “these”?",
        "summary": "ce (masculine), cet (before a vowel), cette (feminine), ces (plural).",
    },
    {
        "id": "negation",
        "title": "Saying no: ne … point, rien, jamais",
        "cards": [
            {"title": "Two words around the verb",
             "body": "French puts ne before the verb and a second word after it. Modern French says ne … pas; "
                     "this Bible often says ne … point. Both mean “not”.",
             "examples": [("il ne vint point", "he did not come"), ("ne craignez pas", "do not be afraid")]},
            {"title": "rien, jamais",
             "body": "Swap the second word to change the meaning: ne … rien (nothing), ne … jamais (never). "
                     "Before a vowel, ne becomes n’.",
             "examples": [("il ne dit rien", "he said nothing"), ("je n’ai jamais", "I have never")]},
        ],
        "checks": [
            {"question": "Which word goes before the verb in a negative?", "answer": "ne",
             "distractors": ["pas", "point"]},
            {"question": "“nothing” is ne … ___", "answer": "rien", "distractors": ["jamais", "point"]},
        ],
        "forms": options({
            "ne": "the first half of “not”, before the verb | pas, rien",
            "rien": "“nothing” | jamais, point",
            "jamais": "“never” | rien, point",
        }),
        "example": "“{word}” is {note}.",
        "fill": "Choose the right negative word",
        "find": "Which word in this verse helps make it negative?",
        "summary": "ne … pas / point = not, ne … rien = nothing, ne … jamais = never.",
    },
    {
        "id": "dire",
        "title": "To say: dire",
        "cards": [
            {"title": "dire is everywhere in the Gospels",
             "body": "Je dis (I say), il dit (he says, and also “he said”), ils disent (they say).",
             "examples": [("je vous dis", "I tell you"), ("Jésus lui dit", "Jesus said to him")]},
            {"title": "Past forms",
             "body": "ils dirent means “they said”. il disait means “he was saying” or “he used to say”.",
             "examples": [("ils dirent", "they said"), ("il disait", "he was saying")]},
        ],
        "checks": [
            {"question": "“they said” is…", "answer": "ils dirent", "distractors": ["ils dit", "ils disent"]},
            {"question": "“I say” is je ___", "answer": "dis", "distractors": ["dit", "disent"]},
        ],
        "forms": options({
            "dis": "“I say” or “you say” | dit, disent",
            "dit": "“he says” or “he said” | dis, dirent",
            "disent": "“they say” | dit, dirent",
            "dirent": "“they said” | dit, disent",
            "disait": "“he was saying” | disaient, dit",
            "disaient": "“they were saying” | disait, dirent",
        }),
        "example": "“{word}” means {note}.",
        "fill": "Choose the right form of dire",
        "find": "Which word in this verse is a form of dire (to say)?",
        "summary": "je dis, il dit, ils disent; ils dirent (they said); il disait (he was saying).",
    },
    {
        "id": "etait_fut",
        "title": "Was: était or fut?",
        "cards": [
            {"title": "Two past tenses",
             "body": "était describes the background: how things were, over time. "
                     "fut marks one event that happened. Fut is the passé simple, used for telling stories.",
             "examples": [("Au commencement était la Parole", "In the beginning was the Word"),
                          ("Il fut baptisé", "He was baptized")]},
        ],
        "checks": [
            {"question": "Describing the background in the past uses…", "answer": "était", "distractors": ["fut"]},
            {"question": "“they were” (background) is…", "answer": "ils étaient", "distractors": ["ils furent", "ils sont"]},
        ],
        "forms": options({
            "était": "the background past (“was”) | fut, est",
            "étaient": "the background past (“were”) | furent, sont",
            "fut": "one event in the past (“was”) | était, est",
            "furent": "one event in the past (“were”) | étaient, sont",
        }),
        "example": "“{word}” is {note}.",
        "fill": "était or fut?",
        "find": "Which word in this verse is a past form of être?",
        "summary": "était / étaient = background. fut / furent = one event.",
    },
    {
        "id": "passe_simple",
        "title": "Storytelling past: il parla, ils parlèrent",
        "cards": [
            {"title": "One person did it",
             "body": "The Gospels tell the story in the passé simple. For one person it ends in -a (parla), "
                     "-it (répondit) or -ut (fut).",
             "examples": [("il parla", "he spoke"), ("il répondit", "he answered"), ("il prit", "he took")]},
            {"title": "They did it",
             "body": "For “they”: -a becomes -èrent, -it becomes -irent, -ut becomes -urent.",
             "examples": [("ils parlèrent", "they spoke"), ("ils répondirent", "they answered"),
                          ("ils furent", "they were")]},
        ],
        "checks": [
            {"question": "“he answered” is il ___", "answer": "répondit", "distractors": ["répondirent", "répond"]},
            {"question": "Which ending means “they” did it?", "answer": "-èrent / -irent",
             "distractors": ["-a / -it", "-ons"]},
        ],
        "match": match_passe_simple,
        "example": "“{word}” has {note}.",
        "fill": "One person or “they”? Choose the right ending",
        "find": "Which word in this verse is a storytelling past (-a, -it, -èrent, -irent)?",
        "summary": "-a / -it / -ut: one person did it. -èrent / -irent / -urent: they did it.",
    },
    {
        "id": "lui_leur",
        "title": "to him, to them: lui, leur",
        "cards": [
            {"title": "They go before the verb",
             "body": "lui means “to him” or “to her”, leur means “to them”. Both come before the verb.",
             "examples": [("Jésus lui dit", "Jesus said to him"), ("il leur répondit", "he answered them")]},
            {"title": "leur or leur?",
             "body": "Before a verb, leur means “to them”. Before a noun, leur means “their” (leur père, their father).",
             "examples": [("il leur parla", "he spoke to them"), ("leur père", "their father")]},
        ],
        "checks": [
            {"question": "“he said to them” is il ___ dit", "answer": "leur", "distractors": ["lui", "les"]},
            {"question": "“Jesus said to him” is Jésus ___ dit", "answer": "lui", "distractors": ["leur", "le"]},
        ],
        "forms": options({
            "lui": "“to him / to her” | leur, le",
            "leur": "“to them” | lui, les",
        }),
        "verb_next_forms": ("lui", "leur"),  # only before a verb (leur père means "their father")
        "example": "“{word}” means {note}, placed before “{next}”.",
        "fill": "lui or leur?",
        "find": "Which word in this verse means “to him” or “to them”?",
        "summary": "lui = to him / to her, leur = to them, both before the verb.",
    },
]
