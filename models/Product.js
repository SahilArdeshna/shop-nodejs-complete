const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    require: true
  },
  imageUrl: {
    type: String,
    require: true
  },
  price: {
    type: Number,
    require: true
  },
  description: {
    type: String,
    require: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Product', productSchema);








// const getDb = require('../util/database').getDb;
// const ObjectId = require('../util/database').ObjectId;

// class Product {
//   constructor(title, imageUrl, price, description, id, userId) {
//     this.title = title;
//     this.imageUrl = imageUrl;
//     this.price = price;
//     this.description = description;
//     this._id = id ? new ObjectId(id) : null;
//     this.userId = userId;
//   };

//   save() {    
//     const db = getDb(); 
//     let dbOp;

//     if (this._id) {
//       dbOp = db.collection('products').updateOne({ _id: this._id }, { $set: this })
//     } else {
//       dbOp = db.collection('products').insertOne(this)      
//     }

//     return dbOp.then(result => {
//         // console.log(result);
//       })
//       .catch(err => console.log(err));
//   };

//   static fetchAll() {
//     const db = getDb();
//     return db.collection('products').find().toArray()
//       .then(products => {
//         // console.log(products);
//         return products;
//       })
//       .catch(err => console.log(err));
//   };

//   static findById(prodId) {    
//     const db = getDb();
//     return db.collection('products').findOne({ _id: new ObjectId(prodId) }) 
//       .then(product => {
//         return product;
//       })
//       .catch(err => console.log(err));;
//   };

//   static deleteById(prodId) {
//     const db = getDb();
//     return db.collection('products').deleteOne({ _id: new ObjectId(prodId) })
//       .then(product => {
//         // console.log(product);
//       })
//       .catch(err => console.log(err));
//   };
// };

// module.exports = Product;