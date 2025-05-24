module.exports = (url) => {
  const pattern = /\/v\d+\/(.+)\.[a-z]+$/;
  const matched = url.match(pattern);
  return matched[1];
};
