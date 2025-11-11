import express from "express";
import morgan from "morgan";
import recipes from "./models/reciepes.js";

const port = 8000;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded());
app.use(morgan("dev"));

function log_request(req, res, next) {
  console.log(`Request ${req.method} ${req.path}`);
  next();
}
app.use(log_request);

app.get("/recipes", (req, res) => {
  res.render("categories", {
    title: "Kategorie przepisów",
    categories: recipes.getCategorySummaries(),
  });
});

app.get("/recipes/:category_id", (req, res) => {
  const category = recipes.getCategory(req.params.category_id);
  if (category != null) {
    res.render("category", {
      title: category.name,
      category,
      // defaults for the form partial
      recipe: null,
      errors: [],
    });
  } else {
    res.sendStatus(404);
  }
});

app.post("/recipes/:category_id/new", (req, res) => {
  const category_id = req.params.category_id;
  if (!recipes.hasCategory(category_id)) {
    res.sendStatus(404);
    return;
  }

  // Zamiana pola ingredients (textarea — jeden składnik na wiersz) na tablicę stringów
  const rawIngredients = req.body.ingredients || "";
  const ingredientsArray = rawIngredients
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const recipe_data = {
    title: req.body.title,
    ingredients: ingredientsArray,
    instructions: req.body.instructions,
    cook_time_min:
      req.body.cook_time_min !== undefined && req.body.cook_time_min !== ""
        ? parseInt(req.body.cook_time_min, 10)
        : undefined,
    servings:
      req.body.servings !== undefined && req.body.servings !== ""
        ? parseInt(req.body.servings, 10)
        : undefined,
  };

  const errors = recipes.validateRecipeData(recipe_data);
  if (errors.length === 0) {
    recipes.addRecipe(category_id, recipe_data);
    res.redirect(`/recipes/${category_id}`);
  } else {
    const category = recipes.getCategory(category_id) || { id: category_id, name: "Kategoria" };
    res.status(400);
    res.render("category", {
      errors,
      title: `Nowy przepis — ${category.name}`,
      category,
      // Prefill form fields in the view
      recipe: {
        title: req.body.title,
        ingredients: rawIngredients,
        instructions: req.body.instructions,
        cook_time_min: req.body.cook_time_min,
        servings: req.body.servings,
      },
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});