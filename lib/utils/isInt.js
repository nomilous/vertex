module.exports = (n) => {
  try {
    return parseInt(n).toString() == n.toString()
  } catch (e) {
    return false;
  }
};
