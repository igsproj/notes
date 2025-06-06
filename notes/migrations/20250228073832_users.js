/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async (knex) => {
  return knex.schema.createTable("users", (table) => {
    table.increments("id");
    table.string("username", 50).notNullable();
    table.string("password", 100).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  return knex.schema.dropTable("users");
};
