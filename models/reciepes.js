import { DatabaseSync } from "node:sqlite";

const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);

console.log("Creating database tables");
db.exec(
  `CREATE TABLE IF NOT EXISTS rc_collections (
    collection_id INTEGER PRIMARY KEY,
    id            TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS rc_recipes (
    id            INTEGER PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES rc_collections(collection_id) ON DELETE NO ACTION,
    title         TEXT NOT NULL,
    ingredients   TEXT NOT NULL, -- JSON array as TEXT
    instructions  TEXT NOT NULL,
    cook_time_min INTEGER,
    servings      INTEGER
  ) STRICT;`
);

const db_ops = {
  insert_collection: db.prepare(
    `INSERT INTO rc_collections (id, name)
        VALUES (?, ?) RETURNING collection_id, id, name;`
  ),
  insert_recipe: db.prepare(
    `INSERT INTO rc_recipes (collection_id, title, ingredients, instructions, cook_time_min, servings)
        VALUES (?, ?, ?, ?, ?, ?) RETURNING id, title;`
  ),
};

const categories = {
  "dania-glowne": {
    name: "Dania główne",
    recipes: [
      {
        title: "Kurczak pieczony z ziemniakami",
        ingredients: ["1 kg kurczaka", "500 g ziemniaków", "sól", "pieprz", "oliwa"],
        instructions: "Przypraw kurczaka, ułóż z ziemniakami, piecz 60 min w 200°C.",
        cook_time_min: 70,
        servings: 4,
      },
    ],
  },
  "desery": {
    name: "Desery",
    recipes: [
      {
        title: "Szarlotka",
        ingredients: ["jabłka", "mąka", "cukier", "masło", "cynamon"],
        instructions: "Przygotuj ciasto, wyłóż jabłka, piecz 50 min.",
        cook_time_min: 80,
        servings: 8,
      },
    ],
  },
};

export function getCategorySummaries() {
  return Object.entries(categories).map(([id, c]) => ({ id, name: c.name }));
}

export function hasCategory(id) {
  return Object.prototype.hasOwnProperty.call(categories, id);
}

export function getCategory(id) {
  if (!hasCategory(id)) return null;
  return { id, name: categories[id].name, recipes: categories[id].recipes };
}

export function addRecipe(categoryId, recipe) {
  if (!hasCategory(categoryId)) return false;
  categories[categoryId].recipes.push(recipe);
  return true;
}

export function validateRecipeData(recipe) {
  const errors = [];
  if (!recipe || typeof recipe !== "object") {
    errors.push("Brak danych przepisu");
    return errors;
  }
  if (!recipe.title || typeof recipe.title !== "string" || recipe.title.trim() === "")
    errors.push("Brak tytułu przepisu");
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0)
    errors.push("Składniki muszą być niepustą tablicą");
  if (!recipe.instructions || typeof recipe.instructions !== "string" || recipe.instructions.trim() === "")
    errors.push("Brak instrukcji przygotowania");
  if (recipe.cook_time_min !== undefined && recipe.cook_time_min !== null) {
    if (!Number.isInteger(recipe.cook_time_min) || recipe.cook_time_min < 0)
      errors.push("Czas przygotowania musi być nieujemną liczbą całkowitą");
  }
  if (recipe.servings !== undefined && recipe.servings !== null) {
    if (!Number.isInteger(recipe.servings) || recipe.servings <= 0)
      errors.push("Porcje muszą być dodatnią liczbą całkowitą");
  }
  return errors;
}

export default {
  getCategorySummaries,
  hasCategory,
  getCategory,
  addRecipe,
  validateRecipeData,
};