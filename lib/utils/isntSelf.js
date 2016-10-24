const {networkInterfaces} = require('os');

module.exports = (listening1) => {

  let interfaces = networkInterfaces();
  let addresses = [];

  Object.keys(interfaces).forEach(iface => {
    addresses = addresses.concat(
      interfaces[iface].map(address => {
        return address.address
      })
    );
  });

  return (connect) => {
    let local = true;

    if (listening1.port != connect.port) {
      local = false;
      return !local;
    }

    if (
      addresses.indexOf(connect.host /*  TODO: resolve dns  */) < 0 &&
      connect.host != '0.0.0.0' &&
      connect.host != 'localhost'
    ) {

      local = false;
      return !local;
    }

    return !local;
  }
};
