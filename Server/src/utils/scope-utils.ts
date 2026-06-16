export function calculateDepth(rootLevel: number, targetLevel: number): number {
  return Math.max(0, rootLevel - targetLevel);
}

export function roleLabel(level: number): string {
  const labels: Record<number, string> = {
    0: "Intern",
    1: "Executive",
    2: "Team Lead",
    3: "Vertical Manager",
    4: "General Manager",
    5: "Business Owner",
    6: "Super Admin",
  };

  return labels[level] ?? "Unknown";
}
