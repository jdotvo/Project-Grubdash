const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Handler to list all orders
function list(req, res){
  res.json({ data: orders });
};

function bodyHasData(property){
  return function(req, res, next){
    const { data = {} } = req.body;
    if(data[property] && data[property] !== ''){
      next();
    } else {
      next({
        status: 400,
        message: `Order must include a ${property}`
      })
    }
  }
}

// Check to see if dish is valid and includes at least one dish
function actualDish(req, res, next){
  const { data: { dishes } = {} } = req.body;
  if(dishes.length > 0 && Array.isArray(dishes)){
    next();
  } else {
    next({
      status: 400,
      message: `Order must include at least one dish`
    })
  }
}

// Check to see if quantity of dish is valid and is an integer greater than 0
function validQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish, index) => {
    const quantity = dish.quantity;
    if (!quantity || quantity < 1 || Number(quantity) !== quantity) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

// Handler to create a new order
function create(req, res){
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder});
};

// Check to see if order exists
function orderExists(req, res, next){
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    next();
  } else {
    next({
      status: 404,
      message: `Order ID does not exist: ${orderId}`,
    });
  }
};

// Handler to read orders
function read(req, res){
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  res.json( { data: foundOrder });
};

function matchingId(req, res, next){
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if(id && id !== orderId){
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
    })
  } else {
    next();
  }
}

// Check to see if status of order has status of pending, preparing, out-for-deliver, or delivered
function orderStatus(req, res, next){
  const { data: { status } = {} } = req.body;
  if(!status || status !== "pending" && status !== "preparing" && status !== "out-for-deliver"){
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
    })
  } else if (status === "delivered"){
    next({
      status: 400,
      message: `A delivered order cannot be changed`
    })
  } else{
    next();
  }
}

// Handler to update an order
function update(req, res){
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;
  
  res.json({ data: foundOrder });
}

// Handler to delete an order
function destroy(req, res, next){
  const { orderId } = req.params;
  const matchingOrder = orders.find((order) => order.id === orderId);
  const { data: { id, status } = {} } = req.body;
  if (matchingOrder.status === "pending"){
    const index = orders.findIndex((order) => order.id === Number(orderId));
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
  } else{
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending.`
    });
  }
}
  


// TODO: Implement the /orders handlers needed to make the tests pass

module.exports = {
  create: [
    bodyHasData("deliverTo"),
    bodyHasData("mobileNumber"),
    bodyHasData("dishes"),
    actualDish,
    validQuantity,
    create
  ],
  read: [orderExists, read],
  update: [
    bodyHasData("deliverTo"),
    bodyHasData("mobileNumber"),
    bodyHasData("dishes"),
    bodyHasData("status"),
    orderExists,
    actualDish,
    validQuantity,
    matchingId,
    orderStatus,
    update
  ],
  delete: [orderExists, destroy],
  list,
}