"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
  $('.submit_form').hide()
  rememberFavoriteHTML()
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main_links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}


// Show create story form when user clicks on submit button in navbar
function navCreateStoryClick(e) {
  e.preventDefault();
  $('.submit_form').show();
  putStoriesOnPage();
}

const $submit = $('#submit');
$submit.on('click', navCreateStoryClick);



// Show favorites list when user clicks on my favorites in the navbar
function navPutFavoritesOnPage(e) {
  e.preventDefault()
  $allStoriesList.empty();
  $('.submit_form').hide()

  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    ($($story[0]).children().eq(0).remove())
    $allStoriesList.append($story);
  }
  $allStoriesList.show()
}

$('#favorites').on('click', navPutFavoritesOnPage)


// Shows all the user's own stories when the user clicks on my stories in the navbar
function navShowMyStories(e) {
  e.preventDefault();
  $allStoriesList.empty();
  $('.submit_form').hide()

  for (let story of currentUser.ownStories) {
    const $story = generateStoryMarkup(story);
    // $story.append("<span>&#128465</span>");
    $($story[0]).children().eq(2).append("<span class='trash'>&#128465</span>");
    $allStoriesList.append($story);
    $('.trash').on('click', deleteOwnStories)
  }
  $allStoriesList.show()
}

$('#my_stories').on('click', navShowMyStories);