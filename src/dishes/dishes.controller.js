const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


// Handler to list all dishes
function list(req, res){
  res.json({ data: dishes });
};

function bodyHasData(property){
  return function(req, res, next){
    const { data = {} } = req.body;
    if(data[property] && data[property] !== ''){
      next();
    } else {
        next({
        status: 400,
        message: `Dish must include a ${property}`
      })
    }
  }
}

// Check to see if price is valid and is an integer greater than 0
function realPrice(req, res, next){
  const { data: { price } = {} } = req.body;
  if (price > 0 && typeof price === "number"){
    next();
  } else {
      next({
        status: 400,
        message: `Dish must have a price that is an integer greater than 0`
      })
    } 
}

// Handler to create a dish
function create(req, res){
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};

// Check to see if dish exists
function dishExists(req, res, next){
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    next();
  } else {
    next({
      status: 404,
      message: `Dish ID does not exist: ${dishId}`,
    });
  }
};

// Handler to read dishes
function read(req, res){
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  res.json( { data: foundDish});
}

function matchingId(req, res, next){
  const { dishId } = req.params;
  const { data : { id } = {} } = req.body;
  if(id && id !== dishId){
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    })
  } else {
    next();
  }
}

// Handler to update a dish
function update(req, res){
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  const { data: { name, description, price, image_url } = {} } = req.body;
  
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;
  
  res.json({ data: foundDish});
}

// TODO: Implement the /dishes handlers needed to make the tests pass

module.exports = {
  create: [
    bodyHasData("name"),
    bodyHasData("description"),
    bodyHasData("price"),
    realPrice,
    bodyHasData("image_url"),
    create
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    realPrice,
    matchingId,
    bodyHasData("name"),
    bodyHasData("description"),
    bodyHasData("price"),
    bodyHasData("image_url"),
    update
  ],
  list,
}