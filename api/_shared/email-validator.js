const acceptedDomains = ["gmail.com", "yahoo.com", "icloud.com", "outlook.com", "hotmail.com", "aol.com"];

function isValidEmail(value = "") {
  const email = String(value).trim().toLowerCase();
  const basicShape = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!basicShape) return false;

  const domain = email.split("@").pop();
  return acceptedDomains.includes(domain) || domain.endsWith(".edu");
}

module.exports = { isValidEmail };
