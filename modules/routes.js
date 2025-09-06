const {
  getUser,
  addUser,
  getSession,
  createSession,
  deleteSession,
  getNotes,
  addNote,
  updateNote,
  deleteNote,
} = require("./db");
const { hash, safeCallAsync, createQueryString } = require("./lib.js");

const { NeedsAuthError, ValidationError, DatabaseError } = require("./errors.js");

const NOTES_PER_PAGE = 5; // сколько записей отдаем на одной странице

const errorHandler = (err, req, res, next) => {
  console.log("errorHandler :", err.message);

  // для авто редиректа на '/' в случае если нет авторизации
  if (err instanceof NeedsAuthError) return res.redirect("/");

  if (err instanceof ValidationError) {
    return res.status(400).send(err.message);
  }

  let msg = "Something broken!";
  if (err instanceof Error) msg = err.message;

  res.status(500).send(msg);
};

const checkAuth = async (req, res, next) => {
  const ses = await safeCallAsync(getSession, req.cookies["sesId"]); //TODO safecall

  if (ses instanceof Error) return next(new DatabaseError("can't get session"));

  // сессия найдена
  if (ses) {
    req.ses = { session: ses.session, sid: ses.sid, user: { username: ses.username } };
    res.status(200);
  }

  // нет авторизации на главной странице, /*отдаем 203*/ - 401
  if (!req.ses && req.route.path === "/") res.status(401);

  // если сессии нет и это не '/', будем делать редирект на главную
  if (!req.ses && req.route.path !== "/") return next(new NeedsAuthError("please login first"));

  next();
};

const onLogin = async (req, res, next) => {
  const { username, password } = req.body;

  const user = await safeCallAsync(getUser, username);

  if (user instanceof Error) return next(new DatabaseError("can't get user"));

  if (!user || user.password !== hash(password))
    return res.status(404).redirect(createQueryString({ authError: true }, "/"));

  const session = await safeCallAsync(createSession, user.id); //TODO safecall

  if (session instanceof Error)
    return res.status(500).redirect(createQueryString({ authError: true, internalError: true }, "/"));

  const sesId = session[0].session;

  res.cookie("sesId", sesId, { httpOnly: true });

  console.log(`Added new session : ${sesId}`);

  res.status(201).redirect("/dashboard");
};

const onSignup = async (req, res, next) => {
  const { username, password } = req.body;

  const user = await safeCallAsync(getUser, username);

  if (user instanceof Error) return next(new DatabaseError("can't get user"));

  if (user)
    return res
      .status(404)
      .redirect(createQueryString({ signupError: true, userExists: true, userName: username }, "/"));

  if (!username.length || !password.length)
    return res.status(404).redirect(createQueryString({ signupError: true, badData: true }, "/"));

  const inserted = await safeCallAsync(addUser, username, password);

  if (inserted instanceof Error)
    return res.status(500).redirect(createQueryString({ signupError: true, internalError: true }, "/"));

  console.log(`Added new user : "${username}"`);

  return res.status(201).redirect(createQueryString({ userCreated: true, userName: username }, "/"));
};

const onLogout = async (req, res, next) => {
  if (!req.ses) return;

  console.log("logging out: ", req.ses.session);

  const logout = await safeCallAsync(deleteSession, req.ses.session);

  if (logout instanceof Error) return next(new DatabaseError("can't delete session"));

  res.clearCookie("sesId");
  res.redirect("/");
};

const onVisitRoot = (req, res) => {
  if (req.ses) {
    console.log("open session :");
    console.log(req.ses);
  }

  res.render("index", {
    user: req.ses ? req.ses.user : null,

    authError: req.query.authError === "true" ? "Auth : Wrong username or password" : req.query.authError,

    signupError:
      req.query.signupError === "true"
        ? req.query.userExists === "true"
          ? `Signup : User "${req.query.userName}" exists`
          : "" + req.query.badData === "true"
            ? "Signup : Wrong name or password"
            : "" + req.query.internalError === "true"
              ? "Signup : Internal server error (:"
              : ""
        : req.query.signupError,

    userCreated:
      req.query.userCreated === "true" ? `User created! Login now with "${req.query.userName}"` : req.query.userCreated,
  });
};

const onVisitDashboard = (req, res) => {
  res.render("dashboard", {
    user: req.ses ? req.ses.user : null,
  });
};

const onGetNotes = async (req, res, next) => {
  // Начальная дата выборки
  if (["1month", "3months"].includes(req.query.age)) {
    let offset = 0;

    if (req.query.age === "1month") offset = 1;

    if (req.query.age === "3months") offset = 3;

    let d = new Date();

    d.setMonth(d.getMonth() - offset);
    d.setMinutes(0, 0, 0);

    req.query["startDate"] = d;
  }

  const data = await safeCallAsync(getNotes, req.ses.session, req.query);

  if (data instanceof Error) {
    console.log(data);
    return next(new DatabaseError("can't get notes"));
  }

  // постраничная отдача
  const page = Number(req.query.page);

  if (page) {
    const start = (page - 1) * NOTES_PER_PAGE;
    const end = start + NOTES_PER_PAGE;
    const hasMore = end < data.length;
    const dataPerPage = data.slice(start, end);

    return res.json({ data: dataPerPage, hasMore });
  }

  res.json({ data });
};

const onNewNote = async (req, res, next) => {
  const data = await safeCallAsync(addNote, req.ses.session, req.body);

  if (data instanceof Error) {
    console.log(data);
    return next(new DatabaseError("can't add note"));
  }

  res.status(201).json({ data: data[0] });
};

const onUpdateNote = async (req, res, next) => {
  const data = await safeCallAsync(updateNote, req.ses.session, req.body);

  if (data instanceof Error) {
    console.log(data);
    return next(new DatabaseError("can't update note"));
  }

  res.status(201).json({ result: true });
};

const onDeleteNote = async (req, res, next) => {
  const data = await safeCallAsync(deleteNote, req.ses.session, req.body);

  if (data instanceof Error) {
    console.log(data);
    return next(new DatabaseError("can't delete note"));
  }

  res.status(201).json({ result: true });
};

module.exports = {
  errorHandler,
  checkAuth,
  onLogin,
  onSignup,
  onLogout,
  onVisitRoot,
  onVisitDashboard,
  onGetNotes,
  onNewNote,
  onUpdateNote,
  onDeleteNote,
};
