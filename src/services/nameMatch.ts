export function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-zäöüß\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSimilar(a: string, b: string) {
  const A = normalizeName(a);
  const B = normalizeName(b);

  return A === B || A.includes(B) || B.includes(A);
}