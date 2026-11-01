# Levels

18 authored levels in 4 worlds. Each level teaches one idea through the body: how high you jump, how hot the suit
gets, whether there is ground, what the sky looks like. A transfer level closes each world, and the finale (L18) has
no hints and hides the names. Every route below is replayed headless through the game's own input in `npm test`
(`npx tsx scripts/solve.ts` prints them); all 18 win with 3 star crumbs and no respawns.

Detailed write-ups (what each level teaches, the misconception it targets, the verified solution, the wrong approaches
and their funny consequences, values used) are in [docs/levels/a.md](docs/levels/a.md) (L2–L5, L10–L14) and
[docs/levels/b.md](docs/levels/b.md) (L6–L9, L15–L18). Level 1 is below.

| n | World | Title | Where | Skill | Flags | Notes |
|---|---|---|---|---|---|---|
| 1 | העולמות הסלעיים | ירח הקפיצות | הירח | כבידה חלשה, אין אוויר |  | below |
| 2 | העולמות הסלעיים | כספית, צד יום וצד לילה | כספית | אין אטמוספרה: יום לוהט, לילה קפוא, צל מקרר | suit meter | [a](docs/levels/a.md) |
| 3 | העולמות הסלעיים | נוגה הלוהטת | נוגה | אטמוספרה עבה: חממה, נפילה איטית | suit meter | [a](docs/levels/a.md) |
| 4 | העולמות הסלעיים | מאדים האדום | מאדים | כבידה חלשה, אוויר דליל, סופת אבק |  | [a](docs/levels/a.md) |
| 5 | העולמות הסלעיים | איפה נחתתי? | כספית | זיהוי עולם לפי עדויות: אוויר, שמיים, שמש, חום | transfer, hidden name, suit meter | [a](docs/levels/a.md) |
| 6 | כדור הארץ | ארבע הספרות | כדור הארץ | ארבע הספרות ויחסי גומלין |  | [b](docs/levels/b.md) |
| 7 | כדור הארץ | הגינה הנודדת | כדור הארץ | תנאים לקיום חיים | suit meter | [b](docs/levels/b.md) |
| 8 | כדור הארץ | שרשרת בין הספרות | כדור הארץ | יחסי גומלין בין הספרות |  | [b](docs/levels/b.md) |
| 9 | כדור הארץ | עולם בלי ספרה | כדור הארץ | זיהוי ספרה חסרה (העברה) | transfer, hidden name | [b](docs/levels/b.md) |
| 10 | הענקים | חגורת האסטרואידים | אסטרואיד | כבידה של גוף קטן, כבידה אל הגוף הקרוב |  | [a](docs/levels/a.md) |
| 11 | הענקים | צדק בלי קרקע | צדק | כוכב לכת גזי בלי קרקע, ירחים, אוקיינוס מתחת לקרח | suit meter | [a](docs/levels/a.md) |
| 12 | הענקים | טבעות שבתאי | טבעות שבתאי | כוכב לכת גזי, טבעות, מים מתחת לקרח | suit meter | [a](docs/levels/a.md) |
| 13 | הענקים | הקרים והרחוקים | אורנוס | רחוק מהשמש: קר, חשוך, שנה ארוכה | suit meter | [a](docs/levels/a.md) |
| 14 | הענקים | סלעי או גזי? | החלל העמוק | סלעי או גזי: לחזות אם יש קרקע לפי המרחק מהשמש | transfer, suit meter | [a](docs/levels/a.md) |
| 15 | אל היקום | מסלול הלוויינים | מסלול סביב כדור הארץ | לוויינים ופסולת חלל |  | [b](docs/levels/b.md) |
| 16 | אל היקום | אור שהגיע באיחור | החלל העמוק | שנת אור: לראות את העבר |  | [b](docs/levels/b.md) |
| 17 | אל היקום | מדרגות הגודל | החלל העמוק | סולם הגדלים ביקום |  | [b](docs/levels/b.md) |
| 18 | אל היקום | המסע הגדול | החלל העמוק | זיהוי עולמות (מבחן מסכם) | transfer, hidden name, no hints, suit meter | [b](docs/levels/b.md) |

## L1 · ירח הקפיצות (`l01-moon.ts`)

**Taught:** the same legs jump much higher where gravity is weaker. On the Moon (g ≈ 0.17) a full jump reaches about
6× the Earth height, and the jump gauge says so ("פי 6"). No air, so the sky is black even in daylight.

**Misconception checked:** "you jump the same everywhere." The crater rim is 9.5 m up: with Earth gravity the first
ledge alone is out of reach (tested by running the same route with Earth gravity, which fails).

**Layout:** a 14 m Moon. Spawn on the plain, a 4 m ledge, then the 9.5 m crater rim with the page. Earth hangs in the
sky behind the rim (visual target 01). A star crumb on the plain, one on the ledge, one in mid-air that needs the jet
puff.

**Solution:** hop for the first crumb, full jump to the ledge, puff jump through the air crumb, full jump to the rim,
take the page. About 10 s for the route bot.

**Wrong approaches:** short taps never reach the ledge; walking around the rim finds no ramp. Standing still never wins
(tested).

## Daily comet

Not a level: three of the levels above, picked by the date, played with the world's name and jump number hidden,
followed by a "which world was this?" choice. See `GAME_IDENTITY.md` → Replay.
