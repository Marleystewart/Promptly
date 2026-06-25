module.exports = function handler(req, res) {
  res.status(200).json({
    publicKey: process.env.VAPID_PUBLIC_KEY || "BIQfsqoTgEEQRYIM-YdEvr8-95V4xhNHKf9CwIRPIb3O0ZyIqABnNXUeuR-cSuoEl4wYkNptOd5aie8PU0e78o8",
  });
};
