// Writes workbook/LEVELS.md (the Workbook catalog entry) from the level data, so titles, skills and module paths never
// drift from the game.  Usage: npx tsx scripts/workbook-levels.ts
import { writeFileSync } from 'node:fs';
import { LEVELS } from '../src/levels/index';

const head = `# Pocket Planets · כוכבים בכיס: workbook catalog entry

- **Slug:** \`pocket-planets\`
- **Hebrew title:** כוכבים בכיס
- **English title:** Pocket Planets
- **Tagline (he):** קפצו בין עולמות קטנטנים במערכת השמש והרגישו בגוף את ההבדלים: על הירח קופצים פי 6, בצד היום של כספית המגפיים מעשנות, ובצדק אין בכלל קרקע לנחות עליה.
- **Grades:** 8
- **Orientation:** \`landscape\` (3D platformer with a camera stick; touch controls fit a landscape phone)
- **Levels:** ${LEVELS.length} authored levels in 4 worlds; \`?level=N\` opens level N directly and skips the title, even when the local save has it locked.
- **Poster:** \`workbook/poster.jpg\` (1600×900, level 1 on the Moon: Nuri mid-jump with Earth behind the crater rim)
- **Stars:** star crumbs collected (1–3, at least 1 for a win). The daily comet mode posts nothing.

Module paths come only from \`acedzn-tools/packages/catalog-geography/src\` (\`ids.ts\`, \`grade-8.ts\`). Details per level are in [../CURRICULUM.md](../CURRICULUM.md).

| n | Hebrew level title | Hebrew skill | Workbook geography modules |
|---|---|---|---|
`;

const rows = LEVELS.map((l) => `| ${l.n} | ${l.titleHe} | ${l.skillHe} | ${l.modules.join(', ')} |`).join('\n');
writeFileSync('workbook/LEVELS.md', head + rows + '\n');
console.log(`workbook/LEVELS.md: ${LEVELS.length} levels`);
