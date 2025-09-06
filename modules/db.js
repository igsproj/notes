const knexSettings = require("../knexfile.js");
const knex = require("knex")(knexSettings);
const { nanoid } = require("nanoid");
const { UserNotFoundError } = require("./errors.js");
const { hash, isValidString, runAsFunction } = require("./lib.js");

/***************************************
common
***************************************/

const selectTableBy = async (table, condition, mappings, limit = 1) => {
  if (isValidString(condition))
    return knex(table)
      .select()
      .whereRaw(condition, mappings)
      .limit(limit)
      .then((result) => (limit > 1 ? result : result[0]));

  return knex(table)
    .select()
    .where(condition)
    .limit(limit)
    .then((result) => (limit > 1 ? result : result[0]));
};

const insertTable = async (table, records, returnArr = ["id"]) => {
  return knex(table).insert(records).returning(returnArr);
};

/***************************************
users
***************************************/

const getUser = async (username) => {
  return selectTableBy("users", { username: username ?? "" });
};

const addUser = async (username, password) => {
  const passHash = hash(password);
  return insertTable("users", { username: username, password: passHash });
};

/***************************************
sessions
***************************************/

// для сессии лучше сразу получить имя пользователя
const getSession = async (session) => {
  return knex
    .raw(
      "select s.id sid, s.session, u.id uid, u.username from sessions s, users u where u.id = s.users_id and s.session = ?",
      session ?? "",
    )
    .then((result) => result.rows[0]);
};

const createSession = async (uid) => {
  const user = await selectTableBy("users", { id: uid ?? "" });
  if (!user) return new UserNotFoundError();

  const sesId = nanoid();
  return insertTable("sessions", { users_id: user.id, session: sesId }, ["session", "users_id"]);
};

const deleteSession = async (session) => {
  return knex("sessions").where("session", session).del();
};

const sessionCheckWrap = async (sesId, fn, ...params) => {
  const user = await selectTableBy("sessions", { session: sesId });

  if (!user) return new UserNotFoundError(`can't find user for session "${sesId}"`);

  return runAsFunction(fn)(user, ...params);
};

/***************************************
notes
***************************************/

const getNotes = async (sesId, getOptions) => {
  return sessionCheckWrap(
    sesId,
    async (user) => {
      let options = `users_id = ?`;
      let mappings = [];
      let data;

      mappings[0] = user.users_id;

      if (getOptions.id) {
        options += " and id = ?";
        mappings[mappings.length] = getOptions.id;
      }

      if (!getOptions.id) {
        if (getOptions.age === "archive") options += " and archived = 1";
        else options += " and archived = 0";

        if (getOptions.startDate) {
          options += " and created >= ?";
          mappings[mappings.length] = getOptions.startDate;
        }
      }

      // console.log(options)
      // console.log(mappings)

      if (getOptions.search)
        data = await knex("notes")
          .select()
          .whereRaw(options, mappings)
          .whereLike("title", `${getOptions.search}%`)
          .orderBy("created");
      else data = await knex("notes").select().whereRaw(options, mappings).orderBy("created");

      return data;
    },
    getOptions,
  );
};

const addNote = async (sesId, records) => {
  return sessionCheckWrap(
    sesId,
    async (user) => {
      records["users_id"] = user.users_id;
      return insertTable("notes", records, ["id", "title", "text", "archived", "created"]);
    },
    records,
  );
};

const updateNote = async (sesId, records) => {
  return sessionCheckWrap(
    sesId,
    async (user) => {
      const id = records.id;
      delete records["id"];

      return knex("notes")
        .where("id", "=", id)
        .andWhere("users_id", "=", user.users_id)
        .update(records)
        .returning(["id", "title", "text", "archived", "created"]);
    },
    records,
  );
};

const deleteNote = async (sesId, records) => {
  return sessionCheckWrap(
    sesId,
    async (user) => {
      let options = `archived = 1 and users_id = ?`;
      let mappings = [];

      mappings[0] = user.users_id;

      if (records.id) {
        options += " and id = ?";
        mappings[mappings.length] = records.id;
      }

      return knex("notes").whereRaw(options, mappings).delete();
      //.returning(["id", "title", "text", "archived", "created"]);
    },
    records,
  );
};

module.exports = {
  getUser,
  addUser,
  getSession,
  createSession,
  deleteSession,
  getNotes,
  addNote,
  updateNote,
  deleteNote,
};
