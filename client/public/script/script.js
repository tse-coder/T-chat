const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("connected");
});

const goToMenu = () => {
  $(".menu-page").css("display", "grid");
};

const enableEdit = () => {
  $("#username").removeAttr("disabled");
  $("#finish").css("display", "block");
  $("#edit").css("display", "none");
};

const exitMenu = () => {
  $(".menu-page").css("display", "none");
};

const finishEdit = async (oldName) => {
  await $.ajax({
    url: "/updateUser",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      oldName: oldName,
      newName: $("#username").val(),
    }),
  });
  $("#finish").css("display", "none");
  $("#edit").css("display", "block");
  $("#username").attr("disabled", "true");
};

const makeTime = (time) => {
  const date = time === "now" ? new Date() : new Date(time);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  seconds = seconds < 10 ? `0${seconds}` : seconds;
  return `${hours}:${minutes}:${seconds}`;
};

let joinedUser;
let picker;
let emojiBtn;

const join = async (sender, receiver, pp, status) => {
  if (joinedUser !== receiver) {
    joinedUser = receiver;
    const room = [sender, receiver].sort().join("-").replace(/\s/g, "");
    sessionStorage.setItem("room", room);
    socket.emit("joinroom", room);
    console.log(`${sender} joined room ${room}`);

    const friendimg = $("<img>").attr("src", pp).addClass("pp");
    const friendbox = $(".right");
    const friendname = $("<div>").html(
      `<p>${receiver}</p><p class='status'>${status}</p>`
    );

    friendbox.empty().append(friendimg, friendname);

    const messageBox = $("<div>").addClass("message-box").html(`
            <button id="emojiBtn"><img src="./images/emoji.png" id="emoji-btn" alt="emoji"></button>
            <emoji-picker id="emojiPicker"></emoji-picker>
            <input type="text" placeholder="message.." name="message" id="message">
            <button><img src="./images/send.png" alt=""></button>
        `);

    $(".chat-box").empty().append(messageBox);

    messageBox.find("button:last").on("click", () => {
      sendMessage(sender, receiver, $("#message").val());
    });

    let messages = await $.getJSON(`/getMessages?sender=${sender}`);
    messages.forEach((msg) => {
      const fullTime = makeTime(msg.createdAt);
      const msgbox = $("<div>").html(
        `<p>${msg.message}</p><p class="time">${fullTime}</p>`
      );

      if (msg.sender === sender && msg.receiver === receiver) {
        msgbox.addClass("out box");
        $(".chat-box").append(msgbox);
      } else if (msg.sender === receiver && msg.receiver === sender) {
        msgbox.addClass("in box");
        $(".chat-box").append(msgbox);
      }
    });

    picker = $("#emojiPicker");
    emojiBtn = $("#emojiBtn");

    emojiBtn.on("click", () => {
      picker.css(
        "display",
        picker.css("display") === "none" ? "block" : "none"
      );
    });

    picker.on("emoji-click", (event) => {
      $("#message").val($("#message").val() + event.detail.unicode);
    });
  }
};

socket.on("reply", (message) => {
  const fullTime = makeTime("now");
  const msgbox = $("<div>")
    .addClass("in box")
    .html(`<p>${message}</p><p class="time">${fullTime}</p>`);
  $(".chat-box").append(msgbox);
});

const sendMessage = async (sender, receiver, message) => {
  $("#emojiPicker").css("display", "none");
  const fullTime = makeTime("now");
  const msgbox = $("<div>")
    .addClass("out box")
    .html(`<p>${message}</p><p class="time">${fullTime}</p>`);
  $(".chat-box").append(msgbox);

  const room = [sender, receiver].sort().join("-").replace(/\s/g, "");
  socket.emit("message", message, room);
  $("#message").val("");

  await $.ajax({
    url: "/addmessage",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      sender: sender,
      receiver: receiver,
      message: message,
    }),
  });
};

const logOut = async (user) => {
  try {
    const response = await $.ajax({
      url: "/logOut",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ user: user }),
    });

    if (response.redirected) {
      window.location.href = response.url;
    } else {
      alert(response.message);
    }
  } catch (err) {
    console.log(err);
  }
};

const deleteAccount = async (user) => {
  if (confirm(`Do you really want to delete your account?`)) {
    try {
      const response = await $.ajax({
        url: "/deleteUser",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ user: user }),
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else {
        alert(response.message);
      }
    } catch (err) {
      console.log(err);
    }
  }
};

const deleteMessage = () => {};

const previewImage = () => {
  const inFile = $("#new-picture")[0]; // Get the DOM element using jQuery
  const file = inFile.files[0];
  let base64String;

  if (file) {
    const reader = new FileReader();

    reader.onload = async (event) => {
      const formData = new FormData();
      formData.append("image", file);

      let fileUrl = event.target.result;

      base64String = fileUrl.split(",")[1]; // Extract base64 string without the "data:image/..." part

      $("#pp").css("display", "block").attr("src", fileUrl);
      $("#submit").css("display", "block");
    };

    reader.readAsDataURL(file); // Convert file to base64
  }
};
