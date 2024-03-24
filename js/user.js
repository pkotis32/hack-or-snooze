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



async function addFavorites(e, currentUser) {
  
  
  const li = ($(e.target).parent())
  const storyId = li.attr('id');
  const username = currentUser.username
  const token = currentUser.loginToken

  updateFavoriteHTMLOnClick(e)
  if ($(e.target).html() === '☆') {
    await removeFavorites(e, username, token)
    return;
  }

  
  const response = await axios({
    method: "POST",
    url: `${BASE_URL}/users/${username}/favorites/${storyId}`,
    data: {token}
  })
  
  const favorites = response.data.user.favorites.map((fav) => new Story(fav))
  
  currentUser.favorites = favorites;
}


function updateFavoriteHTMLOnClick(e) {
  const newStar = ($(e.target).html() === '☆') ? '★' : '☆';
  $(e.target).html(newStar)
}


function rememberFavoriteHTML () {
  const favorites = currentUser.favorites
  const allStories = $allStoriesList.children()
  for (let favorite of favorites) {
    for (let story of allStories) {
      if (favorite.storyId === $(story).attr('id')) {
        const newStar = ($(story).children()[0].innerHTML === '☆') ? '★' : '☆';
        $(story).children()[0].innerHTML = newStar
      }
    }
  }
}


async function removeFavorites(e, username, token) {
  const storyId = $(e.target).parent().attr('id')
  for (let i = 0; i < currentUser.favorites.length; i++) {
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


async function deleteOwnStories(e) {

  const storyId = $(e.target).parent().parent().attr('id')
  const token = currentUser.loginToken
  const ownStories = currentUser.ownStories
  
  for (let i = 0; i < ownStories.length; i++){
    if (ownStories[i].storyId === storyId){
      ownStories.splice(i,1)
    }
  }

  $(e.target).parent().parent().remove()


  const response = await axios({
    url: `${BASE_URL}/stories/${storyId}`,
    method: 'DELETE',
    data: {token}
  })


  for (let i = 0; i < storyList.stories.length; i++) {
    if (storyList.stories[i].storyId === storyId) {
      storyList.stories.splice(i,1)
    }
  }
}

