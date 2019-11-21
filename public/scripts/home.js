const loadNav = () => {
  $.ajax({
    method: "POST",
    url: "/data/user/id"
  })
  .done((data) => {
    if(data){
      const markup = `
      <p> ${data.user.name}</p>
      <form class="myUser" method="GET" action="/user">
      <button  type="home-button" class="home-button btn btn-light ml-auto">My Resources</button></form>
      <form class="logout" method="POST" action="/data/logout">
      <button type="logout-button" class="logout-button btn btn-light">Logout</button>
      </form>
      `
      $("#navbar").append(markup)
    }else{
      const markup = `
      <form class="myUser" method="GET" action="/login">
      <button  type="home-button" class="home-button btn btn-light ml-auto">Login</button></form>
      <form class="myUser" method="GET" action="/register">
      <button type="logout-button" class="logout-button btn btn-light">Register</button>
      </form>
      `
      $("#navbar").append(markup)
    }
  })
  .fail(() => {
    console.log('Server down')
  });
}

const loadPins = () => {
  $.ajax({
    method: "GET",
    url: "/data/pins"
  })
  .done((data) => {
    console.log(data)
    renderPins(data)
  })
  .fail(() => {
    console.log('Server down')
  });
};

const renderPins = function(data) {
  // loops through data
  let categories = data;
  console.log(data)
  for(let catName in categories){
    const $catContainer= $(`<div class="categories ${catName}">${catName}</div> `)
    $('.feed').append($catContainer);
    for(let pinId in categories[catName]){
      const $pin = createPin(categories[catName][pinId])
      $catContainer.append($pin)
    }

  }
};

const createPin = (data) => {
  const $pin = $("<div>").addClass("pin");
  const markup = `
  <a href="/pins/${data.id}">
    <img class ="img" src=${data.image}>
    <p class = "title">${data.title}</p>
  `;
  $($pin).append(markup);
  return $pin;
};

$(() => {
  loadNav()
  loadPins()
  $('#feed)').click((event) => {
    console.log('ayyy')
    console.log(event)
  })
});
