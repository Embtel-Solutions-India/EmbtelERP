export function calculateDepth(rootLevel, targetLevel) {
    return Math.max(0, rootLevel - targetLevel);
}
export function roleLabel(level) {
    const labels = {
        0: "Intern",
        1: "Executive",
        2: "Manager",
        3: "Head",
        4: "Business Owner",
        5: "Super Admin",
    };
    return labels[level] ?? "Unknown";
}
