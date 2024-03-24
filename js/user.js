"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */

/** Handle login form submission. If login ok, sets up the user instance */

async function login(evt) {
  console.debug("login", evt);
  evt.preventDefault();

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();

  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.login(username, password);

  $loginForm.trigger("reset");

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();
}

$loginForm.on("submit", login);

/** Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  // User.signup retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.signup(username, password, name);

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();

  $signupForm.trigger("reset");
}

$signupForm.on("submit", signup);

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  localStorage.clear();
  location.reload();
}

$navLogOut.on("click", logout);

/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

async function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");

  await getAndShowStoriesOnStart()
  $loginForm.hide();
  $signupForm.hide();
  updateNavOnLogin();

  rememberFavoriteHTML()

}


// adds fovorites to database as well as the user object, handles if user wants to remove favorite as well
async function addFavorites(e, currentUser) {
  
  // collect necessary info to make axios post request later
  const li = ($(e.target).parent())
  const storyId = li.attr('id');
  const username = currentUser.username
  const token = currentUser.loginToken

  // changes the star html when it is clicked on so that it indicates a story as being a favorite
  updateFavoriteHTMLOnClick(e)
  
  // if user clicks to remove a favoite, then it calls the remove favorites function
  if ($(e.target).html() === '☆') {
    await removeFavorites(e, username, token)
    return;
  }

  // makes post request to add favorite to the database
  const response = await axios({
    method: "POST",
    url: `${BASE_URL}/users/${username}/favorites/${storyId}`,
    data: {token}
  })
  
  // updates favorites array in the user object 
  const favorites = response.data.user.favorites.map((fav) => new Story(fav))
  currentUser.favorites = favorites;
}

// changes the html of the star when it is clicked
function updateFavoriteHTMLOnClick(e) {
  const newStar = ($(e.target).html() === '☆') ? '★' : '☆';
  $(e.target).html(newStar)
}

// when page refreshes, or when user logins, the favorited stories still have a dark star next to them
function rememberFavoriteHTML () {
  const favorites = currentUser.favorites
  const allStories = $allStoriesList.children()
  
  // if a fovorite story ID matches with a specific story, then change the star for that story
  for (let favorite of favorites) {
    for (let story of allStories) {
      if (favorite.storyId === $(story).attr('id')) {
        const newStar = ($(story).children()[0].innerHTML === '☆') ? '★' : '☆';
        $(story).children()[0].innerHTML = newStar
      }
    }
  }
}


// removes favorite form the database 
async function removeFavorites(e, username, token) {
  const storyId = $(e.target).parent().attr('id')
  
  // loops through the user favorites array to match the one that was clicked on
  for (let i = 0; i < currentUser.favorites.length; i++) {
    
    // deletes the specific story from the user favorites array as well as deletes the story from the database
    if (storyId === currentUser.favorites[i].storyId) {
      currentUser.favorites.splice(i,1);
      
      const response = await axios({
        method: "DELETE",
        url: `${BASE_URL}/users/${username}/favorites/${storyId}`,
        data: {token}
      })
      
      break;
    }
  }
}


// deteles the user's own stories that he posted from the page as well as the database
async function deleteOwnStories(e) {

  const storyId = $(e.target).parent().parent().attr('id')
  const token = currentUser.loginToken
  const ownStories = currentUser.ownStories
  
  // removes the specific story that was clicked from the own stories array in the user object
  for (let i = 0; i < ownStories.length; i++){
    if (ownStories[i].storyId === storyId){
      ownStories.splice(i,1)
    }
  }

  // removes the story form the page 
  $(e.target).parent().parent().remove()

  // deletes the story from the database by making a delete request to the api
  const response = await axios({
    url: `${BASE_URL}/stories/${storyId}`,
    method: 'DELETE',
    data: {token}
  })

  // removes the specific story from the overall story list object as well
  for (let i = 0; i < storyList.stories.length; i++) {
    if (storyList.stories[i].storyId === storyId) {
      storyList.stories.splice(i,1)
    }
  }
}

