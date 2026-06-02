export function calculateDepth(rootLevel: number, targetLevel: number): number {
  return Math.max(0, rootLevel - targetLevel);
}

export function roleLabel(level: number): string {
  const labels: Record<number, string> = {
    0: "Intern",
    1: "Executive",
    2: "Manager",
    3: "Head",
    4: "Business Owner",
    5: "Super Admin",
  };

  return labels[level] ?? "Unknown";
}
