/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  return knex.schema.createTable("sessions", (table) => {
    table.increments("id");
    table.integer("users_id").notNullable().defaultTo(0).references("id").inTable("users").onDelete("cascade");
    table.string("session", 50).notNullable().unique(); //index("session_idx");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  return knex.schema.dropTable("sessions");
};
