# Resolve snapshot at `c3f02f8`

Verbatim copies of the files Forma UI extracts from [Resolve](https://github.com/Yelison/resolve), pinned at commit `c3f02f8`.

| File | Source in Resolve (at `c3f02f8`) |
| --- | --- |
| `tokens.css` | `frontend/src/styles/tokens.css` |
| `global.css` | `frontend/src/styles/global.css` |
| `icon-paths.ts` | `frontend/src/components/ui/Icon/paths.ts` |
| `contrast-pairs.json` | pairs extracted by hand from `frontend/src/styles/tokens.contrast.test.ts` |
| `SHA256SUMS` | checksums of the three copied files |

## Do not edit by hand

These files are a frozen snapshot. The three copies are byte-for-byte (`git show c3f02f8:<path>`), and `SHA256SUMS` proves it:

```sh
cd design/resolve-c3f02f8 && sha256sum -c SHA256SUMS
```

To change the snapshot, pin a new Resolve commit and replace the whole directory; never patch a file in place.

`contrast-pairs.json` lists the 40 foreground/background pairs the Resolve test checks in each theme (`light` and `dark`), in the test's order, with the place each pair is painted. Token names omit the `--color-` prefix. Thresholds are 4.5 for text (WCAG 1.4.3) and 3 for non-text (1.4.11). `excluded` records what the test leaves out on purpose, with the reason.

## Consumers

Read by plan tasks 1.1 (DTCG token source and CSS generator: `tokens.css` and `global.css`) and 2.2 (icon and icon generation: `icon-paths.ts`).

`contrast-pairs.json` is evidence, not an input: the package keeps its own pairs in `packages/forma-ui/tokens/contrast-pairs.json` and publishes them as `@yelison/forma-ui/contrast-pairs.json`, which the package's contrast test reads through the generator (plan task 1.2) and the site's Foundations page imports (4.5). Only the parity test (`packages/forma-ui/src/tokens/parity.test.ts`) reads this file, to keep the package's pairs equal to Resolve's. Nothing else edits these files.
