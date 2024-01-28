const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
//create a post

router.post("/", async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savePost = await newPost.save();
    res.status(200).json(newPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

//update a post

router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // console.log(post);
    if (post.userId === req.body.userId) {
      await post.updateOne({ $set: req.body });
      res.status(200).json("the post has been updated");
    } else {
      res.status(403).json("you can update only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//delete a post

router.delete("/:postId/delete", async (req, res) => {
  const { userId } = req.body;
  try {
    console.log("this is post id", req.params.postId);
    console.log("this is user id", userId);
    const post = await Post.findById(req.params.postId);
    console.log(post);
    if (post.userId === userId) {
      await post.deleteOne();
      res.status(200).json("the post has been deleted");
    } else {
      res.status(403).json("you can delete only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//like a post

router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    console.log(req.body.userId);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("post has been liked");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("post has been unliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//get a post

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get timeline a post

router.get("/timeline/:userId", async (req, res) => {
  try {
    const curruntUser = await User.findById(req.params.userId);
    const userPosts = await Post.find({ userId: curruntUser._id });
    const followingsPosts = await Promise.all(
      curruntUser.followings.map(async (followingId) => {
        return await Post.find({ userId: followingId });
      })
    );
    res.status(200).json(userPosts.concat(...followingsPosts));
  } catch (err) {
    res.status(500).json(err);
  }
});
//get user's all posts

router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const userPosts = await Post.find({ userId: user._id });
    res.status(200).json(userPosts);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
