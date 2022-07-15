import * as model from './model';
import { MODAL_CLOSE_SEC } from './config';
import recipeView from './views/recipeView';
import searchView from './views/searchView';
import resultsView from './views/resultsView';
import paginationView from './views/paginationView';
import bookmarksView from './views/bookmarksView';
import addRecipeView from './views/addRecipeView';

import 'core-js/stable';
import 'regenerator-runtime/runtime';

// https://forkify-api.herokuapp.com/v2

///////////////////////////////////////

// Parcel
if (module.hot) {
  module.hot.accept();
}
//------------ RECIPES -----------

const controlRecipes = async function () {
  try {
    // //Getting the recipe hash-id
    const id = window.location.hash.slice(1); // slice the # off the hash-id
    // console.log(id);

    //guard clause when does not have a id
    if (!id) return;
    // Render Spinner
    recipeView.renderSpinner();

    // 0. update results view to mark selected search results
    resultsView.update(model.getSearchResultsPage());

    // 1. Updating bookmarks view
    bookmarksView.update(model.state.bookmarks);

    // 2. Calling the model to load the recipe/passing the id/getting the recipe data
    await model.loadRecipe(id);

    // 3. Render Recipe
    recipeView.render(model.state.recipe);
  } catch (err) {
    recipeView.renderError();
  }
};

// ------- SEARCH RESULTS -------

const controlSearchResults = async function () {
  try {
    // 0. Render Spinner
    resultsView.renderSpinner();
    // console.log(resultsView);
    // 1. Get search query
    const query = searchView.getQuery();
    if (!query) return;

    // 2. Load search results
    await model.loadSearchResults(query);

    // 3. Render initial results
    resultsView.render(model.getSearchResultsPage());

    // 4. Render initial the pagination button
    paginationView.render(model.state.search);
  } catch (err) {
    console.log(err);
  }
};

//---------- Pagination --------

const controlPagination = function (goToPage) {
  // 1. Render NEW results
  resultsView.render(model.getSearchResultsPage(goToPage));

  // 2. Render NEW the pagination button
  paginationView.render(model.state.search);
};

//-------- Serverings ----------

const controlServings = function (newServings) {
  // Update the recipe serving (in state)
  model.updateServings(newServings);
  // console.log(newServings);

  // Update the recipe view
  recipeView.update(model.state.recipe);
};

//---------- Add BookMark ------

const controlAddBookmark = function () {
  // 1. Add/ Remove bookmark
  if (!model.state.recipe.bookmarked) model.addBookmark(model.state.recipe);
  else model.deleteBookmark(model.state.recipe.id);

  // 2. Update recipe view
  recipeView.update(model.state.recipe);

  // 3. Render bookmark
  bookmarksView.render(model.state.bookmarks);
};

// Bookmarks local storage

const controlBookmarks = function () {
  bookmarksView.render(model.state.bookmarks);
};

// New recipe from the form

const controlAddRecipe = async function (newRecipe) {
  try {
    // Loading Spinner
    addRecipeView.renderSpinner();

    //upload the new recipe data
    await model.uploadRecipe(newRecipe);
    console.log(model.state.recipe);

    // render recipe
    recipeView.render(model.state.recipe);

    // success message
    addRecipeView.renderMessage();

    // render bookmark view
    bookmarksView.render(model.state.bookmarks);

    // Change ID in the URL
    window.history.pushState(null, '', `#${model.state.recipe.id}`);
    // window.history.back()

    // close form window
    setTimeout(function () {
      addRecipeView.toggleWindow();
    }, MODAL_CLOSE_SEC * 1000);
  } catch (err) {
    console.error('💥', err);
    addRecipeView.renderError(err.message);
  }
};

//------ INIT ------------

const init = function () {
  bookmarksView.addHandlerRender(controlBookmarks);
  recipeView.addHandlerRender(controlRecipes);
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerAddBookMark(controlAddBookmark);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addHandlerUpload(controlAddRecipe);
};
init();
