require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.User_Name}:${process.env.User_pass}@cluster0.dtfuxds.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("UserManagement").collection("user");
    const addedUserCollection = client
      .db("UserManagement")
      .collection("addUser");

    //--------- jwt api--------
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.Access_Token, {
        expiresIn: "7h",
      });
      res.send({ token });
    });

    // ---------user collection----------
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({
          message: "This user is exist in the database",
          insertedId: null,
        });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // ---------Add collection----------
    app.post("/addUser", async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email };
      const existingUser = await addedUserCollection.findOne(query);
      if (existingUser) {
        return res.send({
          message: "This user is exist in the database",
          insertedId: null,
        });
      }
      const result = await addedUserCollection.insertOne(user);
      res.send(result);
    });

    // ----get added user---------
    app.get("/getUser", async (req, res) => {
      const { search } = req.query;
      console.log(search);

      const { sortBy } = req.query;
      let sortItem = {};
      if (sortBy === "A-Z") {
        sortItem = { name: 1 };
      } else if (sortBy === "Z-A") {
        sortItem = { name: -1 };
      } else if (sortBy === "LastInserted") {
        sortItem = { insertDate: -1 };
      } else if (sortBy === "LastModified") {
        sortItem = { modifiedDate: -1 };
      }

      const result = await addedUserCollection
        .find({
          $or: [
            { name: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        })
        .sort(sortItem)
        .toArray();
      res.send(result);
    });

    // ----delete user from database----
    app.delete("/deleteUser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addedUserCollection.deleteOne(query);
      res.send(result);
    });

    // ----get user for update----
    app.get("/getUser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addedUserCollection.findOne(query);
      // console.log({ result });
      res.send(result);
    });

    // ------user info update--------
    app.patch("/updated/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          name: item.name,
          email: item.email,
          phone: item.phone,
          modifiedDate: item.modifiedDate,
         
        },
      };
      const result = await addedUserCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("user management server is running");
});
app.listen(port, () => {
  console.log(`user management running on ${port}`);
});
