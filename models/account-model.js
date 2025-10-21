const db = require("../database/databaseConnection")

async function getUserByEmail(user_email) {
  try {
    const sql = "SELECT user_id, user_firstname, user_lastname, user_email, user_password, user_role FROM users WHERE user_email = $1"
    const data = await db.query(sql, [user_email])
    return data.rows[0]
  } catch (error) {
    console.error("Model error: ", error)
    return null
  }
}

async function registerUser(user_firstname, user_lastname, user_email, user_password) {
  try {
    const sql = "INSERT INTO users (user_firstname, user_lastname, user_email, user_password) VALUES ($1, $2, $3, $4) RETURNING user_id, user_firstname, user_lastname, user_email, user_role"
    return await db.query(sql, [user_firstname, user_lastname, user_email, user_password])
  } catch (error) {
    console.error("Model error: ", error)
    return null
  }
}

module.exports = { getUserByEmail, registerUser }