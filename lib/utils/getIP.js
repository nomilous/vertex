// get first external IPv4

const {networkInterfaces} = require('os');

module.exports = () => {
  let interfaces = networkInterfaces();
  let selected;

  Object.keys(interfaces)
    .map(key => interfaces[key])
    .forEach(iface => {
      iface.forEach(address => {
        if (selected) return;
        if (address.internal) return;
        if (address.family == 'IPv6') return;
        selected = address.address;
      });
    });

  return selected;
};
