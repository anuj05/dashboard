// scripts/seed.ts
import { GET } from '../app/seed/route';

(async () => {
  const res = await GET();
  console.log(await res.json());
})();
