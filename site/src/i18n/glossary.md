# Glossary

Fixed terms of the documentation site, agreed before translating. Spanish and English messages follow this table, and
a term marked «kept» is written the same way in both languages, in prose as well as in code.

| Term                  | English                                           | Spanish        | Rule                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forma UI              | Forma UI                                          | Forma UI       | Kept. The product name is never translated: it is written as is inside the messages, as a fixed term, and `src/brand.ts` holds it for what is not a message (the logo and the composed `aria-label`). |
| Component names       | Button, IconButton, Badge, Input, Tooltip, Dialog | the same       | Kept. They are identifiers of the code.                                                                                                                                                               |
| Prop names and values | `variant`, `size`, `loading`…                     | the same       | Kept, always in code font.                                                                                                                                                                            |
| `token`               | token                                             | token          | Kept in prose too: «del token al componente». Plural: «tokens».                                                                                                                                       |
| `variant`             | variant                                           | variante       | Kept only as the prop name. In prose it is «variante».                                                                                                                                                |
| Theme                 | theme                                             | tema           |                                                                                                                                                                                                       |
| Getting started       | Getting started                                   | Primeros pasos |                                                                                                                                                                                                       |
| Foundations           | Foundations                                       | Fundamentos    |                                                                                                                                                                                                       |
| Components            | Components                                        | Componentes    |                                                                                                                                                                                                       |
| Changelog             | Changelog                                         | Cambios        | The design history, not package releases.                                                                                                                                                             |
| GitHub                | GitHub                                            | GitHub         | Kept.                                                                                                                                                                                                 |
| Code examples         | —                                                 | —              | Never translated: code, import paths and CSS stay in English; only the prose around them is translated.                                                                                               |

## Writing rules

- Messages are ICU. Variables go in as arguments (`{component}`), never by joining strings; counts use `plural`.
- Both files hold exactly the same keys and the same arguments. `npm run check:messages -w forma-ui-site` fails if they
  do not, or if a message is not valid ICU.
- Spanish is written for the Spanish-speaking reader in general: no regional vocabulary, and «tú» for instructions.
