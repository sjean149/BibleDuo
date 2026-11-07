"""The English curriculum's teaching text in the learner's own language.

grammar_en.py holds the rules (which words count, which wrong options to offer). This file holds
what Spanish and French speakers read while learning them. English words being taught stay in
English. Per rule:

  title, fill, find, example, summary   same meaning as in grammar_en.py
  cards     per card: title, body, and `natives` (a translation for each example, in order)
  checks    the question of each concept check, in order
  notes     word -> how the "in this chapter" card describes it
  match_note  for rules that use `match` instead of `forms`

UI holds the instructions shared by every lesson.
"""

UI = {
    "es": {
        "quick_check": "Comprobación rápida",
        "review": "Repaso: {fill}",
        "translate": "Elige la traducción al español",
        "true_false": "¿Es correcta esta traducción?",
        "new_rule": "REGLA NUEVA",
        "in_chapter": "En este capítulo",
    },
    "fr": {
        "quick_check": "Vérification rapide",
        "review": "Révision : {fill}",
        "translate": "Choisis la traduction en français",
        "true_false": "Cette traduction est-elle correcte ?",
        "new_rule": "NOUVELLE RÈGLE",
        "in_chapter": "Dans ce chapitre",
    },
}

TEXT = {
    "es": {
        "a_an": {
            "title": "¿a o an?",
            "cards": [{
                "title": "Escucha el sonido siguiente",
                "body": "En inglés, «un» o «una» se dice a delante de un sonido de consonante y an delante "
                        "de un sonido de vocal. Importa el sonido, no la letra: an hour (una hora).",
                "natives": ["un hombre", "una voz", "un ángel", "una hora"],
            }],
            "checks": ["Angel empieza con sonido de vocal. ¿Qué palabra va delante?", "¿Cuál es correcto?"],
            "notes": {"a": "se usa delante de un sonido de consonante", "an": "se usa delante de un sonido de vocal"},
            "example": "“{word}” {note}: “{next}”.",
            "fill": "¿a o an?",
            "find": "¿Qué palabra de este versículo es a o an?",
            "summary": "a delante de un sonido de consonante, an delante de un sonido de vocal.",
        },
        "be_present": {
            "title": "Ser y estar: am, is, are",
            "cards": [{
                "title": "Un verbo, tres formas",
                "body": "To be significa a la vez «ser» y «estar». I am (yo soy). He, she, it is (él, ella es). "
                        "You, we, they are (tú eres, nosotros somos, ellos son).",
                "natives": ["Yo soy la luz del mundo", "Él es el Hijo de Dios", "Ustedes son mis amigos"],
            }],
            "checks": ["¿Qué forma va con they (ellos)?", "«Yo soy el buen pastor»: I ___ the good shepherd"],
            "notes": {"am": "solo se usa con I", "is": "se usa con he, she, it o una sola cosa",
                      "are": "se usa con you, we, they o varias cosas"},
            "example": "“{word}” {note}.",
            "fill": "¿am, is o are?",
            "find": "¿Qué palabra de este versículo es una forma de to be (ser, estar)?",
            "summary": "I am; he / she / it is; you / we / they are.",
        },
        "pronouns": {
            "title": "¿he o him? ¿they o them?",
            "cards": [
                {"title": "Quién actúa y quién recibe",
                 "body": "He, they y we hacen la acción (él, ellos, nosotros). Him, them y us la reciben "
                         "(lo, los, nos). En inglés el pronombre va después del verbo.",
                 "natives": ["Él los amó", "Ellos lo siguieron", "Nosotros lo vimos"]},
                {"title": "Después de to, with, for",
                 "body": "Después de palabras como to (a), with (con), for (para) o from (de), usa him, them o us.",
                 "natives": ["Él les dijo", "Ellos fueron con él"]},
            ],
            "checks": ["Jesús les dijo (a los discípulos): Jesus said to ___", "¿Cuál hace la acción?"],
            "notes": {"he": "quien hace la acción (él)", "him": "quien recibe la acción (a él)",
                      "they": "quienes hacen la acción (ellos)", "them": "quienes reciben la acción (a ellos)",
                      "we": "nosotros, haciendo la acción", "us": "nosotros, recibiendo la acción"},
            "example": "“{word}” es {note}.",
            "fill": "Elige el pronombre correcto",
            "find": "¿Qué palabra de este versículo es he, him, they, them, we o us?",
            "summary": "he / they / we hacen la acción; him / them / us la reciben.",
        },
        "possessives": {
            "title": "¿De quién? his, their, my, your",
            "cards": [{
                "title": "Palabras que muestran el dueño",
                "body": "my (mi), your (tu), his (su, de él), her (su, de ella), our (nuestro), their (su, de ellos). "
                        "A diferencia del español, no cambian en plural: my friends (mis amigos).",
                "natives": ["sus discípulos", "sus redes", "mi Padre", "tu fe"],
            }],
            "checks": ["Los discípulos dejaron sus redes: The disciples left ___ nets",
                       "Pedro y su hermano: Peter and ___ brother"],
            "notes": {"his": "“de él”", "their": "“de ellos”", "my": "“mi / mis”", "our": "“nuestro”",
                      "your": "“tu / su”"},
            "example": "“{word}” significa {note}: “{next}”.",
            "fill": "Elige la palabra que indica de quién es",
            "find": "¿Qué palabra de este versículo indica de quién es algo?",
            "summary": "my, your, his, her, our, their van delante de la cosa y no cambian en plural.",
        },
        "this_these": {
            "title": "¿this o these?",
            "cards": [{
                "title": "Uno o varios",
                "body": "this (este, esta) va con una sola cosa; these (estos, estas) con varias.",
                "natives": ["este hombre", "estas palabras", "este mundo", "estas cosas"],
            }],
            "checks": ["«estas cosas»: ___ things", "«este hombre»: ___ man"],
            "notes": {"this": "para una sola cosa", "these": "para varias cosas"},
            "example": "“{word}” es {note}: “{next}”.",
            "fill": "¿this o these?",
            "find": "¿Qué palabra de este versículo es this o these?",
            "summary": "this + una cosa, these + varias.",
        },
        "have_has": {
            "title": "¿have o has?",
            "cards": [{
                "title": "has con he, she, it",
                "body": "To have significa «tener» y también forma el pasado (we have found: hemos hallado). "
                        "Usa has con he, she, it o una sola cosa, y have con I, you, we, they.",
                "natives": ["Él tiene palabras de vida eterna", "Hemos hallado al Mesías"],
            }],
            "checks": ["¿Qué forma va con he?", "«No tienen vino»: They ___ no wine"],
            "notes": {"have": "se usa con I, you, we, they", "has": "se usa con he, she, it o una sola cosa"},
            "example": "“{word}” {note}.",
            "fill": "¿have o has?",
            "find": "¿Qué palabra de este versículo es have o has?",
            "summary": "he / she / it has; I / you / we / they have.",
        },
        "do_does": {
            "title": "do, does, don’t",
            "cards": [{
                "title": "Preguntas y negación",
                "body": "El inglés usa do para preguntar y para negar: Do you believe? (¿Crees?), I don’t know "
                        "(no sé). Con he, she, it se convierte en does y doesn’t.",
                "natives": ["¿Crees?", "No sé", "Él no"],
            }],
            "checks": ["¿Qué forma va con he?", "«No lo conozco»: I ___ know him"],
            "notes": {"do": "se usa con I, you, we, they", "does": "se usa con he, she, it",
                      "don’t": "“do not”, con I, you, we, they", "doesn’t": "“does not”, con he, she, it"},
            "example": "“{word}” {note}.",
            "fill": "¿do o does?",
            "find": "¿Qué palabra de este versículo es una forma de do?",
            "summary": "do / don’t con I, you, we, they; does / doesn’t con he, she, it.",
        },
        "was_were": {
            "title": "¿was o were?",
            "cards": [{
                "title": "El pasado de to be",
                "body": "was (era, estaba, fue) va con I, he, she, it y una sola cosa. "
                        "were (eran, estaban) va con you, we, they y varias cosas.",
                "natives": ["En el principio era el Verbo", "Ellos tenían miedo"],
            }],
            "checks": ["«Los discípulos tenían miedo»: The disciples ___ afraid",
                       "«Hubo un hombre enviado de Dios»: There ___ a man sent from God"],
            "notes": {"was": "el pasado de is (una persona o cosa)", "were": "el pasado de are (varias, o you)"},
            "example": "“{word}” es {note}.",
            "fill": "¿was o were?",
            "find": "¿Qué palabra de este versículo es was o were?",
            "summary": "I / he / she / it was; you / we / they were.",
        },
        "irregular_past": {
            "title": "Pasado: said, came, went",
            "cards": [
                {"title": "La historia se cuenta en pasado",
                 "body": "Muchos verbos comunes tienen su propia forma de pasado, sin -ed. "
                         "Hay que aprenderlas de memoria.",
                 "natives": ["decir → dijo", "venir → vino", "ir → fue", "ver → vio"]},
                {"title": "Más ejemplos",
                 "body": "give → gave (dar), take → took (tomar), know → knew (conocer), tell → told (decir), "
                         "find → found (hallar), speak → spoke (hablar).",
                 "natives": ["Él tomó el pan", "Ellos lo conocían"]},
            ],
            "checks": ["El pasado de go (ir) es…", "El pasado de say (decir) es…"],
            "notes": {"said": "el pasado de say (decir)", "came": "el pasado de come (venir)",
                      "went": "el pasado de go (ir)", "saw": "el pasado de see (ver)",
                      "gave": "el pasado de give (dar)", "took": "el pasado de take (tomar)",
                      "knew": "el pasado de know (conocer, saber)", "told": "el pasado de tell (decir, contar)",
                      "found": "el pasado de find (hallar)", "spoke": "el pasado de speak (hablar)",
                      "sat": "el pasado de sit (sentarse)", "stood": "el pasado de stand (estar de pie)"},
            "example": "“{word}” es {note}.",
            "fill": "La historia está en pasado. Elige la forma correcta",
            "find": "¿Qué palabra de este versículo es un pasado como said, came o went?",
            "summary": "say → said, come → came, go → went, see → saw, take → took, know → knew.",
        },
        "ed_past": {
            "title": "Pasado: -ed",
            "cards": [{
                "title": "La mayoría de los verbos añade -ed",
                "body": "Para casi todos los verbos, el pasado es el verbo + -ed, igual para todas las personas. "
                        "Si termina en e, añade solo -d: believe → believed.",
                "natives": ["responder → respondió", "seguir → siguió", "creer → creyó"],
            }],
            "checks": ["El pasado de answer (responder) es…", "El pasado de believe (creer) es…"],
            "match_note": "la terminación -ed: ocurrió en el pasado",
            "example": "“{word}” tiene {note}.",
            "fill": "La historia está en pasado. Elige la forma correcta",
            "find": "¿Qué palabra de este versículo es un pasado terminado en -ed?",
            "summary": "Casi todos los verbos: añade -ed (o -d después de e) para el pasado.",
        },
    },
    "fr": {
        "a_an": {
            "title": "a ou an ?",
            "cards": [{
                "title": "Écoute le son qui suit",
                "body": "En anglais, « un » ou « une » se dit a devant un son de consonne et an devant un son "
                        "de voyelle. C’est le son qui compte, pas la lettre : an hour (une heure).",
                "natives": ["un homme", "une voix", "un ange", "une heure"],
            }],
            "checks": ["Angel commence par un son de voyelle. Quel mot va devant ?", "Quelle forme est correcte ?"],
            "notes": {"a": "s’emploie devant un son de consonne", "an": "s’emploie devant un son de voyelle"},
            "example": "“{word}” {note} : “{next}”.",
            "fill": "a ou an ?",
            "find": "Quel mot de ce verset est a ou an ?",
            "summary": "a devant un son de consonne, an devant un son de voyelle.",
        },
        "be_present": {
            "title": "Être : am, is, are",
            "cards": [{
                "title": "Un verbe, trois formes",
                "body": "I am (je suis). He, she, it is (il, elle est). You, we, they are (tu es, nous sommes, ils sont).",
                "natives": ["Je suis la lumière du monde", "Il est le Fils de Dieu", "Vous êtes mes amis"],
            }],
            "checks": ["Quelle forme va avec they (ils) ?", "« Je suis le bon berger » : I ___ the good shepherd"],
            "notes": {"am": "s’emploie seulement avec I", "is": "s’emploie avec he, she, it ou une seule chose",
                      "are": "s’emploie avec you, we, they ou plusieurs choses"},
            "example": "“{word}” {note}.",
            "fill": "am, is ou are ?",
            "find": "Quel mot de ce verset est une forme de to be (être) ?",
            "summary": "I am ; he / she / it is ; you / we / they are.",
        },
        "pronouns": {
            "title": "he ou him ? they ou them ?",
            "cards": [
                {"title": "Qui agit, et qui reçoit",
                 "body": "He, they et we font l’action (il, ils, nous). Him, them et us la reçoivent "
                         "(le, les, nous). En anglais, le pronom se place après le verbe.",
                 "natives": ["Il les aimait", "Ils le suivaient", "Nous l’avons vu"]},
                {"title": "Après to, with, for",
                 "body": "Après des mots comme to (à), with (avec), for (pour) ou from (de), emploie him, them ou us.",
                 "natives": ["Il leur dit", "Ils allèrent avec lui"]},
            ],
            "checks": ["Jésus leur dit (aux disciples) : Jesus said to ___", "Lequel fait l’action ?"],
            "notes": {"he": "celui qui fait l’action (il)", "him": "celui qui reçoit l’action (le, lui)",
                      "they": "ceux qui font l’action (ils)", "them": "ceux qui reçoivent l’action (les, leur)",
                      "we": "nous, qui faisons l’action", "us": "nous, qui recevons l’action"},
            "example": "“{word}” est {note}.",
            "fill": "Choisis le bon pronom",
            "find": "Quel mot de ce verset est he, him, they, them, we ou us ?",
            "summary": "he / they / we font l’action ; him / them / us la reçoivent.",
        },
        "possessives": {
            "title": "À qui ? his, their, my, your",
            "cards": [{
                "title": "Les mots qui montrent le propriétaire",
                "body": "my (mon), your (ton), his (son, à lui), her (son, à elle), our (notre), their (leur). "
                        "Contrairement au français, ils s’accordent avec le propriétaire, pas avec l’objet : "
                        "his mother (sa mère, à lui), her father (son père, à elle).",
                "natives": ["ses disciples", "leurs filets", "mon Père", "ta foi"],
            }],
            "checks": ["Les disciples laissèrent leurs filets : The disciples left ___ nets",
                       "Pierre et son frère : Peter and ___ brother"],
            "notes": {"his": "« à lui »", "their": "« à eux »", "my": "« mon, ma, mes »", "our": "« notre, nos »",
                      "your": "« ton, votre »"},
            "example": "“{word}” signifie {note} : “{next}”.",
            "fill": "Choisis le mot qui montre à qui c’est",
            "find": "Quel mot de ce verset montre à qui appartient quelque chose ?",
            "summary": "my, your, his, her, our, their se placent devant l’objet et suivent le propriétaire.",
        },
        "this_these": {
            "title": "this ou these ?",
            "cards": [{
                "title": "Un ou plusieurs",
                "body": "this (ce, cette) va avec une seule chose ; these (ces) avec plusieurs.",
                "natives": ["cet homme", "ces paroles", "ce monde", "ces choses"],
            }],
            "checks": ["« ces choses » : ___ things", "« cet homme » : ___ man"],
            "notes": {"this": "pour une seule chose", "these": "pour plusieurs choses"},
            "example": "“{word}” est {note} : “{next}”.",
            "fill": "this ou these ?",
            "find": "Quel mot de ce verset est this ou these ?",
            "summary": "this + une chose, these + plusieurs.",
        },
        "have_has": {
            "title": "have ou has ?",
            "cards": [{
                "title": "has avec he, she, it",
                "body": "To have signifie « avoir » et sert aussi à former le passé (we have found : nous avons "
                        "trouvé). Emploie has avec he, she, it ou une seule chose, et have avec I, you, we, they.",
                "natives": ["Il a les paroles de la vie éternelle", "Nous avons trouvé le Messie"],
            }],
            "checks": ["Quelle forme va avec he ?", "« Ils n’ont pas de vin » : They ___ no wine"],
            "notes": {"have": "s’emploie avec I, you, we, they", "has": "s’emploie avec he, she, it ou une seule chose"},
            "example": "“{word}” {note}.",
            "fill": "have ou has ?",
            "find": "Quel mot de ce verset est have ou has ?",
            "summary": "he / she / it has ; I / you / we / they have.",
        },
        "do_does": {
            "title": "do, does, don’t",
            "cards": [{
                "title": "Questions et négation",
                "body": "L’anglais emploie do pour poser une question et pour dire « ne … pas » : Do you believe? "
                        "(Crois-tu ?), I don’t know (je ne sais pas). Avec he, she, it, il devient does et doesn’t.",
                "natives": ["Crois-tu ?", "Je ne sais pas", "Il ne … pas"],
            }],
            "checks": ["Quelle forme va avec he ?", "« Je ne le connais pas » : I ___ know him"],
            "notes": {"do": "s’emploie avec I, you, we, they", "does": "s’emploie avec he, she, it",
                      "don’t": "“do not”, avec I, you, we, they", "doesn’t": "“does not”, avec he, she, it"},
            "example": "“{word}” {note}.",
            "fill": "do ou does ?",
            "find": "Quel mot de ce verset est une forme de do ?",
            "summary": "do / don’t avec I, you, we, they ; does / doesn’t avec he, she, it.",
        },
        "was_were": {
            "title": "was ou were ?",
            "cards": [{
                "title": "Le passé de to be",
                "body": "was (était, fut) va avec I, he, she, it et une seule chose. "
                        "were (étaient, furent) va avec you, we, they et plusieurs choses.",
                "natives": ["Au commencement était la Parole", "Ils avaient peur"],
            }],
            "checks": ["« Les disciples avaient peur » : The disciples ___ afraid",
                       "« Il y eut un homme envoyé de Dieu » : There ___ a man sent from God"],
            "notes": {"was": "le passé de is (une personne ou une chose)", "were": "le passé de are (plusieurs, ou you)"},
            "example": "“{word}” est {note}.",
            "fill": "was ou were ?",
            "find": "Quel mot de ce verset est was ou were ?",
            "summary": "I / he / she / it was ; you / we / they were.",
        },
        "irregular_past": {
            "title": "Passé : said, came, went",
            "cards": [
                {"title": "L’histoire se raconte au passé",
                 "body": "Beaucoup de verbes courants ont leur propre forme au passé, sans -ed. "
                         "Il faut les apprendre par cœur.",
                 "natives": ["dire → dit", "venir → vint", "aller → alla", "voir → vit"]},
                {"title": "Encore quelques-uns",
                 "body": "give → gave (donner), take → took (prendre), know → knew (connaître), tell → told (dire), "
                         "find → found (trouver), speak → spoke (parler).",
                 "natives": ["Il prit le pain", "Ils le connaissaient"]},
            ],
            "checks": ["Le passé de go (aller) est…", "Le passé de say (dire) est…"],
            "notes": {"said": "le passé de say (dire)", "came": "le passé de come (venir)",
                      "went": "le passé de go (aller)", "saw": "le passé de see (voir)",
                      "gave": "le passé de give (donner)", "took": "le passé de take (prendre)",
                      "knew": "le passé de know (connaître, savoir)", "told": "le passé de tell (dire, raconter)",
                      "found": "le passé de find (trouver)", "spoke": "le passé de speak (parler)",
                      "sat": "le passé de sit (s’asseoir)", "stood": "le passé de stand (se tenir debout)"},
            "example": "“{word}” est {note}.",
            "fill": "L’histoire est au passé. Choisis la bonne forme",
            "find": "Quel mot de ce verset est un passé comme said, came ou went ?",
            "summary": "say → said, come → came, go → went, see → saw, take → took, know → knew.",
        },
        "ed_past": {
            "title": "Passé : -ed",
            "cards": [{
                "title": "La plupart des verbes ajoutent -ed",
                "body": "Pour presque tous les verbes, le passé est le verbe + -ed, le même à toutes les personnes. "
                        "S’il finit par e, ajoute seulement -d : believe → believed.",
                "natives": ["répondre → répondit", "suivre → suivit", "croire → crut"],
            }],
            "checks": ["Le passé de answer (répondre) est…", "Le passé de believe (croire) est…"],
            "match_note": "la terminaison -ed : cela s’est passé autrefois",
            "example": "“{word}” a {note}.",
            "fill": "L’histoire est au passé. Choisis la bonne forme",
            "find": "Quel mot de ce verset est un passé en -ed ?",
            "summary": "Presque tous les verbes : ajoute -ed (ou -d après e) pour le passé.",
        },
    },
}
