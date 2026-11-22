const styles: Record<string, string> = {
  Easy: "bg-green-950 text-green-400",
  Medium: "bg-yellow-950 text-yellow-400",
  Hard: "bg-red-950 text-red-400",
};

export default function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[difficulty] ?? "bg-gray-800 text-gray-300"
      }`}
    >
      {difficulty}
    </span>
  );
}
