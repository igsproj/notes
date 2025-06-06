/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {

  // await knex.schema.dropTable("notes");

  return knex.schema.createTable("notes", (table) => {
    table.increments("id");
    table.integer("users_id").notNullable().defaultTo(0).references("id").inTable("users").onDelete("cascade");
    table.string("title", 100).notNullable(),
    table.text("text")
    table.tinyint ("archived").notNullable().defaultTo(0);
    table.datetime('created', {useTz: false} ).defaultTo(knex.fn.now());
    //table.datetime('created', { precision: 6 }).defaultTo(knex.fn.now(6));
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  return knex.schema.dropTable("notes");
};