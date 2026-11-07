"""The English grammar curriculum: one rule per chapter, in teaching order.

Same shape as grammar_es.py (see its docstring for every field). The text is the World English
Bible, in modern English. Apostrophes in the text are ’ (don’t, isn’t).

English is taught in the learner's own language: for_speakers() swaps the teaching text below
for the Spanish or French text in grammar_en_i18n.py. The English text here is the source.
"""
from types import SimpleNamespace

from app.grammar_en_i18n import TEXT, UI
from app.grammar_es import options

VERB_ENDINGS = ()  # no English rule needs to tell pronouns from articles


def match_ed_past(word, known):
    """
    answered, believed -> (note, [answer, answers]) when the plain verb appears in the Bible text.
    The base is checked against `known` so adjectives like "blessed" with no matching verb are skipped.
    """
    if not word.endswith("ed") or len(word) < 6:
        return None
    for base in (word[:-2], word[:-1]):  # answered -> answer, believed -> believe
        if base in known and len(base) >= 3:
            third = base + ("es" if base.endswith(("s", "sh", "ch", "x")) else "s")
            if third in known:
                return "the -ed ending: it happened in the past", [base, third]
    return None


RULES = [
    {
        "id": "a_an",
        "title": "a or an?",
        "cards": [
            {"title": "Listen to the next sound",
             "body": "Use a before a consonant sound and an before a vowel sound (a, e, i, o, u). "
                     "It is about the sound, not the letter: an hour, a united people.",
             "examples": [("a man", ""), ("a voice", ""), ("an angel", ""), ("an hour", "")]},
        ],
        "checks": [
            {"question": "Angel starts with a vowel sound. Which word goes before it?", "answer": "an",
             "distractors": ["a"]},
            {"question": "Which is correct?", "answer": "a man", "distractors": ["an man"]},
        ],
        "forms": options({
            "a": "used before a consonant sound | an",
            "an": "used before a vowel sound | a",
        }),
        "example": "“{word}” is {note}: “{next}”.",
        "fill": "a or an?",
        "find": "Which word in this verse is a or an?",
        "summary": "a before a consonant sound, an before a vowel sound.",
    },
    {
        "id": "be_present",
        "title": "To be: am, is, are",
        "cards": [
            {"title": "One verb, three forms",
             "body": "I am. He, she and it is. You, we and they are.",
             "examples": [("I am the light of the world", ""), ("He is the Son of God", ""),
                          ("You are my friends", "")]},
        ],
        "checks": [
            {"question": "Which form goes with they?", "answer": "are", "distractors": ["is", "am"]},
            {"question": "“I ___ the good shepherd”", "answer": "am", "distractors": ["is", "are"]},
        ],
        "forms": options({
            "am": "used only with I | is, are",
            "is": "used with he, she, it or one thing | are, am",
            "are": "used with you, we, they or more than one thing | is, am",
        }),
        "example": "“{word}” is {note}.",
        "fill": "am, is or are?",
        "find": "Which word in this verse is a form of “to be”?",
        "summary": "I am; he / she / it is; you / we / they are.",
    },
    {
        "id": "pronouns",
        "title": "he or him? they or them?",
        "cards": [
            {"title": "Who does it, and to whom",
             "body": "He, they and we do the action. Him, them and us receive it.",
             "examples": [("He loved them", ""), ("They followed him", ""), ("We saw him", "")]},
            {"title": "After words like to, with, for",
             "body": "After a word like to, with, for or from, use him, them or us: with him, to them, for us.",
             "examples": [("He said to them", ""), ("They went with him", "")]},
        ],
        "checks": [
            {"question": "“Jesus said to ___” (the disciples)", "answer": "them", "distractors": ["they", "their"]},
            {"question": "Which one does the action?", "answer": "he", "distractors": ["him"]},
        ],
        "forms": options({
            "he": "the one doing the action | him, his",
            "him": "the one receiving the action | he, his",
            "they": "the ones doing the action | them, their",
            "them": "the ones receiving the action | they, their",
            "we": "us, doing the action | us, our",
            "us": "us, receiving the action | we, our",
        }),
        "example": "“{word}” is {note}.",
        "fill": "Choose the right pronoun",
        "find": "Which word in this verse is he, him, they, them, we or us?",
        "summary": "he / they / we do it; him / them / us receive it.",
    },
    {
        "id": "possessives",
        "title": "Whose? his, their, my, your",
        "cards": [
            {"title": "Words that show who owns something",
             "body": "my (I), your (you), his (he), her (she), our (we), their (they). "
                     "They go before the thing that is owned.",
             "examples": [("his disciples", ""), ("their nets", ""), ("my Father", ""), ("your faith", "")]},
        ],
        "checks": [
            {"question": "The disciples left ___ nets", "answer": "their", "distractors": ["them", "they"]},
            {"question": "“Peter and ___ brother” (Peter’s brother)", "answer": "his", "distractors": ["him", "he"]},
        ],
        "forms": options({
            "his": "“belonging to him” | him, he",
            "their": "“belonging to them” | them, they",
            "my": "“belonging to me” | me, mine",
            "our": "“belonging to us” | us, we",
            "your": "“belonging to you” | you, yours",
        }),
        "example": "“{word}” means {note}: “{next}”.",
        "fill": "Choose the right word for “whose”",
        "find": "Which word in this verse shows who owns something?",
        "summary": "my, your, his, her, our, their go before the thing owned.",
    },
    {
        "id": "this_these",
        "title": "this or these?",
        "cards": [
            {"title": "One or more",
             "body": "this goes with one thing, these with more than one.",
             "examples": [("this man", ""), ("these words", ""), ("this world", ""), ("these things", "")]},
        ],
        "checks": [
            {"question": "“___ things” (more than one)", "answer": "these", "distractors": ["this"]},
            {"question": "“___ man” (one)", "answer": "this", "distractors": ["these"]},
        ],
        "forms": options({
            "this": "for one thing | these",
            "these": "for more than one | this",
        }),
        "example": "“{word}” is {note}: “{next}”.",
        "fill": "this or these?",
        "find": "Which word in this verse is this or these?",
        "summary": "this + one thing, these + more than one.",
    },
    {
        "id": "have_has",
        "title": "have or has?",
        "cards": [
            {"title": "has for he, she, it",
             "body": "Use has with he, she, it or one thing. Use have with I, you, we and they.",
             "examples": [("He has the words of eternal life", ""), ("We have found the Messiah", "")]},
        ],
        "checks": [
            {"question": "Which form goes with he?", "answer": "has", "distractors": ["have"]},
            {"question": "“They ___ no wine”", "answer": "have", "distractors": ["has"]},
        ],
        "forms": options({
            "have": "used with I, you, we, they | has",
            "has": "used with he, she, it or one thing | have",
        }),
        "example": "“{word}” is {note}.",
        "fill": "have or has?",
        "find": "Which word in this verse is have or has?",
        "summary": "he / she / it has; I / you / we / they have.",
    },
    {
        "id": "do_does",
        "title": "do, does, don’t",
        "cards": [
            {"title": "Questions and “not”",
             "body": "English uses do to ask questions and to say “not”: Do you believe? I don’t know. "
                     "With he, she and it it becomes does and doesn’t.",
             "examples": [("Do you believe?", ""), ("I don’t know", ""), ("He doesn’t", "")]},
        ],
        "checks": [
            {"question": "Which form goes with he?", "answer": "does", "distractors": ["do"]},
            {"question": "“I ___ know him” (not)", "answer": "don’t", "distractors": ["doesn’t"]},
        ],
        "forms": options({
            "do": "used with I, you, we, they | does",
            "does": "used with he, she, it | do",
            "don’t": "“do not”, with I, you, we, they | doesn’t",
            "doesn’t": "“does not”, with he, she, it | don’t",
        }),
        "example": "“{word}” is {note}.",
        "fill": "do or does?",
        "find": "Which word in this verse is a form of do?",
        "summary": "do / don’t with I, you, we, they; does / doesn’t with he, she, it.",
    },
    {
        "id": "was_were",
        "title": "was or were?",
        "cards": [
            {"title": "The past of “to be”",
             "body": "was goes with I, he, she, it and one thing. were goes with you, we, they and more than one.",
             "examples": [("In the beginning was the Word", ""), ("They were afraid", "")]},
        ],
        "checks": [
            {"question": "“The disciples ___ afraid”", "answer": "were", "distractors": ["was"]},
            {"question": "“There ___ a man sent from God”", "answer": "was", "distractors": ["were"]},
        ],
        "forms": options({
            "was": "the past of is (one person or thing) | were",
            "were": "the past of are (more than one, or you) | was",
        }),
        "example": "“{word}” is {note}.",
        "fill": "was or were?",
        "find": "Which word in this verse is was or were?",
        "summary": "I / he / she / it was; you / we / they were.",
    },
    {
        "id": "irregular_past",
        "title": "Past tense: said, came, went",
        "cards": [
            {"title": "The story is told in the past",
             "body": "Many common verbs have their own past form instead of -ed: say becomes said, "
                     "come becomes came, go becomes went.",
             "examples": [("say → said", ""), ("come → came", ""), ("go → went", ""), ("see → saw", "")]},
            {"title": "More of them",
             "body": "give → gave, take → took, know → knew, tell → told, find → found, speak → spoke.",
             "examples": [("He took the bread", ""), ("They knew him", "")]},
        ],
        "checks": [
            {"question": "The past of “go” is…", "answer": "went", "distractors": ["goed", "goes"]},
            {"question": "The past of “say” is…", "answer": "said", "distractors": ["sayed", "says"]},
        ],
        "forms": options({
            "said": "the past of say | say, says",
            "came": "the past of come | come, comes",
            "went": "the past of go | go, goes",
            "saw": "the past of see | see, sees",
            "gave": "the past of give | give, gives",
            "took": "the past of take | take, takes",
            "knew": "the past of know | know, knows",
            "told": "the past of tell | tell, tells",
            "found": "the past of find | find, finds",
            "spoke": "the past of speak | speak, speaks",
            "sat": "the past of sit | sit, sits",
            "stood": "the past of stand | stand, stands",
        }),
        "example": "“{word}” is {note}.",
        "fill": "The story is in the past. Choose the past form",
        "find": "Which word in this verse is a past form like said, came or went?",
        "summary": "say → said, come → came, go → went, see → saw, take → took, know → knew.",
    },
    {
        "id": "ed_past",
        "title": "Past tense: -ed",
        "cards": [
            {"title": "Most verbs add -ed",
             "body": "For most verbs, the past is the verb + -ed: answer → answered, follow → followed. "
                     "If the verb ends in e, just add -d: believe → believed.",
             "examples": [("answer → answered", ""), ("follow → followed", ""), ("believe → believed", "")]},
        ],
        "checks": [
            {"question": "The past of “answer” is…", "answer": "answered", "distractors": ["answers", "answer"]},
            {"question": "The past of “believe” is…", "answer": "believed", "distractors": ["believeed", "believes"]},
        ],
        "match": match_ed_past,
        "example": "“{word}” has {note}.",
        "fill": "The story is in the past. Choose the past form",
        "find": "Which word in this verse is a past form ending in -ed?",
        "summary": "Most verbs: add -ed (or -d after e) for the past.",
    },
]


