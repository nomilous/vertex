module.exports = class VertexError extends Error {

  constructor(message) {
    super(message);
    Object.defineProperty(this, 'name', {
      value: this.constructor.name
    });
  }

};
