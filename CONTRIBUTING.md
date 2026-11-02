# Contributing

The best contribution is a **mask**. Open a PR that adds one to `src/masks/builtin.ts`, or just paste a share-link in an issue and we'll fold it in.

A good mask:

- is a **character**, not a language ("Night-shift konbini clerk", not "Japanese tutor");
- has a `persona` written in the second person, with a setting and a quirk;
- has a `method` that says what gets corrected, how, and what the conversation stays grounded in;
- opens with a `greeting` in the target language that invites a reply.

Everything else:

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # SM-2 + cards parser
npm run build   # typecheck + production build
```

Keep dependencies at zero unless there is no honest way around it. The scheduler and the cards parser are pure functions with tests; keep them that way.
