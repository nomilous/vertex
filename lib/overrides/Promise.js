Promise.every = (promises) => {
  if (!Array.isArray(promises)) {
    return Promise.reject(new TypeError('expected array'));
  }
  if (promises.length == 0) return Promise.resolve(promises);
  return new Promise(resolve => {
    let results = [];
    let done = 0;
    promises.forEach((promise, i) => {
      Promise.resolve(promise)
        .then(result => {
          results[i] = result;
          done++;
          if (done == promises.length) resolve(results);
        })
        .catch(error => {
          results[i] = error;
          done++;
          if (done == promises.length) resolve(results);
        });
    });
  });
};
