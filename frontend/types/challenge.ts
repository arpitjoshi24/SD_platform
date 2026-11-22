export interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  estimated_time: number;
  requirements: string[];
  hints: string[];
  created_at: string;
  updated_at: string;
}
