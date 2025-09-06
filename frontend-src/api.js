import { createQueryString, messageBox } from "./lib.js";
import { jsPDF } from "jspdf";

const PREFIX = location.origin;

const req = async (url, options = {}) => {
  const { body } = options;

  return fetch((PREFIX + url).replace(/\/\/$/, ""), {
    ...options,
    body: body ? JSON.stringify(body) : null,
    headers: {
      ...options.headers,
      ...(body
        ? {
            "Content-Type": "application/json",
          }
        : null),
    },
  })
    .then((res) =>
      res.ok
        ? res.json()
        : res.text().then((message) => {
            throw new Error(message);
          }),
    )
    .catch((res) => {
      console.log(res);
      messageBox(res.message);
    });
};

export const getNotes = async ({ age, search, page } = {}) => {
  return req(createQueryString({ age, search, page }, "/notes"), {
    method: "GET",
  });
};

export const createNote = async (title, text) => {
  return req("/notes", {
    method: "POST",
    body: { title, text },
  });
};

export const getNote = async (id) => {
  const note = await req(createQueryString({ id }, "/notes"), {
    method: "GET",
  });

  return {
    title: note.data[0].title,
    html: note.data[0].text,
    text: note.data[0].text,
    isArchived: note.data[0].archived,
  };
};

export const archiveNote = (id) => {
  return req("/notes", {
    method: "PATCH",
    body: { id, archived: 1 },
  });
};

export const unarchiveNote = (id) => {
  return req("/notes", {
    method: "PATCH",
    body: { id, archived: 0 },
  });
};

export const editNote = (id, title, text) => {
  return req("/notes", {
    method: "PUT",
    body: { id, title, text },
  });
};

export const deleteNote = (id) => {
  return req("/notes", {
    method: "DELETE",
    body: { id },
  });
};

export const deleteAllArchived = () => {
  return req("/notes", {
    method: "DELETE",
  });
};

// Default export is a4 paper, portrait, using millimeters for units
export const notePdfUrl = (html) => {
  const fileName = "note.pdf";
  const doc = new jsPDF();

  doc.text(html, 10, 10);
  doc.save(fileName);
};
