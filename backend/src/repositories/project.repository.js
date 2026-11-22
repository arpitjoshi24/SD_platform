const { pool } = require("../config/db");

// Create a new project
const createProject = async ({
  user_id,
  challenge_id,
  title,
}) => {
  const query = `
    INSERT INTO user_projects (
      user_id,
      challenge_id,
      title
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      user_id,
      challenge_id,
      title,
      nodes,
      edges,
      status,
      created_at,
      updated_at
  `;

  const result = await pool.query(query, [
    user_id,
    challenge_id,
    title,
  ]);

  return result.rows[0];
};


// Get all projects belonging to a user
const findProjectsByUserId = async (user_id) => {
  const query = `
    SELECT
      id,
      challenge_id,
      title,
      nodes,
      edges,
      status,
      created_at,
      updated_at
    FROM user_projects
    WHERE user_id = $1
    ORDER BY updated_at DESC
  `;

  const result = await pool.query(query, [user_id]);

  return result.rows;
};

const findProjectById = async (project_id, user_id) => {
  const query = `
    SELECT
      id,
      user_id,
      challenge_id,
      title,
      nodes,
      edges,
      status,
      created_at,
      updated_at
    FROM user_projects
    WHERE id = $1
      AND user_id = $2
  `;

  const result = await pool.query(query, [
    project_id,
    user_id,
  ]);

  return result.rows[0];
};
const updateProject = async ({
  project_id,
  user_id,
  title,
  nodes,
  edges,
  status,
}) => {
  const query = `
    UPDATE user_projects
    SET
      title = COALESCE($3, title),
      nodes = COALESCE($4, nodes),
      edges = COALESCE($5, edges),
      status = COALESCE($6, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND user_id = $2
    RETURNING
      id,
      user_id,
      challenge_id,
      title,
      nodes,
      edges,
      status,
      created_at,
      updated_at
  `;

  const result = await pool.query(query, [
    project_id,
  user_id,
  title ?? null,
  nodes ? JSON.stringify(nodes) : null,
  edges ? JSON.stringify(edges) : null,
  status ?? null,
  ]);

  return result.rows[0];
};

module.exports = {
  createProject,
  findProjectsByUserId,
  findProjectById,
  updateProject
};