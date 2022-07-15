import { API_URL, RES_PER_PAGE, KEY } from './config';
import { AJAX } from './helpers';

//----- state ---------

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: RES_PER_PAGE,
  },
  bookmarks: [],
};

// Recipe Data

//------ Covert recipe object ----------
const createRecipeObject = function (data) {
  const { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
};

export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}${id}?key=${KEY}`);
    state.recipe = createRecipeObject(data);

    if (state.bookmarks.some(bookmark => bookmark.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;

    console.log(state.recipe);
  } catch (err) {
    console.error(`${err} 💥`);
    throw err;
  }
};

//----------- LOAD SEARCH --------

export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;

    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);
    // console.log(data);

    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image_url,
        ...(rec.key && { key: rec.key }),
      };
    });
    state.search.page = 1;
  } catch (err) {
    console.error(`${err} 💥`);
    throw err;
  }
};

// ---- Pagination Search Result List ------

export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;

  const start = (page - 1) * state.search.resultsPerPage; // page - 1 = 0 /array is 0 base
  const end = page * state.search.resultsPerPage; // slice does not include the last value, so 10 will be actually 9 on zero base array = 10
  page;
  return state.search.results.slice(start, end);
};

//-------- Update servings -------

export const updateServings = function (newServing) {
  state.recipe.ingredients.forEach(ing => {
    // newQt = oldQt * newServing / oldServings = 2 * 8 / 4 = 4
    ing.quantity = (ing.quantity * newServing) / state.recipe.servings;
  });

  state.recipe.servings = newServing;
};

//-------- Bookmarks ----------

//Save to the local storage
const persistBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

// ADD
export const addBookmark = function (recipe) {
  // add bookmark
  state.bookmarks.push(recipe);

  //Mark the current recipe as bookmarked
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;

  //Local storage
  persistBookmarks();
};

// DELETE
export const deleteBookmark = function (id) {
  //delete bookMark
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1);

  //Mark the current recipe Not bookmarked
  if (id === state.recipe.id) state.recipe.bookmarked = false;

  //Local storage
  persistBookmarks();
};

// Rerender the bookmarks from local storage
const init = function () {
  const storage = localStorage.getItem('bookmarks');
  if (storage) state.bookmarks = JSON.parse(storage);
};

init();

// GETTING DATA FROM THE API
export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].split(',').map(el => el.trim());

        if (ingArr.length !== 3)
          throw new Error(
            'Wrong ingridients format! Please entry the correct format 😊'
          );

        const [quantity, unit, description] = ingArr;
        return { quantity: quantity ? +quantity : null, unit, description };
      });

    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };

    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};
