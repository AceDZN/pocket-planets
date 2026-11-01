# Curriculum

Grade 8 geography, chapter 1: **היקום ומערכת השמש** ("מהמפץ הגדול ועד כדור הארץ"). Workbook is the source of truth.
The module snapshots used while building are in `docs/curriculum/` (fetched 1 Nov 2026 from the Workbook markdown API).

| Module slug | Workbook title | Page | Levels |
|---|---|---|---|
| `grade-8/chapter-1/earth-system` | כדור הארץ כמערכת | https://www.workbook.co.il/geography/grade-8/chapter-1/earth-system | 3, 6, 7, 8, 9 |
| `grade-8/chapter-1/universe-structure` | מסע אל היקום | https://www.workbook.co.il/geography/grade-8/chapter-1/universe-structure | 16, 17 |
| `grade-8/chapter-1/solar-system` | מערכת השמש | https://www.workbook.co.il/geography/grade-8/chapter-1/solar-system | 1–5, 7, 10–14, 18 |
| `grade-8/chapter-1/space-exploration` | חקר החלל | https://www.workbook.co.il/geography/grade-8/chapter-1/space-exploration | 4, 15 |

Slugs come only from `acedzn-tools/packages/catalog-geography/src` (`ids.ts`, `grade-8.ts`). `tests/levels.test.ts`
fails if a level names any other module.

## Level → module, skill, misconception

| n | Title | Modules | Skill | Misconception the level breaks |
|---|---|---|---|---|
| 1 | ירח הקפיצות | solar-system | כבידה חלשה, אין אוויר | קופצים אותו דבר בכל מקום |
| 2 | כספית, צד יום וצד לילה | solar-system | אין אטמוספרה: יום לוהט, לילה קפוא, צל מקרר | כוכב הלכת הקרוב לשמש חם בכל מקום |
| 3 | נוגה הלוהטת | solar-system, earth-system | אטמוספרה עבה: חממה, נפילה איטית | בצד הלילה של נוגה יהיה קריר, כמו בכספית |
| 4 | מאדים האדום | solar-system, space-exploration | כבידה חלשה, אוויר דליל, סופת אבק | קופצים אותו דבר בכל מקום |
| 5 | איפה נחתתי? | solar-system | זיהוי עולם לפי עדויות: אוויר, שמיים, שמש, חום | אותה קפיצה = אותו עולם (לכספית ולמאדים אותה כבידה) |
| 6 | ארבע הספרות | earth-system | ארבע הספרות ויחסי גומלין | הספרות נפרדות זו מזו |
| 7 | הגינה הנודדת | solar-system, earth-system | תנאים לקיום חיים | כל קרקע מתאימה לחיים; הירח, מאדים ונוגה דומים לכדור הארץ |
| 8 | שרשרת בין הספרות | earth-system | יחסי גומלין בין הספרות | שינוי בספרה אחת לא משפיע על האחרות |
| 9 | עולם בלי ספרה | earth-system | זיהוי ספרה חסרה (העברה) | ניחוש, או "תמיד להביא את אותו הדבר" |
| 10 | חגורת האסטרואידים | solar-system | כבידה של גוף קטן, כבידה אל הגוף הקרוב | קפיצה גדולה יותר תמיד טובה יותר |
| 11 | צדק בלי קרקע | solar-system | כוכב לכת גזי בלי קרקע, ירחים, אוקיינוס מתחת לקרח | לכל כוכב לכת יש קרקע לנחות עליה |
| 12 | טבעות שבתאי | solar-system | כוכב לכת גזי, טבעות, מים מתחת לקרח | הטבעות הן דיסק מוצק; אפשר לנחות על שבתאי |
| 13 | הקרים והרחוקים | solar-system | רחוק מהשמש: קר, חשוך, שנה ארוכה | כוכבי הלכת הרחוקים הם עותקים קטנים של שלנו |
| 14 | סלעי או גזי? | solar-system | סלעי או גזי: לחזות אם יש קרקע לפי המרחק מהשמש | לכל כוכב לכת יש קרקע / הענקים הם סלעים גדולים |
| 15 | מסלול הלוויינים | space-exploration | לוויינים ופסולת חלל | החלל ריק ובטוח; פסולת פשוט מרחפת הלאה |
| 16 | אור שהגיע באיחור | universe-structure | שנת אור: לראות את העבר | אם אני רואה כוכב, הוא קיים עכשיו |
| 17 | מדרגות הגודל | universe-structure | סולם הגדלים ביקום | בלבול בסדר הגדלים; השמש במרכז הגלקסיה |
| 18 | המסע הגדול | solar-system | זיהוי עולמות (מבחן מסכם) | מזהים עולם לפי השם שלו ולא לפי עדויות |

