# Official GATE papers

`cs.json` lists every official GATE CS paper the app serves; the PDFs live in
`public/papers/cs/`. Both are produced by
`scripts/official-papers/build.py` from the owner's folder of official PDFs,
which also extracts the answer keys printed inside some of them.

## Adding an answer key

A paper becomes gradeable (practice checking + timed mock) as soon as it has a
valid key file:

1. Get the **official** answer key PDF published by that year's organising
   institute (never a coaching institute's key).
2. Create `keys/<paper id>.csv` (ids are in `cs.json`, e.g. `cs-2025-1.csv`):

   ```csv
   section,number,type,key,marks
   GA,1,MCQ,B,1
   GA,6,MCQ,C,2
   CS,1,NAT,11 to 11,1
   CS,14,MSQ,A;C,1
   CS,27,NAT,197.9 to 198.1,2
   CS,30,NAT,13.3 to 13.3 OR 13.5 to 13.5,2
   CS,41,MCQ,MTA,2
   ```

   - `section`: `GA` or `CS`, numbered as printed on the paper.
   - `type`: `MCQ`, `MSQ` or `NAT`.
   - `key`: an option letter (MCQ); letters joined with `;` (MSQ); an
     inclusive range `a to b` (NAT), with ` OR ` between several accepted
     ranges; or `MTA` when the official key says *marks to all*.
   - `marks`: 1 or 2.

3. Run `npm run db:seed` (locally, and against production with the Neon URLs).

The seed checks every key file: 10 GA + 55 CS questions, 100 marks, and every
key readable. A file that fails is ignored and the paper stays "paper only".
