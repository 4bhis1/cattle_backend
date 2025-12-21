import { Router } from "express";

const privateRoutes = Router();

// Example private route
privateRoutes.get("/profile", (req, res) => {
  res.json({
    message: "You are accessing a private route",
    user: req.user
  });
});

export default privateRoutes;
