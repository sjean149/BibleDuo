# BibleDuo helpers

Five characters guide learners through lessons. They are drawn as SVG in
`bible-lang-app/src/art/characters.js` and exported as image files to `docs/art/`
(open `docs/art/index.html` to see them all; re-export with `node scripts/export-art.mjs`
from `bible-lang-app/`).

The look borrows the *approach* of Duolingo-style lesson characters (flat shapes, big round
eyes, no outlines, a speech bubble beside the character) but the characters themselves are
original. Do not copy Duolingo's actual characters, colors or poses.

| Character | Personality | Where they appear | Why them |
|---|---|---|---|
| **Paul** | Warm, scholarly, a little bookish. Holds a scroll. | Explains each grammar rule at the top of a question ("NEW RULE"). | He wrote half the New Testament as letters, so he's a natural teacher of how language works. |
| **Jesus** | Gentle and welcoming, arms open. | The "Lesson complete" screen, next to the lamb. **He has no speech bubble and never says invented lines.** | Central to the text, but putting made-up words in his mouth would bother many users (see "Things to decide" below). |
| **Camel** | Patient, steady, a bit funny. | Waits with you when you run out of hearts. | Camels endure long journeys: good for "keep going". |
| **Lamb** | Soft, curious, encouraging. | Cheers on the "Lesson complete" screen. | "The Lamb of God" (John 1:29). |
| **Fish** | Quick and cheerful. | Points out the rule in a verse from this chapter, above a fill-in-the-blank ("IN THIS CHAPTER"). | Galilee's fishermen, and the early Christian fish symbol. |

## Ideas for later

- Small animations: the fish wiggling when an answer is right, the camel blinking while hearts refill.
- Different expressions per character (happy, thinking, surprised) for right and wrong answers.
- Let learners pick a favorite helper for their profile picture.

## Things to decide

- **Depicting Jesus.** Some Christian traditions avoid images of Jesus or dislike cartoon
  versions. The current drawing is respectful and he stays silent, but you could also replace
  him with a symbol (a dove, a lamp) if your audience prefers.
- **Paul's appearance** is traditional (bald, bearded); no one knows what he looked like.
