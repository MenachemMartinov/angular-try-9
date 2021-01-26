const router = require("express").Router();
const { validateUser, User } = require("../models/user");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const auth = require("../middlewares/auth");

router.get("/user-details", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/newUser", async (req, res) => {
  // validate users body
  const { error } = validateUser(req.body);
  if (error) {
    return res.status(400).send("error 1" + error.details[0].message);
  }

  // validate user doesn't user exist already
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).send("error 2 User already registered");
  }

  // create user and send the new user to client
  user = await new User(req.body);

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(req.body.password, salt);

  await user.save();
  res.send(_.pick(user, ["_id", "name", "email"]));
});

router.put("/:id", auth, async (req, res) => {
  // validate users body
  const { error } = validateUser(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  try {
    // update the user
    let user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      req.body
    );
    if (!user) {
      return res.status(404).send("The user with the given ID was not found");
    }

    user = await User.findOne({
      _id: req.params.id,
    });
    res.send(user);
  } catch (error) {
    console.error("error catch", error);
  }
});

router.delete("/:id", auth, async (req, res) => {
  const user = await User.findOneAndRemove({
    _id: req.params.id,
  });
  if (!user) {
    return res.status(404).send("The user with the given ID was not found");
  }

  res.send(user);
});

module.exports = router;