def for_speakers(base):
    """
    The curriculum as a Spanish ("es") or French ("fr") speaker reads it: same rules and options,
    with the teaching text from grammar_en_i18n.py. English words being taught stay in English.
    """
    localized = []
    for rule in RULES:
        text = TEXT[base][rule["id"]]
        new = {**rule, **{k: text[k] for k in ("title", "example", "fill", "find", "summary")}}
        new["cards"] = [
            {"title": t["title"], "body": t["body"],
             "examples": [(en, native) for (en, _), native in zip(card["examples"], t["natives"], strict=True)]}
            for card, t in zip(rule["cards"], text["cards"], strict=True)
        ]
        new["checks"] = [{**check, "question": q} for check, q in zip(rule["checks"], text["checks"], strict=True)]
        if "match" in rule:
            new["match"] = _with_note(rule["match"], text["match_note"])
        else:
            new["forms"] = {word: (text["notes"][word], wrong) for word, (_, wrong) in rule["forms"].items()}
        localized.append(new)
    return SimpleNamespace(RULES=localized, VERB_ENDINGS=VERB_ENDINGS, UI=UI[base])


def _with_note(match, note):
    """The same `match` function, describing what it finds with this note."""
    def localized(word, known):
        found = match(word, known)
        return (note, found[1]) if found else None
    return localized
