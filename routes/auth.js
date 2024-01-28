const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// const verifyJWT = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   if (!authHeader) return res.status(401).json("Unauthoriazed from verify");
//   console.log(authHeader); // Bearer token
//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) return res.status(403).json("Token is invalid");
//     req.user = decoded.username;
//     next();
//   });
// };
const generateAccessToken = (user) => {
  return jwt.sign(
    { username: user.username },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "30s" } // 10min in production
  );
};
const generateRefreshToken = (user) => {
  return jwt.sign(
    { username: user.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
};

// register users
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existUsername = await User.findOne({ username: username });
    if (!existUsername) {
      // securing password
      const salt = await bcrypt.genSalt(13);
      const hashedPassword = await bcrypt.hash(password, salt);
      // register user
      const newUser = await new User({
        username: username,
        email: email,
        password: hashedPassword,
        // salt: salt,
      });
      // saving user and sending response
      const user = await newUser.save();
      res.status(200).json(user);
    } else {
      res.status(403).json("This username already exists.");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username: username });
    if (!foundUser) return res.status(404).json("user not found");
    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (!validPassword) {
      return res.status(400).json("wrong password");
    }
    // create jwt
    const accessToken = generateAccessToken(foundUser);
    const refreshToken = generateRefreshToken(foundUser);
    const updatedUser = await User.findByIdAndUpdate(
      foundUser._id,
      { refreshToken: refreshToken },
      { new: true }
    );
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    }); // 1day
    res.status(200).json({ accessToken, foundUser });
  } catch (err) {
    res.status(500).json(err);
  }
});
module.exports = router;
// module.exports = { verifyJWT };

// // jwt with lama dev

// // token generation
// let refreshTokens = [];
// const generateAccessToken = (user) => {
//   // console.log("this is access token spread user=>", { ...user._doc });
//   return jwt.sign(
//     {
//       id: user._id,
//       username: user.username,
//       isAdmin: user.isAdmin,
//     },
//     process.env.ACCESS_TOKEN_SECRET_KEY,
//     {
//       expiresIn: "5m",
//     }
//   );
// };
// const generateRefreshToken = (user) => {
//   return jwt.sign(
//     {
//       id: user._id,
//       username: user.username,
//       isAdmin: user.isAdmin,
//     },
//     process.env.REFRESH_TOKEN_SECRET_KEY,
//     {
//       expiresIn: "1h",
//     }
//   );
// };

// //middleware for token verifing to modify data
// const verify = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (authHeader) {
//     const token = authHeader.split(" ")[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, (err, user) => {
//       if (err) return res.status(403).json("token is not valid");
//       else {
//         req.user = user;
//         next();
//       }
//     });
//   } else res.status(401).json("you are not authenticated !");
// };
// // verify token and get user
// router.post("/login", async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const user = await User.findOne({ username: username });
//     if (!user) return res.status(404).json("user not found");
//     const validPassword = await bcrypt.compare(password, user.password);
//     if (!validPassword) {
//       return res.status(400).json("wrong password");
//     }

//     const accessToken = generateAccessToken(user);
//     // console.log("this is access token =>", accessToken);
//     const refreshToken = generateRefreshToken(user);
//     // console.log("this is refresh token =>", refreshToken);
//     refreshTokens.push(refreshToken);
//     // console.log(user);
//     // const userWithToken = {
//     //   _id: user._id,
//     //   username: user.username,
//     //   profilePicture: user.profilePicture,
//     //   coverPicture: user.coverPicture,
//     //   followers: user.followers,
//     //   followings: user.followings,
//     //   isAdmin: user.isAdmin,
//     //   city: user.city,
//     //   description: user.description,
//     //   from: user.from,
//     //   relationship: user.relationship,
//     //   accessToken,
//     //   refreshToken,
//     // };
//     // console.log("this is user with token =>", userWithToken);
//     res.status(200).json({
//       username: user.username,
//       isAdmin: user.isAdmin,
//       accessToken,
//       refreshToken,
//     });
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });
// router.post("/verify/:username", verify, async (req, res) => {
//   const { username } = req.params;
//   if (req.user.username === username) {
//     const userData = await User.findOne({ username: username });
//     res.status(200).json(userData);
//   } else {
//     res.status(403).json("somtinhg in request is wrong");
//   }
// });

// // refresh token
// router.post("/refresh", (req, res) => {
//   const refreshToken = req.body.token;

//   // send error if no token or not valid
//   if (!refreshToken) return res.status(401).json("you are not authenticated !");
//   if (!refreshTokens.includes(refreshToken)) {
//     return res.status(403).json("Refresh token is not valid");

//     // if all ok create new accessToken, refreshtoken
//   } else {
//     jwt.verify(
//       refreshToken,
//       process.env.REFRESH_TOKEN_SECRET_KEY,
//       (err, user) => {
//         err && console.log(err);
//         refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
//         const newAccessToken = generateAccessToken(user);
//         const newRefreshToken = generateRefreshToken(user);
//         res.status(200).json({
//           accessToken: newAccessToken,
//           refreshToken: newRefreshToken,
//         });
//       }
//     );
//   }
// });

// // logout user
// router.post("/logout", verify, (req, res) => {
//   const refreshToken = req.body.token;
//   if (!refreshToken) return res.status(401).json("you are not authenticated !");
//   refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
//   res.status(200).json("logged out successfully");
// });