How each misconception is broken in play (the wrong approach and its funny, recoverable consequence) is written up per
level in [docs/levels/a.md](docs/levels/a.md) and [docs/levels/b.md](docs/levels/b.md).

## Terms (Workbook wording)

Checked against the snapshots: the game uses only these forms.

| Use | Not |
|---|---|
| אטמוספרה, הידרוספרה, גאוספרה, ביוספרה (ארבע הספרות) | ליתוספרה |
| יחסי גומלין | |
| כבידה / כוח הכבידה | גרביטציה |
| כוכבי לכת סלעיים / כוכבי לכת גזיים | ענקי גז (the world tab "הענקים" is a nickname, not a term) |
| כספית, נוגה, כדור הארץ, מאדים, צדק, שבתאי, אורנוס, נפטון | |
| חגורת האסטרואידים, אסטרואיד, שביט | |
| לוויין, פסולת חלל, תסמונת קסלר | |
| שנת אור, גלקסיה, שביל החלב, צביר גלקסיות, המפץ הגדול | |

## Numbers and העשרה

- Values that appear in Workbook are used as they are: a light year (≈ 9,460 billion km), sunlight takes 8 minutes,
  Proxima Centauri over 4 years, Andromeda ≈ 2.5 million years, the Milky Way ≈ 100,000 light years across,
  27,000+ tracked debris pieces at ≈ 28,000 km/h, the Hula drainage, GPS satellites, the rock-and-metal vs gas-and-ice
  split between near and far planets.
- Every other number (surface temperatures, gravity ratios, year lengths, Olympus Mons height, ring width) is shown
  only in the **העשרה** box of the atlas page, phrased "לפי נאס"א". Source: NASA Planetary Fact Sheet
  (https://nssdc.gsfc.nasa.gov/planetary/factsheet/) and NASA Solar System Exploration planet pages
  (https://science.nasa.gov/solar-system/).
- Game simplifications are said aloud in the atlas: tiny bodies use a gameplay gravity floor ("במשחק חיזקנו אותה
  מעט"), and the L14 cloud-skimmer is an invention of the game.

## Physics as the lesson

- **Gravity:** one take-off speed everywhere, so the full-jump height is Earth height ÷ g and the jump gauge reads the
  ratio ("פי 6" on the Moon). כספית and מאדים share g ≈ 0.38, so L5 cannot be solved by jump height alone.
- **Air:** none (black sky, no drag), thin (מאדים), thick (נוגה: slow fall, heat kept day and night).
- **Distance from the Sun:** the Sun's apparent size is 1/distance; the far worlds are dark and cold.
- **Heat:** the suit meter follows the Sun angle and shade, so כספית's twilight band is the only safe road and נוגה is
  hot on the night side too.
- **Life:** L7 checks the three conditions from Workbook (a suitable temperature, liquid water, an atmosphere suited to
  life) plus ground, and names what is missing when a seed pod wilts.

## Rules kept

- Hebrew RTL; numbers in LTR `<bdi>`.
- No political borders anywhere (Earth textures are procedural continents, no lines).
- No colour-only feedback: every state change also has text, an icon, a sound or a physical consequence.
- No "wrong answer" popups: wrong pads, wrong gear and wrong guesses have funny, recoverable consequences and a short
  explanation.
