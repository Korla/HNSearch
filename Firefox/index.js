var data = require("sdk/self").data;
var text_entry = require("sdk/panel").Panel({
  contentURL: data.url("./../popup.html")
});

require("sdk/ui/button/action").ActionButton({
  id: "Search_HN",
  label: "Search HN",
  icon: {
    "64": "./../icon.png"
  },
  onClick: function(state) {
    text_entry.show();
  }
});

text_entry.port.on("text-entered", function (text) {
  console.log(text);
  text_entry.hide();
});
