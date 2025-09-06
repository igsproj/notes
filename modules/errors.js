class NeedsAuthError extends Error {}
class UserNotFoundError extends Error {}
class QueryParamsError extends Error {}
class ValidationError extends Error {}
class DatabaseError  extends Error {}

module.exports = { NeedsAuthError, UserNotFoundError, QueryParamsError, ValidationError, DatabaseError }