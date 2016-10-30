module.exports = class VertexError extends Error {

  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }

};
