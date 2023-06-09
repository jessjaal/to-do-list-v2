//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
//const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//Create and connect to DB
mongoose.set("strictQuery", false);
mongoose.connect("mongodb+srv://jesma0401:BGgmt8CdzSGLMo9G@cluster0.bzdujn8.mongodb.net/todolistDB",  {useNewUrlParser: true});

//Schema and model for db items
const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

//Default items
const item1 = new Item ({
  name: "To pray"
});

const item2 = new Item ({
  name: "To work out"
});

const item3 = new Item ({
  name: "To learn"
});

const defaultItems = [item1, item2, item3];


//Schema and model for db lists
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
})

const List = mongoose.model("List", listSchema);


//Render of home route
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if (err) {
      console.log(err);
    } else {

      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err){
          if (err) {
            console.log(err);
          } else {
            console.log("Default items added successfully to DB");
            res.redirect("/");
          }
        });
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }
  });

});


app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){

      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = _.capitalize(req.body.listName);

  if (listName === "Today") {

    Item.findByIdAndDelete(checkedItemId, function(err){
      if (!err) {
        console.log("Deleted: " + checkedItemId);
        res.redirect("/");
      }
    });

  } else {

    List.findOneAndUpdate({name: listName}, {$pull: {items:  {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }});

  }
});


app.get("/about", function(req, res){
  res.render("about");
});


app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err) {
      if (!foundList) {

        const newList = new List ({
          name: customListName,
          items: defaultItems
        })

        newList.save();

        res.redirect("/" + customListName);

      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started successfully");
});
