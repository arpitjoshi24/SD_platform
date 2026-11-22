const { pool } = require("../config/db");


// Get all published challenges
const findAllChallenges = async () => {
  const query = `
    SELECT
      id,
      title,
      slug,
      description,
      difficulty,
      category,
      estimated_time,
      requirements,
      hints,
      created_at,
      updated_at
    FROM challenges
    WHERE is_published = TRUE
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query);

  return result.rows;
};


// Get one challenge by ID
const findChallengeById = async (id) => {
  const query = `
    SELECT
      id,
      title,
      slug,
      description,
      difficulty,
      category,
      estimated_time,
      requirements,
      hints,
      created_at,
      updated_at
    FROM challenges
    WHERE id = $1
      AND is_published = TRUE
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0];
};


module.exports = {
  findAllChallenges,
  findChallengeById,
};

// Evaluation rules are private: they describe the "answer",
// so they are NOT part of the public challenge payload above.
const findChallengeEvaluationConfig = async (id) => {
  const query = `
    SELECT id, title, evaluation_config
    FROM challenges
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0];
};

module.exports.findChallengeEvaluationConfig = findChallengeEvaluationConfig;
