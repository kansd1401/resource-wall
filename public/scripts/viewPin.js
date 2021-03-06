let boards;
let pinId;
let pinOwner;
let userId;
const loadNav = () => {
  $.ajax({
      method: "POST",
      url: "/data/user/id"
    })
    .done(data => {
      if (data) {
        const markup = `
      <div class="dropdown">
        <button class="nav-btn dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        ${data.user.name}
        </button>
        <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
          <a class="dropdown-item" href="/pins/new">Add Resource</a>
          <a class="dropdown-item" href="/user">My Boards</a>
          <a class="dropdown-item" href="/user/pins">My Pins</a>
          <a class="dropdown-item" href="/user/settings">Profile Settings</a>
          <a class="dropdown-item" href="/data/logout">Logout</a>
        </div>
      </div>
      `;
        userId = data.user.id;
        $("#navbar").append(markup);
      } else {
        const markup = `
      <form class="noUser" method="GET" action="/login">
        <button  type="home-button" class="home-button ml-auto nav-btn">Login</button>
      </form>
      <form class="noUser" method="GET" action="/register">
        <button type="register-button" class="register-button nav-btn">Register</button>
      </form>
      `;
        $("#navbar").append(markup);
        userId = 0;
      }
    })
    .fail(() => {
      console.log("Server down");
    });
};

const viewPin = () => {
  $.ajax({
    method: "GET",
    url: `/data/pins/${pinId}`
  })
  .done((data) => {
    pinOwner = data[pinId].owner_id;
    if(userId !== pinOwner){
      $('#delete').attr("style","visibility: hidden")
    }
    $(".title").text(data[pinId].title)
    $(".image").attr("src",data[pinId].image)
    $(".url").attr("href",data[pinId].url)
    $(".description").text(data[pinId].description)
  })
  .fail(() => {
    console.log('Server down')
  });
};

const loadBoards = () => {
  $.ajax({
      method: "GET",
      url: "/data/user/boards"
    })
    .done(data => {
      boards = data;
      renderBoards();
    })
    .fail(() => {
      console.log("Server down");
    });
};

const renderBoards = function () {
  $("#dropBoards").empty();
  $("#create-board").slideUp();
  let keys = Object.keys(boards);
  if (keys.length === 0) {
    $("#dropBoards").append(`<option>--</option>`);
  } else {
    for (let i = keys.length - 1; i >= 0; i--) {
      $("#dropBoards").append(`<option>${boards[keys[i]].title}</option>`);
    }
  }
  $("#dropBoards").append(`<option>Create a Board</option>`);
};

const getBoardId = selected => {
  for (let i in boards) {
    if (boards[i]["title"] === selected) {
      return i;
    }
  }
};

const loadComments = function () {
  $.ajax({
      method: "GET",
      url: `/data/pins/${pinId}/comments`
    })
    .done(data => {
      console.log(data);
      renderComments(data);
    })
    .fail(() => {
      console.log("Failed to retrieve comments in AJAX request");
    });
};

const renderComments = function (data) {
  $(".comment-section").empty();
  for (const comment in data) {
    const $comment = createComment(data[comment]);
    $(".comment-section").append($comment);
  }
};

const createComment = function (data) {
  const $comment = $("<div>").addClass("comment");
  const markup = `
  <img class="comment-image"src="${data.image}">
  <div>
    <p class="commenter">${data.name}</p>
    <p class="comment-text">${data.text}</p>
    <div>
  `;
  $($comment).append(markup);
  return $comment;
};

const loadRating = function () {
  $.ajax({
    method: "GET",
    url: `/data/pins/${pinId}/rating`
  }).done(data => {
    if (data.rating) {
      let rating = data.rating["avg_rating"];
      if (rating % 1 === 0) {
        rating = Math.floor(rating);
      } else {
        rating = rating.toFixed(2);
      }
      $("#rating").append(`<p>Average: ${rating} / 5</p>`);
    } else {
      $("#rating").append(`<p>Not rated yet</p>`);
    }

    $.ajax({
      method: "GET",
      url: `/data/pins/${pinId}/rating/userRating`
    }).done(data => {
      if (data.rating) {
        const stars = [
          "",
          "starOne",
          "starTwo",
          "starThree",
          "starFour",
          "starFive"
        ];
        $star = $(`.${stars[data.rating]}`);
        $star.addClass("checked");
        $star.prevAll().addClass("checked");
        $star.nextAll().removeClass("checked");
      } else {
        $(".starOne").removeClass("checked");
        $(".starOne")
          .nextAll()
          .removeClass("checked");
      }
    });
  });
};

const ratePin = function () {
  $(".fa-star").hover(function () {
    $(this).addClass("checked");
    $(this)
      .prevAll()
      .addClass("checked");
    $(this)
      .nextAll()
      .removeClass("checked");
  });

  $(".fa-star").click(function () {
    let rating;

    if ($(this).hasClass("starOne")) {
      rating = 1;
    }

    if ($(this).hasClass("starTwo")) {
      rating = 2;
    }

    if ($(this).hasClass("starThree")) {
      rating = 3;
    }

    if ($(this).hasClass("starFour")) {
      rating = 4;
    }

    if ($(this).hasClass("starFive")) {
      rating = 5;
    }

    $.ajax({
      method: "POST",
      url: `/data/pins/${pinId}/rating`,
      data: {
        rating: rating
      }
    });
  });
};

$(() => {
  const url = window.location.pathname;
  const urlArr = url.split("/");
  pinId = urlArr[urlArr.length - 1];
  $("#create-board").slideUp(10);
  $('#delete').attr('action',`/data/boards/delete/${pinId}`)
  loadNav()
  viewPin()
  loadBoards()
  loadComments()
  loadRating()
  ratePin()
  console.log(userId,pinOwner)
  $('#delete').click((event) => {
    event.preventDefault();
    $.ajax({
      method: "POST",
      url: `/data/pins/delete`,
      data: { pin_id: pinId}
    })
    .done(() => {
      window.location.href = "/";
    })
  })
  $( "#dropBoards" ).change(() => {
    const value = $('#dropBoards').val();
    if(value == 'Create a Board'){
      $("#create-board").slideDown();
    }
  });
  $("#btn-board").click(event => {
    event.preventDefault();
    $.ajax({
      method: "POST",
      url: `/data/boards/new`,
      data: {
        title: $("#title-board").val(),
        description: $("#description-board").val(),
        image: $("#image-board").val()
      }
    }).done(loadBoards());
  });
  $(".post-comment").click(event => {
    event.preventDefault();
    console.log($('.comment-input').val())
    $.ajax({
        method: "POST",
        url: `/data/pins/${pinId}/addComment`,
        data: {
          pin_id: pinId,
          comment: $('.comment-input').val()
        }
      })
      .done(loadComments())
  })
  $('#addPin').click((event) => {
    event.preventDefault();
    const boardSelected = $("#dropBoards").val();
    const boardId = getBoardId(boardSelected);
    $.ajax({
      method: "POST",
      url: `/data/boards/addPin`,
      data: {
        pin_id: pinId,
        board_id: boardId
      }
    }).done(() => {
      window.location.href = "/";
    });
  });
});
