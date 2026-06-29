function isValidEmail(value = "") {
  const email = String(value).trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

module.exports = { isValidEmail };
