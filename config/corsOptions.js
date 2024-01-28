const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://xmosocial.onrender.com",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
module.exports = corsOptions;
